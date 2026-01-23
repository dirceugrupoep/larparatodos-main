#!/bin/bash

echo "=== DIAGNÓSTICO DE CONEXÃO COM BANCO DE DADOS ==="
echo ""

echo "1. Status dos containers:"
docker compose ps
echo ""

echo "2. Verificando se PostgreSQL está rodando:"
docker compose ps postgres
echo ""

echo "3. Logs do PostgreSQL (últimas 10 linhas):"
docker compose logs --tail 10 postgres
echo ""

echo "4. Testando healthcheck do PostgreSQL:"
docker compose exec postgres pg_isready -U postgres -d larparatodos 2>&1 || echo "❌ PostgreSQL não está pronto"
echo ""

echo "5. Variáveis de ambiente no backend:"
docker compose exec backend printenv | grep -E "DB_|POSTGRES" || echo "❌ Container backend não está rodando"
echo ""

echo "6. Testando conexão do backend ao PostgreSQL:"
docker compose exec backend sh -c "node -e \"
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
pool.query('SELECT 1').then(() => {
  console.log('✅ Conexão OK');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
\"" 2>&1
echo ""

echo "7. Verificando rede Docker:"
docker network inspect larparatodos-main_larparatodos-network 2>/dev/null | grep -A 5 "Containers" || echo "❌ Rede não encontrada"
echo ""

echo "=== FIM DO DIAGNÓSTICO ==="
