# ✅ URL do Ciabra Atualizada

## 🔄 Mudança Aplicada

A URL da API do Ciabra foi atualizada de:
- ❌ `https://api.ciabra.com.br` (incorreta)
- ✅ `https://api.az.center` (correta)

---

## 📝 Arquivos Atualizados

- ✅ `.env.prod` - URL atualizada
- ✅ `.env.example` - URL atualizada
- ✅ `server/src/services/ciabra.js` - Valor padrão atualizado
- ✅ Todos os arquivos de documentação

---

## 🚀 Como Aplicar no Servidor

### 1. Atualizar o `.env` no servidor:

```bash
cd /opt/apps/larparatodos
nano .env
```

**Altere a linha:**
```env
CIABRA_API_URL=https://api.az.center
```

**Salve:** `CTRL+O`, `Enter`, `CTRL+X`

### 2. Reiniciar o backend:

```bash
docker compose restart backend
```

### 3. Verificar se funcionou:

```bash
# Ver logs do backend
docker compose logs -f backend | grep Ciabra

# Deve mostrar:
# 🔐 Tentando autenticar no Ciabra: https://api.az.center/oauth/token
```

---

## ✅ Teste Rápido

Após atualizar, teste criando uma cobrança:

1. Acesse o painel de pagamentos
2. Clique em "Pagar com PIX" ou "Gerar Boleto"
3. Verifique os logs - não deve mais aparecer erro de DNS

---

## 🎯 Próximos Passos

1. ✅ Atualizar `.env` no servidor com a URL correta
2. ✅ Reiniciar backend
3. ✅ Testar criação de cobrança
4. ✅ Configurar webhooks no painel do Ciabra (se ainda não fez)

---

**A URL está correta agora! O erro de DNS deve desaparecer após atualizar o `.env` no servidor e reiniciar o backend.** 🎉
