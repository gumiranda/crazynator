# Whitelabel System Documentation

Esta aplicação foi convertida em um sistema whitelabel completo, permitindo personalização completa da marca, cores, logos e funcionalidades.

## 🚀 Como Usar o Sistema Whitelabel

### 1. Configuração via Variáveis de Ambiente

Copie o arquivo `.env.whitelabel.example` para `.env.local` e personalize os valores:

```bash
cp .env.whitelabel.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```bash
NEXT_PUBLIC_BRAND_NAME="Sua Marca"
NEXT_PUBLIC_BRAND_TAGLINE="Construa algo incrível com Sua Marca"
NEXT_PUBLIC_PRIMARY_COLOR="#your-color"
# ... outras configurações
```

### 2. Configuração via Arquivo JSON

Alternativamente, você pode usar um arquivo JSON local:

```bash
cp whitelabel.config.example.json whitelabel.config.json
```

Edite o `whitelabel.config.json` com suas configurações.

### 3. Configuração via API Externa

Para máxima flexibilidade, você pode carregar a configuração de uma API:

```bash
NEXT_PUBLIC_CONFIG_URL="https://api.suamarca.com/whitelabel-config"
```

A API deve retornar um JSON no formato do exemplo.

## 📋 Configurações Disponíveis

### Marca e Identidade
- `NEXT_PUBLIC_BRAND_NAME`: Nome da marca
- `NEXT_PUBLIC_BRAND_TAGLINE`: Slogan principal
- `NEXT_PUBLIC_BRAND_DESCRIPTION`: Descrição da aplicação

### Cores e Tema
- `NEXT_PUBLIC_PRIMARY_COLOR`: Cor primária (usado no Clerk, botões, etc.)
- `NEXT_PUBLIC_SECONDARY_COLOR`: Cor secundária (opcional)
- `NEXT_PUBLIC_ACCENT_COLOR`: Cor de destaque (opcional)

### Logos e Assets
- `NEXT_PUBLIC_LOGO_MAIN`: Caminho para o logo principal
- `NEXT_PUBLIC_LOGO_FAVICON`: Caminho para o favicon
- `NEXT_PUBLIC_LOGO_ALT`: Texto alternativo para o logo

### SEO e Meta Tags
- `NEXT_PUBLIC_META_TITLE`: Título da página
- `NEXT_PUBLIC_META_DESCRIPTION`: Descrição meta
- `NEXT_PUBLIC_META_KEYWORDS`: Palavras-chave (separadas por vírgula)

### Funcionalidades
- `NEXT_PUBLIC_ENABLE_PRICING`: Habilitar página de preços (true/false)
- `NEXT_PUBLIC_ENABLE_SIGNUP`: Habilitar botão de cadastro (true/false)
- `NEXT_PUBLIC_ENABLE_SIGNIN`: Habilitar botão de login (true/false)

### Contato
- `NEXT_PUBLIC_CONTACT_EMAIL`: Email de contato
- `NEXT_PUBLIC_CONTACT_WEBSITE`: Website principal
- `NEXT_PUBLIC_CONTACT_SUPPORT`: URL de suporte

## 🎨 Substituindo Assets

### Logo Principal
1. Adicione seu logo em `/public/your-logo.svg`
2. Configure `NEXT_PUBLIC_LOGO_MAIN="/your-logo.svg"`

### Favicon
1. Adicione seu favicon em `/public/your-favicon.ico`
2. Configure `NEXT_PUBLIC_LOGO_FAVICON="/your-favicon.ico"`

## 🔧 Componentes Whitelabel

O sistema inclui componentes React reutilizáveis:

### `<BrandLogo />`
```jsx
import { BrandLogo } from '@/components/whitelabel/brand-logo';

<BrandLogo width={24} height={24} className="custom-class" />
```

### `<BrandText />`
```jsx
import { BrandText } from '@/components/whitelabel/brand-text';

<BrandText variant="header" className="text-center" />
// Variantes: 'default' | 'header' | 'small'
```

### `<BrandHeader />`
```jsx
import { BrandHeader } from '@/components/whitelabel/brand-header';

