# 🔐 Adicionar Credenciais do Ciabra no Servidor

## 📝 Passo a Passo

### 1. Conectar no Servidor

```bash
ssh root@5.75.164.155
# ou use o método de acesso que você usa
```

### 2. Editar o arquivo .env

```bash
cd /opt/apps/larparatodos
nano .env
```

### 3. Adicionar as Credenciais do Ciabra

Adicione estas linhas no final do arquivo `.env`:

```env
# Ciabra Invoice API
CIABRA_API_URL=https://api.ciabra.com.br
CIABRA_CLIENT_ID=COLE_AQUI_O_CLIENT_ID
CIABRA_CLIENT_SECRET=COLE_AQUI_O_CLIENT_SECRET
CIABRA_WEBHOOK_SECRET=COLE_AQUI_O_WEBHOOK_SECRET
```

**⚠️ IMPORTANTE:** 
- Se qualquer credencial tiver o caractere `$`, você precisa duplicar: `$` → `$$`
- Exemplo: se o secret for `abc$123`, coloque `abc$$123` no .env

### 4. Salvar e Sair

No nano:
- Pressione `CTRL + O` (salvar)
- Pressione `Enter` (confirmar)
- Pressione `CTRL + X` (sair)

### 5. Reiniciar os Containers

```bash
cd /opt/apps/larparatodos
docker compose down
docker compose up -d --build
```

### 6. Verificar se Funcionou

```bash
# Ver logs do backend
docker logs larparatodos-backend --tail 50

# Testar criação de cobrança (se tiver um usuário de teste)
# Acesse o site e tente criar uma cobrança
```

## 🔗 Configurar Webhook no Painel do Ciabra

Depois de adicionar as credenciais, configure o webhook:

1. Acesse o painel do Ciabra Invoice
2. Vá em **Configurações** → **Webhooks**
3. Adicione novo webhook:
   - **URL:** `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - **Eventos:** Pagamento confirmado, Status alterado, etc.
4. Copie o **Webhook Secret** gerado
5. Adicione no `.env` como `CIABRA_WEBHOOK_SECRET`

## ✅ Teste Rápido

Após configurar, teste criando uma cobrança:

1. Acesse o site: `https://larparatodoshabitacional.com.br`
2. Faça login como usuário
3. Vá em "Pagamentos"
4. Clique em "PIX" ou "Boleto" em um pagamento pendente
5. Verifique se o QR Code/Boleto aparece

Se aparecer, está funcionando! 🎉
