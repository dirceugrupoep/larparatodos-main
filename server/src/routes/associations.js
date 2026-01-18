import express from 'express';
import { pool } from '../database/connection.js';
import { z } from 'zod';

const router = express.Router();

// Schema de validação
const associationSchema = z.object({
  cnpj: z.string().min(14).max(18),
  corporate_name: z.string().min(1),
  trade_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zip_code: z.string().optional(),
  website: z.string().url().optional(),
});

// Listar todas as associações ativas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, cnpj, corporate_name, trade_name, email, phone,
        address, city, state, zip_code, website, logo_url, cover_url,
        description, facebook_url, instagram_url, youtube_url, linkedin_url, working_hours,
        is_active, is_default, is_approved
      FROM associations 
      WHERE is_active = true AND is_approved = true
      ORDER BY is_default DESC, corporate_name ASC`
    );

    // Sempre retornar um array, mesmo que vazio
    res.json({ associations: result.rows || [] });
  } catch (error) {
    console.error('Get associations error:', error);
    // Retornar array vazio em vez de erro 500
    res.json({ associations: [] });
  }
});

// Buscar associação padrão
router.get('/default', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, cnpj, corporate_name, trade_name, email, phone,
        address, city, state, zip_code, website, is_active, is_default
      FROM associations 
      WHERE is_default = true AND is_active = true AND is_approved = true
      LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Associação padrão não encontrada' });
    }

    res.json({ association: result.rows[0] });
  } catch (error) {
    console.error('Get default association error:', error);
    res.status(500).json({ error: 'Erro ao buscar associação padrão' });
  }
});

// Buscar associação por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        id, cnpj, corporate_name, trade_name, email, phone,
        address, city, state, zip_code, website, logo_url, cover_url,
        description, facebook_url, instagram_url, youtube_url, linkedin_url, working_hours,
        is_active, is_default, is_approved
      FROM associations 
      WHERE id = $1 AND is_active = true AND is_approved = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    res.json({ association: result.rows[0] });
  } catch (error) {
    console.error('Get association error:', error);
    res.status(500).json({ error: 'Erro ao buscar associação' });
  }
});

export default router;

