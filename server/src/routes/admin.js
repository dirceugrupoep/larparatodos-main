import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../database/connection.js';
import { requireAdmin } from '../middleware/admin.js';
import { z } from 'zod';

const router = express.Router();

// Admin que vê apenas cadastros fake e balanço dos fakes; os demais admins veem só não-fake
const FAKE_ADMIN_EMAIL = 'admin@larparatodoshabitacional.com.br';
function isFakeAdmin(req) {
  return req.user && req.user.email === FAKE_ADMIN_EMAIL;
}
function userScopeCondition(req) {
  return isFakeAdmin(req) ? 'u.fake = true' : '(u.fake = false OR u.fake IS NULL)';
}
function userScopeConditionTable(req) {
  return isFakeAdmin(req) ? 'fake = true' : '(fake = false OR fake IS NULL)';
}
// Escopo "real" (não-fake) para somar aos totais do admin fake e dar número quebrado
const REAL_SCOPE = '(u.fake = false OR u.fake IS NULL)';
const REAL_SCOPE_TABLE = '(fake = false OR fake IS NULL)';

// Todas as rotas requerem admin
router.use(requireAdmin);

// ==================== DASHBOARD E MÉTRICAS ====================

// Dashboard geral: admin normal vê só não-fake; admin fake vê só fake nas listas, mas totais = fake + real (número quebrado)
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const userScope = userScopeCondition(req);
    const userScopeTable = userScopeConditionTable(req);
    const userWhere = ` AND ${userScopeTable}`;

    // Métricas de usuários (exclui admins; escopo fake ou não-fake)
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersToday,
      newUsersThisMonth,
      totalAdmins,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false ${userWhere}`),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false AND is_active = true ${userWhere}`),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false AND is_active = false ${userWhere}`),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false AND DATE(created_at) = $1 ${userWhere}`, [today]),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false AND DATE(created_at) >= $1 ${userWhere}`, [firstDayOfMonth]),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true'),
    ]);

    const payScope = ` FROM payments p INNER JOIN users u ON p.user_id = u.id WHERE ${userScope}`;
    // Métricas de pagamentos (escopo atual)
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
      pool.query(`SELECT COUNT(*) as count ${payScope}`),
      pool.query(`SELECT COUNT(*) as count ${payScope} AND p.status = 'paid'`),
      pool.query(`SELECT COUNT(*) as count ${payScope} AND p.status = 'pending' AND p.due_date >= CURRENT_DATE`),
      pool.query(`SELECT COUNT(*) as count ${payScope} AND p.status = 'pending' AND p.due_date < CURRENT_DATE`),
      pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${payScope} AND p.status = 'paid' AND DATE(p.paid_date) = $1`, [today]),
      pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${payScope} AND p.status = 'paid' AND DATE(p.paid_date) >= $1`, [firstDayOfMonth]),
      pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${payScope} AND p.status = 'paid'`),
      pool.query(`
        SELECT COUNT(DISTINCT p.user_id) as count ${payScope}
        AND p.user_id NOT IN (
          SELECT p2.user_id FROM payments p2 INNER JOIN users u2 ON p2.user_id = u2.id
          WHERE p2.status = 'pending' AND p2.due_date < CURRENT_DATE AND ${userScope.replace('u.', 'u2.')}
        )
      `),
      pool.query(`
        SELECT COUNT(DISTINCT p.user_id) as count ${payScope}
        AND p.user_id IN (
          SELECT p2.user_id FROM payments p2 INNER JOIN users u2 ON p2.user_id = u2.id
          WHERE p2.status = 'pending' AND p2.due_date < CURRENT_DATE AND ${userScope.replace('u.', 'u2.')}
        )
      `),
    ]);

    // Admin fake: somar cadastros reais aos totais para dar número quebrado (listagem continua só fake)
    let usersTotal = parseInt(totalUsers.rows[0].count);
    let usersActive = parseInt(activeUsers.rows[0].count);
    let usersInactive = parseInt(inactiveUsers.rows[0].count);
    let usersNewToday = parseInt(newUsersToday.rows[0].count);
    let usersNewMonth = parseInt(newUsersThisMonth.rows[0].count);
    let payTotal = parseInt(totalPayments.rows[0].count);
    let payPaid = parseInt(paidPayments.rows[0].count);
    let payPending = parseInt(pendingPayments.rows[0].count);
    let payOverdue = parseInt(overduePayments.rows[0].count);
    let revToday = parseFloat(revenueToday.rows[0].total);
    let revMonth = parseFloat(revenueThisMonth.rows[0].total);
    let revTotal = parseFloat(revenueTotal.rows[0].total);
    let adimp = parseInt(adimplentes.rows[0].count);
    let inadimp = parseInt(inadimplentes.rows[0].count);

    if (isFakeAdmin(req)) {
      const realWhere = ` AND ${REAL_SCOPE_TABLE}`;
      const realPayScope = ` FROM payments p INNER JOIN users u ON p.user_id = u.id WHERE ${REAL_SCOPE}`;
      const [rU, rA, rI, rToday, rMonth, rPay, rPaid, rPending, rOverdue, rRevToday, rRevMonth, rRevTotal, rAdimp, rInadimp] = await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false ${realWhere}`),
        pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false AND is_active = true ${realWhere}`),
        pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false AND is_active = false ${realWhere}`),
        pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false AND DATE(created_at) = $1 ${realWhere}`, [today]),
        pool.query(`SELECT COUNT(*) as count FROM users WHERE is_admin = false AND DATE(created_at) >= $1 ${realWhere}`, [firstDayOfMonth]),
        pool.query(`SELECT COUNT(*) as count ${realPayScope}`),
        pool.query(`SELECT COUNT(*) as count ${realPayScope} AND p.status = 'paid'`),
        pool.query(`SELECT COUNT(*) as count ${realPayScope} AND p.status = 'pending' AND p.due_date >= CURRENT_DATE`),
        pool.query(`SELECT COUNT(*) as count ${realPayScope} AND p.status = 'pending' AND p.due_date < CURRENT_DATE`),
        pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${realPayScope} AND p.status = 'paid' AND DATE(p.paid_date) = $1`, [today]),
        pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${realPayScope} AND p.status = 'paid' AND DATE(p.paid_date) >= $1`, [firstDayOfMonth]),
        pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${realPayScope} AND p.status = 'paid'`),
        pool.query(`SELECT COUNT(DISTINCT p.user_id) as count ${realPayScope} AND p.user_id NOT IN (SELECT p2.user_id FROM payments p2 INNER JOIN users u2 ON p2.user_id = u2.id WHERE p2.status = 'pending' AND p2.due_date < CURRENT_DATE AND (u2.fake = false OR u2.fake IS NULL))`),
        pool.query(`SELECT COUNT(DISTINCT p.user_id) as count ${realPayScope} AND p.user_id IN (SELECT p2.user_id FROM payments p2 INNER JOIN users u2 ON p2.user_id = u2.id WHERE p2.status = 'pending' AND p2.due_date < CURRENT_DATE AND (u2.fake = false OR u2.fake IS NULL))`),
      ]);
      usersTotal += parseInt(rU.rows[0].count);
      usersActive += parseInt(rA.rows[0].count);
      usersInactive += parseInt(rI.rows[0].count);
      usersNewToday += parseInt(rToday.rows[0].count);
      usersNewMonth += parseInt(rMonth.rows[0].count);
      payTotal += parseInt(rPay.rows[0].count);
      payPaid += parseInt(rPaid.rows[0].count);
      payPending += parseInt(rPending.rows[0].count);
      payOverdue += parseInt(rOverdue.rows[0].count);
      revToday += parseFloat(rRevToday.rows[0].total);
      revMonth += parseFloat(rRevMonth.rows[0].total);
      revTotal += parseFloat(rRevTotal.rows[0].total);
      adimp += parseInt(rAdimp.rows[0].count);
      inadimp += parseInt(rInadimp.rows[0].count);
    }

    // Métricas de contatos (globais para todos os admins)
    const [
      totalContacts,
      contactsToday,
      contactsThisMonth,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM contacts'),
      pool.query("SELECT COUNT(*) as count FROM contacts WHERE DATE(created_at) = $1", [today]),
      pool.query("SELECT COUNT(*) as count FROM contacts WHERE DATE(created_at) >= $1", [firstDayOfMonth]),
    ]);

    // Projeções e tendências (pagamentos no escopo; para fake admin não somamos real para não duplicar gráficos)
    const [
      avgPaymentValue,
      paymentsByMonth,
      revenueByMonth,
      registrationsByDay,
      revenueByDay,
    ] = await Promise.all([
      pool.query(`SELECT COALESCE(AVG(p.amount), 0) as avg ${payScope} AND p.status = 'paid'`),
      pool.query(`
        SELECT TO_CHAR(p.created_at, 'YYYY-MM') as month, COUNT(*) as count
        ${payScope} AND p.created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(p.created_at, 'YYYY-MM') ORDER BY month DESC LIMIT 12
      `),
      pool.query(`
        SELECT TO_CHAR(p.paid_date, 'YYYY-MM') as month, COALESCE(SUM(p.amount), 0) as total
        ${payScope} AND p.status = 'paid' AND p.paid_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(p.paid_date, 'YYYY-MM') ORDER BY month DESC LIMIT 12
      `),
      pool.query(`
        WITH days AS (
          SELECT generate_series(CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, '1 day')::date AS d
        ),
        regs AS (
          SELECT DATE(created_at) AS d, COUNT(*) AS c
          FROM users
          WHERE is_admin = false ${userWhere}
            AND created_at >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY DATE(created_at)
        )
        SELECT days.d::text AS date, COALESCE(regs.c, 0)::int AS count
        FROM days LEFT JOIN regs ON days.d = regs.d ORDER BY days.d
      `),
      pool.query(`
        WITH days AS (
          SELECT generate_series(CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, '1 day')::date AS d
        ),
        rev AS (
          SELECT DATE(p.paid_date) AS d, COALESCE(SUM(p.amount), 0) AS total, COUNT(*) AS cnt
          ${payScope} AND p.status = 'paid' AND p.paid_date IS NOT NULL
            AND p.paid_date >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY DATE(p.paid_date)
        )
        SELECT days.d::text AS date, COALESCE(rev.total, 0) AS total, COALESCE(rev.cnt, 0)::int AS count
        FROM days LEFT JOIN rev ON days.d = rev.d ORDER BY days.d
      `),
    ]);

    const avgVal = payPaid > 0 ? revTotal / payPaid : parseFloat(avgPaymentValue.rows[0].avg);

    res.json({
      users: {
        total: usersTotal,
        active: usersActive,
        inactive: usersInactive,
        newToday: usersNewToday,
        newThisMonth: usersNewMonth,
        admins: parseInt(totalAdmins.rows[0].count),
      },
      payments: {
        total: payTotal,
        paid: payPaid,
        pending: payPending,
        overdue: payOverdue,
        adimplentes: adimp,
        inadimplentes: inadimp,
        avgValue: avgVal,
      },
      revenue: {
        today: revToday,
        thisMonth: revMonth,
        total: revTotal,
      },
      contacts: {
        total: isFakeAdmin(req) ? 0 : parseInt(totalContacts.rows[0].count),
        today: isFakeAdmin(req) ? 0 : parseInt(contactsToday.rows[0].count),
        thisMonth: isFakeAdmin(req) ? 0 : parseInt(contactsThisMonth.rows[0].count),
      },
      trends: {
        paymentsByMonth: paymentsByMonth.rows,
        revenueByMonth: revenueByMonth.rows,
        registrationsByDay: registrationsByDay.rows,
        revenueByDay: revenueByDay.rows,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// ==================== GESTÃO DE USUÁRIOS ====================

// Listar todos os usuários com paginação e filtros (admin fake: só fake; outros: só não-fake)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status; // 'active', 'inactive', 'all'
    const scopeWhere = ` AND ${userScopeCondition(req)}`;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.is_admin, u.is_active, u.created_at, u.payment_day, u.association_id,
        a.trade_name as association_name,
        up.cpf, up.rg, up.city, up.state, up.address, up.zip_code, up.birth_date, up.marital_status, up.occupation, up.monthly_income,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id) as total_payments,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND status = 'paid') as paid_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = u.id AND status = 'paid') as total_paid
      FROM users u
      LEFT JOIN associations a ON u.association_id = a.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1 ${scopeWhere}
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
    let countQuery = `SELECT COUNT(*) as count FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE 1=1 ${scopeWhere}`;
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

// Obter detalhes de um usuário específico (admin fake só acessa fake; outros só não-fake)
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
    const user = userResult.rows[0];
    const isFake = user.fake === true;
    if (isFakeAdmin(req) && !isFake) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    if (!isFakeAdmin(req) && isFake) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      user,
      profile: profileResult.rows[0] || null,
      payments: paymentsResult.rows,
      project: projectResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do usuário' });
  }
});

// Atualizar usuário (admin pode editar qualquer dado: associação, nome, email, telefone, dia de pagamento, perfil completo)
const updateUserSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
  is_admin: z.boolean().optional(),
  is_active: z.boolean().optional(),
  payment_day: z.number().min(1).max(31).optional().nullable(),
  association_id: z.number().int().positive().optional().nullable(),
  cpf: z.string().max(14).optional().nullable(),
  rg: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zip_code: z.string().max(10).optional().nullable(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  marital_status: z.string().max(20).optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  monthly_income: z.number().min(0).optional().nullable(),
});

router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const validatedData = updateUserSchema.parse(req.body);

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

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
    if (validatedData.payment_day !== undefined) {
      updates.push(`payment_day = $${paramCount++}`);
      values.push(validatedData.payment_day);
    }
    if (validatedData.association_id !== undefined) {
      updates.push(`association_id = $${paramCount++}`);
      values.push(validatedData.association_id);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      await pool.query(query, values);
    }

    const profileFields = ['cpf', 'rg', 'address', 'city', 'state', 'zip_code', 'birth_date', 'marital_status', 'occupation', 'monthly_income'];
    const hasProfileData = profileFields.some((f) => validatedData[f] !== undefined);
    if (hasProfileData) {
      const profileResult = await pool.query('SELECT id FROM user_profiles WHERE user_id = $1', [userId]);
      const cpf = validatedData.cpf !== undefined ? validatedData.cpf : null;
      const rg = validatedData.rg !== undefined ? validatedData.rg : null;
      const address = validatedData.address !== undefined ? validatedData.address : null;
      const city = validatedData.city !== undefined ? validatedData.city : null;
      const state = validatedData.state !== undefined ? validatedData.state : null;
      const zip_code = validatedData.zip_code !== undefined ? validatedData.zip_code : null;
      const birth_date = validatedData.birth_date !== undefined ? validatedData.birth_date : null;
      const marital_status = validatedData.marital_status !== undefined ? validatedData.marital_status : null;
      const occupation = validatedData.occupation !== undefined ? validatedData.occupation : null;
      const monthly_income = validatedData.monthly_income !== undefined ? validatedData.monthly_income : null;

      if (profileResult.rows.length > 0) {
        await pool.query(
          `UPDATE user_profiles SET cpf = COALESCE($1, cpf), rg = COALESCE($2, rg), address = COALESCE($3, address), city = COALESCE($4, city), state = COALESCE($5, state), zip_code = COALESCE($6, zip_code), birth_date = COALESCE($7, birth_date), marital_status = COALESCE($8, marital_status), occupation = COALESCE($9, occupation), monthly_income = COALESCE($10, monthly_income), updated_at = CURRENT_TIMESTAMP WHERE user_id = $11`,
          [cpf, rg, address, city, state, zip_code, birth_date, marital_status, occupation, monthly_income, userId]
        );
      } else {
        await pool.query(
          `INSERT INTO user_profiles (user_id, cpf, rg, address, city, state, zip_code, birth_date, marital_status, occupation, monthly_income) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [userId, cpf || null, rg || null, address || null, city || null, state || null, zip_code || null, birth_date || null, marital_status || null, occupation || null, monthly_income || null]
        );
      }
    }

    const [userRow] = (await pool.query('SELECT * FROM users WHERE id = $1', [userId])).rows;
    const [profileRow] = (await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId])).rows;

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: userRow,
      profile: profileRow || null,
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

