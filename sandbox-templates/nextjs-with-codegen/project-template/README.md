# 🚀 Crazy Code Project

Seu projeto foi criado com um **sistema completo de geração automatizada de código** que otimiza o uso de IA e acelera o desenvolvimento em 10x!

## ⚡ Quick Start

```bash
# Gerar código automaticamente
npm run generate

# Comandos específicos
npm run gen:module      # Módulo completo
npm run gen:component   # Componente React
npm run gen:page        # Página Next.js
npm run gen:trpc        # Router tRPC
npm run gen:hook        # Hook customizado
npm run gen:store       # Store Zustand
npm run gen:ai          # Templates IA-otimizados
```

## 🎯 Fluxo de Desenvolvimento

### 1. **Gere a estrutura base (5 min)**
```bash
npm run gen:module
# Nome: Product
# Features: Todas
```

### 2. **Use IA para estender (15 min)**
```prompt
"Baseado no código gerado em src/modules/product/, 
adicione funcionalidade de upload de imagens e sistema 
de categorias, mantendo os padrões existentes"
```

### 3. **Resultado**: Sistema completo em 20 minutos! 🎉

## 📋 Comandos Disponíveis

### Desenvolvimento
```bash
npm run dev          # Iniciar servidor desenvolvimento
npm run build        # Build para produção
npm run start        # Iniciar servidor produção
npm run lint         # Linter ESLint
```

### Geração de Código
```bash
npm run generate     # Menu interativo principal
npm run gen:component # Gerar componente React
npm run gen:page     # Gerar página Next.js
npm run gen:module   # Gerar módulo completo
npm run gen:trpc     # Gerar router tRPC
npm run gen:hook     # Gerar hook customizado
npm run gen:store    # Gerar store Zustand
npm run gen:ai       # Templates IA-otimizados
```

### Banco de Dados (se usando Prisma)
```bash
npm run db:push      # Aplicar schema ao banco
npm run db:studio    # Abrir Prisma Studio
npm run db:generate  # Gerar cliente Prisma
npm run db:migrate   # Criar migration
npm run db:reset     # Reset do banco
```

## 🎨 Templates Disponíveis

### 🧩 Componentes React
- **UI Components**: Estilo shadcn/ui com variantes
- **Feature Components**: Componentes de funcionalidade
- **Layout Components**: Componentes de layout
- **Testes automáticos**: Jest/Vitest incluídos

### 🔗 tRPC Routers
- **CRUD completo**: Create, Read, Update, Delete
- **Validação Zod**: Schemas automáticos
- **Autenticação**: Suporte a auth integrado
- **Paginação**: Cursor-based pagination

### 📄 Páginas Next.js
- **Páginas estáticas**: SSG otimizado
- **Páginas dinâmicas**: [id] routes
- **API Routes**: Endpoints com validação
- **Layouts customizados**: Layouts específicos

### 🏗️ Módulos Completos
- **Estrutura organizada**: server + UI + estado
- **Tipos TypeScript**: Schemas e interfaces
- **Hooks customizados**: Lógica reutilizável
- **Stores Zustand**: Estado global

### 🤖 Templates IA-Otimizados
- **CRUD avançado**: Operações completas
- **Formulários**: Validação e UX
- **Tabelas de dados**: Filtros e ordenação
- **Dashboard**: Layouts e componentes

## 🎯 Exemplos de Uso

### E-commerce Completo
```bash
npm run gen:module   # Product
npm run gen:module   # Category
npm run gen:module   # Cart
npm run gen:page     # Checkout
# = Sistema e-commerce em 30 minutos
```

### Dashboard Analytics
```bash
npm run gen:ai       # Dashboard Layout
npm run gen:module   # Analytics
npm run gen:module   # Reports
npm run gen:component # Charts
# = Dashboard completo em 25 minutos
```

### Sistema CRM
```bash
npm run gen:module   # Customer
npm run gen:module   # Lead
npm run gen:module   # Contact
npm run gen:page     # Pipeline
# = Base CRM em 35 minutos
```

## 🔄 Integrando com IA

### Prompts Eficazes

```prompt
✅ BOM:
"Baseado no código gerado em src/modules/product/, 
adicione sistema de reviews com rating de 1-5 estrelas, 
mantendo os padrões existentes de TypeScript e tRPC"

❌ RUIM:
"Crie um sistema de reviews do zero"
```

### Estratégia de Desenvolvimento

1. **Gere a base** com templates automáticos
2. **Estenda** funcionalidades com IA
3. **Refine** iterativamente
4. **Documente** padrões para o time

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
├── components/             # Componentes React
│   └── ui/                # Componentes shadcn/ui
├── modules/               # Módulos de funcionalidade
│   └── [entity]/
│       ├── server/        # tRPC procedures
│       ├── ui/           # Components & views
│       ├── types/        # TypeScript types
│       ├── hooks/        # Custom hooks
│       └── stores/       # Zustand stores
├── lib/                  # Utilitários
├── trpc/                 # Configuração tRPC
├── stores/               # Stores globais
├── hooks/                # Hooks globais
├── types/                # Tipos globais
└── generated/            # Código IA-otimizado
```

## 🚀 Stack Tecnológica

- **Framework**: Next.js 15 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query
- **API**: tRPC + Zod validation
- **Database**: Prisma (opcional)
- **Auth**: Clerk (opcional)
- **Code Gen**: Plop.js + Templates

## 📈 Benefícios

- ⚡ **95% redução** no tempo de setup
- 🎨 **100% consistência** de código
- 🤖 **Otimizado para IA** entender e estender
- 🛡️ **Qualidade garantida** com TypeScript
- 📱 **Responsivo** por padrão
- ♿ **Acessível** seguindo padrões

## 🎉 Próximos Passos

1. Execute `npm run generate` para começar
2. Crie seu primeiro módulo com `npm run gen:module`
3. Use IA para estender funcionalidades
4. Explore os templates disponíveis
5. Customize conforme necessário

---

**💡 Dica**: Este projeto foi criado para maximizar sua produtividade. O código gerado automaticamente fornece uma base sólida que a IA pode facilmente entender e estender. Comece com os templates e use IA para adicionar funcionalidades específicas!