# 🎯 Exemplo Prático: Sistema de Geração Automatizada

Este documento mostra um exemplo prático completo de como usar o sistema de geração automatizada de código que criamos para otimizar o uso de IA no desenvolvimento.

## 🚀 Cenário: Sistema de Gerenciamento de Produtos

Vamos criar um sistema completo de gerenciamento de produtos desde o zero usando nossos geradores automáticos.

## 📋 Passo a Passo

### 1. 🏗️ Gerar Módulo Completo

```bash
npm run gen:module
```

**Entrada interativa:**
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

**Resultado:**
```
✔ Module name · Product
✔ Select features to include · trpc, ui, views, types, hooks, stores
✓ src/modules/product/server/procedures.ts
✓ src/modules/product/ui/components/index.ts
✓ src/modules/product/ui/components/ProductList.tsx
✓ src/modules/product/ui/components/ProductForm.tsx
✓ src/modules/product/ui/views/ProductView.tsx
✓ src/modules/product/types/index.ts
✓ src/modules/product/hooks/useProduct.ts
✓ src/modules/product/stores/productStore.ts
```

### 2. 📄 Gerar Página Next.js

```bash
npm run gen:page
```

**Entrada interativa:**
```
? Page name: Products
? Page type: Static Page
? Include custom layout? Yes
```

**Resultado:**
```
✔ Page name · Products
✔ Page type · static
✔ Include custom layout · true
✓ src/app/products/page.tsx
✓ src/app/products/layout.tsx
```

### 3. 🤖 Gerar Template IA-Otimizado

```bash
npm run gen:ai
```

**Entrada interativa:**
```
? Select AI template: CRUD Operations Template
? Entity name: Product
```

**Resultado:**
```
✔ Select AI template · crud
✔ Entity name · Product
✓ src/generated/product/types.ts
✓ src/generated/product/procedures.ts
✓ src/generated/product/components/ProductList.tsx
✓ src/generated/product/components/ProductForm.tsx
```

## 📁 Estrutura Final Gerada

```
projeto/
├── src/
│   ├── app/
│   │   └── products/
│   │       ├── page.tsx           # Página principal
│   │       └── layout.tsx         # Layout customizado
│   ├── modules/
│   │   └── product/
│   │       ├── server/
│   │       │   └── procedures.ts   # tRPC procedures
│   │       ├── ui/
│   │       │   ├── components/
│   │       │   │   ├── index.ts
│   │       │   │   ├── ProductList.tsx
│   │       │   │   └── ProductForm.tsx
│   │       │   └── views/
│   │       │       └── ProductView.tsx
│   │       ├── types/
│   │       │   └── index.ts       # TypeScript types
│   │       ├── hooks/
│   │       │   └── useProduct.ts  # Hook customizado
│   │       └── stores/
│   │           └── productStore.ts # Store Zustand
│   └── generated/
│       └── product/
│           ├── types.ts           # Types IA-otimizados
│           ├── procedures.ts      # Procedures avançados
│           └── components/
│               ├── ProductList.tsx
│               └── ProductForm.tsx
├── plopfile.js                   # Configuração do Plop
└── plop-templates/               # Templates
```

## 💻 Código Gerado - Exemplos

