# 🚀 Guia de Geração Automatizada de Código

Este projeto inclui um sistema completo de geração automatizada de código usando **Plop.js** que otimiza o uso de IA na criação de código, reduzindo tarefas repetitivas e garantindo consistência no padrão de código.

## 📋 Índice

- [Instalação](#instalação)
- [Comandos Disponíveis](#comandos-disponíveis)
- [Exemplos de Uso](#exemplos-de-uso)
- [Templates Disponíveis](#templates-disponíveis)
- [Estrutura Gerada](#estrutura-gerada)

## 🛠️ Instalação

O Plop já está configurado no projeto. Para começar a usar:

```bash
# Instalar dependências (se ainda não estiverem instaladas)
npm install

# Executar o gerador de código
npx plop
```

## 🎯 Comandos Disponíveis

### Comando Principal
```bash
npx plop
```

### Comandos Específicos
```bash
# Gerar componente React
npx plop component

# Gerar roteador tRPC
npx plop trpc-router

# Gerar página Next.js
npx plop page

# Gerar módulo completo
npx plop module

# Gerar hook customizado
npx plop hook

# Gerar store Zustand
npx plop store

# Gerar templates otimizados para IA
npx plop ai-template
```

## 📚 Exemplos de Uso

### 1. 🧩 Gerando um Componente React

```bash
npx plop component
```

**Exemplo de interação:**
```
? Component name: ProductCard
? Component type: UI Component (shadcn/ui style)
? Include Storybook stories? No
? Include test files? Yes
```

**Arquivos gerados:**
- `src/components/ui/product-card.tsx`
- `src/components/__tests__/product-card.test.tsx`

**Código gerado:**
```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const productCardVariants = cva(
  "product-card-base",
  {
    variants: {
      variant: {
        default: "product-card-default",
        secondary: "product-card-secondary",
        outline: "product-card-outline",
      },
      size: {
        default: "product-card-size-default",
        sm: "product-card-size-sm",
        lg: "product-card-size-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ProductCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productCardVariants> {}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(productCardVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

ProductCard.displayName = "ProductCard";

export { ProductCard, productCardVariants };
```

### 2. 🔗 Gerando um Roteador tRPC

```bash
npx plop trpc-router
```

**Exemplo de interação:**
```
? Router name: Product
? Select procedures to include: List/Get All, Get by ID, Create, Update, Delete
? Include authentication? Yes
```

**Arquivo gerado:**
- `src/trpc/routers/product.ts`

### 3. 📄 Gerando uma Página Next.js

```bash
npx plop page
```

**Exemplo de interação:**
```
? Page name: Dashboard
? Page type: Static Page
? Include custom layout? Yes
```

**Arquivos gerados:**
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/layout.tsx`

### 4. 🏗️ Gerando um Módulo Completo

```bash
npx plop module
```

**Exemplo de interação:**
```
? Module name: Product
? Select features to include: 
  ✓ tRPC Procedures
  ✓ UI Components
  ✓ Views/Pages
  ✓ Types/Schemas
  ✓ Hooks
  ✓ Stores (Zustand)
```

**Estrutura gerada:**
```
src/modules/product/
├── server/
│   └── procedures.ts
├── ui/
│   ├── components/
│   │   ├── index.ts
│   │   ├── ProductList.tsx
│   │   └── ProductForm.tsx
│   └── views/
│       └── ProductView.tsx
├── types/
│   └── index.ts
├── hooks/
│   └── useProduct.ts
└── stores/
    └── productStore.ts
```

### 5. 🎣 Gerando um Hook Customizado

```bash
npx plop hook
```

**Exemplo de interação:**
```
? Hook name (without "use" prefix): LocalStorage
? Hook type: Custom Hook
```

**Arquivo gerado:**
- `src/hooks/useLocalStorage.ts`

### 6. 🗃️ Gerando um Store Zustand

```bash
npx plop store
```

**Exemplo de interação:**
```
? Store name: Cart
? Select features to include: Persistence, DevTools, Async Actions
```

**Arquivo gerado:**
- `src/stores/cartStore.ts`

### 7. 🤖 Templates Otimizados para IA

```bash
npx plop ai-template
```

**Exemplo de interação:**
```
? Select AI template: CRUD Operations Template
? Entity name: User
```

**Estrutura gerada:**
```
src/generated/user/
├── types.ts
├── procedures.ts
└── components/
    ├── UserList.tsx
    └── UserForm.tsx
```

## 🎨 Templates Disponíveis

### 🧩 Componentes React
- **UI Component**: Componente estilo shadcn/ui com variantes
- **Feature Component**: Componente de funcionalidade
- **Layout Component**: Componente de layout
- **Page Component**: Componente de página

### 🔗 tRPC
- Operações CRUD completas
- Autenticação integrada
- Validação com Zod
- Paginação e filtros

### 📄 Páginas Next.js
- **Static Page**: Página estática
- **Dynamic Page**: Página dinâmica com parâmetros
- **API Route**: Rota de API com validação

### 🏗️ Módulos Completos
- Estrutura modular organizada
- Integração tRPC + UI + Estado
- Tipos TypeScript consistentes
- Padrões de hooks e stores

### 🤖 Templates IA-Otimizados
- **CRUD Operations**: Sistema CRUD completo
- **Form with Validation**: Formulários com validação
- **Data Table**: Tabelas de dados com filtros
- **Dashboard Layout**: Layout de dashboard
- **Authentication Flow**: Fluxo de autenticação

## 📁 Estrutura de Arquivos Gerada

### Exemplo: Módulo Product Completo

```
src/modules/product/
├── server/
│   └── procedures.ts          # tRPC procedures
├── ui/
│   ├── components/
│   │   ├── index.ts          # Exportações
│   │   ├── ProductList.tsx   # Lista com paginação
│   │   └── ProductForm.tsx   # Formulário com validação
│   └── views/
│       └── ProductView.tsx   # View principal
├── types/
│   └── index.ts              # Tipos TypeScript
├── hooks/
│   └── useProduct.ts         # Hook customizado
└── stores/
    └── productStore.ts       # Store Zustand
```

### Características do Código Gerado

#### ✅ **Padrões Consistentes**
- TypeScript strict mode
- Validação com Zod
- Componentes com forwardRef
- Props interfaces bem definidas

#### ✅ **Integração Completa**
- tRPC client/server
- React Hook Form
- Zustand para estado
- shadcn/ui components

#### ✅ **Otimizado para IA**
- Código bem estruturado e comentado
- Padrões reconhecíveis
- Modularidade clara
- Fácil de estender

#### ✅ **Pronto para Produção**
- Error handling
- Loading states
- Responsive design
- Acessibilidade

## 🚀 Fluxo de Desenvolvimento Otimizado

### 1. **Gerar Estrutura Base**
```bash
# Criar módulo completo
npx plop module
# Nome: Product
# Features: Todas
```

### 2. **Customizar Conforme Necessário**
- Editar tipos em `types/index.ts`
- Ajustar procedures em `server/procedures.ts`
- Customizar componentes UI

### 3. **Integrar com IA**
- Use o código gerado como base
- Peça para IA estender funcionalidades
- Mantenha padrões consistentes

### 4. **Exemplo de Prompt para IA**
```
"Baseado no código gerado em src/modules/product/, adicione funcionalidade de:
- Upload de imagens para produtos
- Sistema de categorias
- Filtros avançados por preço e categoria
- Mantenha os padrões existentes de TypeScript, tRPC e componentes"
```

## 🎯 Benefícios

### ⚡ **Velocidade de Desenvolvimento**
- Reduz 80% do tempo de setup inicial
- Elimina código boilerplate repetitivo
- Padrões pré-definidos e testados

### 🎨 **Consistência**
- Mesma estrutura em todos os módulos
- Nomenclatura padronizada
- Arquitetura consistente

### 🤖 **Otimização para IA**
- Código estruturado e previsível
- Padrões reconhecíveis por IA
- Fácil de estender e modificar

### 🛡️ **Qualidade**
- TypeScript strict
- Validação automática
- Testes incluídos
- Error handling

## 🔧 Personalização

### Modificar Templates

Os templates estão em `plop-templates/`. Para customizar:

1. **Editar template existente:**
```bash
# Editar template de componente
vim plop-templates/component/component.hbs
```

2. **Adicionar novo template:**
```bash
# Criar novo template
mkdir plop-templates/my-template
touch plop-templates/my-template/template.hbs
```

3. **Atualizar plopfile.js:**
```javascript
// Adicionar novo gerador
plop.setGenerator('my-generator', {
  description: 'Meu gerador customizado',
  prompts: [...],
  actions: [...]
});
```

### Exemplo: Template Customizado

```handlebars
{{!-- plop-templates/api-client/client.hbs --}}
import { createApi } from '@/lib/api';

export interface {{pascalCase name}}Client {
  list(): Promise<{{pascalCase name}}[]>;
  getById(id: string): Promise<{{pascalCase name}}>;
  create(data: Create{{pascalCase name}}Input): Promise<{{pascalCase name}}>;
  update(id: string, data: Update{{pascalCase name}}Input): Promise<{{pascalCase name}}>;
  delete(id: string): Promise<void>;
}

export const {{camelCase name}}Client: {{pascalCase name}}Client = {
  list: () => createApi().get('/{{kebabCase name}}s'),
  getById: (id) => createApi().get(`/{{kebabCase name}}s/${id}`),
  create: (data) => createApi().post('/{{kebabCase name}}s', data),
  update: (id, data) => createApi().put(`/{{kebabCase name}}s/${id}`, data),
  delete: (id) => createApi().delete(`/{{kebabCase name}}s/${id}`),
};
```

## 📈 Próximos Passos

1. **Execute os exemplos acima**
2. **Explore os templates gerados**
3. **Customize conforme suas necessidades**
4. **Use IA para estender funcionalidades**
5. **Compartilhe padrões com o time**

---

**💡 Dica:** Combine este sistema com ferramentas de IA como GitHub Copilot ou Claude para maximizar a produtividade. O código gerado fornece uma base sólida que a IA pode facilmente entender e estender!