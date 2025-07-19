# Padrões de Código - Atomic Design & Feature Sliced Design

## 📚 Índice

1. [Atomic Design](#atomic-design)
2. [Feature Sliced Design](#feature-sliced-design)
3. [Estrutura de Pastas Recomendada](#estrutura-de-pastas)
4. [Convenções de Nomenclatura](#nomenclatura)
5. [Exemplos Práticos](#exemplos)
6. [Boas Práticas](#boas-praticas)

## 🧬 Atomic Design

O Atomic Design é uma metodologia para criar sistemas de design que divide os componentes em 5 níveis hierárquicos:

### 1. Atoms (Átomos) 
**Componentes básicos e indivisíveis**
- Botões, inputs, labels, ícones
- Não podem ser decompostos funcionalmente
- São reutilizáveis e genéricos

```typescript
// src/components/ui/atoms/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) => {
  return (
    <button 
      className={cn(buttonVariants({ variant, size }))}
      {...props}
    >
      {children}
    </button>
  );
};
```

### 2. Molecules (Moléculas)
**Combinação de átomos com propósito específico**
- Campo de busca (input + botão)
- Card de informação (título + texto + botão)

```typescript
// src/components/ui/molecules/SearchField/SearchField.tsx
interface SearchFieldProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export const SearchField: React.FC<SearchFieldProps> = ({ 
  placeholder = "Pesquisar...", 
  onSearch 
}) => {
  const [query, setQuery] = useState('');

  return (
    <div className="flex gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <Button onClick={() => onSearch(query)}>
        <Search size={16} />
      </Button>
    </div>
  );
};
```

### 3. Organisms (Organismos)
**Seções complexas de interface**
- Header completo
- Lista de produtos
- Formulários complexos

```typescript
// src/components/ui/organisms/Header/Header.tsx
export const Header: React.FC = () => {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          <Logo />
          <SearchField onSearch={handleSearch} />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
};
```

### 4. Templates (Templates)
**Layout de página sem conteúdo específico**
- Wireframes
- Estrutura de página

```typescript
// src/components/templates/DashboardTemplate/DashboardTemplate.tsx
interface DashboardTemplateProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  main: React.ReactNode;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  sidebar,
  header,
  main
}) => {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-50">
        {sidebar}
      </aside>
      <div className="flex-1">
        <header className="h-16 border-b">
          {header}
        </header>
        <main className="p-6">
          {main}
        </main>
      </div>
    </div>
  );
};
```

### 5. Pages (Páginas)
**Instâncias específicas dos templates**
- Página de dashboard
- Página de perfil

## 🎯 Feature Sliced Design (FSD)

O FSD organiza o código por camadas (layers) e segmentos (slices), promovendo baixo acoplamento e alta coesão.

### Camadas (Layers)

1. **app** - Configurações da aplicação
2. **pages** - Páginas da aplicação
3. **widgets** - Componentes compostos independentes
4. **features** - Funcionalidades de negócio
5. **entities** - Entidades de negócio
6. **shared** - Código reutilizável

### Segmentos (Slices)

Cada camada é dividida em segmentos por domínio:
- `user`
- `project`
- `auth`
- etc.

### Segmentos Internos

Cada segmento pode ter:
- **ui** - Componentes de interface
- **api** - Chamadas de API
- **model** - Estado e lógica de negócio
- **lib** - Utilitários específicos
- **config** - Configurações

## 📁 Estrutura de Pastas Recomendada

```
src/
├── app/                          # Configurações da aplicação
│   ├── providers/               # Providers (React Query, etc.)
│   ├── store/                   # Store global
│   └── styles/                  # Estilos globais
│
├── pages/                       # Páginas (App Router do Next.js)
│   ├── home/
│   ├── dashboard/
│   └── profile/
│
├── widgets/                     # Widgets independentes
│   ├── header/
│   ├── sidebar/
│   └── footer/
│
├── features/                    # Funcionalidades de negócio
│   ├── auth/
│   │   ├── ui/
│   │   ├── api/
│   │   ├── model/
│   │   └── lib/
│   ├── project-management/
│   └── user-profile/
│
├── entities/                    # Entidades de negócio
│   ├── user/
│   ├── project/
│   └── task/
│
└── shared/                      # Código compartilhado
    ├── ui/                      # Design System (Atomic Design)
    │   ├── atoms/
    │   ├── molecules/
    │   ├── organisms/
    │   └── templates/
    ├── api/                     # Cliente API base
    ├── lib/                     # Utilitários
    ├── config/                  # Configurações
    ├── types/                   # Tipos TypeScript
    └── constants/               # Constantes
```

## 📝 Convenções de Nomenclatura

### Componentes
- **PascalCase** para nomes de componentes
- **kebab-case** para nomes de arquivos
- Prefixo indicando o tipo: `Button`, `UserCard`, `ProjectList`

### Hooks
- Prefixo `use`: `useUser`, `useProjects`
- **camelCase** para nomes

### Constantes
- **UPPER_SNAKE_CASE**: `API_BASE_URL`, `MAX_FILE_SIZE`

### Tipos
- **PascalCase** com sufixo indicativo: `UserData`, `ProjectConfig`, `ApiResponse`

## 🔧 Exemplos Práticos

### Feature: Autenticação

```typescript
// features/auth/model/auth.store.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const user = await authApi.login(email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  logout: () => set({ user: null })
}));
```

```typescript
// features/auth/ui/login-form.tsx
import { useAuthStore } from '../model/auth.store';
import { Button, Input } from '@/shared/ui/atoms';

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
};
```

### Entity: User

```typescript
// entities/user/model/user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface UserConfig {
  theme: 'light' | 'dark';
  language: 'pt' | 'en';
  notifications: boolean;
}
```

```typescript
// entities/user/ui/user-avatar.tsx
import { Avatar } from '@/shared/ui/atoms';
import { User } from '../model/user.types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md' }) => {
  return (
    <Avatar size={size}>
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} />
      ) : (
        <span>{user.name.charAt(0).toUpperCase()}</span>
      )}
    </Avatar>
  );
};
```

## ✅ Boas Práticas

### 1. Separação de Responsabilidades
- **UI**: Apenas apresentação
- **Model**: Lógica de negócio e estado
- **API**: Comunicação com backend

### 2. Dependency Rule
- Camadas superiores podem importar das inferiores
- Camadas inferiores nunca importam das superiores
- Shared nunca importa de outras camadas

### 3. Nomenclatura Consistente
```typescript
// ❌ Inconsistente
const userButton = ...
const ProjectCard = ...
const task_list = ...

// ✅ Consistente
const UserButton = ...
const ProjectCard = ...
const TaskList = ...
```

### 4. Exports Centralizados
```typescript
// features/auth/index.ts
export { LoginForm } from './ui/login-form';
export { useAuthStore } from './model/auth.store';
export { authApi } from './api/auth.api';
```

### 5. Props Interface
```typescript
// ❌ Props inline
const Button = ({ variant, size, children, ...props }: {
  variant?: string;
  size?: string;
  children: React.ReactNode;
}) => { ... }

// ✅ Interface separada
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, size, children }) => { ... }
```

### 6. Composição vs Herança
```typescript
// ✅ Preferir composição
const IconButton: React.FC<IconButtonProps> = ({ icon, ...buttonProps }) => {
  return (
    <Button {...buttonProps}>
      {icon}
    </Button>
  );
};
```

### 7. Hooks Customizados
```typescript
// shared/lib/hooks/use-local-storage.ts
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
};
```

## 🚀 Próximos Passos

1. Implemente os componentes básicos (atoms) primeiro
2. Crie moléculas combinando atoms
3. Desenvolva organismos para seções complexas
4. Organize features seguindo FSD
5. Mantenha documentação atualizada
6. Faça code review focando na arquitetura
