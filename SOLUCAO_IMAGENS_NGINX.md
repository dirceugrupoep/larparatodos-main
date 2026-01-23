# 🔧 Solução - Imagens não Carregam (404 no Nginx)

## 🔍 Problema Identificado

Os logs mostram:
```
open() "/usr/share/nginx/html/storage/logo_3_1769201207201.jpg" failed (2: No such file or directory)
```

**Causa:** O Nginx do frontend está tentando servir arquivos de `/storage/` do sistema de arquivos local, mas as imagens estão armazenadas no **MinIO**, não no sistema de arquivos do container.

---

## ✅ Solução Aplicada

Configurei o Nginx para fazer **proxy** das requisições `/storage/*` para o MinIO.

### O que foi alterado:

**Arquivo:** `Dockerfile.prod`

Adicionada configuração de proxy no Nginx:

```nginx
location /storage/ {
    # Remove /storage e adiciona /associations (nome do bucket)
    rewrite ^/storage/(.*)$ /associations/$1 break;
    proxy_pass http://minio:9000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Cache para imagens
    proxy_cache_valid 200 1d;
    add_header Cache-Control "public, max-age=86400";
}
```

---

## 🚀 Como Aplicar

### 1. Reconstruir o Frontend

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

### 2. Verificar se Funcionou

```bash
# Ver logs do frontend
docker compose logs -f frontend

# Testar acesso a uma imagem
curl -I http://127.0.0.1:8080/storage/logo_3_1769201207201.jpg
```

Deve retornar `200 OK` em vez de `404 Not Found`.

---

## 🎯 Como Funciona Agora

### Antes (❌ Erro):
1. Navegador pede: `GET /storage/logo.jpg`
2. Nginx procura em: `/usr/share/nginx/html/storage/logo.jpg`
3. ❌ Arquivo não existe → **404**

### Depois (✅ Funciona):
1. Navegador pede: `GET /storage/logo.jpg`
2. Nginx faz proxy para: `http://minio:9000/associations/logo.jpg`
3. MinIO retorna a imagem
4. ✅ **200 OK**

---

## 📋 Fluxo Completo

### Em Produção (com Apache):

1. **Navegador** → `https://larparatodoshabitacional.com.br/storage/logo.jpg`
2. **Apache** → Faz proxy para `http://127.0.0.1:8080/storage/logo.jpg`
3. **Nginx (Frontend)** → Faz proxy para `http://minio:9000/associations/logo.jpg`
4. **MinIO** → Retorna a imagem
5. **Nginx** → Retorna para Apache
6. **Apache** → Retorna para navegador
7. ✅ **Imagem aparece!**

### Em Desenvolvimento (sem Apache):

1. **Navegador** → `http://localhost:8080/storage/logo.jpg`
2. **Nginx (Frontend)** → Faz proxy para `http://minio:9000/associations/logo.jpg`
3. **MinIO** → Retorna a imagem
4. ✅ **Imagem aparece!**

---

## ✅ Checklist

- [ ] Frontend reconstruído com nova configuração do Nginx
- [ ] Teste de acesso a imagem retorna `200 OK`
- [ ] Imagens aparecem no painel da associação
- [ ] Imagens aparecem na lista de associações
- [ ] Imagens aparecem no perfil público da associação

---

## 🐛 Se Ainda Não Funcionar

### Verificar se MinIO está acessível do Nginx

```bash
# Entrar no container do frontend
docker exec -it larparatodos-frontend sh

# Testar conexão com MinIO
wget -O- http://minio:9000/associations/ 2>&1 | head -20
```

### Verificar se o bucket tem arquivos

```bash
# Listar arquivos no bucket
docker exec larparatodos-minio mc ls myminio/associations/
```

### Verificar logs do Nginx

```bash
docker compose logs frontend | grep -i storage
```

---

## 📝 Notas Importantes

1. **Rede Docker:** O Nginx precisa estar na mesma rede Docker (`larparatodos-network`) que o MinIO para acessar `minio:9000`.

2. **Apache em Produção:** Em produção, o Apache também pode fazer proxy direto para o MinIO, mas o Nginx do frontend também precisa fazer proxy para funcionar quando acessado diretamente (sem Apache).

3. **Cache:** As imagens são cacheadas por 1 dia (`max-age=86400`) para melhor performance.

---

**Depois de aplicar, as imagens devem carregar corretamente! 🎉**
