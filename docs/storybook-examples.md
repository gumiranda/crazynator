# Storybook para Atomic Design

## 📚 Documentação de Componentes

Este documento mostra como estruturar e documentar componentes seguindo Atomic Design usando Storybook.

## 🏗️ Estrutura de Pastas para Stories

```
src/
├── shared/
│   └── ui/
│       ├── atoms/
│       │   ├── button/
│       │   │   ├── button.tsx
│       │   │   ├── button.stories.tsx
│       │   │   └── button.test.tsx
│       │   └── input/
│       │       ├── input.tsx
│       │       ├── input.stories.tsx
│       │       └── input.test.tsx
│       ├── molecules/
│       │   └── search-field/
│       │       ├── search-field.tsx
│       │       ├── search-field.stories.tsx
│       │       └── search-field.test.tsx
│       └── organisms/
│           └── header/
│               ├── header.tsx
│               ├── header.stories.tsx
│               └── header.test.tsx
```

## ⚛️ Atoms - Stories

### Button Stories

```typescript
// src/shared/ui/atoms/button/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente de botão reutilizável com várias variantes e tamanhos.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
      description: 'Estilo visual do botão'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Tamanho do botão'
    },
    isLoading: {
      control: 'boolean',
      description: 'Mostra indicador de carregamento'
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o botão'
    },
    children: {
      control: 'text',
      description: 'Conteúdo do botão'
    }
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    isLoading: false,
    disabled: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Estados básicos
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button Primary'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button Secondary'
  }
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Button Outline'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Button Ghost'
  }
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Button Destructive'
  }
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Button Link'
  }
};

// Tamanhos
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button'
  }
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button'
  }
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button'
  }
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    children: '⚙️'
  }
};

// Estados especiais
export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Loading Button'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
};

// Casos de uso específicos
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Item
      </>
    )
  }
};

// Showcase de todas as variantes
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todas as variantes do componente Button lado a lado.'
      }
    }
  }
};

// Showcase de todos os tamanhos
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🎯</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todos os tamanhos do componente Button lado a lado.'
      }
    }
  }
};
```

### Input Stories

```typescript
// src/shared/ui/atoms/input/input.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente de input com suporte a label, erro e texto de ajuda.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Variante visual do input'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamanho do input'
    },
    label: {
      control: 'text',
      description: 'Label do input'
    },
    error: {
      control: 'text',
      description: 'Mensagem de erro'
    },
    helpText: {
      control: 'text',
      description: 'Texto de ajuda'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder do input'
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o input'
    }
  },
  args: {
    placeholder: 'Digite algo...',
    variant: 'default',
    size: 'md',
    disabled: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Input padrão'
  }
};

export const WithLabel: Story = {
  args: {
    label: 'Nome completo',
    placeholder: 'Digite seu nome'
  }
};

export const WithHelpText: Story = {
  args: {
    label: 'Email',
    placeholder: 'seu@email.com',
    helpText: 'Usaremos este email para entrar em contato'
  }
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'seu@email.com',
    error: 'Email deve ter um formato válido',
    value: 'email-invalido'
  }
};

export const Success: Story = {
  args: {
    label: 'Email',
    placeholder: 'seu@email.com',
    variant: 'success',
    value: 'usuario@exemplo.com'
  }
};

export const Disabled: Story = {
  args: {
    label: 'Campo desabilitado',
    placeholder: 'Não editável',
    disabled: true,
    value: 'Valor fixo'
  }
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input size="sm" label="Small" placeholder="Input pequeno" />
      <Input size="md" label="Medium" placeholder="Input médio" />
      <Input size="lg" label="Large" placeholder="Input grande" />
    </div>
  )
};

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input type="text" label="Text" placeholder="Texto" />
      <Input type="email" label="Email" placeholder="email@exemplo.com" />
      <Input type="password" label="Password" placeholder="Senha" />
      <Input type="number" label="Number" placeholder="123" />
      <Input type="tel" label="Telefone" placeholder="(11) 99999-9999" />
      <Input type="url" label="URL" placeholder="https://exemplo.com" />
    </div>
  )
};
```

