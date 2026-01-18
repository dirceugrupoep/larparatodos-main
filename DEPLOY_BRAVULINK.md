# 🔷 Deploy Específico para Bravulink

## 📋 Características do Bravulink

O Bravulink é um provedor de hospedagem que **já vem com Docker instalado**, o que facilita muito o deploy!

## ✅ O que o Bravulink já tem:

- ✅ Docker
- ✅ Docker Compose
- ✅ Git
- ✅ SSH habilitado
- ✅ Firewall configurável

## 🚀 Deploy Passo a Passo no Bravulink

### 1️⃣ Preparação no seu PC (Uma única vez)

```bash
# No diretório C:\projetos\larparatodos\larparatodos-main

# Inicializar Git
git init
git add .
git commit -m "Sistema Larparatodos completo - Deploy inicial"

# Criar repositório no GitHub/GitLab
# Depois fazer push:
git remote add origin https://github.com/SEU-USUARIO/larparatodos.git
git branch -M main
git push -u origin main
```

### 2️⃣ No Painel do Bravulink

1. **Acessar o painel:** https://painel.bravulink.com
2. **Ativar SSH:** Vá em Serviços → SSH → Ativar
3. **Anotar credenciais SSH:**
   - Host: `seu-servidor.bravulink.com`
   - Usuário: `seu-usuario`
   - Porta: geralmente `22`
4. **Liberar portas no firewall:**
   - Porta 80 (HTTP)
   - Porta 3000 (API)
   - Porta 9000 (MinIO)
   - Porta 9001 (MinIO Console)

### 3️⃣ Conectar via SSH

```bash
# No seu PC, abrir terminal (PowerShell ou cmd)
ssh seu-usuario@seu-servidor.bravulink.com

# Ou se especificar porta:
ssh -p 22 seu-usuario@seu-servidor.bravulink.com
```

### 4️⃣ Clonar o Repositório no Servidor

```bash
# Após conectar via SSH, você estará no servidor Bravulink

# Navegar para o diretório home
cd ~

# Clonar o repositório
git clone https://github.com/SEU-USUARIO/larparatodos.git

# Entrar no diretório
cd larparatodos
```

### 5️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar o template
cp .env.example .env

# Editar o arquivo
nano .env

# Ou se preferir vim:
vim .env
```

**IMPORTANTE:** Edite estas linhas:

```bash
# Substituir pelo seu domínio Bravulink
DOMAIN=seu-site.bravulink.com

# TROCAR TODAS AS SENHAS!
DB_PASSWORD=SuaSenhaPostgresAqui123!@#
JWT_SECRET=UmaChaveJWTMuitoSeguraEAleatoria987$%^
S3_SECRET_KEY=SenhaMinioDiferenteAqui456&*()

# Ajustar URLs se necessário
S3_PUBLIC_URL=http://seu-site.bravulink.com:9000
```

**Dica:** Para gerar senhas seguras no servidor:
```bash
openssl rand -base64 32
```

### 6️⃣ Build e Iniciar os Containers

```bash
# Build das imagens (pode demorar alguns minutos)
docker-compose -f docker-compose.prod.yml build

# Iniciar todos os containers
docker-compose -f docker-compose.prod.yml up -d
```

**Aguarde:** O primeiro build pode levar de 5 a 10 minutos dependendo da conexão.

### 7️⃣ Verificar Status

```bash
# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Para sair dos logs, pressione Ctrl+C
```

**Você deve ver:**
```
NAME                        STATUS
larparatodos-frontend       Up
larparatodos-backend        Up
larparatodos-postgres       Up (healthy)
larparatodos-minio          Up (healthy)
larparatodos-minio-setup    Exited (0)
```

### 8️⃣ Configurar DNS (Se tiver domínio próprio)

Se você tem um domínio próprio (ex: `www.larparatodos.com.br`):

1. **No seu provedor de domínio (Registro.br, GoDaddy, etc.):**
   - Criar registro A apontando para o IP do Bravulink
   - `larparatodos.com.br` → `IP_DO_BRAVULINK`

2. **No .env do servidor, atualizar:**
   ```bash
   nano .env
   # Trocar DOMAIN=seu-site.bravulink.com
   # Para: DOMAIN=www.larparatodos.com.br
   ```

3. **Reiniciar containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

### 9️⃣ Acessar o Sistema

Abra o navegador:

- **Site:** `http://seu-site.bravulink.com`
- **API:** `http://seu-site.bravulink.com:3000`
- **MinIO:** `http://seu-site.bravulink.com:9001`

