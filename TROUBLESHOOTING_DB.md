# 🔧 Troubleshooting - Problema de Conexão com Banco de Dados

## ❌ Erro: Database connection timeout

O backend não está conseguindo conectar ao PostgreSQL.

## ✅ Soluções

### 1. Verificar se o PostgreSQL está rodando

```bash
docker compose ps
```

Deve mostrar `larparatodos-postgres` com status `Up (healthy)`.

Se não estiver rodando:
```bash
docker compose up -d postgres
```

### 2. Verificar logs do PostgreSQL

```bash
docker compose logs postgres
```

Procure por erros de inicialização.

### 3. Verificar se as variáveis de ambiente estão corretas

```bash
# Verificar variáveis no container do backend
docker compose exec backend printenv | grep DB_
```

Deve mostrar:
```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=larparatodos
DB_USER=postgres
DB_PASSWORD=***
```

### 4. Testar conexão manualmente

```bash
# Entrar no container do backend
docker compose exec backend sh

# Dentro do container, testar conexão
node -e "
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
"
```

### 5. Verificar se o .env está sendo lido

```bash
# Verificar se o Docker Compose está lendo o .env
docker compose config | grep DB_PASSWORD
```

### 6. Reiniciar tudo do zero

```bash
# Parar tudo
docker compose down

# Remover volumes (CUIDADO: apaga dados!)
docker compose down -v

# Subir novamente
docker compose up -d

# Ver logs do backend
docker compose logs -f backend
```

### 7. Verificar se o PostgreSQL aceita conexões

```bash
# Testar conexão direta ao PostgreSQL
docker compose exec postgres psql -U postgres -d larparatodos -c "SELECT 1;"
```

Se funcionar, o problema é na configuração do backend.

## 🔍 Diagnóstico Rápido

Execute este comando para verificar tudo:

```bash
echo "=== Status dos Containers ==="
docker compose ps

echo -e "\n=== Logs do PostgreSQL (últimas 20 linhas) ==="
docker compose logs --tail 20 postgres

echo -e "\n=== Variáveis de Ambiente do Backend ==="
docker compose exec backend printenv | grep DB_

echo -e "\n=== Teste de Conexão ==="
docker compose exec postgres pg_isready -U postgres
```

## 🐛 Problemas Comuns

### Problema 1: PostgreSQL não inicia

**Sintoma:** Container do PostgreSQL não fica `healthy`

**Solução:**
```bash
# Ver logs detalhados
docker compose logs postgres

# Verificar se a senha tem caracteres especiais
# Se tiver $, precisa ser $$
```

### Problema 2: Backend tenta conectar antes do PostgreSQL estar pronto

**Sintoma:** Timeout mesmo com PostgreSQL rodando

**Solução:** Já foi corrigido! O script agora espera até 2 minutos (60 tentativas x 2s).

### Problema 3: Variáveis de ambiente não estão sendo lidas

**Sintoma:** `DB_PASSWORD` aparece como vazio

**Solução:**
1. Verificar se o `.env` está na raiz do projeto
2. Verificar se não tem espaços extras: `DB_PASSWORD=senha` (não `DB_PASSWORD = senha`)
3. Se a senha tem `$`, usar `$$`: `DB_PASSWORD=abc$$123`

### Problema 4: Senha com caracteres especiais

**Sintoma:** PostgreSQL rejeita a senha

**Solução:**
- Caracteres `$` devem ser `$$` no `.env`
- Caracteres `@`, `#`, `!` geralmente funcionam, mas se der problema, use aspas: `DB_PASSWORD="senha@com#especiais"`

## ✅ Após Corrigir

```bash
# Reconstruir o backend
docker compose build backend

# Reiniciar
docker compose up -d

# Ver logs
docker compose logs -f backend
```

Deve aparecer:
```
✅ Database connection established
🔄 Running migrations...
✅ Migrations completed
```
