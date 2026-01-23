# 📋 Configuração do Ambiente

## ✅ Arquivo `.env` Criado

O arquivo `.env` foi criado com todas as credenciais fornecidas, adaptado para desenvolvimento local (localhost).

### Estrutura do `.env`:

```env
# App
DOMAIN=localhost
JWT_SECRET=Yv9Q2xF$$K@!7Tz3R5N8bH#eCwP6mA0XG

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=larparatodos
DB_USER=postgres
DB_PASSWORD=ZQ4m$$W7h2N@A3F9eK8P!sXbVt6R#Yc

# MinIO / S3
S3_ENDPOINT=http://minio:9000
S3_PUBLIC_URL=http://localhost:8080/storage
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=K5N!V2x7@M3RZ8W$$T#QFhC9B
S3_BUCKET=associations
S3_REGION=us-east-1
S3_USE_SSL=false

# Ciabra Invoice API
CIABRA_API_URL=https://api.az.center
CIABRA_CLIENT_ID=
CIABRA_CLIENT_SECRET=
CIABRA_WEBHOOK_SECRET=

# Frontend URL
FRONTEND_URL=http://localhost:8080

# Server
PORT=3000
NODE_ENV=development
```

## 🔧 Docker Compose Configurado

O `docker-compose.yml` está configurado para:
- ✅ Usar todas as variáveis do `.env`
- ✅ Ter valores padrão caso alguma variável não esteja definida
- ✅ Funcionar tanto em desenvolvimento (localhost) quanto em produção

### Principais ajustes:

1. **FRONTEND_URL**: Usa `FRONTEND_URL` do `.env` ou padrão `http://localhost:8080`
2. **S3_PUBLIC_URL**: Usa `S3_PUBLIC_URL` do `.env` ou padrão `http://localhost:8080/storage`
3. **NODE_ENV**: Usa `NODE_ENV` do `.env` ou padrão `production`
4. **CIABRA**: Variáveis opcionais (podem ficar vazias até adicionar credenciais)

## 🚀 Como Usar

### 1. Desenvolvimento Local (atual)

```bash
# O .env já está configurado para localhost
docker compose up -d --build
```

Acesse:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- MinIO Console: http://localhost:9001

### 2. Produção (servidor)

No servidor, edite o `.env` e altere:

```env
DOMAIN=larparatodoshabitacional.com.br
FRONTEND_URL=https://larparatodoshabitacional.com.br
S3_PUBLIC_URL=https://larparatodoshabitacional.com.br/storage
NODE_ENV=production
```

Depois:
```bash
docker compose up -d --build
```

## ⚠️ Importante

1. **Senhas com `$`**: Já estão escapadas corretamente (`$$`)
2. **Ciabra**: Adicione as credenciais quando obtiver do painel
3. **Git**: O `.env` está no `.gitignore` e não será commitado

## 📝 Próximos Passos

1. ✅ Arquivo `.env` criado e configurado
2. ✅ `docker-compose.yml` ajustado
3. ⏳ Adicionar credenciais do Ciabra quando tiver
4. ⏳ Testar localmente: `docker compose up -d --build`

---

**Tudo pronto para testar!** 🎉
