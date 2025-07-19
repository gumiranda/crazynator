# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para este projeto! Este documento contém diretrizes para ajudar você a contribuir de forma efetiva.

## 📋 Sumário

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Diretrizes de Código](#diretrizes-de-código)
- [Processo de Review](#processo-de-review)

## 📜 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você deve honrar este código.

### Nossos Padrões

- Usar linguagem acolhedora e inclusiva
- Respeitar diferentes pontos de vista e experiências
- Aceitar críticas construtivas graciosamente
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros da comunidade

## 🚀 Como Posso Contribuir?

### Reportando Bugs

- Use o template de bug report
- Pesquise issues existentes antes de criar uma nova
- Inclua informações detalhadas sobre o ambiente
- Forneça passos claros para reproduzir

### Sugerindo Melhorias

- Use o template de feature request
- Explique claramente o problema que a feature resolve
- Descreva a solução proposta
- Considere implementações alternativas

### Contribuindo com Código

1. Fork o repositório
2. Crie uma branch para sua feature/fix
3. Implemente suas mudanças
4. Adicione/atualize testes se necessário
5. Atualize documentação se necessário
6. Abra um Pull Request

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- Node.js (18.x ou superior)
- npm ou yarn
- Git

### Configuração Local

```bash
# Clone seu fork
git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git
cd NOME_DO_REPO

# Adicione o upstream
git remote add upstream https://github.com/gumiranda/c.git

# Instale dependências
npm install

# Configure ambiente
cp env-example.txt .env.local

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🔄 Processo de Desenvolvimento

### Workflow Git

```bash
# Sincronize com upstream
git fetch upstream
git checkout main
git merge upstream/main

# Crie nova branch
git checkout -b feature/nome-da-feature

# Trabalhe na sua feature
# ... faça suas mudanças ...

# Commit suas mudanças
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Push para seu fork
git push origin feature/nome-da-feature

# Abra Pull Request no GitHub
```

### Convenções de Branch

- `feature/nome-da-feature` - Novas funcionalidades
- `fix/descricao-do-bug` - Correções de bugs
- `docs/descricao` - Atualizações de documentação
- `refactor/descricao` - Refatorações
- `test/descricao` - Adição/melhoria de testes

### Convenções de Commit

Utilizamos [Conventional Commits](https://conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Exemplos:**
```
feat: adiciona autenticação com OAuth
fix: corrige erro de validação no formulário
docs: atualiza README com instruções de deploy
```

## 📏 Diretrizes de Código

### TypeScript

- Use tipos explícitos sempre que possível
- Evite `any` - prefira `unknown` quando necessário
- Use interfaces para objetos complexos
- Documente tipos complexos com comentários

### React/Next.js

- Use componentes funcionais com hooks
- Prefira composição sobre herança
- Mantenha componentes pequenos e focados
- Use TypeScript Props interfaces

### Estilização

- Use Tailwind CSS para estilização
- Mantenha classes organizadas
- Use variáveis CSS para valores repetidos
- Siga padrões de responsividade

### Estrutura de Arquivos

```
src/
├── app/              # App Router
│   ├── (dashboard)/  # Route groups
│   └── api/         # API routes
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Componentes base
│   └── forms/       # Componentes de formulário
├── lib/             # Utilitários
├── hooks/           # Custom hooks
└── types/           # Definições de tipos
```

### Performance

- Use `React.memo` para componentes pesados
- Implemente lazy loading para rotas
- Otimize imagens com next/image
- Use cache quando apropriado

## 🔍 Processo de Review

### Checklist para Pull Requests

- [ ] Código segue padrões do projeto
- [ ] Testes passam localmente
- [ ] Documentação atualizada
- [ ] Sem conflitos de merge
- [ ] Descrição clara das mudanças
- [ ] Issues relacionadas referenciadas

### Critérios de Aceitação

1. **Funcionalidade**: A feature funciona conforme especificado
2. **Qualidade**: Código limpo e bem estruturado
3. **Testes**: Cobertura adequada de testes
4. **Performance**: Não introduz regressões
5. **Compatibilidade**: Funciona em diferentes ambientes
6. **Documentação**: Mudanças documentadas adequadamente

### Processo de Review

1. **Review Automático**: CI executa testes e linting
2. **Review Manual**: Maintainers revisam o código
3. **Feedback**: Discussão e sugestões de melhorias
4. **Aprovação**: Merge após aprovações necessárias

## 🎯 Dicas para Contribuidores

### Primeiras Contribuições

- Comece com issues marcadas como "good first issue"
- Leia código existente para entender padrões
- Faça perguntas se não entender algo
- Mantenha PRs pequenos e focados

### Melhores Práticas

- Teste suas mudanças localmente
- Escreva mensagens de commit descritivas
- Mantenha PRs atualizados com a branch main
- Responda feedbacks prontamente
- Seja respeitoso nas discussões

## 📞 Precisa de Ajuda?

- Abra uma issue com label "question"
- Entre em contato com os maintainers
- Consulte a documentação do projeto
- Verifique discussions no GitHub

---

Obrigado por contribuir! 🙏