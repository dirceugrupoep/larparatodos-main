# 🎯 Resumo - Integração Ciabra Invoice

## ✅ O que foi implementado

### 1. Banco de Dados
- ✅ Campo `payment_day` (10 ou 20) na tabela `users`
- ✅ Campos do Ciabra na tabela `payments`:
  - `ciabra_charge_id` - ID da cobrança no Ciabra
  - `ciabra_pix_qr_code` - Código PIX para copiar/colar
  - `ciabra_pix_qr_code_url` - URL do QR Code PIX
  - `ciabra_boleto_url` - URL do boleto

### 2. Backend
- ✅ Serviço de integração (`server/src/services/ciabra.js`)
  - Autenticação OAuth2
  - Criação de cobranças (PIX e Boleto)
  - Consulta de status
  - Processamento de webhook
- ✅ Rotas (`server/src/routes/ciabra.js`)
  - `POST /api/ciabra/charges` - Criar cobrança
  - `GET /api/ciabra/charges/:id` - Consultar status
  - `POST /api/ciabra/webhook` - Receber notificações
- ✅ Job de geração mensal (`server/src/jobs/generateMonthlyCharges.js`)
  - Gera cobranças automaticamente no dia escolhido
  - Verifica status periodicamente
  - Atualiza pagamentos vencidos

### 3. Frontend
- ✅ Seleção de dia de pagamento no cadastro (10 ou 20)
- ✅ Edição do dia de pagamento no perfil
- ✅ Botões para gerar PIX e Boleto
- ✅ Modal com QR Code PIX
- ✅ Links para visualizar boletos
- ✅ Status atualizado automaticamente

### 4. Lógica de Inadimplência
- ✅ Usuário fica inadimplente quando tem pagamento vencido
- ✅ Status atualizado via webhook (tempo real)
- ✅ Verificação periódica (a cada hora)
- ✅ Atualização diária de vencidos

## 🔧 Configuração Necessária

### No Servidor (.env)

Adicione estas variáveis:

```env
# Ciabra Invoice API
CIABRA_API_URL=https://api.az.center
CIABRA_CLIENT_ID=seu_client_id
CIABRA_CLIENT_SECRET=seu_client_secret
CIABRA_WEBHOOK_SECRET=seu_webhook_secret
```

**⚠️ IMPORTANTE:** Se qualquer credencial tiver `$`, troque por `$$` no .env

### No Painel do Ciabra

1. Acesse o painel do Ciabra Invoice
2. Vá em **Configurações** → **Webhooks**
3. Adicione webhook:
   - **URL:** `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - **Eventos:** Todos relacionados a pagamentos
4. Copie o **Webhook Secret** e adicione no `.env`

## 🚀 Como Funciona

### Fluxo Completo

1. **Cadastro do Usuário**
   - Usuário escolhe dia de pagamento (10 ou 20)
   - Dado salvo no banco

2. **Geração Automática de Cobrança**
   - Job roda diariamente
   - Verifica usuários com `payment_day` = dia atual (10 ou 20)
   - Cria registro de pagamento
   - Cria cobrança no Ciabra (PIX por padrão)
   - Salva QR Code e links no banco

3. **Pagamento pelo Usuário**
   - Usuário acessa "Pagamentos"
   - Clica em "PIX" ou "Boleto"
   - Vê QR Code ou abre boleto
   - Paga via app do banco

4. **Confirmação de Pagamento**
   - Ciabra envia webhook quando pagamento é confirmado
   - Sistema atualiza status para "paid"
   - Usuário volta a ser adimplente (se não tiver outros vencidos)

5. **Inadimplência**
   - Se pagamento não for feito até o vencimento
   - Job diário marca como "overdue"
   - Usuário fica inadimplente
   - Aparece nos relatórios

## 📋 Comandos Úteis

### Gerar Cobranças Manualmente
```bash
docker exec larparatodos-backend npm run generate-charges
```

### Verificar Status de Pagamentos
```bash
docker exec larparatodos-backend npm run check-payments
```

### Atualizar Pagamentos Vencidos
```bash
docker exec larparatodos-backend npm run update-overdue
```

### Ver Logs do Ciabra
```bash
docker logs larparatodos-backend | grep -i ciabra
```

## 🔄 Cron Jobs Recomendados

Adicione no crontab do servidor:

```bash
# Gerar cobranças diariamente às 8h
0 8 * * * docker exec larparatodos-backend npm run generate-charges

# Verificar status a cada hora
0 * * * * docker exec larparatodos-backend npm run check-payments

# Atualizar vencidos diariamente à meia-noite
0 0 * * * docker exec larparatodos-backend npm run update-overdue
```

## 🐛 Problemas Comuns

### Webhook não recebe notificações
- Verifique se a URL está correta no painel do Ciabra
- Verifique logs: `docker logs larparatodos-backend | grep webhook`
- Teste manualmente: `curl -X POST https://larparatodoshabitacional.com.br/api/ciabra/webhook`

### Cobrança não é criada
- Verifique se o usuário tem `payment_day` configurado
- Verifique logs: `docker logs larparatodos-backend | grep -i charge`
- Verifique credenciais do Ciabra no `.env`

### Imagens não carregam
- Veja `TROUBLESHOOTING_S3.md`
- Verifique proxy Apache
- Verifique `S3_PUBLIC_URL` no `.env`

## 📚 Documentação

- **Configuração completa:** `CONFIGURAR_CIABRA.md`
- **Como adicionar credenciais:** `CIABRA_CREDENCIAIS.md`
- **Troubleshooting S3:** `TROUBLESHOOTING_S3.md`
