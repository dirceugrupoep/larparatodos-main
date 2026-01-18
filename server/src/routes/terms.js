import express from 'express';
import { pool } from '../database/connection.js';

const router = express.Router();

// Buscar termo de aceite ativo
router.get('/active', async (req, res) => {
  try {
    // Primeiro tenta buscar termo ativo
    let result = await pool.query(
      `SELECT id, version, title, content, created_at, updated_at
       FROM terms_of_acceptance
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT 1`
    );

    // Se não encontrar ativo, busca qualquer termo (último criado)
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT id, version, title, content, created_at, updated_at
         FROM terms_of_acceptance
         ORDER BY created_at DESC
         LIMIT 1`
      );
    }

    if (result.rows.length === 0) {
      console.error('Nenhum termo encontrado no banco de dados');
      return res.status(404).json({ 
        error: 'Nenhum termo de aceite encontrado. Por favor, execute o seed do banco de dados.' 
      });
    }

    res.json({ term: result.rows[0] });
  } catch (error) {
    console.error('Get active term error:', error);
    res.status(500).json({ error: 'Erro ao buscar termo de aceite' });
  }
});

// Buscar termo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, version, title, content, created_at, updated_at
       FROM terms_of_acceptance
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Termo não encontrado' });
    }

    res.json({ term: result.rows[0] });
  } catch (error) {
    console.error('Get term error:', error);
    res.status(500).json({ error: 'Erro ao buscar termo' });
  }
});

// Verificar se usuário aceitou o termo
router.get('/user/:userId/acceptance', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Buscar termo ativo
    const termResult = await pool.query(
      `SELECT id FROM terms_of_acceptance WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
    );

    if (termResult.rows.length === 0) {
      return res.json({ accepted: false, term: null });
    }

    const termId = termResult.rows[0].id;

    // Verificar se usuário aceitou
    const acceptanceResult = await pool.query(
      `SELECT * FROM user_term_acceptances
       WHERE user_id = $1 AND term_id = $2`,
      [userId, termId]
    );

    res.json({
      accepted: acceptanceResult.rows.length > 0,
      acceptance: acceptanceResult.rows[0] || null,
      term: termResult.rows[0],
    });
  } catch (error) {
    console.error('Check acceptance error:', error);
    res.status(500).json({ error: 'Erro ao verificar aceite' });
  }
});

// Registrar aceite do termo
router.post('/accept', async (req, res) => {
  try {
    const { userId, termId, ipAddress, userAgent } = req.body;

    if (!userId || !termId) {
      return res.status(400).json({ error: 'userId e termId são obrigatórios' });
    }

    // Verificar se termo existe e está ativo
    const termResult = await pool.query(
      `SELECT id FROM terms_of_acceptance WHERE id = $1 AND is_active = true`,
      [termId]
    );

    if (termResult.rows.length === 0) {
      return res.status(404).json({ error: 'Termo não encontrado ou inativo' });
    }

    // Inserir ou atualizar aceite
    const result = await pool.query(
      `INSERT INTO user_term_acceptances (user_id, term_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, term_id) 
       DO UPDATE SET 
         ip_address = EXCLUDED.ip_address,
         user_agent = EXCLUDED.user_agent,
         accepted_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, termId, ipAddress || null, userAgent || null]
    );

    res.json({ acceptance: result.rows[0] });
  } catch (error) {
    console.error('Accept term error:', error);
    res.status(500).json({ error: 'Erro ao registrar aceite' });
  }
});

export default router;

