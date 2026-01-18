# 🔄 Como Atualizar o Repositório Git

## 📌 Repositório Público
**URL:** https://github.com/dirceugrupoep/larparatodos.git

## 🎯 Objetivo
Enviar todas as melhorias e arquivos de deploy para o GitHub.

---

## ✅ OPÇÃO 1: Usar GitHub Desktop (Mais Fácil)

### 1. Baixar e Instalar GitHub Desktop
- Acesse: https://desktop.github.com/
- Baixe e instale o GitHub Desktop
- Faça login com sua conta GitHub

### 2. Adicionar o Repositório Local
1. Abra o GitHub Desktop
2. Clique em **File** → **Add Local Repository**
3. Navegue até `C:\projetos\larparatodos\larparatodos-main`
4. Clique em **Add Repository**

### 3. Verificar Mudanças
- O GitHub Desktop mostrará todos os arquivos modificados/novos
- Você deve ver:
  - ✅ DEPLOY.md (novo)
  - ✅ DEPLOY_BRAVULINK.md (novo)
  - ✅ DEPLOY_RESUMO.txt (novo)
  - ✅ DIFERENCAS_PROD.md (novo)
  - ✅ docker-compose.prod.yml (novo)
  - ✅ Dockerfile.prod (modificado)
  - ✅ server/Dockerfile.prod (novo)
  - ✅ .env.example (novo)
  - ✅ README.md (modificado)
  - ✅ GUIA_RAPIDO.md (modificado)
  - ✅ .gitignore (modificado)
  - E outros arquivos...

### 4. Fazer Commit
1. No campo **Summary**, digite:
   ```
   Deploy em produção: Sistema simplificado e otimizado
   ```

2. No campo **Description**, digite:
   ```
   - Criado docker-compose.prod.yml unificado
   - Dockerfiles otimizados para produção
   - Documentação completa de deploy (DEPLOY.md, DEPLOY_BRAVULINK.md)
   - Frontend com Nginx (build estático)
   - Backend otimizado (apenas deps de produção)
   - Segurança: variáveis em .env
   - Guias completos para Bravulink
   - README atualizado
   - Sistema 100% pronto para produção
   ```

3. Clique em **Commit to main**

### 5. Fazer Push
1. Clique em **Push origin** (botão azul no topo)
2. Aguarde o upload
3. ✅ Pronto! Verifique em: https://github.com/dirceugrupoep/larparatodos

---

## ✅ OPÇÃO 2: Usar Git Bash (Linha de Comando)

### 1. Instalar Git
- Baixe em: https://git-scm.com/download/win
- Instale com as opções padrão
- Reinicie o terminal

### 2. Configurar Git (Primeira vez)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### 3. Navegar até o Diretório
```bash
cd C:\projetos\larparatodos\larparatodos-main
```

### 4. Verificar Status
```bash
git status
```

### 5. Adicionar Todos os Arquivos
```bash
git add .
```

### 6. Fazer Commit
```bash
git commit -m "Deploy em produção: Sistema simplificado e otimizado

- Criado docker-compose.prod.yml unificado
- Dockerfiles otimizados para produção
- Documentação completa de deploy
- Frontend com Nginx (build estático)
- Backend otimizado (apenas deps de produção)
- Segurança: variáveis em .env
- Guias completos para Bravulink
- Sistema 100% pronto para produção"
```

### 7. Verificar Remote
```bash
git remote -v
```

Se não mostrar o repositório, adicione:
```bash
git remote add origin https://github.com/dirceugrupoep/larparatodos.git
```

### 8. Fazer Push
```bash
git push -u origin main
```

Se pedir credenciais:
- Usuário: seu username do GitHub
- Senha: use um **Personal Access Token** (não a senha comum)

**Como criar Personal Access Token:**
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Selecione: `repo` (full control)
5. Copie o token e use como senha

---

## ✅ OPÇÃO 3: Upload Manual pelo GitHub

### 1. Acessar o Repositório
- Vá em: https://github.com/dirceugrupoep/larparatodos

### 2. Para Cada Arquivo Novo/Modificado:

#### Arquivos Novos:
1. Clique em **Add file** → **Upload files**
2. Arraste os arquivos:
   - `DEPLOY.md`
   - `DEPLOY_BRAVULINK.md`
   - `DEPLOY_RESUMO.txt`
   - `DIFERENCAS_PROD.md`
   - `docker-compose.prod.yml`
   - `server/Dockerfile.prod`
   - `.env.example`
   - `COMO_ATUALIZAR_GIT.md` (este arquivo)

3. No campo commit, escreva:
   ```
   Adicionando arquivos de deploy e documentação
   ```

4. Clique em **Commit changes**

#### Arquivos Modificados:
1. Navegue até o arquivo (ex: `README.md`)
2. Clique no ícone de lápis (Edit)
3. Copie todo o conteúdo novo do seu arquivo local
4. Cole substituindo o conteúdo antigo
5. Clique em **Commit changes**

---

## 📋 Checklist de Arquivos a Enviar

### Novos Arquivos:
- [ ] `DEPLOY.md` - Guia completo de deploy
- [ ] `DEPLOY_BRAVULINK.md` - Guia específico Bravulink
- [ ] `DEPLOY_RESUMO.txt` - Resumo visual
- [ ] `DIFERENCAS_PROD.md` - Explicação das mudanças
- [ ] `docker-compose.prod.yml` - Docker Compose de produção
- [ ] `server/Dockerfile.prod` - Dockerfile backend
- [ ] `.env.example` - Template de variáveis
- [ ] `COMO_ATUALIZAR_GIT.md` - Este guia

### Arquivos Modificados:
- [ ] `Dockerfile.prod` - Frontend otimizado
- [ ] `README.md` - Atualizado com instruções de deploy
- [ ] `GUIA_RAPIDO.md` - Adicionado comandos de produção
- [ ] `.gitignore` - Adicionado .env e outros

### Arquivos Não Devem Ser Enviados:
- ❌ `.env` (contém senhas!)
- ❌ `node_modules/`
- ❌ `dist/`
- ❌ Backups (*.sql)

---

## ✅ Verificar se Funcionou

1. Acesse: https://github.com/dirceugrupoep/larparatodos
2. Verifique se os arquivos novos estão lá:
   - `DEPLOY.md`
   - `DEPLOY_BRAVULINK.md`
   - `docker-compose.prod.yml`
   - etc.

3. Leia o `README.md` no GitHub para confirmar que está atualizado

---

## 🎯 Próximos Passos Após Atualizar

1. ✅ Código atualizado no GitHub
2. ✅ Fazer deploy no Bravulink (seguir `DEPLOY_BRAVULINK.md`)
3. ✅ Testar o sistema em produção

---

## 🆘 Problemas Comuns

### "Permission denied" ao fazer push
**Solução:** Use Personal Access Token em vez de senha

### "Repository not found"
**Solução:** Verifique se você tem acesso ao repositório

### "Failed to push"
**Solução:** Faça `git pull origin main` primeiro, depois `git push`

### Git não reconhecido no PowerShell
**Solução:** Use GitHub Desktop ou instale Git e reinicie o terminal

---

## 📞 Dúvidas?

- **GitHub Desktop:** https://docs.github.com/pt/desktop
- **Git Comandos:** https://git-scm.com/doc
- **Personal Access Token:** https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

---

## ✅ Conclusão

Escolha a **OPÇÃO 1 (GitHub Desktop)** se você não tem experiência com Git - é a mais fácil e visual!

Após enviar tudo para o GitHub, o sistema estará pronto para deploy no Bravulink! 🚀