// Relatório de pagamentos (filtros: associação, status)
router.get('/reports/payments', async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const associationId = req.query.associationId ? parseInt(req.query.associationId, 10) : null;
    const status = req.query.status || 'all'; // all | paid | pending | overdue
    const scopeWhere = ` AND ${userScopeCondition(req)}`;

    const conditions = ['DATE(p.created_at) BETWEEN $1 AND $2', scopeWhere.replace(/^ AND /, '')];
    const params = [startDate, endDate];

    if (associationId) {
      conditions.push(`u.association_id = $${params.length + 1}`);
      params.push(associationId);
    }
    if (status === 'paid') {
      conditions.push("p.status = 'paid'");
    } else if (status === 'pending') {
      conditions.push("p.status = 'pending' AND p.due_date >= CURRENT_DATE");
    } else if (status === 'overdue') {
      conditions.push("p.status = 'pending' AND p.due_date < CURRENT_DATE");
    }

    const whereClause = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        up.cpf as user_cpf,
        a.trade_name as association_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN associations a ON u.association_id = a.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC`,
      params
    );

    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Payments report error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de pagamentos' });
  }
});

// Relatório analítico (DRE, faturamento do mês, resumo gerencial)
router.get('/reports/analytics', async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const associationId = req.query.associationId ? parseInt(req.query.associationId, 10) : null;
    const scopeCond = userScopeCondition(req);
    const params = [startDate, endDate];
    let assocFilter = '';
    if (associationId) {
      assocFilter = ` AND u.association_id = $${params.length + 1}`;
      params.push(associationId);
    }

    const baseFrom = `FROM payments p INNER JOIN users u ON p.user_id = u.id WHERE ${scopeCond} AND DATE(p.created_at) BETWEEN $1 AND $2${assocFilter}`;
    const baseFromAll = `FROM payments p INNER JOIN users u ON p.user_id = u.id WHERE ${scopeCond}${associationId ? ' AND u.association_id = $1' : ''}`;
    const paramsAll = associationId ? [associationId] : [];

    const [
      receitaPeriodo,
      parcelasPendentes,
      parcelasAtrasadas,
      totalReceitaHistorico,
      inadimplenciaTotal,
      cooperadosPagantes,
      cooperadosInadimplentes,
    ] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${baseFrom} AND p.status = 'paid'`, params),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total ${baseFrom} AND p.status = 'pending' AND p.due_date >= CURRENT_DATE`, params),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total ${baseFrom} AND p.status = 'pending' AND p.due_date < CURRENT_DATE`, params),
      pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${baseFromAll} AND p.status = 'paid'`, paramsAll),
      pool.query(`SELECT COALESCE(SUM(p.amount), 0) as total ${baseFromAll} AND p.status = 'pending' AND p.due_date < CURRENT_DATE`, paramsAll),
      pool.query(`SELECT COUNT(DISTINCT p.user_id) as count ${baseFromAll} AND p.status = 'paid'`, paramsAll),
      pool.query(
        `SELECT COUNT(DISTINCT p.user_id) as count ${baseFromAll} AND p.user_id IN (SELECT p2.user_id FROM payments p2 INNER JOIN users u2 ON p2.user_id = u2.id WHERE p2.status = 'pending' AND p2.due_date < CURRENT_DATE AND ${scopeCond.replace('u.', 'u2.')}${associationId ? ' AND u2.association_id = $1' : ''})`,
        paramsAll
      ),
    ]);

    const parcelasPagas = await pool.query(`SELECT COUNT(*) as count ${baseFrom} AND p.status = 'paid'`, params);

    const paramsFaturamento = associationId ? [associationId] : [];
    const faturamentoPorMesQuery = associationId
      ? `SELECT TO_CHAR(p.paid_date, 'YYYY-MM') as mes_ano, SUM(p.amount) as valor, COUNT(p.id) as quantidade
         FROM payments p INNER JOIN users u ON p.user_id = u.id WHERE p.status = 'paid' AND u.association_id = $1 AND ${scopeCond}
         GROUP BY TO_CHAR(p.paid_date, 'YYYY-MM') ORDER BY mes_ano DESC LIMIT 12`
      : `SELECT TO_CHAR(p.paid_date, 'YYYY-MM') as mes_ano, SUM(p.amount) as valor, COUNT(p.id) as quantidade
         FROM payments p INNER JOIN users u ON p.user_id = u.id WHERE p.status = 'paid' AND ${scopeCond}
         GROUP BY TO_CHAR(p.paid_date, 'YYYY-MM') ORDER BY mes_ano DESC LIMIT 12`;
    const faturamentoPorMes = await pool.query(faturamentoPorMesQuery, paramsFaturamento.length ? paramsFaturamento : []);

    const dre = {
      receitaOperacional: parseFloat(receitaPeriodo.rows[0]?.total || 0),
      parcelasPagasPeriodo: parseInt(parcelasPagas.rows[0]?.count || 0),
      parcelasPendentes: parseInt(parcelasPendentes.rows[0]?.count || 0),
      valorPendente: parseFloat(parcelasPendentes.rows[0]?.total || 0),
      parcelasAtrasadas: parseInt(parcelasAtrasadas.rows[0]?.count || 0),
      valorAtrasado: parseFloat(parcelasAtrasadas.rows[0]?.total || 0),
      totalReceitaAcumulada: parseFloat(totalReceitaHistorico.rows[0]?.total || 0),
      inadimplenciaTotal: parseFloat(inadimplenciaTotal.rows[0]?.total || 0),
      cooperadosPagantes: parseInt(cooperadosPagantes.rows[0]?.count || 0),
      cooperadosInadimplentes: parseInt(cooperadosInadimplentes.rows[0]?.count || 0),
    };

    const faturamentoMeses = faturamentoPorMes.rows.map((r) => ({
      mesAno: r.mes_ano,
      valor: parseFloat(r.valor),
      quantidade: parseInt(r.quantidade),
    }));

    res.json({
      dre,
      faturamentoPorMes: faturamentoMeses,
      periodo: { startDate, endDate },
      associationId: associationId || null,
    });
  } catch (error) {
    console.error('Reports analytics error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório analítico' });
  }
});

// Relatório de previsão: projeta receita e cadastros para os próximos X meses (média dos últimos 90 dias)
router.get('/reports/forecast', async (req, res) => {
  try {
    const months = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 6));
    const scopeCond = userScopeCondition(req);
    const userScopeTable = userScopeConditionTable(req);
    const payScope = ` FROM payments p INNER JOIN users u ON p.user_id = u.id WHERE ${scopeCond}`;

    const [dailyRevenue, dailyRegistrations] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) AS total, COUNT(DISTINCT DATE(p.paid_date)) AS days_with_data
        ${payScope} AND p.status = 'paid' AND p.paid_date IS NOT NULL
          AND p.paid_date >= CURRENT_DATE - INTERVAL '90 days'
      `),
      pool.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE is_admin = false AND ${userScopeTable}
          AND created_at >= CURRENT_DATE - INTERVAL '90 days'
      `),
    ]);

    const totalRevenue90 = parseFloat(dailyRevenue.rows[0]?.total || 0);
    const daysWithRevenue = parseInt(dailyRevenue.rows[0]?.days_with_data || 0, 10);
    const avgDailyRevenue = daysWithRevenue > 0 ? totalRevenue90 / 90 : 0;
    const totalRegs90 = parseInt(dailyRegistrations.rows[0]?.total || 0, 10);
    const avgDailyRegistrations = totalRegs90 / 90;

    const byMonth = [];
    let totalPredictedRevenue = 0;
    let totalPredictedRegistrations = 0;
    const now = new Date();
    for (let i = 1; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const predRevenue = Math.round(avgDailyRevenue * daysInMonth * 100) / 100;
      const predRegs = Math.round(avgDailyRegistrations * daysInMonth);
      byMonth.push({
        month: monthKey,
        monthLabel,
        daysInMonth,
        predictedRevenue: predRevenue,
        predictedRegistrations: predRegs,
      });
      totalPredictedRevenue += predRevenue;
      totalPredictedRegistrations += predRegs;
    }

    res.json({
      projectionMonths: months,
      basedOnDays: 90,
      avgDailyRevenue,
      avgDailyRegistrations,
      byMonth,
      totalPredictedRevenue,
      totalPredictedRegistrations,
    });
  } catch (error) {
    console.error('Forecast report error:', error);
    res.status(500).json({ error: 'Erro ao gerar previsão' });
  }
});

// Relatório de inadimplência (escopo fake/não-fake; filtro por associação)
router.get('/reports/overdue', async (req, res) => {
  try {
    const associationId = req.query.associationId ? parseInt(req.query.associationId, 10) : null;
    const scopeWhere = ` AND ${userScopeCondition(req)}`;
    const params = [];
    let assocWhere = '';
    if (associationId) {
      assocWhere = ` AND u.association_id = $1`;
      params.push(associationId);
    }

    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        up.cpf,
        a.trade_name as association_name,
        COUNT(p.id) as overdue_count,
        COALESCE(SUM(p.amount), 0) as total_overdue
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN associations a ON u.association_id = a.id
      INNER JOIN payments p ON u.id = p.user_id
      WHERE p.status = 'pending' AND p.due_date < CURRENT_DATE ${scopeWhere}${assocWhere}
      GROUP BY u.id, u.name, u.email, u.phone, up.cpf, a.trade_name
      ORDER BY total_overdue DESC`,
      params
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

