import express from 'express';
import { pool } from '../database/connection.js';
import { createCharge, getChargeStatus, verifyWebhookSignature, processWebhook } from '../services/ciabra.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Webhook para receber notificações do Ciabra
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-ciabra-signature'] || req.headers['x-signature'];
    const payload = req.body;

    // Log completo do payload recebido para debug
    console.log('📨 Webhook recebido do Ciabra - Payload completo:', JSON.stringify(payload, null, 2));
    console.log('📨 Webhook recebido do Ciabra - Resumo:', {
      event: payload.event || payload.type || 'unknown',
      chargeId: payload.id || payload.charge_id || payload.data?.id || payload.charge?.id,
      status: payload.status || payload.data?.status || payload.charge?.status,
    });

    // Verificar assinatura (opcional - Ciabra pode não enviar)
    if (signature && !verifyWebhookSignature(signature, payload)) {
      console.warn('⚠️  Webhook com assinatura inválida:', signature);
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Processar webhook
    const webhookData = processWebhook(payload);
    const { eventType, chargeId, status, paidAt, amount, pixQrCode, pixQrCodeUrl, boletoUrl } = webhookData;

    console.log(`📋 Processando evento: ${eventType}, chargeId: ${chargeId}, status: ${status}`);

    if (!chargeId) {
      console.warn('⚠️  Webhook sem charge_id:', payload);
      return res.status(400).json({ error: 'charge_id não encontrado no webhook' });
    }

    // Buscar pagamento pelo charge_id
    const paymentResult = await pool.query(
      'SELECT id, user_id, status FROM payments WHERE ciabra_charge_id = $1',
      [chargeId]
    );

    if (paymentResult.rows.length === 0) {
      console.warn(`⚠️  Pagamento não encontrado para charge_id: ${chargeId} (pode ser teste ou cobrança externa)`);
      // Retornar 200 para não causar retry do Ciabra
      return res.status(200).json({ message: 'Pagamento não encontrado (pode ser teste ou cobrança externa)' });
    }

    const payment = paymentResult.rows[0];

    // Processar cada tipo de evento especificamente
    const updateData = {
      updated_at: new Date(),
    };

    // Processar baseado no tipo de evento
    if (eventType.includes('charge.created') || eventType.includes('cobrança.criada')) {
      // Cobrança criada: Atualizar com dados iniciais (PIX/Boleto)
      console.log('📦 Evento: Cobrança criada');
      if (pixQrCode) updateData.ciabra_pix_qr_code = pixQrCode;
      if (pixQrCodeUrl) updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
      if (boletoUrl) updateData.ciabra_boleto_url = boletoUrl;
      if (status) updateData.status = status;
    }
    else if (eventType.includes('charge.deleted') || eventType.includes('cobrança.deletada')) {
      // Cobrança deletada: Marcar como cancelado
      console.log('🗑️  Evento: Cobrança deletada');
      updateData.status = 'cancelled';
    }
    else if (eventType.includes('payment.generated') || eventType.includes('pagamento.gerado')) {
      // Pagamento gerado: Atualizar QR Code PIX ou URL do boleto
      console.log('💳 Evento: Pagamento gerado');
      if (pixQrCode) updateData.ciabra_pix_qr_code = pixQrCode;
      if (pixQrCodeUrl) updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
      if (boletoUrl) updateData.ciabra_boleto_url = boletoUrl;
    }
    else if (eventType.includes('payment.confirmed') || eventType.includes('pagamento.confirmado') || status === 'paid') {
      // Pagamento confirmado: Marcar como pago e atualizar data
      console.log('✅ Evento: Pagamento confirmado');
      updateData.status = 'paid';
      if (paidAt) {
        updateData.paid_date = new Date(paidAt);
      } else {
        updateData.paid_date = new Date(); // Se não veio a data, usar agora
      }

      // Verificar se o usuário ainda tem outros pagamentos vencidos
      const overdueCheck = await pool.query(
        `SELECT COUNT(*) as count 
         FROM payments 
         WHERE user_id = $1 
           AND id != $2
           AND status IN ('pending', 'overdue') 
           AND due_date < CURRENT_DATE`,
        [payment.user_id, payment.id]
      );

      // Se não tem mais vencidos, o usuário volta a ser adimplente
      if (parseInt(overdueCheck.rows[0].count) === 0) {
        console.log(`✅ Usuário ${payment.user_id} voltou a ser adimplente`);
      }
    }
    else {
      // Evento genérico: Atualizar status e dados se fornecidos
      console.log(`📝 Evento genérico: ${eventType}`);
      if (status) updateData.status = status;
      if (pixQrCode) updateData.ciabra_pix_qr_code = pixQrCode;
      if (pixQrCodeUrl) updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
      if (boletoUrl) updateData.ciabra_boleto_url = boletoUrl;
      if (status === 'paid' && paidAt) {
        updateData.paid_date = new Date(paidAt);
      }
    }

    // Construir query de update dinamicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(updateData[key]);
        paramIndex++;
      }
    });

    updateValues.push(payment.id);
    const updateQuery = `
      UPDATE payments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    await pool.query(updateQuery, updateValues);

    console.log(`✅ Pagamento ${payment.id} atualizado para status: ${status}`);

    res.json({ success: true, message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar webhook do Ciabra:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

/**
 * Criar cobrança para um pagamento
 * POST /api/ciabra/charges
 * Body: { payment_id (opcional), payment_method: 'pix' | 'boleto' }
 * Se payment_id não for fornecido, cria um novo pagamento baseado no payment_day do usuário
 */
router.post('/charges', authenticateToken, async (req, res) => {
  try {
    const { payment_id, payment_method = 'pix' } = req.body;
    const userId = req.user.id;

    let payment;

    if (payment_id) {
      // Buscar pagamento existente
      const paymentResult = await pool.query(
        `SELECT p.*, u.name, u.email, u.phone, u.payment_day, up.cpf
         FROM payments p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE p.id = $1 AND p.user_id = $2`,
        [payment_id, userId]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      payment = paymentResult.rows[0];
    } else {
      // Criar novo pagamento baseado no payment_day do usuário
      const userResult = await pool.query(
        `SELECT u.id, u.name, u.email, u.phone, u.payment_day, up.cpf
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = userResult.rows[0];
      const paymentDay = user.payment_day || 10;

      // Calcular próxima data de vencimento
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

      if (existingPayment.rows.length > 0) {
        payment = existingPayment.rows[0];
        // Buscar dados do usuário para o pagamento existente
        const userDataResult = await pool.query(
          `SELECT u.name, u.email, u.phone, up.cpf
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id = $1`,
          [userId]
        );
        if (userDataResult.rows.length > 0) {
          payment = {
            ...payment,
            name: userDataResult.rows[0].name,
            email: userDataResult.rows[0].email,
            phone: userDataResult.rows[0].phone,
            cpf: userDataResult.rows[0].cpf,
          };
        }
      } else {
        // Criar novo pagamento
        const amount = 150.00; // Valor padrão
        const newPaymentResult = await pool.query(
          `INSERT INTO payments (user_id, amount, due_date, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING *`,
          [userId, amount, dueDateStr]
        );

        payment = {
          ...newPaymentResult.rows[0],
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: user.cpf,
        };
      }
    }

    // Se já tem charge_id, retornar dados existentes
    if (payment.ciabra_charge_id) {
      const chargeData = await getChargeStatus(payment.ciabra_charge_id);
      return res.json({
        charge: chargeData,
        payment: {
          id: payment.id,
          ciabra_charge_id: payment.ciabra_charge_id,
          pix_qr_code: payment.ciabra_pix_qr_code,
          pix_qr_code_url: payment.ciabra_pix_qr_code_url,
          boleto_url: payment.ciabra_boleto_url,
        },
      });
    }

    // Criar cobrança no Ciabra
    const chargeData = await createCharge({
      amount: parseFloat(payment.amount),
      due_date: payment.due_date,
      description: `Contribuição mensal - ${payment.due_date}`,
      customer: {
        name: payment.name,
        email: payment.email,
        document: payment.cpf,
        phone: payment.phone,
      },
      payment_method,
    });

    // Atualizar pagamento com dados do Ciabra
    const updateData = {
      ciabra_charge_id: chargeData.id || chargeData.charge_id,
      ciabra_pix_qr_code: chargeData.pix?.qr_code || chargeData.pix_qr_code,
      ciabra_pix_qr_code_url: chargeData.pix?.qr_code_url || chargeData.pix_qr_code_url,
      ciabra_boleto_url: chargeData.boleto?.url || chargeData.boleto_url,
    };

    await pool.query(
      `UPDATE payments 
       SET ciabra_charge_id = $1,
           ciabra_pix_qr_code = $2,
           ciabra_pix_qr_code_url = $3,
           ciabra_boleto_url = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        updateData.ciabra_charge_id,
        updateData.ciabra_pix_qr_code,
        updateData.ciabra_pix_qr_code_url,
        updateData.ciabra_boleto_url,
        payment.id,
      ]
    );

    res.json({
      message: 'Cobrança criada com sucesso',
      charge: chargeData,
      payment: {
        id: payment.id,
        amount: payment.amount,
        due_date: payment.due_date,
        status: payment.status,
        ciabra_charge_id: updateData.ciabra_charge_id,
        ciabra_pix_qr_code: updateData.ciabra_pix_qr_code,
        ciabra_pix_qr_code_url: updateData.ciabra_pix_qr_code_url,
        ciabra_boleto_url: updateData.ciabra_boleto_url,
      },
    });
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar cobrança' });
  }
});

/**
 * Consultar status de uma cobrança
 * GET /api/ciabra/charges/:charge_id
 */
router.get('/charges/:charge_id', authenticateToken, async (req, res) => {
  try {
    const { charge_id } = req.params;

    const chargeData = await getChargeStatus(charge_id);

    // Atualizar pagamento local se necessário
    const paymentResult = await pool.query(
      'SELECT id FROM payments WHERE ciabra_charge_id = $1',
      [charge_id]
    );

    if (paymentResult.rows.length > 0) {
      const paymentId = paymentResult.rows[0].id;
      const statusMap = {
        pending: 'pending',
        paid: 'paid',
        overdue: 'overdue',
        cancelled: 'cancelled',
      };

      const newStatus = statusMap[chargeData.status] || chargeData.status;

      await pool.query(
        `UPDATE payments 
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newStatus, paymentId]
      );
    }

    res.json({ charge: chargeData });
  } catch (error) {
    console.error('Erro ao consultar cobrança:', error);
    res.status(500).json({ error: error.message || 'Erro ao consultar cobrança' });
  }
});

export default router;
