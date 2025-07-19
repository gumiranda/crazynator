This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🤝 Como Contribuir com o Projeto

### 1. Fork do Repositório
1. Acesse o repositório no GitHub
2. Clique no botão "Fork" no canto superior direito
3. Escolha sua conta pessoal para criar o fork

### 2. Clone do seu Fork
```bash
# Clone seu fork (substitua SEU_USUARIO pelo seu username do GitHub)
git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git
cd NOME_DO_REPO

# Adicione o repositório original como upstream
git remote add upstream https://github.com/gumiranda/c.git

# Verifique os remotes configurados
git remote -v
```

### 3. Configuração do Ambiente
```bash
# Instale as dependências
npm install

# Copie o arquivo de exemplo de variáveis de ambiente
cp env-example.txt .env.local

# Configure suas variáveis de ambiente no arquivo .env.local
```

### 4. Workflow de Desenvolvimento

#### Criar uma nova feature/fix:
```bash
# Sincronize com o repositório original
git fetch upstream
git checkout main
git merge upstream/main

# Crie uma nova branch para sua feature
git checkout -b feature/nome-da-sua-feature
# ou para correções
git checkout -b fix/descricao-do-bug
```

#### Fazendo commits:
```bash
# Adicione os arquivos modificados
git add .

# Faça commit com mensagem descritiva
git commit -m "feat: adiciona nova funcionalidade X"
# ou
git commit -m "fix: corrige problema Y"
# ou
git commit -m "docs: atualiza documentação Z"
```

#### Convenção de Commits:
- `feat:` para novas funcionalidades
- `fix:` para correções de bugs
- `docs:` para documentação
- `style:` para formatação (sem mudança de lógica)
- `refactor:` para refatoração de código
- `test:` para testes
- `chore:` para tarefas de manutenção

### 5. Criando Pull Request

```bash
# Envie sua branch para seu fork
git push origin feature/nome-da-sua-feature

# No GitHub:
# 1. Vá para seu fork
# 2. Clique em "Compare & pull request"
# 3. Preencha o template de PR
# 4. Aguarde review
```

### 6. Mantendo seu Fork Atualizado
```bash
# Regularmente sincronize com o repositório original
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linting
npm run lint:fix     # Corrige problemas de lint automaticamente
npm run format       # Formata código com Prettier
npm run type-check   # Verifica tipos TypeScript
```

## 📁 Estrutura do Projeto

```
├── src/
│   ├── app/         # App Router (Next.js 13+)
│   ├── components/  # Componentes reutilizáveis
│   ├── lib/         # Utilitários e configurações
│   └── styles/      # Estilos globais
├── public/          # Arquivos estáticos
├── prisma/          # Schema e migrações do banco
└── docs/            # Documentação adicional
```

## 🛠️ Tecnologias Utilizadas

- **Framework:** Next.js 14
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Banco de Dados:** Prisma
- **Linting:** ESLint
- **Formatação:** Prettier

## 📝 Reportando Issues

Ao reportar um bug ou solicitar uma feature:

1. Use os templates de issue disponíveis
2. Forneça informações detalhadas
3. Inclua steps para reproduzir (se for bug)
4. Adicione screenshots se relevante

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
