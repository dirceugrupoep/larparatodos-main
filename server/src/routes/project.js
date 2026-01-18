import express from 'express';
import { pool } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Get project status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM project_status WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Criar status inicial se não existir
      await pool.query(
        `INSERT INTO project_status (user_id, phase, progress_percentage)
         VALUES ($1, 'registration', 0)
         RETURNING *`,
        [userId]
      );

      const newResult = await pool.query(
        'SELECT * FROM project_status WHERE user_id = $1',
        [userId]
      );

      return res.json({ status: newResult.rows[0] });
    }

    res.json({ status: result.rows[0] });
  } catch (error) {
    console.error('Get project status error:', error);
    res.status(500).json({ error: 'Erro ao buscar status do projeto' });
  }
});

// Get project timeline/phases
router.get('/timeline', async (req, res) => {
  try {
    const phases = [
      {
        phase: 'registration',
        title: 'Cadastro',
        description: 'Cadastro realizado e documentação em análise',
        progress: 0,
      },
      {
        phase: 'documentation',
        title: 'Documentação',
        description: 'Documentos aprovados e processo iniciado',
        progress: 25,
      },
      {
        phase: 'planning',
        title: 'Planejamento',
        description: 'Escolha do terreno e estudos de viabilidade',
        progress: 40,
      },
      {
        phase: 'projects',
        title: 'Projetos',
        description: 'Projetos arquitetônicos e estruturais em desenvolvimento',
        progress: 60,
      },
      {
        phase: 'construction',
        title: 'Construção',
        description: 'Obra em andamento',
        progress: 80,
      },
      {
        phase: 'delivery',
        title: 'Entrega',
        description: 'Chaves entregues!',
        progress: 100,
      },
    ];

    res.json({ phases });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Erro ao buscar timeline' });
  }
});

export default router;

