# Painel Administrativo - Lar Para Todos

## 🎯 Funcionalidades do Painel Admin

### Dashboard Administrativo (`/admin`)
- **Métricas de Usuários**: Total, ativos, inativos, novos hoje/mês, administradores
- **Métricas de Receita**: Receita do dia, do mês e total
- **Métricas de Pagamentos**: Total, pagos, pendentes, em atraso, ticket médio
- **Status de Adimplência**: Quantidade de adimplentes e inadimplentes
- **Métricas de Contatos**: Total, hoje e do mês
- **Tendências**: Gráficos de pagamentos e receita por mês

### Gestão de Usuários (`/admin/users`)
- **Listagem completa** com paginação
- **Busca** por nome, email ou CPF
- **Filtros** por status (ativo/inativo)
- **Edição** de dados do usuário
- **Ativar/Desativar** contas
- **Resetar senha** de qualquer usuário
- **Promover a admin** ou remover permissões
- **Visualização** de pagamentos e histórico

### Relatórios (`/admin/reports`)
- **Relatório de Pagamentos**: Por período (data inicial e final)
- **Relatório de Inadimplência**: Lista de usuários com pagamentos em atraso
- **Exportação CSV**: Todos os relatórios podem ser exportados

## 🔐 Como Criar o Primeiro Administrador

### Opção 1: Via Script (Recomendado)

1. Entre no container do backend:
```bash
docker exec -it larparatodos-backend sh
```

2. Execute o script:
```bash
npm run create-admin seu@email.com senha123
```

Ou se já tiver um usuário cadastrado, apenas promove a admin:
```bash
npm run create-admin seu@email.com
```

### Opção 2: Via SQL Direto

1. Entre no container do PostgreSQL:
```bash
docker exec -it larparatodos-postgres psql -U postgres -d larparatodos
```

2. Execute:
```sql
-- Para criar novo admin
INSERT INTO users (name, email, password, is_admin, is_active)
VALUES ('Admin', 'admin@larparatodos.com', '$2a$10$...', true, true);

-- Ou promover usuário existente
UPDATE users SET is_admin = true WHERE email = 'seu@email.com';
```

### Opção 3: Via API (após ter um admin)

Um admin pode promover outros usuários através do painel `/admin/users`.

## 📊 Métricas Disponíveis

### Usuários
- Total de usuários cadastrados
- Usuários ativos vs inativos
- Novos cadastros (hoje e mês)
- Total de administradores

### Receita
- Receita do dia (pagamentos confirmados hoje)
- Receita do mês atual
- Receita total acumulada
- Ticket médio de pagamento

### Pagamentos
- Total de pagamentos registrados
- Pagamentos pagos
- Pagamentos pendentes
- Pagamentos em atraso
- Taxa de adimplência

### Contatos
- Total de formulários de interesse
- Contatos recebidos hoje
- Contatos do mês

## 🛠️ Funcionalidades de Gestão

### Editar Usuário
- Alterar nome, email, telefone
- Ativar/desativar conta
- Promover/remover permissões de admin

### Resetar Senha
- Definir nova senha para qualquer usuário
- Útil para recuperação de acesso

### Ativar/Desativar
- Desativar contas temporariamente
- Reativar quando necessário

## 📈 Relatórios

### Relatório de Pagamentos
- Filtro por período (data inicial e final)
- Mostra todos os pagamentos com detalhes
- Exportação em CSV

### Relatório de Inadimplência
- Lista usuários com pagamentos em atraso
- Mostra quantidade e valor total em atraso
- Exportação em CSV

## 🔒 Segurança

- Todas as rotas administrativas requerem autenticação
- Verificação de permissão de admin em todas as requisições
- Contas desativadas não podem fazer login
- Senhas nunca são retornadas nas respostas

## 🚀 Acesso

Após criar um admin, acesse:
- **Dashboard Admin**: `http://localhost:8080/admin`
- **Gestão de Usuários**: `http://localhost:8080/admin/users`
- **Relatórios**: `http://localhost:8080/admin/reports`

O link para o painel admin aparece automaticamente no dashboard do usuário se ele for admin.

