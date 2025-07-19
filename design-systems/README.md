# Sistema de Design Customizado

Este projeto implementa um sistema completo de design systems customizados com integração total ao Tailwind CSS. O sistema permite criar, gerenciar e aplicar design systems de forma dinâmica.

## 🚀 Funcionalidades Principais

- **Design Systems Integrados**: Material Design 3, Microsoft Fluent, e sistema padrão
- **Sistema Customizado**: Crie seus próprios design systems com tokens personalizados
- **Integração Tailwind**: Geração automática de configurações Tailwind CSS
- **Gerenciamento Visual**: Interface gráfica para criar e editar design systems
- **Persistência**: Salva automaticamente as configurações no localStorage
- **Importação/Exportação**: Compartilhe design systems via JSON
- **TypeScript**: Tipagem completa para todas as configurações

## 📁 Estrutura do Projeto

```
src/
├── lib/
│   ├── design-system.ts          # Core do sistema de design
│   └── tailwind-config-generator.ts # Gerador de configurações Tailwind
├── hooks/
│   └── use-design-system.ts      # Hook React para uso do sistema
├── components/
│   ├── design-system-manager.tsx # Interface de gerenciamento
│   └── design-system-provider.tsx # Provider React
└── app/
    └── design-system/
        └── page.tsx               # Página de demonstração

design-systems/
├── examples/
│   └── custom-brand.json         # Exemplo de sistema customizado
└── README.md                     # Esta documentação
```

## 🛠 Como Usar

### 1. Configuração Básica

Envolva sua aplicação com o `DesignSystemProvider`:

```tsx
import { DesignSystemProvider } from '@/components/design-system-provider'

export default function App({ children }) {
  return (
    <DesignSystemProvider 
      initialSystem="default" 
      enablePersistence={true}
    >
      {children}
    </DesignSystemProvider>
  )
}
```

### 2. Usando o Hook

```tsx
import { useDesignSystem } from '@/hooks/use-design-system'

function MyComponent() {
  const { 
    currentSystem, 
    loadBuiltInSystem, 
    cn,
    getComponentStyles 
  } = useDesignSystem()

  return (
    <div className={cn('p-4', getComponentStyles('card'))}>
      <h1>Sistema atual: {currentSystem.name}</h1>
      <button onClick={() => loadBuiltInSystem('material')}>
        Carregar Material Design
      </button>
    </div>
  )
}
```

### 3. Interface de Gerenciamento

Acesse `/design-system` para usar a interface visual de gerenciamento, onde você pode:

- Visualizar o design system atual
- Trocar entre sistemas integrados
- Criar sistemas customizados
- Importar/exportar configurações
- Gerar configurações Tailwind

## 🎨 Criando um Design System Customizado

### Via Interface (Recomendado)

1. Acesse `/design-system`
2. Vá para a aba "Customize"
3. Digite o nome do sistema
4. Cole a configuração JSON
5. Clique em "Create Custom System"

### Programaticamente

```tsx
import { useDesignSystem } from '@/hooks/use-design-system'

const customSystem = {
  name: "Meu Sistema",
  version: "1.0.0",
  tokens: {
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      background: "#ffffff"
    },
    spacing: {
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem"
    },
    typography: {
      fontFamilies: {
        sans: "Inter, sans-serif"
      }
    }
  },
  components: {
    button: {
      base: "px-4 py-2 rounded-md font-medium",
      variants: {
        primary: "bg-primary text-white",
        secondary: "bg-secondary text-white"
      }
    }
  }
}

function RegisterSystem() {
  const { registerCustomSystem } = useDesignSystem()
  
  const handleRegister = () => {
    registerCustomSystem('my-system', customSystem)
  }
  
  return <button onClick={handleRegister}>Registrar Sistema</button>
}
```

## 🔧 Configuração Avançada do Tailwind

O sistema gera automaticamente configurações Tailwind. Para personalizar ainda mais:

```typescript
// tailwind.config.ts
import { designSystem } from './src/lib/design-system'
import { createTailwindConfig } from './src/lib/tailwind-config-generator'

const currentSystem = designSystem.getCurrentSystem()
const generatedConfig = createTailwindConfig(currentSystem, {
  includeDarkMode: true,
  includeAnimations: true,
  includeUtilities: true,
  prefix: 'ds-', // Prefixo para classes do design system
})

export default {
  ...generatedConfig,
  // Suas customizações adicionais aqui
}
```

## 📋 Schema dos Design Tokens

```typescript
interface DesignTokens {
  colors?: Record<string, string>
  spacing?: Record<string, string>
  typography?: {
    fontFamilies?: Record<string, string>
    fontSizes?: Record<string, string>
    fontWeights?: Record<string, string>
    lineHeights?: Record<string, string>
    letterSpacing?: Record<string, string>
  }
  borders?: {
    radius?: Record<string, string>
    width?: Record<string, string>
  }
  shadows?: Record<string, string>
  breakpoints?: Record<string, string>
  animations?: Record<string, {
    keyframes: Record<string, any>
    duration: string
    timingFunction?: string
    fillMode?: string
  }>
}
```

## 🎯 Exemplos de Uso

### Botão com Design System

```tsx
import { useDesignSystem } from '@/hooks/use-design-system'

function Button({ variant = 'default', size = 'md', children, ...props }) {
  const { getComponentStyles, cn } = useDesignSystem()
  
  return (
    <button 
      className={cn(
        getComponentStyles('button', variant, size),
        'transition-all duration-200'
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Card Responsivo

```tsx
function Card({ variant, children }) {
  const { getComponentStyles, cn } = useDesignSystem()
  
  return (
    <div className={cn(
      getComponentStyles('card', variant),
      'p-6 md:p-8'
    )}>
      {children}
    </div>
  )
}
```

## 🚦 Melhores Práticas

1. **Nomenclatura Consistente**: Use nomes semânticos para cores e espaçamentos
2. **Modularidade**: Separe tokens por categoria (cores, tipografia, etc.)
3. **Versionamento**: Sempre inclua versão nos seus design systems
4. **Documentação**: Adicione descrições claras aos seus sistemas
5. **Teste**: Teste o sistema em diferentes componentes antes de usar em produção

## 🔄 Migração de Sistemas Existentes

Para migrar de sistemas existentes:

1. **Extraia os tokens**: Converta suas variáveis CSS/SCSS em tokens JSON
2. **Mapeie componentes**: Identifique padrões de componentes reutilizáveis
3. **Configure gradualmente**: Implemente por partes, começando com tokens básicos
4. **Teste extensivamente**: Verifique se todos os componentes funcionam corretamente

## 🐛 Resolução de Problemas

### Sistema não carrega
- Verifique se o `DesignSystemProvider` está envolvendo a aplicação
- Confirme se o JSON do sistema está válido
- Veja o console para erros de validação

### Estilos não aplicam
- Verifique se as classes Tailwind estão sendo geradas
- Confirme se o sistema foi carregado corretamente
- Teste com classes básicas primeiro

### Performance
- Use `useMemo` para sistemas complexos
- Evite mudanças frequentes de sistema
- Considere lazy loading para sistemas não utilizados

## 📚 Recursos Adicionais

- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Design Tokens W3C](https://www.w3.org/community/design-tokens/)
- [Atomic Design](https://atomicdesign.bradfrost.com/)

## 🤝 Contribuindo

Para contribuir com melhorias:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente suas mudanças
4. Adicione testes se necessário
5. Faça um pull request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.