# 🚀 Guia Rápido - Larparatodos

## 🔗 URLs Principais

### Público
- **Home:** `http://localhost:8080/`
- **Login:** `http://localhost:8080/login`
- **Cadastro:** `http://localhost:8080/register`
- **Associações:** `http://localhost:8080/associations`

### Painel do Usuário
- **Dashboard:** `http://localhost:8080/dashboard`
- **Pagamentos:** `http://localhost:8080/dashboard/payments`
- **Perfil:** `http://localhost:8080/dashboard/profile`
- **Projeto:** `http://localhost:8080/dashboard/project`

### Painel da Associação
- **Login:** `http://localhost:8080/association/login`
- **Cadastro:** `http://localhost:8080/association/register`
- **Dashboard:** `http://localhost:8080/association/dashboard`
- **Usuários:** `http://localhost:8080/association/users`
- **Relatórios:** `http://localhost:8080/association/reports`
- **Configurações:** `http://localhost:8080/association/settings`

### Painel Administrativo
- **Dashboard:** `http://localhost:8080/admin`
- **Usuários:** `http://localhost:8080/admin/users`
- **Associações:** `http://localhost:8080/admin/associations`
- **Relatórios:** `http://localhost:8080/admin/reports`

## 🔑 Credenciais Padrão

### Administrador
- **E-mail:** `dirceu.oliveira@grupoep.com.br`
- **Senha:** `senha123`

### Associação Padrão
- **E-mail:** `larparatodos@larparatodos.com.br`
- **Senha:** `larparatodos123`
- **CNPJ:** `55912593000154`

## 📋 Funcionalidades por Painel

### 👤 Usuário
- ✅ Dashboard com métricas pessoais
- ✅ Gestão de pagamentos
- ✅ Acompanhamento de projeto
- ✅ Edição de perfil
- ✅ Visualização de termos aceitos

### 🏢 Associação
- ✅ Dashboard completo com gráficos
- ✅ Gestão de usuários vinculados
- ✅ Relatórios financeiros
- ✅ Upload de logo e capa
- ✅ Editor de descrição rica
- ✅ Configuração de redes sociais
- ✅ Exportação de dados (CSV)

### 🔐 Administrador
- ✅ Gestão completa de usuários
- ✅ Gestão completa de associações
- ✅ Aprovação de associações
- ✅ Relatórios gerais
- ✅ Métricas globais

## 🗄️ Estrutura do Banco

### Tabelas Principais
- `users` - Usuários/Cooperados
- `user_profiles` - Perfis completos
- `associations` - Associações cooperativas
- `payments` - Pagamentos/Contribuições
- `project_status` - Status dos projetos
- `terms_of_acceptance` - Termos de uso
- `user_term_acceptances` - Aceites registrados
- `contacts` - Contatos do formulário

## 🔌 APIs Principais

### Autenticação
- `POST /api/auth/register` - Cadastro usuário
- `POST /api/auth/login` - Login usuário
- `POST /api/association-auth/register` - Cadastro associação
- `POST /api/association-auth/login` - Login associação

### Dados
- `GET /api/associations` - Lista associações
- `GET /api/association-dashboard/metrics` - Métricas associação
- `GET /api/association-dashboard/users` - Usuários da associação
- `GET /api/terms/active` - Termo ativo

## 🐳 Docker

### Desenvolvimento (Local)
```bash
# Iniciar
docker-compose up -d

# Logs
docker-compose logs -f

# Parar
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Produção (Servidor)
```bash
# Iniciar
docker-compose -f docker-compose.prod.yml up -d

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar
docker-compose -f docker-compose.prod.yml down

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🚀 Deploy Rápido

1. **No seu PC:**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **No Servidor:**
```bash
git clone https://github.com/seu-usuario/larparatodos.git
cd larparatodos
cp .env.example .env
nano .env  # Edite as senhas
docker-compose -f docker-compose.prod.yml up -d
```

3. **Pronto!** Acesse: `http://seu-dominio.com.br`

📖 **Guia completo de deploy:** Ver `DEPLOY.md`

## 📦 Tecnologias

**Frontend:** React, TypeScript, Tailwind, Shadcn/ui, Recharts  
**Backend:** Node.js, Express, PostgreSQL, JWT  
**Storage:** MinIO (S3-compatível)  
**Container:** Docker, Docker Compose

---

📖 **Documentação completa:** Ver `DOCUMENTACAO.md`  
🚀 **Deploy em produção:** Ver `DEPLOY.md`