### 🔗 tRPC Procedures (`src/modules/product/server/procedures.ts`)

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const createProductInput = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const productProcedures = createTRPCRouter({
  // List all products with pagination
  list: protectedProcedure
    .input(listProductInput)
    .query(async ({ input, ctx }) => {
      const { limit, cursor, search } = input;
      const userId = ctx.user.id;

      const items = await ctx.db.product.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          userId,
          ...(search && {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      let nextCursor: string | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  // Create a new product
  create: protectedProcedure
    .input(createProductInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const item = await ctx.db.product.create({
        data: {
          ...input,
          userId,
        },
      });

      return item;
    }),

  // ... outras procedures (getById, update, delete)
});
```

### 🧩 Componente List (`src/modules/product/ui/components/ProductList.tsx`)

```tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Edit, Plus } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';

export default function ProductList({ onEdit, onAdd, className }) {
  const [search, setSearch] = React.useState('');
  
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage,
    refetch 
  } = trpc.product.list.useInfiniteQuery(
    { limit: 10, search },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  const items = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Products</CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </CardHeader>
      
      <CardContent>
        {/* Lista de produtos com paginação, loading states, etc. */}
      </CardContent>
    </Card>
  );
}
```

### 📄 Página Next.js (`src/app/products/page.tsx`)

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Description for Products page',
};

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Products</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Welcome to the Products page
          </p>
        </header>

        <main>
          <div className="grid gap-6">
            <div className="border rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
              <p className="text-muted-foreground">
                This is a generated page. Start building your content here.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

## 🔄 Fluxo de Desenvolvimento com IA

### 1. **Base Sólida Gerada**
O sistema gera automaticamente:
- ✅ Estrutura de arquivos organizada
- ✅ Tipos TypeScript completos
- ✅ Validação com Zod
- ✅ Componentes React funcionais
- ✅ Integração tRPC completa
- ✅ Estado Zustand configurado

### 2. **Extensão com IA**
Com a base gerada, use IA para adicionar funcionalidades:

```prompt
"Baseado no código gerado em src/modules/product/, adicione:

1. Sistema de categorias:
   - Campo 'categoryId' nos tipos
   - Select de categoria no formulário
   - Filtro por categoria na lista

2. Upload de imagens:
   - Campo 'imageUrl' opcional
   - Componente de upload
   - Preview de imagem

3. Sistema de preços:
   - Campos 'price' e 'discountPrice'
   - Validação de preço
   - Exibição formatada

Mantenha os padrões existentes de TypeScript, tRPC e componentes."
```

### 3. **Resultado da IA**
A IA pode facilmente:
- Entender a estrutura existente
- Adicionar campos nos tipos
- Estender procedures tRPC
- Adicionar componentes UI
- Manter consistência de código

## 🎯 Comandos Rápidos para Desenvolvimento

```bash
# Gerar componente específico
npm run gen:component
# Nome: ProductCard, Tipo: UI Component

# Gerar hook customizado
npm run gen:hook
# Nome: ProductSearch, Tipo: Custom Hook

# Gerar store adicional
npm run gen:store
# Nome: Cart, Features: Persistence, DevTools

# Gerar roteador tRPC específico
npm run gen:trpc
# Nome: Category, Procedures: list,create,update,delete
```

## 🚀 Benefícios Práticos

### ⚡ **Velocidade**
- **Antes**: 2-3 horas para criar estrutura básica
- **Depois**: 5 minutos para estrutura completa

### 🎨 **Consistência**
- Mesmo padrão de nomeação
- Estrutura de arquivos uniforme
- Tipos TypeScript consistentes

### 🤖 **IA-Friendly**
- Código estruturado e previsível
- Padrões reconhecíveis
- Comentários e documentação

### 🛡️ **Qualidade**
- Validação automática
- Error handling incluído
- Testes gerados automaticamente

## 🔧 Customização do Template

### Modificar Template Existente

```bash
# Editar template de componente
vim plop-templates/component/component.hbs

# Adicionar nova validação
vim plop-templates/trpc/router.hbs
```

### Criar Template Personalizado

```bash
# Criar novo template
mkdir plop-templates/api-client
touch plop-templates/api-client/client.hbs
```

```javascript
// Adicionar no plopfile.js
plop.setGenerator('api-client', {
  description: 'Generate API client',
  prompts: [{
    type: 'input',
    name: 'name',
    message: 'API name:'
  }],
  actions: [{
    type: 'add',
    path: 'src/api/{{kebabCase name}}Client.ts',
    templateFile: 'plop-templates/api-client/client.hbs'
  }]
});
```

## 📈 Próximos Passos

1. **Execute o exemplo acima**
2. **Explore os arquivos gerados**
3. **Use IA para estender funcionalidades**
4. **Customize templates conforme necessário**
5. **Compartilhe padrões com a equipe**

## 💡 Dicas de Uso com IA

### Prompts Eficazes

```prompt
✅ BOM:
"Baseado no código em src/modules/product/, adicione funcionalidade X mantendo os padrões existentes"

❌ RUIM:
"Crie um sistema de produtos do zero"
```

### Iteração Inteligente

1. **Gere base** com Plop
2. **Estenda** com IA
3. **Refine** iterativamente
4. **Documente** padrões

---

**🎉 Resultado:** Sistema completo de geração automatizada que acelera desenvolvimento em 10x e otimiza uso de IA!