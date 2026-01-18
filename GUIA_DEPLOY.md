# 🚀 Guia de Deploy - Larparatodos
## Servidor Bravulink (ou qualquer VPS Linux)

---

## 📋 Pré-requisitos no Servidor

Seu servidor precisa ter instalado:
- ✅ Docker
- ✅ Docker Compose
- ✅ Git

### Verificar se está instalado

```bash
docker --version
docker-compose --version
git --version
```

### Instalar Docker (se necessário)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar para aplicar as permissões
sudo reboot
```

---

## 📦 Passo 1: Preparar o Repositório Git

### 1.1 Criar repositório no GitHub/GitLab/Bitbucket

1. Crie um repositório novo (pode ser privado)
2. Não inicialize com README (você já tem os arquivos)

### 1.2 Subir o código para o Git

No seu computador local (onde está o projeto):

```bash
cd C:\projetos\larparatodos\larparatodos-main

# Inicializar Git (se ainda não estiver)
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Initial commit - Sistema Larparatodos completo"

# Adicionar o repositório remoto (substitua pela sua URL)
git remote add origin https://github.com/SEU-USUARIO/larparatodos.git

# Fazer push
git push -u origin main
```

### 1.3 Criar arquivo .gitignore

Certifique-se de que estes arquivos NÃO vão para o Git:

```gitignore
# Node modules
node_modules/
server/node_modules/

# Environment variables
.env
server/.env

# Build files
dist/
build/
server/dist/

# Logs
*.log
logs/
server/logs/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Docker volumes (não necessário)
data/
postgres-data/
minio-data/
```

---

## 🖥️ Passo 2: Configurar o Servidor

### 2.1 Conectar ao servidor

```bash
ssh root@SEU-IP-DO-SERVIDOR
# ou
ssh larparatodoshabi@SEU-IP-DO-SERVIDOR
```

### 2.2 Criar diretório para o projeto

```bash
# Ir para o diretório home
cd /home/larparatodoshabi

# Criar diretório do projeto
mkdir -p larparatodos
cd larparatodos
```

### 2.3 Clonar o repositório

```bash
# Clonar (substitua pela sua URL)
git clone https://github.com/SEU-USUARIO/larparatodos.git .

# Se for repositório privado, vai pedir usuário e senha/token
```

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo .env no servidor

```bash
cd /home/larparatodoshabi/larparatodos

# Criar .env para o backend
nano server/.env
```

Cole este conteúdo (ajuste conforme necessário):

```env
# Servidor
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://postgres:postgres123@db:5432/larparatodos

# JWT Secret (MUDE ISSO PARA UMA STRING ALEATÓRIA FORTE!)
JWT_SECRET=mude-para-uma-chave-super-segura-aleatoria-aqui-123456789

# Frontend URL (substitua pelo seu domínio ou IP)
FRONTEND_URL=http://SEU-IP-OU-DOMINIO:8080

# MinIO/S3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123strong
S3_BUCKET_NAME=associations
S3_REGION=us-east-1
S3_USE_SSL=false

# Em produção, você pode usar S3 da AWS:
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_ACCESS_KEY_ID=sua-access-key
# S3_SECRET_ACCESS_KEY=sua-secret-key
# S3_USE_SSL=true
```

Salvar: `CTRL+O`, Enter, `CTRL+X`

### 3.2 Criar .env para o frontend

```bash
nano .env
```

Cole:

```env
VITE_API_URL=http://SEU-IP-OU-DOMINIO:3000
```

Salvar e sair.

---

## 🐳 Passo 4: Ajustar Docker Compose para Produção

### 4.1 Editar docker-compose.yml

```bash
nano docker-compose.yml
```

Certifique-se de que está usando as portas corretas e que está configurado para produção:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "8080:80"
    environment:
      - VITE_API_URL=http://SEU-IP-OU-DOMINIO:3000
    depends_on:
      - backend
    restart: always

  backend:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres123@db:5432/larparatodos
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=http://SEU-IP-OU-DOMINIO:8080
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY_ID=minioadmin
      - S3_SECRET_ACCESS_KEY=minioadmin123strong
      - S3_BUCKET_NAME=associations
    depends_on:
      - db
      - minio
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres123
      - POSTGRES_DB=larparatodos
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123strong
    volumes:
      - minio-data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    restart: always

  minio-setup:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 10;
      mc alias set myminio http://minio:9000 minioadmin minioadmin123strong;
      mc mb myminio/associations --ignore-existing;
      mc anonymous set download myminio/associations;
      exit 0;
      "

volumes:
  postgres-data:
  minio-data:
```

---

## 🚀 Passo 5: Fazer o Deploy

### 5.1 Build e iniciar os containers

```bash
cd /home/larparatodoshabi/larparatodos

# Build das imagens (primeira vez pode demorar)
docker-compose build

# Iniciar os serviços
docker-compose up -d

# Ver os logs em tempo real
docker-compose logs -f
```

### 5.2 Executar migrações e seed

```bash
# Executar migrações do banco de dados
docker-compose exec backend npm run migrate

# Executar seed (criar dados iniciais)
docker-compose exec backend npm run seed
```

### 5.3 Verificar se está funcionando