**Login Admin:**
- Email: `dirceu.oliveira@grupoep.com.br`
- Senha: `senha123`

⚠️ **IMPORTANTE:** Altere a senha imediatamente!

## 🔒 Configurar HTTPS (SSL) no Bravulink

### Opção 1: Usar Let's Encrypt no Bravulink

1. No painel do Bravulink: SSL → Let's Encrypt
2. Adicionar domínio
3. Gerar certificado
4. Ativar redirecionamento HTTP → HTTPS

### Opção 2: Usar Cloudflare (Recomendado)

1. Criar conta no Cloudflare
2. Adicionar seu domínio
3. Alterar nameservers para Cloudflare
4. Ativar SSL/TLS (Full)
5. Pronto! Cloudflare gerencia SSL automaticamente

## 🔄 Atualizar o Sistema

Quando fizer mudanças no código:

```bash
# 1. No seu PC, fazer commit e push
git add .
git commit -m "Descrição das mudanças"
git push origin main

# 2. No servidor Bravulink (via SSH)
cd ~/larparatodos
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 💾 Backup Automático

### Criar script de backup:

```bash
# No servidor
nano ~/backup-larparatodos.sh
```

Cole este conteúdo:

```bash
#!/bin/bash
BACKUP_DIR=~/backups/larparatodos
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco
docker exec larparatodos-postgres pg_dump -U postgres larparatodos > $BACKUP_DIR/db_$DATE.sql

# Backup das imagens MinIO
docker exec larparatodos-minio mc mirror /data/associations $BACKUP_DIR/images_$DATE

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/db_*.sql | tail -n +8 | xargs rm -f

echo "Backup concluído: $DATE"
```

Tornar executável e agendar:

```bash
chmod +x ~/backup-larparatodos.sh

# Agendar para rodar todo dia às 3h da manhã
crontab -e
# Adicionar linha:
0 3 * * * ~/backup-larparatodos.sh >> ~/backup.log 2>&1
```

## 📊 Monitoramento

### Ver uso de recursos:

```bash
# CPU e memória dos containers
docker stats

# Espaço em disco
df -h

# Ver logs de um serviço específico
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs postgres
```

### Alertas (Opcional):

Instalar Uptime Kuma para monitoramento:

```bash
docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
```

Acesse: `http://seu-site.bravulink.com:3001`

## 🐛 Troubleshooting Específico do Bravulink

### Problema: "Permission denied"

```bash
# Adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER
# Fazer logout e login novamente
```

### Problema: "Port already in use"

```bash
# Ver o que está usando a porta
sudo lsof -i :80
sudo lsof -i :3000

# Parar o serviço conflitante ou mudar a porta no .env
```

### Problema: "Out of disk space"

```bash
# Limpar containers e imagens antigas
docker system prune -a --volumes

# Ver tamanho dos volumes
docker system df
```

### Problema: Container reiniciando constantemente

```bash
# Ver logs detalhados
docker logs larparatodos-backend --tail 100 --follow

# Verificar variáveis de ambiente
docker exec larparatodos-backend env | grep DB_PASSWORD
```

## 📞 Suporte Bravulink

- **Site:** https://bravulink.com
- **Ticket:** Abrir ticket no painel
- **Documentação:** https://docs.bravulink.com

## ✅ Checklist Final

- [ ] Repositório Git criado e código enviado
- [ ] SSH ativado no painel Bravulink
- [ ] Portas liberadas no firewall (80, 3000, 9000, 9001)
- [ ] Conectado via SSH no servidor
- [ ] Código clonado no servidor
- [ ] Arquivo .env criado e senhas alteradas
- [ ] Docker Compose build executado
- [ ] Containers iniciados e rodando
- [ ] Site acessível no navegador
- [ ] Login admin funcionando
- [ ] Senha do admin alterada
- [ ] DNS configurado (se tiver domínio próprio)
- [ ] SSL configurado (Cloudflare ou Let's Encrypt)
- [ ] Backup automático configurado
- [ ] Monitoramento ativado

## 🎉 Pronto!

Seu sistema Larparatodos está rodando no Bravulink! 🚀

**URLs importantes:**
- Frontend: http://seu-site.bravulink.com
- Backend API: http://seu-site.bravulink.com:3000
- MinIO Console: http://seu-site.bravulink.com:9001

**Próximos passos:**
1. Testar todas as funcionalidades
2. Cadastrar cooperados
3. Configurar as associações
4. Fazer backup inicial
5. Monitorar logs nas primeiras horas

**Boa sorte com o sistema! 🏠✨**

