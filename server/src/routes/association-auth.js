import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/connection.js';
import { z } from 'zod';

const router = express.Router();

// Função para validar CNPJ
function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  
  if (cnpj.length !== 14) return false;
  
  // Eliminar CNPJs conhecidos como inválidos
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validar dígitos verificadores
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

const registerAssociationSchema = z.object({
  cnpj: z.string().min(14).max(18),
  corporate_name: z.string().min(1),
  trade_name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zip_code: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

const loginAssociationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Cadastro público de associação
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerAssociationSchema.parse(req.body);
    const {
      cnpj,
      corporate_name,
      trade_name,
      email,
      password,
      phone,
      address,
      city,
      state,
      zip_code,
      website,
    } = validatedData;

    // Validar CNPJ
    const cnpjClean = cnpj.replace(/[^\d]+/g, '');
    if (!validateCNPJ(cnpjClean)) {
      return res.status(400).json({ error: 'CNPJ inválido' });
    }

    // Verificar se CNPJ já existe
    const existingCNPJ = await pool.query(
      'SELECT id FROM associations WHERE cnpj = $1',
      [cnpj]
    );

    if (existingCNPJ.rows.length > 0) {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }

    // Verificar se email já existe
    const existingEmail = await pool.query(
      'SELECT id FROM associations WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar associação (aguardando aprovação)
    const result = await pool.query(
      `INSERT INTO associations (
        cnpj, corporate_name, trade_name, email, password, phone,
        address, city, state, zip_code, website, is_active, is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, cnpj, corporate_name, trade_name, email, is_active, is_approved`,
      [
        cnpj,
        corporate_name,
        trade_name || null,
        email,
        hashedPassword,
        phone || null,
        address || null,
        city || null,
        state || null,
        zip_code || null,
        website || null,
        false, // Inativa até aprovação
        false, // Aguardando aprovação
      ]
    );

    res.status(201).json({
      message: 'Associação cadastrada com sucesso! Aguardando aprovação do administrador.',
      association: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.code === '23505') {
      // Unique violation
      return res.status(400).json({ error: 'CNPJ ou email já cadastrado' });
    }
    console.error('Register association error:', error);
    res.status(500).json({ error: 'Erro ao cadastrar associação' });
  }
});

// Login de associação
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginAssociationSchema.parse(req.body);
    const { email, password } = validatedData;

    // Buscar associação
    const result = await pool.query(
      'SELECT id, email, password, corporate_name, trade_name, is_active, is_approved FROM associations WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const association = result.rows[0];

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, association.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verificar se está aprovada
    if (!association.is_approved) {
      return res.status(403).json({ error: 'Associação aguardando aprovação do administrador' });
    }

    // Verificar se está ativa
    if (!association.is_active) {
      return res.status(403).json({ error: 'Associação inativa. Entre em contato com o administrador.' });
    }

    // Verificar se JWT_SECRET está configurado
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      console.error('⚠️  ERRO: JWT_SECRET não configurado!');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: association.id, associationId: association.id, email: association.email, type: 'association' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      association: {
        id: association.id,
        email: association.email,
        corporate_name: association.corporate_name,
        trade_name: association.trade_name,
        is_active: association.is_active,
        is_approved: association.is_approved,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login association error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Buscar associação atual (autenticada)
router.get('/me', async (req, res) => {
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

    // Verificar se é associação
    if (decoded.type !== 'association') {
      return res.status(403).json({ error: 'Token inválido para associação' });
    }

    const result = await pool.query(
      `SELECT 
        id, cnpj, corporate_name, trade_name, email, phone,
        address, city, state, zip_code, website, logo_url, cover_url,
        description, facebook_url, instagram_url, youtube_url, linkedin_url, working_hours,
        is_active, is_approved, created_at, updated_at
      FROM associations WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    res.json({ association: result.rows[0] });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    console.error('Get association error:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Atualizar dados da associação
router.put('/update', async (req, res) => {
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

    const updateSchema = z.object({
      trade_name: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().length(2).optional(),
      zip_code: z.string().optional(),
      website: z.string().url().optional().or(z.literal('')),
      description: z.string().optional(),
      facebook_url: z.string().url().optional().or(z.literal('')),
      instagram_url: z.string().url().optional().or(z.literal('')),
      youtube_url: z.string().url().optional().or(z.literal('')),
      linkedin_url: z.string().url().optional().or(z.literal('')),
      working_hours: z.string().optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const key in validatedData) {
      if (validatedData[key] !== undefined && validatedData[key] !== '') {
        fields.push(`${key} = $${paramCount++}`);
        values.push(validatedData[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(decoded.id);

    const result = await pool.query(
      `UPDATE associations SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, cnpj, corporate_name, trade_name, email, phone,
       address, city, state, zip_code, website, logo_url, cover_url,
       description, facebook_url, instagram_url, youtube_url, linkedin_url, working_hours,
       is_active, is_approved, created_at, updated_at`,
      values
    );

    res.json({ association: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    console.error('Update association error:', error);
    res.status(500).json({ error: 'Erro ao atualizar associação' });
  }
});

export default router;

