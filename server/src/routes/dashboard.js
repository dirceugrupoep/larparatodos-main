import express from 'express';
import { pool } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [usersCount, contactsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM contacts'),
    ]);

    res.json({
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalContacts: parseInt(contactsCount.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Get recent contacts
router.get('/recent-contacts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contacts ORDER BY created_at DESC LIMIT 10'
    );

    res.json({ contacts: result.rows });
  } catch (error) {
    console.error('Recent contacts error:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos recentes' });
  }
});

export default router;

