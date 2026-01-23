# 📝 Explicação sobre o .env

## 🔐 Sobre o JWT_SECRET e o `$$`

O `JWT_SECRET` no seu `.env` está **correto**:

```
JWT_SECRET=Yv9Q2xF$$K@!7Tz3R5N8bH#eCwP6mA0XG
```

### Por que `$$`?

No **Docker Compose**, o caractere `$` tem significado especial (usado para variáveis de ambiente). Para usar um `$` literal na senha, você precisa **escapar** com `$$`.

- `$$` no `.env` = `$` real na senha
- Se você colocar apenas `$`, o Docker vai tentar interpretar como variável

### Exemplo:
- **No .env:** `JWT_SECRET=Yv9Q2xF$$K@!7Tz3R5N8bH#eCwP6mA0XG`
- **Valor real usado:** `Yv9Q2xF$K@!7Tz3R5N8bH#eCwP6mA0XG` (um único `$`)

### ❌ NÃO está comentado!

A credencial está **completa e ativa**. O `$$` é apenas a forma correta de escrever um `$` literal no Docker Compose.

---

## 🚀 Diferenças entre Dev e Prod

### Desenvolvimento (Local)
```env
DOMAIN=localhost
FRONTEND_URL=http://localhost:8080
VITE_API_URL=http://localhost:3000
S3_PUBLIC_URL=http://localhost:8080/storage
NODE_ENV=development
```

### Produção (Bravulink)
```env
DOMAIN=larparatodoshabitacional.com.br
FRONTEND_URL=https://larparatodoshabitacional.com.br
VITE_API_URL=https://larparatodoshabitacional.com.br/api
S3_PUBLIC_URL=https://larparatodoshabitacional.com.br/storage
NODE_ENV=production
```

---

## ✅ Checklist para Produção

Antes de usar no servidor, verifique:

- [ ] `DOMAIN` aponta para o domínio real
- [ ] `FRONTEND_URL` usa `https://`
- [ ] `VITE_API_URL` aponta para `/api` (via proxy)
- [ ] `S3_PUBLIC_URL` usa `https://` e `/storage`
- [ ] `NODE_ENV=production`
- [ ] Credenciais do Ciabra preenchidas
- [ ] Todas as senhas com `$$` onde necessário

---

## 📋 Como usar no Bravulink

1. **Copie o `.env.prod` para `.env` no servidor:**
   ```bash
   cp .env.prod .env
   ```

2. **Edite e preencha as credenciais do Ciabra:**
   ```bash
   nano .env
   ```

3. **Inicie os containers:**
   ```bash
   docker compose up -d --build
   ```

---

## 🔍 Verificar se está funcionando

Após iniciar, verifique:

```bash
# Ver logs do backend
docker compose logs backend

# Verificar se as variáveis foram carregadas corretamente
docker compose exec backend env | grep JWT_SECRET
```

Se aparecer `Yv9Q2xF$K@!7Tz3R5N8bH#eCwP6mA0XG` (com um único `$`), está correto! ✅
