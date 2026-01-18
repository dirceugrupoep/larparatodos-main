import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../database/connection.js';
import { requireAdmin } from '../middleware/admin.js';
import { z } from 'zod';

const router = express.Router();

// Todas as rotas requerem admin
router.use(requireAdmin);

// ==================== DASHBOARD E MÉTRICAS ====================

// Dashboard geral com todas as métricas
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Métricas de usuários
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersToday,
      newUsersThisMonth,
      totalAdmins,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = false'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = $1", [today]),
      pool.query("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) >= $1", [firstDayOfMonth]),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true'),
    ]);

    // Métricas de pagamentos
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
      revenueToday,
      revenueThisMonth,
      revenueTotal,
      adimplentes,
      inadimplentes,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM payments'),
      pool.query("SELECT COUNT(*) as count FROM payments WHERE status = 'paid'"),
      pool.query("SELECT COUNT(*) as count FROM payments WHERE status = 'pending' AND due_date >= CURRENT_DATE"),
      pool.query("SELECT COUNT(*) as count FROM payments WHERE status = 'pending' AND due_date < CURRENT_DATE"),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid' AND DATE(paid_date) = $1", [today]),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid' AND DATE(paid_date) >= $1", [firstDayOfMonth]),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'"),
      pool.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM payments 
        WHERE user_id NOT IN (
          SELECT DISTINCT user_id 
          FROM payments 
          WHERE status = 'pending' AND due_date < CURRENT_DATE
        )
      `),
      pool.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM payments 
        WHERE user_id IN (
          SELECT DISTINCT user_id 
          FROM payments 
          WHERE status = 'pending' AND due_date < CURRENT_DATE
        )
      `),
    ]);

    // Métricas de contatos
    const [
      totalContacts,
      contactsToday,
      contactsThisMonth,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM contacts'),
      pool.query("SELECT COUNT(*) as count FROM contacts WHERE DATE(created_at) = $1", [today]),
      pool.query("SELECT COUNT(*) as count FROM contacts WHERE DATE(created_at) >= $1", [firstDayOfMonth]),
    ]);

    // Projeções e tendências
    const [
      avgPaymentValue,
      paymentsByMonth,
      revenueByMonth,
    ] = await Promise.all([
      pool.query("SELECT COALESCE(AVG(amount), 0) as avg FROM payments WHERE status = 'paid'"),
      pool.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as count
        FROM payments
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `),
      pool.query(`
        SELECT 
          TO_CHAR(paid_date, 'YYYY-MM') as month,
          COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE status = 'paid' AND paid_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(paid_date, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `),
    ]);

    res.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        active: parseInt(activeUsers.rows[0].count),
        inactive: parseInt(inactiveUsers.rows[0].count),
        newToday: parseInt(newUsersToday.rows[0].count),
        newThisMonth: parseInt(newUsersThisMonth.rows[0].count),
        admins: parseInt(totalAdmins.rows[0].count),
      },
      payments: {
        total: parseInt(totalPayments.rows[0].count),
        paid: parseInt(paidPayments.rows[0].count),
        pending: parseInt(pendingPayments.rows[0].count),
        overdue: parseInt(overduePayments.rows[0].count),
        adimplentes: parseInt(adimplentes.rows[0].count),
        inadimplentes: parseInt(inadimplentes.rows[0].count),
        avgValue: parseFloat(avgPaymentValue.rows[0].avg),
      },
      revenue: {
        today: parseFloat(revenueToday.rows[0].total),
        thisMonth: parseFloat(revenueThisMonth.rows[0].total),
        total: parseFloat(revenueTotal.rows[0].total),
      },
      contacts: {
        total: parseInt(totalContacts.rows[0].count),
        today: parseInt(contactsToday.rows[0].count),
        thisMonth: parseInt(contactsThisMonth.rows[0].count),
      },
      trends: {
        paymentsByMonth: paymentsByMonth.rows,
        revenueByMonth: revenueByMonth.rows,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// ==================== GESTÃO DE USUÁRIOS ====================

// Listar todos os usuários com paginação e filtros
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status; // 'active', 'inactive', 'all'

    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.is_admin, u.is_active, u.created_at,
        up.cpf, up.city, up.state,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id) as total_payments,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND status = 'paid') as paid_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = u.id AND status = 'paid') as total_paid
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR up.cpf ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status === 'active') {
      query += ` AND u.is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND u.is_active = false`;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as count FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE 1=1';
    const countParams = [];
    paramCount = 1;

    if (search) {
      countQuery += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR up.cpf ILIKE $${paramCount})`;
      countParams.push(`%${search}%`);
      paramCount++;
    }

    if (status === 'active') {
      countQuery += ` AND u.is_active = true`;
    } else if (status === 'inactive') {
      countQuery += ` AND u.is_active = false`;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Obter detalhes de um usuário específico
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const [userResult, profileResult, paymentsResult, projectResult] = await Promise.all([
      pool.query('SELECT * FROM users WHERE id = $1', [userId]),
      pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]),
      pool.query(
        'SELECT * FROM payments WHERE user_id = $1 ORDER BY due_date DESC',
        [userId]
      ),
      pool.query('SELECT * FROM project_status WHERE user_id = $1', [userId]),
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      user: userResult.rows[0],
      profile: profileResult.rows[0] || null,
      payments: paymentsResult.rows,
      project: projectResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do usuário' });
  }
});