// Listar todas as associações (admin - inclui inativas) com métricas (escopo fake/não-fake)
router.get('/associations', async (req, res) => {
  try {
    const scopeCond = userScopeCondition(req);
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
      LEFT JOIN users u ON u.association_id = a.id AND ${scopeCond}
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

// Métricas detalhadas de uma associação (escopo fake/não-fake)
router.get('/associations/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const scopeTable = userScopeConditionTable(req);
    const scopeCond = userScopeCondition(req);

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
      pool.query(`SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND ${scopeTable}`, [id]),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND is_active = true AND ${scopeTable}`, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND ${scopeCond}
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND ${scopeCond}
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date >= CURRENT_DATE AND ${scopeCond}
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date < CURRENT_DATE AND ${scopeCond}
      `, [id]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) = $2 AND ${scopeCond}
      `, [id, today]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) >= $2 AND ${scopeCond}
      `, [id, firstDayOfMonth]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND ${scopeCond}
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

// Buscar usuários de uma associação (segunda rota duplicada - manter escopo)
router.get('/associations/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const scopeWhere = ` AND ${userScopeCondition(req)}`;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.is_admin, u.is_active, u.created_at,
        up.cpf, up.city, up.state,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id) as total_payments,
        (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND status = 'paid') as paid_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = u.id AND status = 'paid') as total_paid
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.association_id = $1 ${scopeWhere}
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
    let countQuery = `SELECT COUNT(*) as count FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.association_id = $1 ${scopeWhere}`;
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

// Métricas detalhadas de uma associação (segunda rota duplicada - escopo)
router.get('/associations/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const scopeTable = userScopeConditionTable(req);
    const scopeCond = userScopeCondition(req);

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
      pool.query(`SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND ${scopeTable}`, [id]),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND is_active = true AND ${scopeTable}`, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND ${scopeCond}
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND ${scopeCond}
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date >= CURRENT_DATE AND ${scopeCond}
      `, [id]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date < CURRENT_DATE AND ${scopeCond}
      `, [id]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) = $2 AND ${scopeCond}
      `, [id, today]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) >= $2 AND ${scopeCond}
      `, [id, firstDayOfMonth]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND ${scopeCond}
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

