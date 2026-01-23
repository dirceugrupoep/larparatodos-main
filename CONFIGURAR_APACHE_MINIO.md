# 🔧 CONFIGURAR APACHE PARA MINIO (S3)

## ⚠️ PROBLEMA: Imagens não carregam

Se os logos e capas das associações não estão carregando, é porque o proxy do Apache para o MinIO não está configurado corretamente.

---

## ✅ SOLUÇÃO COMPLETA

### 1️⃣ Editar arquivo de proxy do Apache

```bash
sudo nano /etc/httpd/conf.d/larparatodos-proxy.conf
```

### 2️⃣ Substituir TUDO por esta configuração:

```apache
<VirtualHost *:80>
    ServerName larparatodoshabitacional.com.br
    ServerAlias www.larparatodoshabitacional.com.br

    # Importante para manter headers originais
    ProxyPreserveHost On
    ProxyTimeout 300

    # ========================================
    # BACKEND API em /api
    # ========================================
    <Location /api>
        ProxyPass http://127.0.0.1:3000
        ProxyPassReverse http://127.0.0.1:3000
        
        # Headers para API
        RequestHeader set X-Forwarded-Proto "http"
        RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
    </Location>

    # ========================================
    # MINIO STORAGE em /storage
    # ========================================
    # Proxy para MinIO (reescreve /storage para /associations no MinIO)
    <Location /storage>
        # Remove /storage e adiciona /associations (bucket name)
        ProxyPass http://127.0.0.1:9000/associations
        ProxyPassReverse http://127.0.0.1:9000/associations
        
        # Headers importantes para S3/MinIO
        RequestHeader set Host "127.0.0.1:9000"
        RequestHeader unset Authorization
        
        # Permitir cache de imagens
        Header set Cache-Control "public, max-age=604800"
    </Location>

    # ========================================
    # FRONTEND (React) - tudo resto
    # ========================================
    ProxyPass /storage !
    ProxyPass /api !
    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/
</VirtualHost>
```

### 3️⃣ Testar configuração do Apache

```bash
sudo apachectl configtest
```

**Deve retornar:** `Syntax OK`

### 4️⃣ Reiniciar Apache

```bash
sudo systemctl restart httpd
sudo systemctl status httpd --no-pager
```

---

## 🧪 TESTAR SE FUNCIONA

### No servidor:

```bash
# Testar MinIO direto (interno)
curl -I http://127.0.0.1:9000/associations/

# Testar MinIO via proxy Apache
curl -I http://larparatodoshabitacional.com.br/storage/
```

**Deve retornar:** Algo do MinIO (XML ou lista de arquivos)

### No navegador:

1. Faça upload de uma imagem no painel da associação
2. A URL deve ser algo como: `https://larparatodoshabitacional.com.br/storage/logo_1_123456.png`
3. Abra a URL direto no navegador - deve mostrar a imagem

---

## 🐛 TROUBLESHOOTING

### Erro 404 nas imagens:

```bash
# Ver logs do Apache
sudo tail -f /var/log/httpd/error_log

# Ver logs do MinIO
docker logs larparatodos-minio --tail 100
```

### Módulos Apache faltando:

```bash
# Verificar se módulos proxy estão ativos
sudo apachectl -M | grep proxy

# Deve mostrar:
# proxy_module (shared)
# proxy_http_module (shared)
# proxy_connect_module (shared)
```

Se não aparecer, habilitar:

```bash
# AlmaLinux/RHEL
sudo dnf install mod_proxy_html -y
sudo systemctl restart httpd
```

### Testar upload manual:

```bash
# Upload de teste via API
curl -X POST http://127.0.0.1:3000/api/association-upload/logo \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "logo=@/caminho/para/imagem.png"
```

---

## 📋 CHECKLIST

- [ ] Arquivo `/etc/httpd/conf.d/larparatodos-proxy.conf` editado
- [ ] `apachectl configtest` retorna `Syntax OK`
- [ ] Apache reiniciado com sucesso
- [ ] `curl http://127.0.0.1:9000/associations/` responde
- [ ] `curl http://larparatodoshabitacional.com.br/storage/` responde
- [ ] Upload de imagem funciona
- [ ] Imagens aparecem no painel e no site público

---

## 🎯 COMO FUNCIONA

### Fluxo de uma imagem:

1. **Frontend** envia upload para: `POST /api/association-upload/logo`
2. **Backend** recebe, salva no MinIO e retorna URL: `https://dominio/storage/logo_1_123.png`
3. **Navegador** pede a imagem: `GET https://dominio/storage/logo_1_123.png`
4. **Apache** intercepta `/storage/*` e faz proxy para: `http://127.0.0.1:9000/associations/*`
5. **MinIO** retorna a imagem
6. **Apache** devolve para o navegador

✅ **Usuário vê a imagem!**

---

## 🔐 IMPORTANTE

- MinIO **NÃO fica exposto** na internet (só via Apache)
- Porta 9000 está em `127.0.0.1` (interno)
- Apache cuida de cache, headers e segurança

---

**Depois de aplicar, teste fazendo upload de uma imagem no painel da associação! 📸**
