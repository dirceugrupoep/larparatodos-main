# 🏦 Configuração do Ciabra Invoice

Este documento explica como configurar e usar a integração com o Ciabra Invoice para gerenciamento de boletos e PIX.

## 📋 Pré-requisitos

1. Conta ativa no Ciabra Invoice
2. Credenciais de API (Client ID e Client Secret)
3. URL do webhook configurada no painel do Ciabra

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Ciabra Invoice API
CIABRA_API_URL=https://api.az.center
CIABRA_CLIENT_ID=seu_client_id_aqui
CIABRA_CLIENT_SECRET=seu_client_secret_aqui
CIABRA_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

### 2. Configurar Webhook no Ciabra

No painel do Ciabra, configure o webhook para:
```
https://seu-dominio.com.br/api/ciabra/webhook
```

O webhook será usado para receber notificações automáticas quando:
- Um pagamento for confirmado
- Um pagamento for cancelado
- O status de uma cobrança mudar

## 🚀 Funcionamento

### Geração Automática de Cobranças

O sistema gera automaticamente cobranças mensais para todos os usuários ativos baseado no dia de pagamento escolhido (10 ou 20).

#### Executar Manualmente

```bash
# Dentro do container do backend
docker exec -it larparatodos-backend npm run generate-charges
```

#### Configurar Cron (Recomendado)

Para executar automaticamente, configure um cron job no servidor:

```bash
# Editar crontab
crontab -e

# Adicionar linha para executar diariamente às 8h
0 8 * * * docker exec larparatodos-backend npm run generate-charges >> /var/log/larparatodos-charges.log 2>&1

# Adicionar linha para verificar status a cada hora
0 * * * * docker exec larparatodos-backend npm run check-payments >> /var/log/larparatodos-payments.log 2>&1
```

### Verificação de Status

O sistema verifica periodicamente o status das cobranças pendentes:

```bash
# Executar manualmente
docker exec -it larparatodos-backend npm run check-payments
```

## 👤 Para Usuários

### Escolher Dia de Pagamento

1. **No Cadastro**: Ao se cadastrar, escolha o dia 10 ou 20
2. **No Perfil**: Acesse "Meu Perfil" > "Dia de Pagamento" para alterar

⚠️ **Importante**: O dia escolhido será usado para todas as cobranças futuras.

### Pagar uma Cobrança

1. Acesse "Pagamentos" no dashboard
2. Para pagamentos pendentes, clique em:
   - **PIX**: Gera QR Code para pagamento instantâneo
   - **Boleto**: Gera boleto bancário para pagamento

### Status dos Pagamentos

- **Pendente**: Cobrança criada, aguardando pagamento
- **Pago**: Pagamento confirmado pelo Ciabra
- **Em Atraso**: Vencido e não pago

## 🔍 Inadimplência

Usuários ficam inadimplentes quando:
- Têm pagamentos com status "Em Atraso"
- O vencimento passou e o pagamento não foi confirmado

O sistema atualiza automaticamente o status baseado nas notificações do webhook.

## 🛠️ Troubleshooting

### Cobrança não foi criada

1. Verifique se o usuário tem `payment_day` configurado
2. Verifique se já existe cobrança para o mês atual
3. Verifique logs: `docker logs larparatodos-backend`

### Webhook não está funcionando

1. Verifique se a URL está correta no painel do Ciabra
2. Verifique se o servidor está acessível publicamente
3. Verifique logs: `docker logs larparatodos-backend | grep webhook`

### Erro de autenticação

1. Verifique se `CIABRA_CLIENT_ID` e `CIABRA_CLIENT_SECRET` estão corretos
2. Verifique se as credenciais não expiraram
3. Verifique logs para detalhes do erro

## 📚 Documentação

Para mais informações sobre a API do Ciabra, consulte:
- [Documentação Oficial](https://docs.ciabra.com.br)

## 🔐 Segurança

- **Nunca** commite credenciais no Git
- Use variáveis de ambiente para todas as configurações sensíveis
- Mantenha o `CIABRA_WEBHOOK_SECRET` seguro e use-o para validar webhooks
- Configure HTTPS para o webhook em produção