// Atualizar usuário
const updateUserSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  is_admin: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const validatedData = updateUserSchema.parse(req.body);

    // Verificar se usuário existe
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Construir query dinâmica
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (validatedData.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(validatedData.name);
    }
    if (validatedData.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(validatedData.email);
    }
    if (validatedData.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(validatedData.phone);
    }
    if (validatedData.is_admin !== undefined) {
      updates.push(`is_admin = $${paramCount++}`);
      values.push(validatedData.is_admin);
    }
    if (validatedData.is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(validatedData.is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Resetar senha do usuário
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Senha resetada com sucesso',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
});

// Ativar/Desativar usuário
router.post('/users/:id/toggle-active', async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, is_active',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: `Usuário ${result.rows[0].is_active ? 'ativado' : 'desativado'} com sucesso`,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Toggle active error:', error);
    res.status(500).json({ error: 'Erro ao alterar status do usuário' });
  }
});

// ==================== RELATÓRIOS ====================

// Relatório de pagamentos
router.get('/reports/payments', async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        up.cpf as user_cpf
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE DATE(p.created_at) BETWEEN $1 AND $2
      ORDER BY p.created_at DESC`,
      [startDate, endDate]
    );

    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Payments report error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de pagamentos' });
  }
});

// Relatório de inadimplência
router.get('/reports/overdue', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        up.cpf,
        COUNT(p.id) as overdue_count,
        COALESCE(SUM(p.amount), 0) as total_overdue
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      INNER JOIN payments p ON u.id = p.user_id
      WHERE p.status = 'pending' AND p.due_date < CURRENT_DATE
      GROUP BY u.id, u.name, u.email, u.phone, up.cpf
      ORDER BY total_overdue DESC`
    );

    res.json({ overdueUsers: result.rows });
  } catch (error) {
    console.error('Overdue report error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de inadimplência' });
  }
});

// ==================== GESTÃO DE ASSOCIAÇÕES ====================

const associationSchema = z.object({
  cnpj: z.string().min(14).max(18),
  corporate_name: z.string().min(1),
  trade_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zip_code: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

// Listar todas as associações (admin - inclui inativas) com métricas
router.get('/associations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        a.id, a.cnpj, a.corporate_name, a.trade_name, a.email, a.phone,
        a.address, a.city, a.state, a.zip_code, a.website, a.is_active, a.is_default, a.is_approved,
        a.created_at, a.updated_at,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_users,
        COUNT(DISTINCT p.id) as total_payments,
        COUNT(DISTINCT CASE WHEN p.status = 'paid' THEN p.id END) as paid_payments,
        COUNT(DISTINCT CASE WHEN p.status = 'pending' AND p.due_date >= CURRENT_DATE THEN p.id END) as pending_payments,
        COUNT(DISTINCT CASE WHEN p.status = 'pending' AND p.due_date < CURRENT_DATE THEN p.id END) as overdue_payments,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as total_revenue
      FROM associations a
      LEFT JOIN users u ON u.association_id = a.id
      LEFT JOIN payments p ON p.user_id = u.id
      GROUP BY a.id
      ORDER BY a.is_default DESC, a.is_approved DESC, a.corporate_name ASC`
    );

    res.json({ associations: result.rows });
  } catch (error) {
    console.error('Get associations error:', error);
    res.status(500).json({ error: 'Erro ao buscar associações' });
  }
});

// Criar nova associação
router.post('/associations', async (req, res) => {
  try {
    const validatedData = associationSchema.parse(req.body);
    const {
      cnpj,
      corporate_name,
      trade_name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      website,
      is_active = true,
      is_default = false,
    } = validatedData;

    // Verificar se CNPJ já existe
    const existing = await pool.query(
      'SELECT id FROM associations WHERE cnpj = $1',
      [cnpj]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }

    // Se for definir como padrão, remover padrão anterior
    if (is_default) {
      await pool.query(
        'UPDATE associations SET is_default = false WHERE is_default = true'
      );
    }

    const result = await pool.query(
      `INSERT INTO associations (
        cnpj, corporate_name, trade_name, email, phone,
        address, city, state, zip_code, website, is_active, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        cnpj,
        corporate_name,
        trade_name || null,
        email || null,
        phone || null,
        address || null,
        city || null,
        state || null,
        zip_code || null,
        website || null,
        is_active,
        is_default,
      ]
    );

    res.status(201).json({
      message: 'Associação criada com sucesso',
      association: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.code === '23505') {
      // Unique violation
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }
    console.error('Create association error:', error);
    res.status(500).json({ error: 'Erro ao criar associação' });
  }
});

