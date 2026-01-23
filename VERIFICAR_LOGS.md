# 🔍 Como Verificar Logs e Diagnosticar o Problema

## ❌ Erro: "Unexpected token '<', "<html> <h"... is not valid JSON"

Este erro significa que o backend está retornando **HTML** em vez de **JSON**. Isso geralmente acontece quando:

1. **Backend não está rodando** - O servidor não iniciou
2. **Backend crashou** - Erro durante a inicialização
3. **Backend não conseguiu conectar ao banco** - Migrations falharam

## 🔍 Verificar Logs

### 1. Ver logs do Backend

```bash
docker compose logs backend --tail 100
```

**Procure por:**
- ✅ `🚀 Server running on port 3000` - Backend iniciou
- ✅ `✅ Database connection established` - Banco conectado
- ❌ `❌ Migration error` - Migrations falharam
- ❌ `💥 Failed to run migrations` - Backend não iniciou
- ❌ `❌ PostgreSQL connection error` - Erro de conexão

### 2. Ver logs do PostgreSQL

```bash
docker compose logs postgres --tail 50
```

**Procure por:**
- ✅ `database system is ready to accept connections` - PostgreSQL OK
- ❌ `FATAL: password authentication failed` - Senha errada
- ❌ `FATAL: database does not exist` - Banco não existe

### 3. Ver status dos containers

```bash
docker compose ps
```

**Deve mostrar:**
- `larparatodos-postgres` - `Up (healthy)`
- `larparatodos-backend` - `Up` (não deve estar restarting)
- `larparatodos-frontend` - `Up`

### 4. Testar se o backend está respondendo

```bash
# Testar health check
curl http://localhost:3000/health

# Deve retornar JSON:
# {"status":"ok","database":"connected"}
```

Se retornar HTML ou erro, o backend não está rodando.

### 5. Testar endpoint de login diretamente

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"senha123"}'
```

**Se retornar HTML**, o backend não está processando a requisição corretamente.

## 🛠️ Soluções

### Problema 1: Backend não iniciou (migrations falharam)

**Sintoma:** Logs mostram `❌ Migration error` ou `💥 Failed to run migrations`

**Solução:**
```bash
# Parar tudo
docker compose down

# Subir apenas PostgreSQL primeiro
docker compose up -d postgres

# Aguardar ficar healthy (verificar)
docker compose ps postgres

# Depois subir backend
docker compose up -d backend

# Ver logs
docker compose logs -f backend
```

### Problema 2: Backend está crashando em loop

**Sintoma:** Container está sempre `Restarting`

**Solução:**
```bash
# Ver logs detalhados
docker compose logs backend --tail 200

# Verificar se é problema de banco
docker compose exec backend printenv | grep DB_

# Se necessário, resetar
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

### Problema 3: Backend não está acessível

**Sintoma:** `curl http://localhost:3000/health` retorna erro

**Solução:**
```bash
# Verificar se porta está em uso
netstat -an | grep 3000

# Verificar se container está rodando
docker compose ps backend

# Verificar logs
docker compose logs backend
```

## 📋 Checklist de Diagnóstico

Execute estes comandos em ordem:

```bash
# 1. Status dos containers
echo "=== STATUS ===" && docker compose ps

# 2. Logs do backend (últimas 50 linhas)
echo -e "\n=== BACKEND LOGS ===" && docker compose logs backend --tail 50

# 3. Logs do PostgreSQL
echo -e "\n=== POSTGRES LOGS ===" && docker compose logs postgres --tail 30

# 4. Teste de health check
echo -e "\n=== HEALTH CHECK ===" && curl -s http://localhost:3000/health || echo "❌ Backend não está respondendo"

# 5. Variáveis de ambiente
echo -e "\n=== VARIÁVEIS DB ===" && docker compose exec backend printenv | grep DB_ || echo "❌ Container backend não está rodando"
```

## 🎯 Comando Rápido

Execute este comando para ver tudo de uma vez:

```bash
docker compose ps && \
echo -e "\n=== BACKEND LOGS ===" && \
docker compose logs backend --tail 30 && \
echo -e "\n=== TESTE HEALTH ===" && \
curl -s http://localhost:3000/health || echo "❌ Backend não responde"
```

## ✅ Após Corrigir

Quando o backend estiver funcionando, você verá nos logs:

```
✅ Database connection established
🔄 Running migrations...
✅ Migrations completed
🚀 Server running on port 3000
```

E o health check deve retornar:
```json
{"status":"ok","database":"connected"}
```
