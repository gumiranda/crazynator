# 🎯 Padrões de Código - Guia de Implementação

## 📋 Visão Geral

Este projeto implementa padrões de código baseados em **Atomic Design** e **Feature Sliced Design (FSD)** para criar uma arquitetura escalável e maintível.

## 🚀 Como Usar

### 1. Instalação de Dependências

Instale as dependências necessárias para os padrões:

```bash
npm install clsx tailwind-merge class-variance-authority
npm install -D @storybook/nextjs @storybook/addon-essentials
```

### 2. Configuração do Path Mapping

Adicione ao seu `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/features/*": ["./src/features/*"],
      "@/entities/*": ["./src/entities/*"],
      "@/widgets/*": ["./src/widgets/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

### 3. Usando os Componentes

#### Atoms (Componentes Básicos)

```typescript
import { Button, Input } from '@/shared/ui';

function MyForm() {
  return (
    <div className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        helpText="Usaremos para entrar em contato"
      />
      <Button variant="primary" size="lg">
        Enviar
      </Button>
    </div>
  );
}
```

#### Molecules (Combinação de Atoms)

```typescript
import { SearchField } from '@/shared/ui';

function SearchPage() {
  const handleSearch = (query: string) => {
    console.log('Pesquisando:', query);
  };

  return (
    <SearchField
      placeholder="Buscar produtos..."
      onSearch={handleSearch}
      showClearButton
    />
  );
}
```

#### Features (Funcionalidades de Negócio)

```typescript
import { LoginForm, useAuthStore } from '@/features/auth';

function LoginPage() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <div>Já está logado!</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Login</h1>
      <LoginForm
        onSuccess={() => console.log('Login realizado!')}
        redirectTo="/dashboard"
      />
    </div>
  );
}
```

## 📁 Estrutura de Pastas

```
src/
├── app/                    # Configurações da aplicação
├── pages/                  # Páginas do Next.js
├── widgets/                # Componentes independentes
├── features/               # Funcionalidades de negócio
│   └── auth/              # Feature de autenticação
│       ├── ui/            # Componentes UI
│       ├── api/           # API calls
│       ├── model/         # Estado e tipos
│       └── index.ts       # Exports centralizados
├── entities/              # Entidades de negócio
├── shared/                # Código compartilhado
│   ├── ui/               # Design System
│   ├── lib/              # Utilitários
│   ├── types/            # Tipos globais
│   └── constants/        # Constantes
└── docs/                  # Documentação
```

## 🛠️ Criando Novos Componentes

### 1. Atoms

Para criar um novo atom:

```bash
# Crie a pasta do componente
mkdir -p src/shared/ui/atoms/avatar

# Crie os arquivos
touch src/shared/ui/atoms/avatar/avatar.tsx
touch src/shared/ui/atoms/avatar/avatar.stories.tsx
touch src/shared/ui/atoms/avatar/avatar.test.tsx
```

Template básico para um atom:

```typescript
// src/shared/ui/atoms/avatar/avatar.tsx
'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt} className="aspect-square h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            {fallback || children}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
```

### 2. Features

Para criar uma nova feature:

```bash
# Estrutura da feature
mkdir -p src/features/user-profile/{ui,api,model}

# Arquivos principais
touch src/features/user-profile/index.ts
touch src/features/user-profile/model/user-profile.types.ts
touch src/features/user-profile/model/user-profile.store.ts
touch src/features/user-profile/api/user-profile.api.ts
touch src/features/user-profile/ui/profile-form.tsx
```

Template para store da feature:

```typescript
// src/features/user-profile/model/user-profile.store.ts
'use client';

import { create } from 'zustand';
import { UserProfile } from './user-profile.types';
import { userProfileApi } from '../api/user-profile.api';

interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userProfileApi.getProfile(userId);
      set({ profile, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false 
      });
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userProfileApi.updateProfile(data);
      set({ profile, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar',
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null }),
}));
```

## 🎨 Storybook

Para visualizar e documentar componentes:

```bash
# Executar Storybook
npm run storybook

# Build do Storybook
npm run build-storybook
```

### Criando Stories

```typescript
// component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './component';

const meta: Meta<typeof Component> = {
  title: 'Atoms/Component',
  component: Component,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // props padrão
  },
};
```

## 📏 Regras de Arquitetura

### 1. Dependency Rule

- **shared** nunca importa de outras layers
- **entities** pode importar apenas de **shared**
- **features** pode importar de **entities** e **shared**
- **widgets** pode importar de **features**, **entities** e **shared**
- **pages** pode importar de todas as layers inferiores

### 2. Nomenclatura

```typescript
// ✅ Correto
const UserProfile = () => {};
const useUserData = () => {};
const USER_ROLES = ['admin', 'user'];
interface UserProps {}

// ❌ Incorreto
const userProfile = () => {};
const getUserData = () => {};
const userRoles = ['admin', 'user'];
interface userProps {}
```

### 3. Exports Centralizados

```typescript
// features/auth/index.ts
export { LoginForm } from './ui/login-form';
export { useAuthStore } from './model/auth.store';
export type { User, LoginCredentials } from './model/auth.types';
```

## 🧪 Testes

### Estrutura de Testes

```typescript
// component.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });
});
```

## 📊 Métricas e Monitoramento

### ESLint Rules

As regras ESLint ajudam a manter a arquitetura:

```javascript
// .eslintrc.js
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/shared/**/*",
            "from": "./src/features/**/*",
            "message": "shared cannot import from features"
          }
        ]
      }
    ]
  }
}
```

### Comandos Úteis

```bash
# Verificar arquitetura
npm run lint

# Executar testes
npm run test

# Verificar tipos
npm run type-check

# Formatar código
npm run format
```

## 🔄 Fluxo de Desenvolvimento

1. **Identifique o nível**: Atom, Molecule, Organism, Feature?
2. **Crie a estrutura**: Pastas e arquivos base
3. **Implemente**: Componente, tipos, testes
4. **Documente**: Stories no Storybook
5. **Exporte**: Adicione aos índices apropriados
6. **Teste**: Verificações automáticas

## 📚 Recursos Adicionais

- [Documentação Atomic Design](./code-patterns.md)
- [Regras ESLint FSD](./eslint-rules-fsd.md)
- [Exemplos Storybook](./storybook-examples.md)
- [Feature Sliced Design](https://feature-sliced.design/)

## 🤝 Contribuindo

1. Siga os padrões estabelecidos
2. Documente novos componentes
3. Mantenha testes atualizados
4. Use commits semânticos
5. Faça code review focando na arquitetura

---

**Lembre-se**: A consistência é chave para uma arquitetura maintível! 🚀