// Atualizar associação
router.put('/associations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = associationSchema.parse(req.body);
    const {
      cnpj,
      corporate_name,
      trade_name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      website,
      is_active,
      is_default,
    } = validatedData;

    // Verificar se associação existe
    const existing = await pool.query(
      'SELECT id, cnpj FROM associations WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    // Verificar se CNPJ já existe em outra associação
    if (cnpj !== existing.rows[0].cnpj) {
      const cnpjCheck = await pool.query(
        'SELECT id FROM associations WHERE cnpj = $1 AND id != $2',
        [cnpj, id]
      );
      if (cnpjCheck.rows.length > 0) {
        return res.status(400).json({ error: 'CNPJ já cadastrado em outra associação' });
      }
    }

    // Se for definir como padrão, remover padrão anterior
    if (is_default) {
      await pool.query(
        'UPDATE associations SET is_default = false WHERE is_default = true AND id != $1',
        [id]
      );
    }

    const result = await pool.query(
      `UPDATE associations SET
        cnpj = $1,
        corporate_name = $2,
        trade_name = $3,
        email = $4,
        phone = $5,
        address = $6,
        city = $7,
        state = $8,
        zip_code = $9,
        website = $10,
        is_active = COALESCE($11, is_active),
        is_default = COALESCE($12, is_default),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
      [
        cnpj,
        corporate_name,
        trade_name || null,
        email || null,
        phone || null,
        address || null,
        city || null,
        state || null,
        zip_code || null,
        website || null,
        is_active,
        is_default,
        id,
      ]
    );

    res.json({
      message: 'Associação atualizada com sucesso',
      association: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.code === '23505') {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }
    console.error('Update association error:', error);
    res.status(500).json({ error: 'Erro ao atualizar associação' });
  }
});

// Aprovar/Rejeitar associação
router.post('/associations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    const result = await pool.query(
      'UPDATE associations SET is_approved = $1, is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, corporate_name, is_approved',
      [is_approved === true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    res.json({
      message: `Associação ${is_approved ? 'aprovada' : 'rejeitada'} com sucesso`,
      association: result.rows[0],
    });
  } catch (error) {
    console.error('Approve association error:', error);
    res.status(500).json({ error: 'Erro ao aprovar/rejeitar associação' });
  }
});

// Ativar/Desativar associação (ao ativar, também aprova automaticamente)
router.post('/associations/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;

    const associationResult = await pool.query('SELECT is_active FROM associations WHERE id = $1', [id]);
    if (associationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    const newStatus = !associationResult.rows[0].is_active;

    // Se estiver ativando, também aprovar automaticamente
    if (newStatus) {
      await pool.query(
        'UPDATE associations SET is_active = $1, is_approved = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStatus, id]
      );
      res.json({ message: 'Associação ativada e aprovada com sucesso' });
    } else {
      // Se estiver desativando, apenas desativar (mantém aprovação)
      await pool.query(
        'UPDATE associations SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStatus, id]
      );
      res.json({ message: 'Associação desativada com sucesso' });
    }
  } catch (error) {
    console.error('Toggle association active status error:', error);
    res.status(500).json({ error: 'Erro ao alterar status da associação' });
  }
});

// Buscar usuários de uma associação
router.get('/associations/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.is_admin, u.is_active, u.created_at,
        up.cpf, up.city, up.state,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id) as total_payments,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND status = 'paid') as paid_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = u.id AND status = 'paid') as total_paid
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.association_id = $1
    `;
    const params = [id];
    let paramCount = 2;

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR up.cpf ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as count FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.association_id = $1';
    const countParams = [id];
    paramCount = 2;

    if (search) {
      countQuery += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR up.cpf ILIKE $${paramCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Get association users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários da associação' });
  }
});

// Métricas detalhadas de uma associação
router.get('/associations/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [
      totalUsers,
      activeUsers,
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
      revenueToday,
      revenueThisMonth,
      revenueTotal,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users WHERE association_id = $1', [id]),
      pool.query('SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND is_active = true', [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid'
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date >= CURRENT_DATE
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date < CURRENT_DATE
      `, [id]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) = $2
      `, [id, today]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) >= $2
      `, [id, firstDayOfMonth]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid'
      `, [id]),
    ]);

    res.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        active: parseInt(activeUsers.rows[0].count),
      },
      payments: {
        total: parseInt(totalPayments.rows[0].count),
        paid: parseInt(paidPayments.rows[0].count),
        pending: parseInt(pendingPayments.rows[0].count),
        overdue: parseInt(overduePayments.rows[0].count),
      },
      revenue: {
        today: parseFloat(revenueToday.rows[0].total),
        thisMonth: parseFloat(revenueThisMonth.rows[0].total),
        total: parseFloat(revenueTotal.rows[0].total),
      },
    });
  } catch (error) {
    console.error('Get association metrics error:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas da associação' });
  }
});

