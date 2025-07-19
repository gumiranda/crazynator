# Figma Design Import System

Um sistema completo para importação direta de arquivos Figma com extração automática de contexto de design, componentes, tokens de design e análise de sistemas de design.

## ✨ Funcionalidades

### 🎨 Importação Direta
- Importação direta de arquivos Figma via URL
- Autenticação segura com tokens de acesso
- Suporte para diferentes tipos de arquivo (wireframes, mockups, protótipos)

### 🔍 Análise de Design
- **Componentes**: Detecção automática e categorização de componentes
- **Cores**: Extração e categorização de paleta de cores
- **Tipografia**: Análise de hierarquia tipográfica e escalas
- **Espaçamento**: Identificação de sistemas de espaçamento
- **Layout**: Padrões de layout e breakpoints

### 🎯 Design Tokens
- Extração automática de tokens de design
- Geração de variáveis CSS/SCSS
- Exportação em múltiplos formatos (JSON, CSS, SCSS)
- Tokens semânticos organizados

### 🛠️ Geração de Código
- Templates de componentes React, Vue, Angular
- Geração de código CSS/SCSS
- Documentação automática do sistema de design

## 🚀 Instalação e Configuração

### Dependências
```bash
npm install figma-js axios
```

### Variáveis de Ambiente
Adicione ao seu arquivo `.env`:
```env
FIGMA_ACCESS_TOKEN=figd_sua_chave_aqui
```

