# 🌍 Guia de Configuração - Local e Produção

## ✅ Sim, funciona em ambos os ambientes!

O `docker-compose.yml` está configurado para usar variáveis do arquivo `.env`, então funciona tanto localmente quanto no servidor Bravulink.

## 📋 Como Funciona

### Estrutura Atual

```
docker-compose.yml
  └── Usa variáveis do .env
       ├── Local: .env com localhost
       └── Produção: .env com domínio real
```

## 🏠 Desenvolvimento Local (Atual)

### Arquivo `.env` (local):

```env
DOMAIN=localhost
FRONTEND_URL=http://localhost:8080
S3_PUBLIC_URL=http://localhost:8080/storage
NODE_ENV=development
```

### Comando:

```bash
docker compose up -d --build
```

### Acessos:
- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- MinIO: http://localhost:9001

## 🚀 Produção (Bravulink)

### Passo 1: Editar `.env` no servidor

```bash
cd /opt/apps/larparatodos
nano .env
```

### Passo 2: Alterar apenas estas linhas:

```env
# Mudar de:
DOMAIN=localhost
FRONTEND_URL=http://localhost:8080
S3_PUBLIC_URL=http://localhost:8080/storage
NODE_ENV=development

# Para:
DOMAIN=larparatodoshabitacional.com.br
FRONTEND_URL=https://larparatodoshabitacional.com.br
S3_PUBLIC_URL=https://larparatodoshabitacional.com.br/storage
NODE_ENV=production
```

### Passo 3: Adicionar credenciais do Ciabra (se tiver):

```env
CIABRA_CLIENT_ID=seu_client_id
CIABRA_CLIENT_SECRET=seu_client_secret
CIABRA_WEBHOOK_SECRET=seu_webhook_secret
```

### Passo 4: Subir os containers:

```bash
docker compose up -d --build
```

### Acessos:
- Frontend: https://larparatodoshabitacional.com.br
- Backend: https://larparatodoshabitacional.com.br/api
- MinIO: Interno (via Apache proxy em /storage)

## 🔄 Comparação Rápida

| Configuração | Local | Produção |
|-------------|-------|----------|
| **DOMAIN** | `localhost` | `larparatodoshabitacional.com.br` |
| **FRONTEND_URL** | `http://localhost:8080` | `https://larparatodoshabitacional.com.br` |
| **S3_PUBLIC_URL** | `http://localhost:8080/storage` | `https://larparatodoshabitacional.com.br/storage` |
| **NODE_ENV** | `development` | `production` |
| **Comando** | `docker compose up -d --build` | `docker compose up -d --build` |

## ✅ Por que funciona em ambos?

1. **Variáveis do `.env`**: O `docker-compose.yml` lê todas as variáveis do `.env`
2. **Valores padrão**: Se alguma variável não existir, usa valores padrão seguros
3. **Mesmo arquivo**: Usa o mesmo `docker-compose.yml` em ambos os ambientes
4. **Flexível**: Basta mudar o `.env` para mudar o ambiente

## 📝 Checklist para Produção

Antes de fazer deploy no servidor:

- [ ] `.env` no servidor com `DOMAIN=larparatodoshabitacional.com.br`
- [ ] `.env` no servidor com `FRONTEND_URL=https://larparatodoshabitacional.com.br`
- [ ] `.env` no servidor com `S3_PUBLIC_URL=https://larparatodoshabitacional.com.br/storage`
- [ ] `.env` no servidor com `NODE_ENV=production`
- [ ] Credenciais do Ciabra adicionadas (se tiver)
- [ ] Apache configurado para proxy (já deve estar)
- [ ] Containers reiniciados após mudanças

## 🐛 Troubleshooting

### Problema: URLs ainda apontam para localhost em produção

**Solução:**
1. Verifique o `.env` no servidor: `cat /opt/apps/larparatodos/.env | grep DOMAIN`
2. Se estiver `localhost`, edite e mude para o domínio real
3. Reinicie: `docker compose restart backend frontend`

### Problema: Imagens não carregam em produção

**Solução:**
1. Verifique `S3_PUBLIC_URL` no `.env`: deve ser `https://larparatodoshabitacional.com.br/storage`
2. Verifique se o Apache está fazendo proxy para `/storage`
3. Reinicie o backend: `docker compose restart backend`

### Problema: API não funciona em produção

**Solução:**
1. Verifique `FRONTEND_URL` no `.env`: deve ser `https://larparatodoshabitacional.com.br`
2. Verifique se o Apache está fazendo proxy para `/api`
3. Verifique logs: `docker logs larparatodos-backend`

## 🎯 Resumo

✅ **Funciona em ambos os ambientes!**

- **Local**: `.env` com `localhost` → `docker compose up -d --build`
- **Produção**: `.env` com domínio real → `docker compose up -d --build`

**A única diferença é o conteúdo do arquivo `.env`!** 🎉