// Buscar usuários de uma associação
router.get('/associations/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.is_admin, u.is_active, u.created_at,
        up.cpf, up.city, up.state,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id) as total_payments,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND status = 'paid') as paid_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = u.id AND status = 'paid') as total_paid
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.association_id = $1
    `;
    const params = [id];
    let paramCount = 2;

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR up.cpf ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as count FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.association_id = $1';
    const countParams = [id];
    paramCount = 2;

    if (search) {
      countQuery += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR up.cpf ILIKE $${paramCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Get association users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários da associação' });
  }
});

// Métricas detalhadas de uma associação
router.get('/associations/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [
      totalUsers,
      activeUsers,
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
      revenueToday,
      revenueThisMonth,
      revenueTotal,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users WHERE association_id = $1', [id]),
      pool.query('SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND is_active = true', [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid'
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date >= CURRENT_DATE
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date < CURRENT_DATE
      `, [id]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) = $2
      `, [id, today]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) >= $2
      `, [id, firstDayOfMonth]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid'
      `, [id]),
    ]);

    res.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        active: parseInt(activeUsers.rows[0].count),
      },
      payments: {
        total: parseInt(totalPayments.rows[0].count),
        paid: parseInt(paidPayments.rows[0].count),
        pending: parseInt(pendingPayments.rows[0].count),
        overdue: parseInt(overduePayments.rows[0].count),
      },
      revenue: {
        today: parseFloat(revenueToday.rows[0].total),
        thisMonth: parseFloat(revenueThisMonth.rows[0].total),
        total: parseFloat(revenueTotal.rows[0].total),
      },
    });
  } catch (error) {
    console.error('Get association metrics error:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas da associação' });
  }
});

// Deletar/Desativar associação
router.delete('/associations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se associação existe
    const existing = await pool.query(
      'SELECT id, is_default FROM associations WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    // Não permitir deletar associação padrão
    if (existing.rows[0].is_default) {
      return res.status(400).json({ error: 'Não é possível deletar a associação padrão' });
    }

    // Verificar se há usuários vinculados
    const usersCount = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE association_id = $1',
      [id]
    );

    if (parseInt(usersCount.rows[0].count) > 0) {
      // Se houver usuários, apenas desativar
      await pool.query(
        'UPDATE associations SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      res.json({ message: 'Associação desativada com sucesso' });
    } else {
      // Se não houver usuários, deletar
      await pool.query('DELETE FROM associations WHERE id = $1', [id]);
      res.json({ message: 'Associação deletada com sucesso' });
    }
  } catch (error) {
    console.error('Delete association error:', error);
    res.status(500).json({ error: 'Erro ao deletar associação' });
  }
});

export default router;