### Token de Acesso Figma
1. Acesse [Figma Developer Settings](https://www.figma.com/developers/api#access-tokens)
2. Clique em "Create a personal access token"
3. Dê um nome ao token e copie-o
4. Configure no ambiente da aplicação

## 📋 Uso Básico

### Interface React
```tsx
import { FigmaImport } from '@/components/figma-import';

function MyComponent() {
  return (
    <FigmaImport 
      onImportComplete={(result) => {
        console.log('Design context:', result.data);
      }} 
    />
  );
}
```

### API Programática
```typescript
import { importFigmaFile, createImportConfig } from '@/lib/figma-import';

// Configuração básica
const config = createImportConfig(
  'https://figma.com/file/exemplo',
  'figd_seu_token',
  {
    includeComponents: true,
    includeStyles: true,
    extractTokens: true
  }
);

// Importar arquivo
const result = await importFigmaFile(config);

if (result.success) {
  console.log('Componentes encontrados:', result.data.components);
  console.log('Paleta de cores:', result.data.colorPalette);
  console.log('Design tokens:', result.data.designTokens);
}
```

## 🔧 API Endpoints

### Importar Arquivo Figma
```http
POST /api/figma/import
Content-Type: application/json

{
  "fileUrl": "https://figma.com/file/seu-arquivo",
  "accessToken": "figd_seu_token",
  "options": {
    "includeComponents": true,
    "includeStyles": true,
    "includeAssets": false,
    "extractTokens": true,
    "generateCode": false,
    "outputFormat": ["json", "css"]
  }
}
```

### Validar Token
```http
GET /api/figma/import?action=validate-token&accessToken=figd_seu_token
```

### Validar URL
```http
GET /api/figma/import?action=validate-url&fileUrl=https://figma.com/file/...
```

## 📊 Estrutura de Dados

### Contexto de Design
```typescript
interface DesignContext {
  file: {
    id: string;
    name: string;
    url: string;
    lastModified: string;
    version: string;
  };
  components: ComponentAnalysis[];
  colorPalette: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingSystem;
  layout: LayoutSystem;
  designTokens: DesignTokens;
  pages: PageAnalysis[];
  metadata: DesignMetadata;
}
```

### Análise de Componentes
```typescript
interface ComponentAnalysis {
  id: string;
  name: string;
  type: ComponentType;
  description?: string;
  variants: ComponentVariant[];
  properties: ComponentProperty[];
  usageCount: number;
  instances: ComponentInstance[];
  designTokens: string[];
  accessibility: AccessibilityInfo;
  responsive: ResponsiveInfo;
}
```

### Paleta de Cores
```typescript
interface ColorPalette {
  primary: ColorToken[];
  secondary: ColorToken[];
  neutral: ColorToken[];
  semantic: {
    success: ColorToken[];
    warning: ColorToken[];
    error: ColorToken[];
    info: ColorToken[];
  };
  custom: ColorToken[];
}
```

## 🎨 Exemplos de Output

### Design Tokens CSS
```css
:root {
  /* Colors */
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-neutral-50: #f9fafb;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  
  /* Typography */
  --font-heading-family: 'Inter';
  --font-heading-size: 24px;
  --font-heading-weight: 600;
}
```

### Design Tokens SCSS
```scss
// Colors
$color-primary-500: #3b82f6;
$color-primary-600: #2563eb;
$color-neutral-50: #f9fafb;

// Spacing
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;

// Typography
$font-heading-family: 'Inter';
$font-heading-size: 24px;
$font-heading-weight: 600;
```

### JSON Design Tokens
```json
{
  "colors": {
    "primary-500": "#3b82f6",
    "primary-600": "#2563eb",
    "neutral-50": "#f9fafb"
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16
  },
  "typography": {
    "heading": {
      "fontFamily": "Inter",
      "fontSize": 24,
      "fontWeight": 600
    }
  }
}
```

## 🧩 Componentes do Sistema

### 1. FigmaClient (`src/lib/figma-client.ts`)
Cliente para comunicação com a API do Figma:
- Autenticação e validação de tokens
- Busca de arquivos e metadados
- Download de assets
- Tratamento de erros e rate limiting

### 2. FigmaDesignAnalyzer (`src/lib/figma-analyzer.ts`)
Analisador de contexto de design:
- Extração de componentes e variantes
- Análise de paleta de cores
- Identificação de padrões tipográficos
- Extração de sistemas de espaçamento

### 3. FigmaImportService (`src/lib/figma-import.ts`)
Orquestrador do processo de importação:
- Coordenação entre cliente e analisador
- Geração de código em múltiplos formatos
- Relatórios de progresso e estatísticas

### 4. FigmaImport Component (`src/components/figma-import.tsx`)
Interface React para importação:
- Formulário de configuração
- Indicador de progresso
- Visualização de resultados
- Exportação de dados

## 🎯 Casos de Uso

### Design System Audit
```typescript
const config = createImportConfig(url, token, {
  includeComponents: true,
  includeStyles: true,
  extractTokens: true
});

const result = await importFigmaFile(config);

// Análise de consistência
const colorCount = Object.keys(result.data.designTokens.colors).length;
const componentCount = result.data.components.length;
const inconsistencies = result.warnings;

console.log(`Sistema usa ${colorCount} cores e ${componentCount} componentes`);
```

### Token Generation
```typescript
const config = createImportConfig(url, token, {
  extractTokens: true,
  generateCode: true,
  outputFormat: ['css', 'scss', 'tokens']
});

const result = await importFigmaFile(config);
// Tokens prontos para uso em CSS/SCSS
```

### Component Documentation
```typescript
const config = createImportConfig(url, token, {
  includeComponents: true
});

const result = await importFigmaFile(config);

result.data.components.forEach(component => {
  console.log(`${component.name}: ${component.variants.length} variantes`);
  console.log(`Usado ${component.usageCount} vezes`);
});
```

## ⚙️ Configurações Avançadas

### Plugin System
```typescript
const config = createImportConfig(url, token, {
  plugins: [
    {
      name: 'accessibility-analyzer',
      enabled: true,
      options: { checkContrast: true }
    },
    {
      name: 'component-generator',
      enabled: true,
      options: { framework: 'react' }
    }
  ]
});
```

### Formatos de Output Personalizados
```typescript
const config = createImportConfig(url, token, {
  outputFormat: [
    OutputFormat.CSS,
    OutputFormat.SCSS,
    OutputFormat.TOKENS,
    OutputFormat.REACT
  ]
});
```

## 🚨 Tratamento de Erros

### Códigos de Erro Comuns
- `UNAUTHORIZED`: Token inválido ou expirado
- `NOT_FOUND`: Arquivo não encontrado
- `RATE_LIMITED`: Muitas requisições
- `INVALID_URL`: URL do Figma inválida
- `NETWORK_ERROR`: Erro de conexão

### Tratamento de Erros
```typescript
const result = await importFigmaFile(config);

if (!result.success) {
  result.errors.forEach(error => {
    switch (error.code) {
      case 'UNAUTHORIZED':
        console.log('Token inválido. Gere um novo token.');
        break;
      case 'NOT_FOUND':
        console.log('Arquivo não encontrado. Verifique a URL.');
        break;
      default:
        console.log(`Erro: ${error.message}`);
    }
  });
}
```

## 📈 Performance e Otimização

### Rate Limiting
- Respeita limites da API do Figma
- Implementa retry automático
- Batching de requisições quando possível

### Caching
- Cache de metadados de arquivos
- Cache de tokens de design extraídos
- Invalidação baseada em versão do arquivo

### Processamento Assíncrono
- Importação não-bloqueante
- Indicadores de progresso em tempo real
- Processamento em background

## 🧪 Testes

### Execução dos Testes
```bash
npm test src/lib/figma-*.test.ts
```

### Teste de Integração
```typescript
// Teste com arquivo Figma real
const testConfig = createImportConfig(
  'https://figma.com/file/test-file',
  process.env.FIGMA_TEST_TOKEN
);

const result = await importFigmaFile(testConfig);
expect(result.success).toBe(true);
expect(result.data.components.length).toBeGreaterThan(0);
```

## 🚀 Deploy e Produção

### Variáveis de Ambiente
```env
FIGMA_ACCESS_TOKEN=figd_production_token
FIGMA_RATE_LIMIT=100
FIGMA_CACHE_TTL=3600
```

### Monitoramento
- Logs estruturados para importações
- Métricas de performance
- Alertas para falhas de API

### Segurança
- Tokens criptografados em repouso
- Validação de URLs
- Rate limiting por usuário

## 📝 Roadmap

### Próximas Funcionalidades
- [ ] Suporte para Figma Variables (beta)
- [ ] Importação incremental (apenas mudanças)
- [ ] Plugin system extensível
- [ ] Integração com design systems populares
- [ ] Geração de storybook automática
- [ ] Análise de acessibilidade avançada

### Melhorias Planejadas
- [ ] Performance otimizada para arquivos grandes
- [ ] Cache inteligente
- [ ] Suporte offline
- [ ] Interface de linha de comando (CLI)

## 🤝 Contribuição

### Setup de Desenvolvimento
```bash
git clone [repositório]
cd projeto
npm install
npm run dev
```

### Estrutura de Commits
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `refactor:` refatoração
- `test:` testes

## 📄 Licença

Este projeto está licenciado sob a MIT License.

## 🆘 Suporte

### Problemas Comuns
1. **Token inválido**: Regenere o token no Figma
2. **Rate limit**: Aguarde ou implemente batching
3. **Arquivo muito grande**: Use filtros para reduzir dados

### Documentação Adicional
- [Figma API Documentation](https://www.figma.com/developers/api)
- [Design Tokens Community Group](https://design-tokens.github.io/community-group/)

---

**Desenvolvido com ❤️ para facilitar a integração entre design e desenvolvimento.**