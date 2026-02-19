import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../database/connection.js';

const router = express.Router();
const NON_FAKE_SCOPE = '(u.fake = false OR u.fake IS NULL)';
const NON_FAKE_SCOPE_TABLE = '(fake = false OR fake IS NULL)';

// Middleware para autenticar associação
const authenticateAssociation = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.type !== 'association') {
      return res.status(403).json({ error: 'Token inválido para associação' });
    }

    req.associationId = decoded.id || decoded.associationId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Métricas completas do dashboard
router.get('/metrics', authenticateAssociation, async (req, res) => {
  try {
    const { associationId } = req;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const firstDayOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
    const lastDayOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];

    // Métricas básicas
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
      revenueToday,
      revenueThisMonth,
      revenueLastMonth,
      revenueTotal,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND ${NON_FAKE_SCOPE_TABLE}`, [associationId]),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND is_active = true AND ${NON_FAKE_SCOPE_TABLE}`, [associationId]),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE association_id = $1 AND is_active = false AND ${NON_FAKE_SCOPE_TABLE}`, [associationId]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND ${NON_FAKE_SCOPE}
      `, [associationId]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND ${NON_FAKE_SCOPE}
      `, [associationId]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date >= CURRENT_DATE AND ${NON_FAKE_SCOPE}
      `, [associationId]),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'pending' AND p.due_date < CURRENT_DATE AND ${NON_FAKE_SCOPE}
      `, [associationId]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) = $2 AND ${NON_FAKE_SCOPE}
      `, [associationId, today]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) >= $2 AND ${NON_FAKE_SCOPE}
      `, [associationId, firstDayOfMonth]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND DATE(p.paid_date) >= $2 AND DATE(p.paid_date) <= $3 AND ${NON_FAKE_SCOPE}
      `, [associationId, firstDayOfLastMonth, lastDayOfLastMonth]),
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE u.association_id = $1 AND p.status = 'paid' AND ${NON_FAKE_SCOPE}
      `, [associationId]),
    ]);

    // Receita dos últimos 12 meses para gráfico
    const revenueByMonth = await pool.query(`
      SELECT 
        TO_CHAR(p.paid_date, 'YYYY-MM') as month,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE u.association_id = $1 
        AND p.status = 'paid'
        AND ${NON_FAKE_SCOPE}
        AND p.paid_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(p.paid_date, 'YYYY-MM')
      ORDER BY month ASC
    `, [associationId]);

    // Receita dos últimos 30 dias para gráfico diário
    const revenueByDay = await pool.query(`
      SELECT 
        DATE(p.paid_date) as date,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE u.association_id = $1 
        AND p.status = 'paid'
        AND ${NON_FAKE_SCOPE}
        AND p.paid_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(p.paid_date)
      ORDER BY date ASC
    `, [associationId]);

    // Taxa de adimplência por mês
    const complianceByMonth = await pool.query(`
      SELECT 
        TO_CHAR(p.due_date, 'YYYY-MM') as month,
        COUNT(*) FILTER (WHERE p.status = 'paid') as paid,
        COUNT(*) FILTER (WHERE p.status = 'pending') as pending,
        COUNT(*) as total
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE u.association_id = $1 
        AND ${NON_FAKE_SCOPE}
        AND p.due_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(p.due_date, 'YYYY-MM')
      ORDER BY month ASC
    `, [associationId]);

    // Crescimento de usuários
    const userGrowth = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as new_users
      FROM users
      WHERE association_id = $1 
        AND ${NON_FAKE_SCOPE_TABLE}
        AND created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `, [associationId]);

    // Top usuários por receita
    const topUsers = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(p.id) FILTER (WHERE p.status = 'paid') as paid_count,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0) as total_paid
      FROM users u
      LEFT JOIN payments p ON p.user_id = u.id
      WHERE u.association_id = $1
        AND ${NON_FAKE_SCOPE}
      GROUP BY u.id, u.name, u.email
      ORDER BY total_paid DESC
      LIMIT 10
    `, [associationId]);

    // Métricas de crescimento
    const revenueThisMonthValue = parseFloat(revenueThisMonth.rows[0].total);
    const revenueLastMonthValue = parseFloat(revenueLastMonth.rows[0].total);
    const revenueGrowth = revenueLastMonthValue > 0 
      ? ((revenueThisMonthValue - revenueLastMonthValue) / revenueLastMonthValue) * 100 
      : 0;

    const usersThisMonth = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE association_id = $1 
        AND ${NON_FAKE_SCOPE_TABLE}
        AND created_at >= $2
    `, [associationId, firstDayOfMonth]);

    const usersLastMonth = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE association_id = $1 
        AND ${NON_FAKE_SCOPE_TABLE}
        AND created_at >= $2 AND created_at <= $3
    `, [associationId, firstDayOfLastMonth, lastDayOfLastMonth]);

    const userGrowthRate = parseInt(usersLastMonth.rows[0].count) > 0
      ? ((parseInt(usersThisMonth.rows[0].count) - parseInt(usersLastMonth.rows[0].count)) / parseInt(usersLastMonth.rows[0].count)) * 100
      : 0;

    res.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        active: parseInt(activeUsers.rows[0].count),
        inactive: parseInt(inactiveUsers.rows[0].count),
        growthRate: userGrowthRate,
      },
      payments: {
        total: parseInt(totalPayments.rows[0].count),
        paid: parseInt(paidPayments.rows[0].count),
        pending: parseInt(pendingPayments.rows[0].count),
        overdue: parseInt(overduePayments.rows[0].count),
        complianceRate: parseInt(totalPayments.rows[0].count) > 0
          ? (parseInt(paidPayments.rows[0].count) / parseInt(totalPayments.rows[0].count)) * 100
          : 0,
      },
      revenue: {
        today: parseFloat(revenueToday.rows[0].total),
        thisMonth: revenueThisMonthValue,
        lastMonth: revenueLastMonthValue,
        total: parseFloat(revenueTotal.rows[0].total),
        growthRate: revenueGrowth,
      },
      charts: {
        revenueByMonth: revenueByMonth.rows,
        revenueByDay: revenueByDay.rows,
        complianceByMonth: complianceByMonth.rows,
        userGrowth: userGrowth.rows,
      },
      topUsers: topUsers.rows,
    });
  } catch (error) {
    console.error('Get association metrics error:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// Listar usuários da associação
router.get('/users', authenticateAssociation, async (req, res) => {
  try {
    const { associationId } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT
        u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
        up.cpf, up.city, up.state,
        COUNT(p.id) as total_payments,
        COUNT(p.id) FILTER (WHERE p.status = 'paid') as paid_payments,
        COUNT(p.id) FILTER (WHERE p.status = 'pending') as pending_payments,
        COUNT(p.id) FILTER (WHERE p.status = 'pending' AND p.due_date < CURRENT_DATE) as overdue_payments,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0) as total_paid,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'pending'), 0) as pending_amount
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN payments p ON p.user_id = u.id
      WHERE u.association_id = $1
        AND ${NON_FAKE_SCOPE}
    `;
    const params = [associationId];
    let paramCount = 2;

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR up.cpf ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY u.id, up.cpf, up.city, up.state ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.association_id = $1
        AND ${NON_FAKE_SCOPE}
    `;
    const countParams = [associationId];
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
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Relatórios da associação
router.get('/reports', authenticateAssociation, async (req, res) => {
  try {
    const { associationId } = req;
    const startDate = req.query.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];

    // Relatório de pagamentos
    const paymentsReport = await pool.query(`
      SELECT 
        p.id,
        p.amount,
        p.due_date,
        p.paid_date,
        p.status,
        p.payment_method,
        u.name as user_name,
        u.email as user_email
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE u.association_id = $1
        AND ${NON_FAKE_SCOPE}
        AND p.due_date >= $2
        AND p.due_date <= $3
      ORDER BY p.due_date DESC
    `, [associationId, startDate, endDate]);

    // Resumo financeiro
    const financialSummary = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE p.status = 'paid') as paid_count,
        COUNT(*) FILTER (WHERE p.status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE p.status = 'pending' AND p.due_date < CURRENT_DATE) as overdue_count,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0) as total_received,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'pending'), 0) as total_pending,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'pending' AND p.due_date < CURRENT_DATE), 0) as total_overdue
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE u.association_id = $1
        AND ${NON_FAKE_SCOPE}
        AND p.due_date >= $2
        AND p.due_date <= $3
    `, [associationId, startDate, endDate]);

    // Relatório de usuários
    const usersReport = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.is_active,
        u.created_at,
        up.cpf,
        up.city,
        up.state,
        COUNT(p.id) as total_payments,
        COUNT(p.id) FILTER (WHERE p.status = 'paid') as paid_payments,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0) as total_contributed
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN payments p ON p.user_id = u.id
      WHERE u.association_id = $1
        AND ${NON_FAKE_SCOPE}
      GROUP BY u.id, up.cpf, up.city, up.state
      ORDER BY u.created_at DESC
    `, [associationId]);

    res.json({
      period: {
        startDate,
        endDate,
      },
      financial: {
        paidCount: parseInt(financialSummary.rows[0].paid_count),
        pendingCount: parseInt(financialSummary.rows[0].pending_count),
        overdueCount: parseInt(financialSummary.rows[0].overdue_count),
        totalReceived: parseFloat(financialSummary.rows[0].total_received),
        totalPending: parseFloat(financialSummary.rows[0].total_pending),
        totalOverdue: parseFloat(financialSummary.rows[0].total_overdue),
      },
      payments: paymentsReport.rows,
      users: usersReport.rows,
    });
  } catch (error) {
    console.error('Get association reports error:', error);
    res.status(500).json({ error: 'Erro ao buscar relatórios' });
  }
});

export default router;

