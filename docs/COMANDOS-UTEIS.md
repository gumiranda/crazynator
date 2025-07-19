# 📖 Comandos Úteis para Desenvolvimento

Este documento contém comandos Git e npm frequentemente utilizados no desenvolvimento do projeto.

## 🔧 Comandos npm/yarn

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar servidor de produção
npm run start

# Executar linting
npm run lint

# Corrigir problemas de lint automaticamente
npm run lint:fix

# Formatar código
npm run format

# Verificar formatação
npm run format:check

# Verificar tipos TypeScript
npm run type-check
```

### Prisma (Banco de Dados)
```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar migrações
npx prisma migrate dev

# Reset do banco
npx prisma migrate reset

# Visualizar banco de dados
npx prisma studio

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Deploy de migrações para produção
npx prisma migrate deploy
```

## 🌿 Comandos Git

### Configuração Inicial
```bash
# Configurar nome e email
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"

# Configurar editor padrão
git config --global core.editor "code --wait"

# Configurar quebras de linha (Unix/Linux/Mac)
git config --global core.autocrlf input

# Configurar quebras de linha (Windows)
git config --global core.autocrlf true
```

### Clonagem e Configuração
```bash
# Clonar repositório
git clone https://github.com/usuario/repositorio.git

# Adicionar upstream (repositório original)
git remote add upstream https://github.com/gumiranda/c.git

# Verificar remotes
git remote -v

# Buscar atualizações do upstream
git fetch upstream
```

### Workflow Básico
```bash
# Verificar status
git status

# Verificar diferenças
git diff

# Adicionar arquivos específicos
git add arquivo.ts

# Adicionar todos os arquivos
git add .

# Commit com mensagem
git commit -m "feat: adiciona nova funcionalidade"

# Push para origin (seu fork)
git push origin nome-da-branch

# Pull/fetch do upstream
git pull upstream main
```

### Gerenciamento de Branches
```bash
# Listar branches
git branch

# Listar branches remotas
git branch -r

# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Trocar de branch
git checkout main

# Criar branch a partir de outra
git checkout -b feature/nova-funcionalidade main

# Deletar branch local
git branch -d nome-da-branch

# Deletar branch remota
git push origin --delete nome-da-branch
```

### Sincronização com Upstream
```bash
# Buscar mudanças do upstream
git fetch upstream

# Mergear mudanças do upstream na main local
git checkout main
git merge upstream/main

# Rebase sua branch com a main atualizada
git checkout feature/sua-branch
git rebase main

# Push da main atualizada para seu fork
git push origin main
```

### Resolução de Conflitos
```bash
# Ver arquivos com conflito
git status

# Após resolver conflitos manualmente
git add .
git commit

# Abortar merge em caso de problemas
git merge --abort

# Abortar rebase em caso de problemas
git rebase --abort

# Continuar rebase após resolver conflitos
git add .
git rebase --continue
```

### Comandos Avançados
```bash
# Ver histórico de commits
git log --oneline

# Ver histórico com gráfico
git log --graph --oneline --all

# Desfazer último commit (mantendo mudanças)
git reset --soft HEAD~1

# Desfazer último commit (removendo mudanças)
git reset --hard HEAD~1

# Stash (salvar mudanças temporariamente)
git stash

# Aplicar stash
git stash pop

# Listar stashes
git stash list

# Alterar mensagem do último commit
git commit --amend -m "nova mensagem"

# Cherry-pick (aplicar commit específico)
git cherry-pick hash-do-commit
```

### Limpeza e Manutenção
```bash
# Limpar branches que não existem mais no remote
git remote prune origin

# Ver tamanho do repositório
git count-objects -vH

# Limpar cache e otimizar
git gc --aggressive --prune=now

# Ver arquivos ignorados
git ls-files --others --ignored --exclude-standard
```

## 🔍 Comandos de Inspeção

### Verificar Informações
```bash
# Ver configurações do Git
git config --list

# Ver remote URLs
git remote get-url origin
git remote get-url upstream

# Ver última tag
git describe --tags --abbrev=0

# Ver diferença entre branches
git diff main..feature/sua-branch

# Ver arquivos modificados entre commits
git diff --name-only HEAD~1 HEAD

# Ver estatísticas de contribuição
git shortlog -sn

# Ver quem modificou cada linha
git blame arquivo.ts
```

### Debug e Troubleshooting
```bash
# Ver reflog (histórico de operações)
git reflog

# Ver commit específico
git show hash-do-commit

# Encontrar commit que introduziu bug
git bisect start
git bisect bad HEAD
git bisect good hash-do-commit-bom

# Verificar integridade do repositório
git fsck
```

## 📝 Aliases Úteis

Adicione estes aliases ao seu `.gitconfig`:

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
git config --global alias.amend 'commit --amend --no-edit'
git config --global alias.force 'push --force-with-lease'
```

## 🚨 Comandos de Emergência

```bash
# Recuperar arquivo deletado
git checkout HEAD -- arquivo.ts

# Recuperar commit deletado (usando reflog)
git reflog
git checkout hash-do-commit

# Desfazer push (CUIDADO!)
git push --force-with-lease origin main

# Limpar mudanças locais
git checkout .
git clean -fd

# Reset completo para estado do remote
git fetch origin
git reset --hard origin/main
```

---

💡 **Dica**: Use `git help <comando>` para ver a documentação completa de qualquer comando Git.