import { pool } from './connection.js';

// Função para aguardar o banco estar pronto
async function waitForDatabase(maxRetries = 60, delay = 2000) {
  const dbConfig = {
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'larparatodos',
    user: process.env.DB_USER || 'postgres',
  };
  
  console.log(`🔍 Tentando conectar ao banco: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} como ${dbConfig.user}`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await pool.query('SELECT 1');
      console.log('✅ Database connection established');
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('❌ Última tentativa falhou:', error.message);
        console.error('📋 Configuração do banco:', {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD ? '***' : 'NOT SET',
        });
        throw new Error(`Database connection timeout: ${error.message}`);
      }
      // Log sempre nas primeiras 5 tentativas, depois a cada 5
      if (i < 5 || i % 5 === 0) {
        console.log(`⏳ Waiting for database... (${i + 1}/${maxRetries}) - ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Aguardar banco estar pronto
    await waitForDatabase();

    console.log('🔄 Running migrations...');

    // Create associations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS associations (
        id SERIAL PRIMARY KEY,
        cnpj VARCHAR(18) UNIQUE NOT NULL,
        corporate_name VARCHAR(255) NOT NULL,
        trade_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        website VARCHAR(255),
        logo_url VARCHAR(500),
        cover_url VARCHAR(500),
        description TEXT,
        facebook_url VARCHAR(500),
        instagram_url VARCHAR(500),
        youtube_url VARCHAR(500),
        linkedin_url VARCHAR(500),
        working_hours VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "associations" created/verified');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        association_id INTEGER REFERENCES associations(id) ON DELETE SET NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        fake BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "users" created/verified');

    // Adicionar colunas se não existirem (para migrações existentes)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_admin') THEN
          ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
          ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='association_id') THEN
          ALTER TABLE users ADD COLUMN association_id INTEGER REFERENCES associations(id) ON DELETE SET NULL;
        END IF;
        -- payment_day agora aceita qualquer dia entre 1 e 31
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payment_day') THEN
          ALTER TABLE users ADD COLUMN payment_day INTEGER;
        END IF;
        -- Ajustar constraint de payment_day para permitir valores de 1 a 31 (ou NULL)
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_payment_day_check') THEN
          ALTER TABLE users DROP CONSTRAINT users_payment_day_check;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_payment_day_check') THEN
          ALTER TABLE users ADD CONSTRAINT users_payment_day_check CHECK (payment_day IS NULL OR (payment_day >= 1 AND payment_day <= 31));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ciabra_customer_id') THEN
          ALTER TABLE users ADD COLUMN ciabra_customer_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fake') THEN
          ALTER TABLE users ADD COLUMN fake BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='password') THEN
          ALTER TABLE associations ADD COLUMN password VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='is_approved') THEN
          ALTER TABLE associations ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='logo_url') THEN
          ALTER TABLE associations ADD COLUMN logo_url VARCHAR(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='cover_url') THEN
          ALTER TABLE associations ADD COLUMN cover_url VARCHAR(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='description') THEN
          ALTER TABLE associations ADD COLUMN description TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='facebook_url') THEN
          ALTER TABLE associations ADD COLUMN facebook_url VARCHAR(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='instagram_url') THEN
          ALTER TABLE associations ADD COLUMN instagram_url VARCHAR(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='youtube_url') THEN
          ALTER TABLE associations ADD COLUMN youtube_url VARCHAR(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='linkedin_url') THEN
          ALTER TABLE associations ADD COLUMN linkedin_url VARCHAR(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='associations' AND column_name='working_hours') THEN
          ALTER TABLE associations ADD COLUMN working_hours VARCHAR(255);
        END IF;
        -- Tornar email único se não for
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'associations_email_key' 
          AND table_name = 'associations'
        ) THEN
          ALTER TABLE associations ADD CONSTRAINT associations_email_key UNIQUE (email);
        END IF;
      END $$;
    `);
    console.log('✅ User and Association columns verified');

    // Create terms_of_acceptance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS terms_of_acceptance (
        id SERIAL PRIMARY KEY,
        version VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "terms_of_acceptance" created/verified');

    // Create user_term_acceptances table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_term_acceptances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        term_id INTEGER NOT NULL REFERENCES terms_of_acceptance(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, term_id)
      );
    `);
    console.log('✅ Table "user_term_acceptances" created/verified');

    // Create index for associations
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_associations_cnpj ON associations(cnpj);
      CREATE INDEX IF NOT EXISTS idx_associations_is_default ON associations(is_default);
      CREATE INDEX IF NOT EXISTS idx_users_association_id ON users(association_id);
      CREATE INDEX IF NOT EXISTS idx_user_term_acceptances_user_id ON user_term_acceptances(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_term_acceptances_term_id ON user_term_acceptances(term_id);
    `);
    console.log('✅ Association indexes created/verified');

    // Verificar se existe termo de aceite, se não existir, criar um padrão
    const termCheck = await pool.query('SELECT id FROM terms_of_acceptance LIMIT 1');
    if (termCheck.rows.length === 0) {
      const defaultTermContent = `TERMO DE ACEITE E CONDIÇÕES DE USO - LARPARATODOS COOPERATIVA HABITACIONAL

Este documento estabelece os termos e condições que regem o uso da plataforma Larparatodos, uma cooperativa habitacional que visa facilitar o acesso à moradia através de um sistema colaborativo de contribuições mensais.

1. ACEITAÇÃO DOS TERMOS E CONDIÇÕES

Ao acessar, navegar ou utilizar a plataforma Larparatodos, você declara ter lido, compreendido e aceitado integralmente todos os termos e condições aqui estabelecidos. Este termo constitui um acordo legalmente vinculante entre você e a Larparatodos Cooperativa Habitacional.

2. OBJETIVO DA PLATAFORMA

A Larparatodos é uma cooperativa habitacional que tem como objetivo principal facilitar o acesso à moradia própria através de um sistema inovador de contribuições mensais, permitindo que famílias realizem o sonho da casa própria de forma organizada e transparente.

3. CADASTRO E CONTA DO USUÁRIO

Para utilizar a plataforma, você deve fornecer informações verdadeiras, precisas e completas, incluindo nome completo, CPF, e-mail, telefone e senha segura. Você é responsável por manter a confidencialidade de suas credenciais de acesso.

4. ASSOCIAÇÃO COOPERATIVA

Ao se cadastrar, você deve selecionar uma associação cooperativa parceira. Cada associação possui suas próprias regras, valores de contribuição e condições específicas. A Larparatodos não se responsabiliza pelas decisões das associações parceiras.

5. CONTRIBUIÇÕES E PAGAMENTOS

Você se compromete a realizar as contribuições mensais conforme estabelecido pela associação escolhida. O não pagamento pode resultar em suspensão ou cancelamento da participação no projeto.

6. PRIVACIDADE E PROTEÇÃO DE DADOS

A Larparatodos coleta e processa seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018). Seus dados são utilizados para gerenciamento da conta, processamento de pagamentos e comunicação sobre o projeto.

7. RESPONSABILIDADES

Você é responsável por fornecer informações verdadeiras, manter a segurança de sua conta, realizar pagamentos dentro dos prazos e utilizar a plataforma apenas para fins legítimos.

8. LIMITAÇÃO DE RESPONSABILIDADE

A Larparatodos atua como intermediária e não se responsabiliza por decisões das associações, atrasos em projetos, problemas técnicos de terceiros ou perdas decorrentes de uso indevido.

9. PROPRIEDADE INTELECTUAL

Todo o conteúdo da plataforma é propriedade da Larparatodos. É proibida a reprodução, distribuição ou uso não autorizado.

10. MODIFICAÇÕES

A Larparatodos pode modificar estes termos a qualquer momento, comunicando alterações significativas com antecedência. O uso continuado constitui aceitação dos novos termos.

11. CANCELAMENTO

Você pode solicitar o cancelamento de sua conta a qualquer momento. O cancelamento não isenta de obrigações financeiras pendentes.

12. LEI APLICÁVEL

Estes termos são regidos pela legislação brasileira. Qualquer disputa será resolvida no foro da Comarca de São Paulo, SP.

13. CONTATO

Para questões relacionadas a estes termos, entre em contato através dos canais disponíveis no site.

Ao clicar em "Aceito os Termos e Condições", você declara ter lido, compreendido e aceitado integralmente todos os termos aqui estabelecidos.`;

      await pool.query(
        `INSERT INTO terms_of_acceptance (version, title, content, is_active)
         VALUES ($1, $2, $3, $4)`,
        ['1.0', 'Termo de Aceite e Condições de Uso - Larparatodos', defaultTermContent, true]
      );
      console.log('✅ Termo de aceite padrão criado durante migração');
    }

    // Create contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "contacts" created/verified');

    // Create index on email and fake for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_fake ON users(fake) WHERE fake = true;
    `);
    console.log('✅ Index "idx_users_email" and "idx_users_fake" created/verified');

    // Create user_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cpf VARCHAR(14),
        rg VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        birth_date DATE,
        marital_status VARCHAR(20),
        occupation VARCHAR(100),
        monthly_income DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "user_profiles" created/verified');

    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
        due_date DATE NOT NULL,
        paid_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        ciabra_charge_id VARCHAR(255),
        ciabra_pix_qr_code TEXT,
        ciabra_pix_qr_code_url TEXT,
        ciabra_boleto_url TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "payments" created/verified');

    // Adicionar colunas do Ciabra se não existirem
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='ciabra_charge_id') THEN
          ALTER TABLE payments ADD COLUMN ciabra_charge_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='ciabra_pix_qr_code') THEN
          ALTER TABLE payments ADD COLUMN ciabra_pix_qr_code TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='ciabra_pix_qr_code_url') THEN
          ALTER TABLE payments ADD COLUMN ciabra_pix_qr_code_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='ciabra_boleto_url') THEN
          ALTER TABLE payments ADD COLUMN ciabra_boleto_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='ciabra_payment_url') THEN
          ALTER TABLE payments ADD COLUMN ciabra_payment_url TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Payment Ciabra columns verified');

    // Create project_status table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_status (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phase VARCHAR(50) DEFAULT 'registration',
        progress_percentage INTEGER DEFAULT 0,
        start_date DATE,
        expected_completion_date DATE,
        current_step VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "project_status" created/verified');

    // Create indexes for payments
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
    `);
    console.log('✅ Payment indexes created/verified');

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
  // Não fechar o pool aqui, pois o seed vai usar
}

// Executar migrações
runMigrations()
  .then(() => {
    console.log('🚀 Migrations finished, starting server...');
  })
  .catch((error) => {
    console.error('💥 Failed to run migrations:', error);
    process.exit(1);
  });

