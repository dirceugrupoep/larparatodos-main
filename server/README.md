# Backend - Lar Para Todos

## Estrutura

- `src/index.js` - Servidor principal
- `src/database/` - Conexão e migrações do banco
- `src/routes/` - Rotas da API
- `src/middleware/` - Middlewares (autenticação, etc)

## Como usar

### Desenvolvimento

O backend roda automaticamente com o Docker Compose. As migrações são executadas automaticamente na inicialização.

### Migrações

Para rodar as migrações manualmente:

```bash
npm run migrate
```

## Endpoints da API

### Autenticação

- `POST /api/auth/register` - Cadastrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter usuário atual

### Contatos

- `POST /api/contact` - Criar contato
- `GET /api/contact` - Listar contatos (protegido)

### Dashboard

- `GET /api/dashboard/stats` - Estatísticas (protegido)
- `GET /api/dashboard/recent-contacts` - Contatos recentes (protegido)

## Variáveis de Ambiente

Criar arquivo `.env` na pasta `server/`:

```
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=larparatodos
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:8080
```