## 🧬 Molecules - Stories

### SearchField Stories

```typescript
// src/shared/ui/molecules/search-field/search-field.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { SearchField } from './search-field';

const meta: Meta<typeof SearchField> = {
  title: 'Molecules/SearchField',
  component: SearchField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Campo de busca que combina input e botão de pesquisa com funcionalidades avançadas.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto do placeholder'
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo'
    },
    isLoading: {
      control: 'boolean',
      description: 'Estado de carregamento'
    },
    showClearButton: {
      control: 'boolean',
      description: 'Mostra botão de limpar'
    },
    value: {
      control: 'text',
      description: 'Valor controlado'
    }
  },
  args: {
    placeholder: 'Pesquisar...',
    disabled: false,
    isLoading: false,
    showClearButton: true,
    onSearch: action('onSearch'),
    onClear: action('onClear')
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: 'React components'
  }
};

export const Loading: Story = {
  args: {
    isLoading: true,
    value: 'Pesquisando...'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Campo desabilitado'
  }
};

export const WithoutClearButton: Story = {
  args: {
    showClearButton: false,
    value: 'Sem botão de limpar'
  }
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Busque por produtos, marcas ou categorias...'
  }
};

// Demonstração interativa
export const Interactive: Story = {
  render: (args) => {
    const [searchResults, setSearchResults] = React.useState<string[]>([]);
    
    const handleSearch = (query: string) => {
      action('onSearch')(query);
      // Simular resultados de busca
      setSearchResults([
        `Resultado 1 para "${query}"`,
        `Resultado 2 para "${query}"`,
        `Resultado 3 para "${query}"`
      ]);
    };
    
    return (
      <div className="w-96 space-y-4">
        <SearchField {...args} onSearch={handleSearch} />
        {searchResults.length > 0 && (
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Resultados:</h3>
            <ul className="space-y-1">
              {searchResults.map((result, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {result}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
};
```

## 🏢 Organisms - Stories

### Header Stories

```typescript
// src/shared/ui/organisms/header/header.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './header';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Header principal da aplicação com navegação, busca e menu do usuário.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithUser: Story = {
  parameters: {
    mockData: {
      user: {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        avatar: 'https://github.com/joaosilva.png'
      }
    }
  }
};

export const WithoutUser: Story = {
  parameters: {
    mockData: {
      user: null
    }
  }
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
};
```

## 📖 Configuração do Storybook

### Main Config

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true)
    }
  }
};

export default config;
```

### Preview Config

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    docs: {
      theme: {
        brandTitle: 'Design System',
        brandUrl: '/',
        brandImage: '/logo.png'
      }
    },
    layout: 'centered'
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true
      }
    }
  }
};

export default preview;
```

## 🎯 Boas Práticas para Stories

### 1. Estrutura Consistente
```typescript
// Use sempre a mesma estrutura
const meta: Meta<typeof Component> = {
  title: 'Layer/ComponentName',
  component: Component,
  parameters: { /* configurações */ },
  tags: ['autodocs'],
  argTypes: { /* controles */ },
  args: { /* valores padrão */ }
};
```

### 2. Documentação Rica
```typescript
// Adicione descrições detalhadas
parameters: {
  docs: {
    description: {
      component: 'Descrição completa do componente',
      story: 'Descrição específica desta story'
    }
  }
}
```

### 3. Controls Intuitivos
```typescript
argTypes: {
  variant: {
    control: 'select',
    options: ['option1', 'option2'],
    description: 'Descrição clara da prop'
  }
}
```

### 4. Stories Demonstrativas
```typescript
// Crie stories que mostram casos de uso reais
export const RealWorldExample: Story = {
  render: () => (
    <div className="p-6 bg-gray-50">
      <Component {...realWorldProps} />
    </div>
  )
};
```

### 5. Testes Visuais
```typescript
// Use Chromatic para testes visuais automáticos
export const VisualTest: Story = {
  parameters: {
    chromatic: { 
      viewports: [320, 768, 1200] 
    }
  }
};
```