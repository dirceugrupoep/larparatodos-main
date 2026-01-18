import express from 'express';
import { pool } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

const profileSchema = z.object({
  cpf: z.string().optional(),
  rg: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zip_code: z.string().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  marital_status: z.string().optional(),
  occupation: z.string().optional(),
  monthly_income: z.number().positive().optional(),
});

// Get user profile
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar dados do usuário e perfil
    const [userResult, profileResult] = await Promise.all([
      pool.query(
        'SELECT id, name, email, phone, created_at FROM users WHERE id = $1',
        [userId]
      ),
      pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [userId]
      ),
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      user: userResult.rows[0],
      profile: profileResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Update user profile
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const validatedData = profileSchema.parse(req.body);

    // Verificar se perfil já existe
    const existingProfile = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      // Criar perfil
      const result = await pool.query(
        `INSERT INTO user_profiles (
          user_id, cpf, rg, address, city, state, zip_code, 
          birth_date, marital_status, occupation, monthly_income
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          userId,
          validatedData.cpf || null,
          validatedData.rg || null,
          validatedData.address || null,
          validatedData.city || null,
          validatedData.state || null,
          validatedData.zip_code || null,
          validatedData.birth_date || null,
          validatedData.marital_status || null,
          validatedData.occupation || null,
          validatedData.monthly_income || null,
        ]
      );

      return res.json({
        message: 'Perfil criado com sucesso',
        profile: result.rows[0],
      });
    } else {
      // Atualizar perfil existente
      const result = await pool.query(
        `UPDATE user_profiles 
         SET cpf = COALESCE($1, cpf),
             rg = COALESCE($2, rg),
             address = COALESCE($3, address),
             city = COALESCE($4, city),
             state = COALESCE($5, state),
             zip_code = COALESCE($6, zip_code),
             birth_date = COALESCE($7, birth_date),
             marital_status = COALESCE($8, marital_status),
             occupation = COALESCE($9, occupation),
             monthly_income = COALESCE($10, monthly_income),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $11
         RETURNING *`,
        [
          validatedData.cpf,
          validatedData.rg,
          validatedData.address,
          validatedData.city,
          validatedData.state,
          validatedData.zip_code,
          validatedData.birth_date,
          validatedData.marital_status,
          validatedData.occupation,
          validatedData.monthly_income,
          userId,
        ]
      );

      return res.json({
        message: 'Perfil atualizado com sucesso',
        profile: result.rows[0],
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

export default router;

