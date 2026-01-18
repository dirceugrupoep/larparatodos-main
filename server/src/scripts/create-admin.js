import { pool } from '../database/connection.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2];
const password = process.argv[3] || 'admin123';

if (!email) {
  console.error('❌ Uso: node create-admin.js <email> [senha]');
  process.exit(1);
}

async function createAdmin() {
  try {
    // Verificar se usuário existe
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      // Atualizar para admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET is_admin = true, is_active = true, password = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      console.log(`✅ Usuário ${email} promovido a administrador!`);
    } else {
      // Criar novo admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (name, email, password, is_admin, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
        [email.split('@')[0], email, hashedPassword, true, true]
      );
      console.log(`✅ Administrador criado com sucesso!`);
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${password}`);
      console.log(`   ID: ${result.rows[0].id}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();