```bash
# Ver status dos containers
docker-compose ps

# Todos devem estar "Up"
```

---

## 🌐 Passo 6: Configurar Firewall

### 6.1 Abrir portas necessárias

```bash
# Se usar UFW
sudo ufw allow 8080/tcp  # Frontend
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 9000/tcp  # MinIO (opcional, se quiser acesso externo)
sudo ufw allow 9001/tcp  # MinIO Console (opcional)
sudo ufw status
```

### 6.2 Acessar o sistema

Abra no navegador:
- **Frontend:** `http://SEU-IP:8080`
- **Backend API:** `http://SEU-IP:3000/health`
- **MinIO Console:** `http://SEU-IP:9001`

---

## 🔒 Passo 7: Configurar Domínio e SSL (Opcional mas Recomendado)

### 7.1 Apontar domínio para o servidor

No seu provedor de domínio (Registro.br, GoDaddy, etc):
- Crie um registro A apontando para o IP do servidor
- Exemplo: `larparatodos.com.br` → `SEU-IP`

### 7.2 Instalar Nginx como proxy reverso

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 7.3 Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/larparatodos
```

Cole:

```nginx
# Frontend
server {
    listen 80;
    server_name larparatodos.com.br www.larparatodos.com.br;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.larparatodos.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar e reiniciar:

```bash
sudo ln -s /etc/nginx/sites-available/larparatodos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7.4 Instalar SSL com Let's Encrypt

```bash
sudo certbot --nginx -d larparatodos.com.br -d www.larparatodos.com.br
sudo certbot --nginx -d api.larparatodos.com.br
```

---

## 🔄 Atualizações Futuras

### Para atualizar o sistema depois:

```bash
cd /home/larparatodoshabi/larparatodos

# Baixar atualizações do Git
git pull origin main

# Rebuild e reiniciar
docker-compose down
docker-compose build
docker-compose up -d

# Executar migrações (se houver)
docker-compose exec backend npm run migrate
```

---

## 📊 Comandos Úteis

### Gerenciar containers

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Parar tudo
docker-compose down

# Reiniciar um serviço específico
docker-compose restart backend

# Entrar no container
docker-compose exec backend sh
docker-compose exec frontend sh

# Ver uso de recursos
docker stats
```

### Backup do banco de dados

```bash
# Fazer backup
docker-compose exec db pg_dump -U postgres larparatodos > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260117.sql | docker-compose exec -T db psql -U postgres larparatodos
```

### Limpar espaço em disco

```bash
# Remover imagens não utilizadas
docker system prune -a

# Remover volumes não utilizados
docker volume prune
```

---

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar se as portas estão disponíveis
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080
```

### Erro de conexão com banco de dados

```bash
# Verificar se o banco está rodando
docker-compose ps db

# Conectar ao banco manualmente
docker-compose exec db psql -U postgres -d larparatodos

# Ver logs do banco
docker-compose logs db
```

### MinIO não está funcionando

```bash
# Recriar o bucket
docker-compose exec minio-setup sh
mc alias set myminio http://minio:9000 minioadmin minioadmin123strong
mc mb myminio/associations --ignore-existing
mc anonymous set download myminio/associations
```

### Frontend não carrega

```bash
# Rebuild do frontend
docker-compose build frontend
docker-compose up -d frontend

# Ver logs
docker-compose logs -f frontend
```

---

## 📧 Credenciais Padrão

Após o deploy, você pode acessar com:

### Administrador
- **URL:** `http://SEU-IP:8080/login`
- **E-mail:** `dirceu.oliveira@grupoep.com.br`
- **Senha:** `senha123`

### Associação Padrão
- **URL:** `http://SEU-IP:8080/association/login`
- **E-mail:** `larparatodos@larparatodos.com.br`
- **Senha:** `larparatodos123`

### MinIO Console
- **URL:** `http://SEU-IP:9001`
- **Usuário:** `minioadmin`
- **Senha:** `minioadmin123strong`

**⚠️ IMPORTANTE: Altere todas essas senhas em produção!**

---

## ✅ Checklist de Deploy

- [ ] Servidor com Docker e Docker Compose instalados
- [ ] Código no repositório Git
- [ ] Repositório clonado no servidor
- [ ] Arquivo `.env` criado e configurado
- [ ] `docker-compose.yml` ajustado para produção
- [ ] Containers buildados e iniciados
- [ ] Migrações executadas
- [ ] Seed executado (dados iniciais criados)
- [ ] Portas abertas no firewall
- [ ] Sistema acessível via navegador
- [ ] Domínio configurado (opcional)
- [ ] SSL instalado (opcional)
- [ ] Senhas padrão alteradas

---

## 🎯 Estrutura Final no Servidor

```
/home/larparatodoshabi/
└── larparatodos/
    ├── server/
    │   ├── src/
    │   ├── package.json
    │   ├── Dockerfile
    │   └── .env
    ├── src/
    ├── public/
    ├── docker-compose.yml
    ├── Dockerfile.prod
    ├── .env
    └── GUIA_DEPLOY.md (este arquivo)
```

---

**Última atualização:** Janeiro de 2026  
**Pronto para produção!** 🚀