<BrandHeader 
  logoSize={24} 
  textVariant="default"
  orientation="horizontal" // ou "vertical"
  showText={true}
/>
```

### `<BrandHero />`
```jsx
import { BrandHero } from '@/components/whitelabel/brand-hero';

<BrandHero /> // Logo + título + descrição
```

## 🪝 Hooks Disponíveis

```jsx
import { 
  useWhitelabel,
  useBrandName,
  useBrandTagline,
  useBrandDescription,
  usePrimaryColor,
  useLogos,
  useFeatures,
  useMeta,
  useContact
} from '@/hooks/use-whitelabel';

const brandName = useBrandName();
const features = useFeatures();
const config = useWhitelabel(); // Configuração completa
```

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos
```
src/
├── config/
│   └── whitelabel.ts          # Configuração central
├── hooks/
│   └── use-whitelabel.ts      # Hooks React
└── components/
    └── whitelabel/
        ├── brand-logo.tsx     # Componente de logo
        ├── brand-text.tsx     # Componente de texto
        ├── brand-header.tsx   # Header com logo + texto
        └── brand-hero.tsx     # Hero section completa
```

### Prioridade de Configuração
1. **API Externa** (se `NEXT_PUBLIC_CONFIG_URL` estiver definido)
2. **Arquivo JSON Local** (`whitelabel.config.json`)
3. **Variáveis de Ambiente** (`.env.local`)
4. **Valores Padrão** (Crazy Code)

## 🚀 Deployment

### Vercel
Configure as variáveis de ambiente no painel da Vercel:
```bash
NEXT_PUBLIC_BRAND_NAME="Sua Marca"
NEXT_PUBLIC_PRIMARY_COLOR="#your-color"
# ... outras variáveis
```

### Docker
Crie um arquivo `.env.production`:
```bash
# Variáveis de produção
NEXT_PUBLIC_BRAND_NAME="Sua Marca"
# ...
```

### Build Personalizado
Para diferentes marcas, você pode ter diferentes arquivos de configuração:

```bash
# Build para marca A
cp config/brand-a.env .env.local
npm run build

# Build para marca B  
cp config/brand-b.env .env.local
npm run build
```

## 🔄 Migration de Código Existente

Se você já tem código que usa referências hardcoded ao "Crazy Code", você pode:

1. **Substituir manualmente** usando os componentes whitelabel
2. **Usar busca/substituição** no editor:
   - `"Crazy Code"` → `{useBrandName()}`
   - `src="/logo.svg"` → `<BrandLogo />`

## 🎯 Casos de Uso

### Agência Digital
Configure diferentes marcas para diferentes clientes:
- Cliente A: `.env.client-a`
- Cliente B: `.env.client-b`
- Deploy: Múltiplas instâncias com diferentes configs

### SaaS Multitenancy
Use API externa para configuração dinâmica por tenant:
```javascript
// API endpoint: /api/whitelabel/:tenantId
{
  "brand": { "name": "Cliente XYZ" },
  "colors": { "primary": "#client-color" }
}
```

### White Label Reseller
Permita que revendedores personalizem a aplicação:
- Interface de admin para configuração
- API para salvar/carregar configurações
- Deploy automático com novas configurações

## 🛠️ Troubleshooting

### Logo não aparece
- Verifique se o arquivo existe em `/public/`
- Confirme a variável `NEXT_PUBLIC_LOGO_MAIN`
- Verifique permissões de arquivo

### Cores não aplicam
- Reinicie o servidor de desenvolvimento
- Limpe o cache do browser
- Verifique se a variável está com `NEXT_PUBLIC_` prefix

### Configuração não carrega
- Verifique a sintaxe do JSON
- Confirme que as variáveis de ambiente estão corretas
- Verifique os logs do console

## 📝 Contribuindo

Para adicionar novas opções de configuração:

1. Atualize a interface `WhitelabelConfig` em `src/config/whitelabel.ts`
2. Adicione as variáveis de ambiente padrão
3. Crie hooks específicos se necessário
4. Atualize a documentação

---

**Agora sua aplicação está completamente whitelabel! 🎉**

Cada marca pode ter sua própria identidade visual e configurações sem modificar o código fonte.