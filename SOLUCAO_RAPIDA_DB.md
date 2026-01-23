# 🚨 Solução Rápida - Problema de Conexão com Banco

## ⚡ Solução Imediata

O problema é que o backend está tentando conectar antes do PostgreSQL estar pronto. Siga estes passos:

### 1. Parar tudo

```bash
docker compose down
```

### 2. Limpar cache do Docker

```bash
docker compose build --no-cache backend
```

### 3. Subir apenas o PostgreSQL primeiro

```bash
docker compose up -d postgres
```

### 4. Aguardar PostgreSQL ficar healthy

```bash
# Verificar status
docker compose ps postgres

# Deve mostrar: "Up (healthy)"
# Se não mostrar, aguarde mais alguns segundos
```

### 5. Testar conexão manualmente

```bash
# Testar se PostgreSQL aceita conexões
docker compose exec postgres psql -U postgres -d larparatodos -c "SELECT 1;"
```

Se funcionar, o PostgreSQL está OK.

### 6. Subir o backend

```bash
docker compose up -d backend
```

### 7. Ver logs

```bash
docker compose logs -f backend
```

## 🔍 Se ainda não funcionar

### Verificar variáveis de ambiente

```bash
# Ver se as variáveis estão sendo lidas
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

### Verificar se PostgreSQL está na mesma rede

```bash
# Ver containers na rede
docker network inspect larparatodos-main_larparatodos-network
```

### Verificar logs do PostgreSQL

```bash
docker compose logs postgres | tail -50
```

Procure por erros como:
- "FATAL: password authentication failed"
- "FATAL: database does not exist"
- "could not connect to server"

## 🛠️ Solução Alternativa: Resetar Tudo

Se nada funcionar, resetar completamente:

```bash
# ⚠️ CUIDADO: Isso apaga TODOS os dados!
docker compose down -v

# Reconstruir tudo
docker compose build --no-cache

# Subir novamente
docker compose up -d

# Ver logs
docker compose logs -f
```

## 📋 Checklist

- [ ] PostgreSQL está rodando (`docker compose ps postgres`)
- [ ] PostgreSQL está healthy (`Up (healthy)`)
- [ ] Variáveis de ambiente estão corretas no backend
- [ ] Backend e PostgreSQL estão na mesma rede Docker
- [ ] Senha do banco está correta no `.env`
- [ ] Não há caracteres especiais problemáticos na senha

## 🎯 Comando Rápido de Diagnóstico

Execute este comando para ver tudo de uma vez:

```bash
echo "=== Status ===" && \
docker compose ps && \
echo -e "\n=== PostgreSQL Health ===" && \
docker compose exec postgres pg_isready -U postgres 2>&1 && \
echo -e "\n=== Variáveis DB no Backend ===" && \
docker compose exec backend printenv | grep DB_ && \
echo -e "\n=== Últimos logs do Backend ===" && \
docker compose logs --tail 20 backend
```
