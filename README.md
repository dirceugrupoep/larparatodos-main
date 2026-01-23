# 🏠 Larparatodos - Sistema de Gestão de Cooperativa Habitacional

Sistema completo para gestão de cooperativas habitacionais, desenvolvido com React, Node.js, PostgreSQL e Docker.

## 📚 Documentação

- **[DEPLOY.md](DEPLOY.md)** - Guia completo de deploy no servidor (Bravulink ou qualquer servidor com Docker)
- **[GUIA_RAPIDO.md](GUIA_RAPIDO.md)** - Guia rápido de referência

## ⚡ Quick Start

### Requisitos
- Docker 20.10+
- Docker Compose 2.0+
- Git

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/larparatodos.git
cd larparatodos

# 2. Configure as variáveis de ambiente
cp .env.example .env
nano .env  # Edite e adicione suas senhas

# 3. Inicie o sistema
docker-compose -f docker-compose.prod.yml up -d

# 4. Acesse o sistema
# Frontend: http://localhost
# Backend API: http://localhost:3000
# MinIO Console: http://localhost:9001
```

### Login Padrão

**Admin:**
- Email: `admin@larparatodos.com`
- Senha: `admin123`

⚠️ **Altere a senha imediatamente após o primeiro login!**

## 🎯 Funcionalidades Principais

### Para Usuários
- ✅ Cadastro e login seguro
- 💰 Gestão de pagamentos mensais
- 📊 Acompanhamento do progresso do projeto
- 👤 Perfil completo com documentos
- 📄 Aceitação de termos de uso (LGPD)

### Para Associações
- 🏢 Painel de gestão completo
- 📈 Dashboard com métricas e gráficos
- 👥 Gerenciamento de cooperados
- 💵 Relatórios financeiros detalhados
- 🎨 Perfil público personalizável
- 🖼️ Upload de logo e capa

### Para Administradores
- 👨‍💼 Gerenciamento de usuários
- 🏛️ Gerenciamento de associações
- ✅ Aprovação de novas associações
- 📊 Visão geral do sistema

## 🏗️ Arquitetura

```
larparatodos/
├── src/                      # Frontend React + TypeScript
│   ├── components/          # Componentes reutilizáveis
│   ├── pages/              # Páginas da aplicação
│   ├── lib/                # Bibliotecas e utilitários
│   └── assets/             # Imagens e recursos estáticos
├── server/                  # Backend Node.js + Express
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── database/       # Migrations e conexão
│   │   └── services/       # Serviços (storage, auth, etc)
│   └── package.json
├── docker-compose.prod.yml  # Configuração Docker para produção
├── Dockerfile.prod          # Dockerfile do frontend
└── server/Dockerfile.prod   # Dockerfile do backend
```

## 🚀 Deploy em Produção

Consulte o arquivo [DEPLOY.md](DEPLOY.md) para instruções detalhadas de deploy no Bravulink ou qualquer servidor com Docker.

### Resumo:
1. Subir código para Git
2. Clonar no servidor
3. Configurar `.env`
4. Executar `docker-compose -f docker-compose.prod.yml up -d`
5. Pronto! ✅

## 🛠️ Tecnologias

**Frontend:**
- React 18
- TypeScript
- TailwindCSS
- Framer Motion
- React Router
- React Query
- React Quill (editor de texto)
- Recharts (gráficos)

**Backend:**
- Node.js 20
- Express
- PostgreSQL 16
- JWT Authentication
- MinIO (S3-compatible storage)

**Infraestrutura:**
- Docker & Docker Compose
- Nginx (proxy reverso no frontend)
- MinIO (armazenamento de imagens)

## 📊 Variáveis de Ambiente

Consulte `.env.example` para todas as variáveis disponíveis. Principais:

```bash
DOMAIN=seu-dominio.com.br
DB_PASSWORD=senha-postgres
JWT_SECRET=chave-secreta-jwt
S3_SECRET_KEY=senha-minio
```

## 🔐 Segurança

- ✅ Autenticação JWT
- ✅ Senhas hasheadas com bcrypt
- ✅ Validação de dados com Zod
- ✅ CORS configurado
- ✅ Proteção contra SQL Injection
- ✅ Rate limiting (recomendado adicionar)
- ✅ HTTPS (configure nginx/traefik)

## 📦 Backup e Restauração

### Backup do Banco de Dados

```bash
docker exec larparatodos-postgres pg_dump -U postgres larparatodos > backup.sql
```

### Restaurar Backup

```bash
cat backup.sql | docker exec -i larparatodos-postgres psql -U postgres larparatodos
```

### Backup de Imagens (MinIO)

```bash
docker exec larparatodos-minio mc mirror /data/associations /backup/associations
```

## 🐛 Troubleshooting

### Container não inicia

```bash
docker-compose -f docker-compose.prod.yml logs [service-name]
```

### Resetar banco de dados

```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Recriar containers

```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Atualizações

Para atualizar o sistema:

```bash
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Licença

Proprietário - Todos os direitos reservados.

## 👥 Suporte

Para dúvidas ou suporte:
- Email: suporte@larparatodos.com.br
- Guia de Deploy: [DEPLOY.md](DEPLOY.md)
- Guia Rápido: [GUIA_RAPIDO.md](GUIA_RAPIDO.md)

---

Desenvolvido com ❤️ para facilitar o acesso à moradia digna.
