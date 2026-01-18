# 📚 Documentação Completa - Larparatodos

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Sistema](#estrutura-do-sistema)
3. [Painéis e Rotas](#painéis-e-rotas)
4. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
5. [APIs e Endpoints](#apis-e-endpoints)
6. [Banco de Dados](#banco-de-dados)
7. [Tecnologias Utilizadas](#tecnologias-utilizadas)
8. [Autenticação e Segurança](#autenticação-e-segurança)
9. [Deploy e Configuração](#deploy-e-configuração)

---

## 🎯 Visão Geral

O **Larparatodos** é uma plataforma completa de gestão de cooperativa habitacional que permite:

- Cadastro e gestão de usuários
- Vinculação a associações cooperativas
- Controle de pagamentos e contribuições
- Acompanhamento de projetos habitacionais
- Painéis administrativos para gestão completa
- Painéis específicos para associações
- Sistema de relatórios e métricas avançadas

---

## 🏗️ Estrutura do Sistema

### Tipos de Usuários

1. **Usuário Normal (Cooperado)**
   - Acesso ao painel pessoal
   - Visualização de pagamentos
   - Acompanhamento de projeto
   - Gestão de perfil

2. **Associação**
   - Painel próprio de gestão
   - Visualização de usuários vinculados
   - Métricas e relatórios
   - Configuração de perfil público

3. **Administrador**
   - Acesso total ao sistema
   - Gestão de usuários
   - Gestão de associações
   - Relatórios gerais
   - Métricas globais

---

## 🖥️ Painéis e Rotas

### 🌐 Rotas Públicas

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Página inicial com informações sobre o projeto | Público |
| `/login` | Página de login para usuários | Público |
| `/register` | Página de cadastro de novos usuários | Público |
| `/associations` | Lista pública de associações disponíveis | Público |
| `/associations/:id` | Perfil público detalhado de uma associação | Público |

### 👤 Painel do Usuário (Cooperado)

**URL Base:** `/dashboard`

| Rota | Descrição | Funcionalidades |
|------|-----------|-----------------|
| `/dashboard` | Dashboard principal do usuário | Métricas pessoais, gráficos de pagamentos, status do projeto, informações de adimplência |
| `/dashboard/payments` | Gestão de pagamentos | Lista de pagamentos, histórico, status (pago/pendente/atrasado), valores |
| `/dashboard/profile` | Perfil do usuário | Editar dados pessoais, CPF, endereço, informações de contato |
| `/dashboard/project` | Acompanhamento do projeto | Status do projeto habitacional, fases, progresso, prazos |

**Autenticação:** Requer token JWT de usuário normal

### 🏢 Painel da Associação

**URL Base:** `/association`

| Rota | Descrição | Funcionalidades |
|------|-----------|-----------------|
| `/association/login` | Login para associações | Autenticação específica para associações |
| `/association/register` | Cadastro de nova associação | Formulário público com validação de CNPJ |
| `/association/dashboard` | Dashboard da associação | Métricas completas: receita, usuários, adimplência, gráficos avançados, crescimento, top usuários |
| `/association/users` | Gestão de usuários | Lista completa de usuários vinculados, filtros, busca, status de pagamentos, exportação CSV |
| `/association/reports` | Relatórios detalhados | Relatórios financeiros, pagamentos por período, análise de usuários, exportação CSV |
| `/association/settings` | Configurações da associação | Upload de logo e capa, descrição rica (editor WYSIWYG), redes sociais, horário de funcionamento, informações de contato |

**Autenticação:** Requer token JWT de associação

### 🔐 Painel Administrativo

**URL Base:** `/admin`

| Rota | Descrição | Funcionalidades |
|------|-----------|-----------------|
| `/admin` | Dashboard administrativo | Visão geral do sistema, métricas globais, estatísticas gerais |
| `/admin/users` | Gestão de usuários | Lista de todos os usuários, edição, ativação/desativação, reset de senha, filtros avançados |
| `/admin/associations` | Gestão de associações | Lista de associações, ativação/desativação, aprovação, métricas por associação, visualização de usuários |
| `/admin/associations/:id` | Detalhes da associação | Informações completas, métricas detalhadas, lista de usuários vinculados, histórico |
| `/admin/reports` | Relatórios administrativos | Relatórios gerais do sistema, análises, exportações |

**Autenticação:** Requer token JWT de administrador (`is_admin = true`)

---

## ⚙️ Funcionalidades por Módulo

### 1. Sistema de Autenticação

#### Usuários Normais
- Cadastro com validação de CPF
- Login com e-mail e senha
- JWT token para sessão
- Recuperação de senha (estrutura preparada)

#### Associações
- Cadastro público com validação de CNPJ
- Login separado com e-mail e senha
- JWT token específico para associações
- Sistema de aprovação por administradores

#### Administradores
- Login com credenciais especiais
- Acesso total ao sistema
- Gestão completa de usuários e associações

### 2. Gestão de Usuários

#### No Painel do Usuário
- Visualização de perfil
- Edição de dados pessoais
- Visualização de pagamentos
- Acompanhamento de projeto
- Aceite de termos de uso

#### No Painel da Associação
- Lista de usuários vinculados
- Filtros por status (ativo/inativo/atrasado)
- Busca por nome, e-mail ou CPF
- Visualização de métricas por usuário
- Exportação para CSV

#### No Painel Administrativo
- Gestão completa de usuários
- Ativação/desativação
- Reset de senha
- Edição de perfil
- Visualização de histórico

### 3. Gestão de Associações

#### Cadastro Público
- Formulário com validação de CNPJ
- Campos: razão social, nome fantasia, CNPJ, e-mail, senha
- Aguarda aprovação do administrador

#### Painel da Associação
- Dashboard com métricas avançadas
- Gestão de usuários vinculados
- Relatórios financeiros
- Configuração de perfil público
- Upload de imagens (logo e capa)

#### Perfil Público
- Página pública com informações da associação
- Logo e imagem de capa
- Descrição rica formatada
- Redes sociais
- Informações de contato
- Horário de funcionamento

#### Painel Administrativo
- Aprovação de novas associações
- Ativação/desativação
- Visualização de métricas
- Gestão completa

### 4. Sistema de Pagamentos

#### Funcionalidades
- Criação automática de pagamentos mensais
- Status: pendente, pago, atrasado
- Histórico completo
- Métodos de pagamento
- Valores configuráveis por associação
- Controle de adimplência

#### Visualizações
- Gráficos de pagamentos
- Taxa de adimplência
- Histórico detalhado
- Relatórios por período

### 5. Acompanhamento de Projetos

#### Fases do Projeto
- Cadastro
- Análise
- Aprovação
- Construção
- Entrega

#### Funcionalidades
- Progresso percentual
- Datas importantes
- Notas e observações
- Acompanhamento visual

### 6. Sistema de Métricas e Relatórios

#### Dashboard da Associação
- Receita total e por período
- Crescimento de receita
- Total de usuários e crescimento
- Taxa de adimplência
- Gráficos:
  - Receita por mês (últimos 12 meses)
  - Receita diária (últimos 30 dias)
  - Taxa de adimplência por mês
  - Crescimento de usuários
  - Status de pagamentos (pizza)
- Top 10 usuários por contribuição

#### Relatórios da Associação
- Filtros por período (data inicial e final)
- Resumo financeiro completo
- Lista detalhada de pagamentos
- Análise de usuários
- Exportação para CSV

#### Dashboard Administrativo
- Métricas globais do sistema
- Estatísticas de usuários
- Estatísticas de associações
- Receita total
- Análises gerais

### 7. Sistema de Termos de Aceite

#### Funcionalidades
- Termo completo e profissional
- Aceite obrigatório no cadastro
- Registro de aceite no banco de dados
- Armazenamento de IP e user agent
- Data e hora do aceite
- Visualização no painel do usuário
- Modal para leitura do termo

#### Conteúdo do Termo
- 15 seções completas
- Conformidade com LGPD
- Cláusulas legais adequadas
- Versão controlada

---

## 🔌 APIs e Endpoints

### Autenticação de Usuários

**Base URL:** `/api/auth`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/register` | Cadastro de novo usuário | Não |
| POST | `/login` | Login de usuário | Não |
| GET | `/me` | Dados do usuário autenticado | Sim (JWT) |

### Autenticação de Associações

**Base URL:** `/api/association-auth`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/register` | Cadastro de nova associação | Não |
| POST | `/login` | Login de associação | Não |
| GET | `/me` | Dados da associação autenticada | Sim (JWT) |
| PUT | `/update` | Atualizar dados da associação | Sim (JWT) |

### Associações (Público)

**Base URL:** `/api/associations`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/` | Lista de associações ativas | Não |
| GET | `/default` | Associação padrão | Não |
| GET | `/:id` | Detalhes de uma associação | Não |

### Upload de Imagens de Associações

**Base URL:** `/api/association-upload`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/logo` | Upload de logo | Sim (JWT Associação) |
| POST | `/cover` | Upload de imagem de capa | Sim (JWT Associação) |

### Dashboard da Associação

**Base URL:** `/api/association-dashboard`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/metrics` | Métricas completas do dashboard | Sim (JWT Associação) |
| GET | `/users` | Lista de usuários com paginação | Sim (JWT Associação) |
| GET | `/reports` | Relatórios por período | Sim (JWT Associação) |

### Termos de Aceite

**Base URL:** `/api/terms`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/active` | Termo de aceite ativo | Não |
| GET | `/:id` | Termo por ID | Não |
| GET | `/user/:userId/acceptance` | Verificar aceite do usuário | Não |
| POST | `/accept` | Registrar aceite do termo | Não |

### Dashboard do Usuário

**Base URL:** `/api/dashboard`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/stats` | Estatísticas do dashboard | Sim (JWT) |
| GET | `/contacts/recent` | Contatos recentes | Sim (JWT) |

### Pagamentos

**Base URL:** `/api/payments`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/` | Lista de pagamentos do usuário | Sim (JWT) |
| GET | `/stats` | Estatísticas de pagamentos | Sim (JWT) |
| POST | `/` | Criar novo pagamento | Sim (JWT) |
| PUT | `/:id` | Atualizar pagamento | Sim (JWT) |

### Perfil do Usuário

**Base URL:** `/api/profile`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/` | Dados do perfil | Sim (JWT) |
| PUT | `/` | Atualizar perfil | Sim (JWT) |

### Projeto

**Base URL:** `/api/project`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/status` | Status do projeto | Sim (JWT) |
| PUT | `/status` | Atualizar status | Sim (JWT) |

### Contato/Cadastro

**Base URL:** `/api/contact`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/` | Cadastro via formulário de contato | Não |

### Administração

**Base URL:** `/api/admin`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/stats` | Estatísticas gerais | Sim (JWT Admin) |
| GET | `/users` | Lista de usuários | Sim (JWT Admin) |
| GET | `/users/:id` | Detalhes do usuário | Sim (JWT Admin) |
| PUT | `/users/:id` | Atualizar usuário | Sim (JWT Admin) |
| PUT | `/users/:id/reset-password` | Resetar senha | Sim (JWT Admin) |
| PUT | `/users/:id/toggle-active` | Ativar/desativar usuário | Sim (JWT Admin) |
| GET | `/associations` | Lista de associações | Sim (JWT Admin) |
| GET | `/associations/:id` | Detalhes da associação | Sim (JWT Admin) |
| GET | `/associations/:id/users` | Usuários da associação | Sim (JWT Admin) |
| GET | `/associations/:id/metrics` | Métricas da associação | Sim (JWT Admin) |
| POST | `/associations` | Criar associação | Sim (JWT Admin) |
| PUT | `/associations/:id` | Atualizar associação | Sim (JWT Admin) |
| PUT | `/associations/:id/toggle-active` | Ativar/desativar associação | Sim (JWT Admin) |
| DELETE | `/associations/:id` | Deletar associação | Sim (JWT Admin) |
| GET | `/reports` | Relatórios administrativos | Sim (JWT Admin) |

---

## 🗄️ Banco de Dados

### Tabelas Principais

#### `users`
Armazena informações dos usuários/cooperados.

**Campos:**
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR) - Nome completo
- `email` (VARCHAR UNIQUE) - E-mail
- `password` (VARCHAR) - Senha hasheada
- `phone` (VARCHAR) - Telefone
- `association_id` (INTEGER) - ID da associação vinculada
- `is_admin` (BOOLEAN) - Se é administrador
- `is_active` (BOOLEAN) - Se está ativo
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `user_profiles`
Perfil completo do usuário.

**Campos:**
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER UNIQUE) - Referência ao usuário
- `cpf` (VARCHAR) - CPF
- `address` (TEXT) - Endereço
- `city` (VARCHAR) - Cidade
- `state` (VARCHAR) - Estado
- `zip_code` (VARCHAR) - CEP
- `birth_date` (DATE) - Data de nascimento
- `marital_status` (VARCHAR) - Estado civil
- `occupation` (VARCHAR) - Ocupação
- `monthly_income` (DECIMAL) - Renda mensal
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `associations`
Armazena informações das associações cooperativas.

**Campos:**
- `id` (SERIAL PRIMARY KEY)
- `cnpj` (VARCHAR UNIQUE) - CNPJ
- `corporate_name` (VARCHAR) - Razão social
- `trade_name` (VARCHAR) - Nome fantasia
- `email` (VARCHAR UNIQUE) - E-mail
- `password` (VARCHAR) - Senha hasheada
- `phone` (VARCHAR) - Telefone
- `address` (TEXT) - Endereço
- `city` (VARCHAR) - Cidade
- `state` (VARCHAR) - Estado
- `zip_code` (VARCHAR) - CEP
- `website` (VARCHAR) - Website
- `logo_url` (VARCHAR) - URL do logo
- `cover_url` (VARCHAR) - URL da imagem de capa
- `description` (TEXT) - Descrição rica formatada
- `facebook_url` (VARCHAR) - Facebook
- `instagram_url` (VARCHAR) - Instagram
- `youtube_url` (VARCHAR) - YouTube
- `linkedin_url` (VARCHAR) - LinkedIn
- `working_hours` (VARCHAR) - Horário de funcionamento
- `is_active` (BOOLEAN) - Se está ativa
- `is_default` (BOOLEAN) - Se é associação padrão
- `is_approved` (BOOLEAN) - Se está aprovada
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `payments`
Registra todos os pagamentos/contribuições.

**Campos:**
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - Referência ao usuário
- `amount` (DECIMAL) - Valor
- `due_date` (DATE) - Data de vencimento
- `paid_date` (DATE) - Data de pagamento
- `status` (VARCHAR) - Status: 'pending', 'paid'
- `payment_method` (VARCHAR) - Método de pagamento
- `transaction_id` (VARCHAR) - ID da transação
- `notes` (TEXT) - Observações
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `project_status`
Status do projeto habitacional do usuário.

**Campos:**
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER UNIQUE) - Referência ao usuário
- `phase` (VARCHAR) - Fase atual
- `progress_percentage` (INTEGER) - Progresso percentual
- `start_date` (DATE) - Data de início
- `expected_completion_date` (DATE) - Data esperada de conclusão
- `current_step` (VARCHAR) - Etapa atual
- `notes` (TEXT) - Observações
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `contacts`
Contatos/cadastros via formulário.

**Campos:**
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR) - Nome
- `email` (VARCHAR) - E-mail
- `phone` (VARCHAR) - Telefone
- `message` (TEXT) - Mensagem
- `created_at` (TIMESTAMP)

#### `terms_of_acceptance`
Termos de aceite e condições de uso.

**Campos:**
- `id` (SERIAL PRIMARY KEY)
- `version` (VARCHAR) - Versão do termo
- `title` (VARCHAR) - Título
- `content` (TEXT) - Conteúdo completo
- `is_active` (BOOLEAN) - Se está ativo
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `user_term_acceptances`
Registro de aceites dos termos pelos usuários.

**Campos:**
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - Referência ao usuário
- `term_id` (INTEGER) - Referência ao termo
- `ip_address` (VARCHAR) - IP do usuário
- `user_agent` (TEXT) - User agent do navegador
- `accepted_at` (TIMESTAMP) - Data/hora do aceite
- UNIQUE(user_id, term_id)

### Índices

- `idx_users_association_id` - Otimização de consultas por associação
- `idx_associations_cnpj` - Busca rápida por CNPJ
- `idx_associations_is_default` - Busca de associação padrão
- `idx_payments_user_id` - Consultas de pagamentos por usuário
- `idx_payments_status` - Filtros por status
- `idx_payments_due_date` - Consultas por data de vencimento
- `idx_user_term_acceptances_user_id` - Consultas de aceites
- `idx_user_term_acceptances_term_id` - Consultas por termo

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18.3.1** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **Framer Motion** - Animações
- **Recharts** - Gráficos e visualizações
- **React Quill** - Editor de texto rico (WYSIWYG)
- **Date-fns** - Manipulação de datas
- **Lucide React** - Ícones
- **Zod** - Validação de schemas

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **PostgreSQL** - Banco de dados
- **JWT (jsonwebtoken)** - Autenticação
- **Bcrypt** - Hash de senhas
- **Zod** - Validação de dados
- **Multer** - Upload de arquivos
- **AWS SDK S3 Client** - Integração com S3/MinIO
- **Multer-S3** - Upload direto para S3

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **MinIO** - Armazenamento S3-compatível (local)
- **Nginx** - Proxy reverso (produção)

### Segurança
- **Helmet** - Headers de segurança HTTP
- **Express Rate Limit** - Limitação de requisições
- **CORS** - Controle de acesso cross-origin
- **JWT** - Tokens seguros
- **Bcrypt** - Hash seguro de senhas

---

## 🔐 Autenticação e Segurança

### Sistema de Tokens JWT

#### Usuários Normais
- Token armazenado em `localStorage` como `token`
- Tipo: `user`
- Expiração configurável
- Usado em todas as requisições autenticadas

#### Associações
- Token armazenado em `localStorage` como `association_token`
- Tipo: `association`
- Expiração configurável
- Rotas específicas para associações

#### Administradores
- Token armazenado em `localStorage` como `token`
- Tipo: `user` com `is_admin = true`
- Acesso total ao sistema

### Middleware de Autenticação

- Verificação de token em rotas protegidas
- Validação de tipo de usuário
- Redirecionamento automático se não autenticado

### Proteção de Rotas

- Rotas públicas: `/`, `/login`, `/register`, `/associations`
- Rotas de usuário: `/dashboard/*`
- Rotas de associação: `/association/*`
- Rotas administrativas: `/admin/*`

---

## 📦 Deploy e Configuração

### Variáveis de Ambiente

#### Backend (.env)
```
PORT=3000
DATABASE_URL=postgresql://user:password@db:5432/larparatodos
JWT_SECRET=seu-secret-key-aqui
FRONTEND_URL=http://localhost:8080

# MinIO/S3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=associations
S3_REGION=us-east-1
S3_USE_SSL=false
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

### Docker Compose

O sistema utiliza Docker Compose com os seguintes serviços:

1. **Frontend** - React app (porta 8080)
2. **Backend** - Node.js/Express (porta 3000)
3. **Database** - PostgreSQL (porta 5432)
4. **MinIO** - Armazenamento S3 (porta 9000)
5. **MinIO Setup** - Configuração automática do bucket

### Comandos Principais

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build

# Executar migrações
docker-compose exec backend npm run migrate

# Executar seed
docker-compose exec backend npm run seed
```

### Seed Inicial

O sistema cria automaticamente:

1. **Associação Padrão**
   - CNPJ: 55912593000154
   - Nome: Larparatodos
   - E-mail: larparatodos@larparatodos.com.br
   - Senha: larparatodos123
   - Status: Ativa e aprovada

2. **Usuário Administrador**
   - Nome: Dirceu Oliveira
   - E-mail: dirceu.oliveira@grupoep.com.br
   - Senha: senha123
   - Status: Admin ativo

3. **Termo de Aceite**
   - Versão: 1.0
   - Status: Ativo
   - Conteúdo completo e profissional

---

## 📊 Métricas e Analytics

### Dashboard da Associação

**Métricas Principais:**
- Receita total
- Receita do mês
- Receita hoje
- Total de usuários
- Usuários ativos
- Taxa de adimplência
- Pagamentos pendentes
- Pagamentos atrasados

**Gráficos:**
- Receita por mês (12 meses)
- Receita diária (30 dias)
- Taxa de adimplência por mês
- Crescimento de usuários
- Status de pagamentos (pizza)
- Top 10 usuários por contribuição

### Dashboard Administrativo

**Métricas Globais:**
- Total de usuários
- Total de associações
- Receita total do sistema
- Estatísticas gerais

---

## 🎨 Recursos Visuais

### Editor de Texto Rico
- React Quill integrado
- Formatação completa (negrito, itálico, cores, tamanhos)
- Inserção de links e imagens
- Listas ordenadas e não ordenadas
- Alinhamento de texto

### Upload de Imagens
- Logo da associação
- Imagem de capa
- Armazenamento em S3/MinIO
- Validação de tamanho (máx 5MB)
- Formatos aceitos: JPEG, PNG, GIF, WEBP

### Gráficos Interativos
- Recharts para visualizações
- Gráficos de linha, área, barras e pizza
- Responsivos e interativos
- Tooltips informativos

---

## 📝 Funcionalidades Especiais

### Sistema de Busca
- Busca de usuários por nome, e-mail ou CPF
- Filtros avançados por status
- Paginação de resultados

### Exportação de Dados
- Exportação de usuários para CSV
- Exportação de relatórios para CSV
- Formatação adequada para planilhas

### Validações
- CPF (formato brasileiro)
- CNPJ (formato brasileiro)
- E-mail
- Senha (mínimo 6 caracteres)
- URLs de redes sociais

### Notificações
- Toasts para feedback do usuário
- Mensagens de sucesso e erro
- Notificações de ações importantes

---

## 🔄 Fluxos Principais

### Cadastro de Usuário
1. Preenchimento do formulário
2. Seleção de associação
3. Aceite obrigatório dos termos
4. Criação da conta
5. Registro automático do aceite
6. Login automático
7. Redirecionamento para dashboard

### Cadastro de Associação
1. Preenchimento do formulário público
2. Validação de CNPJ
3. Criação da conta (aguardando aprovação)
4. Aprovação pelo administrador
5. Ativação da associação
6. Acesso ao painel

### Processo de Pagamento
1. Criação automática de pagamentos mensais
2. Notificação de vencimento
3. Registro de pagamento
4. Atualização de status
5. Cálculo de adimplência
6. Geração de relatórios

---

## 📞 Suporte e Contato

Para questões técnicas ou suporte:
- E-mail: contato@larparatodos.org.br
- Documentação: Este arquivo
- Logs: `docker-compose logs -f`

---

## 🚀 Próximas Melhorias Sugeridas

- [ ] Sistema de notificações push
- [ ] Integração com gateway de pagamento
- [ ] App mobile (React Native)
- [ ] Sistema de mensagens internas
- [ ] Calendário de eventos
- [ ] Documentos compartilhados
- [ ] Sistema de tickets de suporte
- [ ] Integração com WhatsApp Business API
- [ ] Dashboard de analytics avançado
- [ ] Exportação de relatórios em PDF

---

**Última atualização:** Janeiro de 2026  
**Versão do Sistema:** 1.0  
**Documentação mantida por:** Equipe Larparatodos

