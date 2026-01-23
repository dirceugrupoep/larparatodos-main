#!/bin/bash

echo "=========================================="
echo "🔍 DIAGNÓSTICO COMPLETO - LARPARATODOS"
echo "=========================================="
echo ""

echo "1️⃣ STATUS DOS CONTAINERS:"
echo "------------------------"
docker compose ps
echo ""

echo "2️⃣ LOGS DO BACKEND (últimas 30 linhas):"
echo "------------------------"
docker compose logs backend --tail 30
echo ""

echo "3️⃣ LOGS DO POSTGRESQL (últimas 20 linhas):"
echo "------------------------"
docker compose logs postgres --tail 20
echo ""

echo "4️⃣ TESTE DE HEALTH CHECK:"
echo "------------------------"
curl -s http://localhost:3000/health 2>&1 | head -5 || echo "❌ Backend não está respondendo na porta 3000"
echo ""

echo "5️⃣ TESTE DE PING (sem banco):"
echo "------------------------"
curl -s http://localhost:3000/ping 2>&1 | head -5 || echo "❌ Backend não está respondendo"
echo ""

echo "6️⃣ VARIÁVEIS DE AMBIENTE DO BACKEND:"
echo "------------------------"
docker compose exec backend printenv | grep -E "DB_|JWT|NODE_ENV" 2>&1 || echo "❌ Container backend não está rodando"
echo ""

echo "7️⃣ TESTE DE CONEXÃO COM BANCO:"
echo "------------------------"
docker compose exec backend sh -c "node -e \"const { Pool } = require('pg'); const p = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }); p.query('SELECT 1').then(() => console.log('✅ Conexão OK')).catch(e => console.error('❌ Erro:', e.message)).finally(() => process.exit(0));\"" 2>&1 || echo "❌ Não foi possível testar conexão"
echo ""

echo "8️⃣ TESTE DE ENDPOINT DE LOGIN:"
echo "------------------------"
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"teste"}' \
  -s -w "\nStatus: %{http_code}\n" 2>&1 | head -10
echo ""

echo "=========================================="
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="
