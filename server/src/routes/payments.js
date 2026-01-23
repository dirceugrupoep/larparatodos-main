import express from 'express';
import { pool } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

const paymentSchema = z.object({
  amount: z.number().positive().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z.string().optional(),
  transaction_id: z.string().optional(),
  notes: z.string().optional(),
});

// Get user's payments
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        id, 
        amount, 
        due_date, 
        paid_date, 
        status, 
        payment_method, 
        transaction_id,
        ciabra_charge_id,
        ciabra_pix_qr_code,
        ciabra_pix_qr_code_url,
        ciabra_boleto_url,
        notes,
        created_at,
        updated_at
      FROM payments 
      WHERE user_id = $1 
      ORDER BY due_date DESC, created_at DESC`,
      [userId]
    );

    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
});

// Get payment statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar dados do usuário (incluindo payment_day)
    const userResult = await pool.query(
      `SELECT payment_day FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];
    const paymentDay = user?.payment_day || 10; // Padrão dia 10

    const [totalPaid, totalPending, totalOverdue, nextPayment] = await Promise.all([
      // Total pago
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM payments 
         WHERE user_id = $1 AND status = 'paid'`,
        [userId]
      ),
      // Total pendente
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM payments 
         WHERE user_id = $1 AND status = 'pending' AND due_date >= CURRENT_DATE`,
        [userId]
      ),
      // Total em atraso (pending vencidos + overdue)
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM payments 
         WHERE user_id = $1 AND (status = 'overdue' OR (status = 'pending' AND due_date < CURRENT_DATE))`,
        [userId]
      ),
      // Próximo pagamento (pendente ou vencido)
      pool.query(
        `SELECT * FROM payments 
         WHERE user_id = $1 AND status IN ('pending', 'overdue')
         ORDER BY due_date ASC 
         LIMIT 1`,
        [userId]
      ),
    ]);

    let nextPaymentData = nextPayment.rows[0] || null;

    // Se não há próximo pagamento pendente, calcular baseado no payment_day
    if (!nextPaymentData && paymentDay) {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      let targetDay = paymentDay;
      let targetMonth = currentMonth;
      let targetYear = currentYear;

      // Se já passou o dia de pagamento deste mês, calcular para o próximo mês
      if (currentDay > paymentDay) {
        targetMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      }

      const dueDate = new Date(targetYear, targetMonth, targetDay);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Verificar se já existe pagamento para essa data
      const existingPayment = await pool.query(
        `SELECT * FROM payments 
         WHERE user_id = $1 AND due_date = $2
         LIMIT 1`,
        [userId, dueDateStr]
      );

      if (existingPayment.rows.length === 0) {
        // Criar pagamento virtual (não salvo ainda) para exibir
        nextPaymentData = {
          id: null, // Será criado quando gerar a cobrança
          amount: 150.00, // Valor padrão
          due_date: dueDateStr,
          status: 'pending',
          ciabra_charge_id: null,
          ciabra_pix_qr_code: null,
          ciabra_pix_qr_code_url: null,
          ciabra_boleto_url: null,
        };
      } else {
        nextPaymentData = existingPayment.rows[0];
      }
    }

    const isAdimplente = totalOverdue.rows[0].total === '0';

    res.json({
      stats: {
        totalPaid: parseFloat(totalPaid.rows[0].total),
        totalPending: parseFloat(totalPending.rows[0].total),
        totalOverdue: parseFloat(totalOverdue.rows[0].total),
        isAdimplente,
        nextPayment: nextPaymentData,
      },
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de pagamento' });
  }
});

// Create payment (admin only - para criar pagamentos mensais)
router.post('/', async (req, res) => {
  try {
    const validatedData = paymentSchema.parse(req.body);
    const userId = req.user.id;
    const { amount = 150.00, due_date, payment_method, transaction_id, notes } = validatedData;

    const result = await pool.query(
      `INSERT INTO payments (user_id, amount, due_date, payment_method, transaction_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, amount, due_date, payment_method || null, transaction_id || null, notes || null]
    );

    res.status(201).json({
      message: 'Pagamento registrado com sucesso',
      payment: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Erro ao registrar pagamento' });
  }
});

// Mark payment as paid
router.patch('/:id/pay', async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentId = req.params.id;
    const { payment_method, transaction_id, notes } = req.body;

    // Verificar se o pagamento pertence ao usuário
    const checkResult = await pool.query(
      'SELECT id FROM payments WHERE id = $1 AND user_id = $2',
      [paymentId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    const result = await pool.query(
      `UPDATE payments 
       SET status = 'paid', 
           paid_date = CURRENT_DATE,
           payment_method = COALESCE($1, payment_method),
           transaction_id = COALESCE($2, transaction_id),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [payment_method, transaction_id, notes, paymentId, userId]
    );

    res.json({
      message: 'Pagamento marcado como pago',
      payment: result.rows[0],
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Erro ao atualizar pagamento' });
  }
});

export default router;

