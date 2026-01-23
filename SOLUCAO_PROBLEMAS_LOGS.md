# 🔧 Solução - Problemas nos Logs

## 🔍 Problemas Identificados

### 1. ❌ Imagens não carregam (404)
```
open() "/usr/share/nginx/html/storage/logo_3_1769201207201.jpg" failed (2: No such file or directory)
```

**Causa:** O frontend precisa ser **reconstruído** para aplicar a nova configuração do Nginx que faz proxy para o MinIO.

### 2. ❌ Erro de DNS do Ciabra
```
getaddrinfo ENOTFOUND api.ciabra.com.br
```

**Causa:** O container do backend não consegue resolver o DNS de `api.ciabra.com.br`. Pode ser:
- Problema de rede do container
- URL incorreta
- Container sem acesso à internet

---

## ✅ Soluções

### Solução 1: Reconstruir Frontend (Imagens)

```bash
# Parar containers
docker compose down

# Reconstruir frontend com nova configuração do Nginx
docker compose build --no-cache frontend

# Subir novamente
docker compose up -d
```

**O que isso faz:**
- Aplica a nova configuração do Nginx que faz proxy de `/storage/*` para o MinIO
- As imagens passarão a carregar corretamente

---

### Solução 2: Verificar DNS do Ciabra

#### Opção A: Testar DNS do Container

```bash
# Entrar no container do backend
docker exec -it larparatodos-backend sh

# Testar resolução DNS
nslookup api.ciabra.com.br
# ou
ping -c 3 api.ciabra.com.br
```

#### Opção B: Verificar URL da API

Verifique se a URL está correta. Pode ser que o domínio seja diferente. Verifique na documentação do Ciabra ou no painel deles.

#### Opção C: Configurar DNS no Docker

Se o problema for DNS, você pode configurar DNS servers no `docker-compose.yml`:

```yaml
backend:
  # ... outras configurações
  dns:
    - 8.8.8.8
    - 8.8.4.4
```

#### Opção D: Verificar Acesso à Internet

```bash
# Testar se o container tem acesso à internet
docker exec larparatodos-backend ping -c 3 8.8.8.8
```

---

## 🚀 Passos para Resolver

### 1. Reconstruir Frontend (CRÍTICO)

```bash
cd /opt/apps/larparatodos
docker compose build --no-cache frontend
docker compose up -d frontend
```

### 2. Verificar Imagens

```bash
# Ver logs do frontend
docker compose logs -f frontend | grep storage

# Testar acesso a uma imagem
curl -I http://127.0.0.1:8080/storage/logo_3_1769201207201.jpg
```

Deve retornar `200 OK` em vez de `404`.

### 3. Verificar DNS do Ciabra

```bash
# Testar DNS do container
docker exec larparatodos-backend nslookup api.ciabra.com.br

# Se não resolver, verificar se a URL está correta
# Pode ser que seja outro domínio, como:
# - https://ciabra.com.br/api
# - https://app.ciabra.com.br/api
# - etc.
```

### 4. Se DNS não resolver, adicionar DNS servers

Edite `docker-compose.yml` e adicione na seção `backend`:

```yaml
backend:
  # ... outras configurações
  dns:
    - 8.8.8.8
    - 8.8.4.4
```

Depois:
```bash
docker compose up -d backend
```

---

## 📋 Checklist

- [ ] Frontend reconstruído com `--no-cache`
- [ ] Teste de acesso a imagem retorna `200 OK`
- [ ] DNS do Ciabra resolve corretamente
- [ ] Container tem acesso à internet
- [ ] URL da API do Ciabra está correta

---

## 🐛 Se Ainda Não Funcionar

### Para Imagens:

1. Verificar se MinIO está rodando:
   ```bash
   docker ps | grep minio
   ```

2. Verificar se bucket tem arquivos:
   ```bash
   docker exec larparatodos-minio mc ls myminio/associations/
   ```

3. Verificar configuração do Nginx:
   ```bash
   docker exec larparatodos-frontend cat /etc/nginx/conf.d/default.conf | grep storage
   ```

### Para Ciabra:

1. Verificar se a URL está correta na documentação do Ciabra
2. Verificar se as credenciais estão corretas no `.env`
3. Testar acesso manual:
   ```bash
   docker exec larparatodos-backend curl -v https://api.ciabra.com.br/oauth/token
   ```

---

## 📝 Notas

- **Imagens:** O problema é que o Nginx precisa ser reconstruído para aplicar a nova configuração
- **Ciabra:** O erro de DNS pode ser temporário (rede) ou permanente (URL incorreta). Verifique a documentação oficial do Ciabra para confirmar a URL correta.

---

**Prioridade:** Resolver primeiro o problema das imagens (reconstruir frontend), depois verificar o DNS do Ciabra.
