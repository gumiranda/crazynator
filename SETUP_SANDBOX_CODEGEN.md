# 🛠️ Setup do Template E2B com Sistema de Geração de Código

Este documento explica como configurar e publicar o novo template E2B que inclui sistema completo de geração automatizada de código.

## 📋 Pré-requisitos

- E2B CLI instalado (`brew install e2b` ou `npm install -g @e2b/cli`)
- Conta E2B configurada (`e2b auth login`)
- Docker (para build local - opcional)

## 🚀 Passos para Configuração

### 1. Navegue até o diretório do template

```bash
cd sandbox-templates/nextjs-with-codegen
```

### 2. Build do template

```bash
# Build local (recomendado para testes)
e2b template build --name crazystack-codegen

# Ou build com especificação de comando
e2b template build --name crazystack-codegen --cmd "/setup_project.sh"
```

### 3. Teste local (opcional)

```bash
# Criar sandbox para teste
e2b sandbox create crazystack-codegen

# Conectar ao sandbox
e2b sandbox connect <SANDBOX_ID>
```

### 4. Publicar template

```bash
# Obter o template ID gerado
e2b template list

# Publicar template (usar o ID obtido acima)
e2b template publish -t <TEMPLATE_ID>
```

### 5. Atualizar configuração no código

Após publicar, atualize o `template_id` nos arquivos:

1. **sandbox-templates/nextjs-with-codegen/e2b.toml**
```toml
template_id = "SEU_TEMPLATE_ID_AQUI"
```

2. **src/lib/sandbox.ts** - função `createSandboxWithCodegen()`
```typescript
export async function createSandboxWithCodegen() {
  const sandbox = await Sandbox.create('SEU_TEMPLATE_ID_AQUI');
  return sandbox;
}
```

## 📂 Estrutura do Template

```
sandbox-templates/nextjs-with-codegen/
├── e2b.toml                    # Configuração E2B
├── e2b.Dockerfile             # Dockerfile do sandbox
├── setup_project.sh           # Script de inicialização
└── project-template/          # Template base do projeto
    ├── package.json           # Dependências + scripts de geração
    ├── plopfile.js           # Configuração Plop
    ├── plop-templates/       # Templates de geração
    ├── src/                  # Código fonte base
    ├── tailwind.config.ts    # Configuração Tailwind
    ├── tsconfig.json         # Configuração TypeScript
    └── README.md             # Documentação do projeto
```

## 🎯 Funcionalidades Incluídas

### Sistema de Geração Automatizada
- **35+ templates** Handlebars
- **7 geradores** diferentes (component, page, module, trpc, hook, store, ai)
- **Scripts NPM** pré-configurados
- **Documentação completa** incluída

### Stack Tecnológica Completa
- **Next.js 15** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **tRPC** + Zod validation
- **Zustand** para estado
- **TanStack Query** para data fetching
- **Plop.js** para geração de código

### Comandos Disponíveis
```bash
npm run generate          # Menu principal
npm run gen:component     # Componente React
npm run gen:page          # Página Next.js
npm run gen:module        # Módulo completo
npm run gen:trpc          # Router tRPC
npm run gen:hook          # Hook customizado
npm run gen:store         # Store Zustand
npm run gen:ai            # Templates IA-otimizados
```

## 🔧 Personalização

### Modificar Templates
Os templates estão em `project-template/plop-templates/`. Para customizar:

```bash
# Editar template de componente
vim project-template/plop-templates/component/component.hbs

# Adicionar novo template
mkdir project-template/plop-templates/meu-template
```

### Atualizar Dependências
Edite `project-template/package.json` para adicionar/remover dependências.

### Modificar Setup
Edite `setup_project.sh` para personalizar a inicialização do projeto.

## 🧪 Testes

### Teste Local
```bash
# Criar sandbox para teste
e2b sandbox create crazystack-codegen

# Verificar se o sistema de geração funciona
# (no terminal do sandbox)
npm run generate
```

### Teste de Geração
```bash
# Testar geração de módulo
npm run gen:module
# Nome: TestModule
# Features: Todas

# Verificar arquivos gerados
ls -la src/modules/test-module/
```

## 🚀 Deploy em Produção

### 1. Update da aplicação principal

```typescript
// src/lib/sandbox.ts
export async function createSandboxWithCodegen() {
  const sandbox = await Sandbox.create('SEU_TEMPLATE_ID_PUBLICADO');
  return sandbox;
}
```

### 2. Update das functions Inngest

Certifique-se de que `codeAgentWithCodegenFunction` está exportada e registrada.

### 3. Update da UI (opcional)

Adicione opção na UI para escolher entre template normal e com geração de código:

```tsx
// Exemplo de checkbox na UI de criação de projeto
<Checkbox 
  checked={useCodegen}
  onCheckedChange={setUseCodegen}
  label="Incluir sistema de geração automatizada de código"
/>
```

## 📊 Monitoramento

### Verificar Template Status
```bash
e2b template list
e2b template describe <TEMPLATE_ID>
```

### Logs do Sandbox
```bash
e2b sandbox logs <SANDBOX_ID>
```

## 🔄 Atualizações

Para atualizar o template:

1. Modifique os arquivos em `project-template/`
2. Execute `e2b template build`
3. Teste localmente
4. Execute `e2b template publish`
5. Atualize o código da aplicação

## 💡 Dicas

- **Template ID**: Salve o template ID após publicar
- **Versionamento**: Use tags para versionar templates
- **Testes**: Sempre teste localmente antes de publicar
- **Backup**: Mantenha backup dos templates funcionais
- **Logs**: Monitore logs para debugging

## 🎉 Resultado Final

Depois da configuração completa, os usuários poderão:

1. **Criar projetos** com sistema de geração incluído
2. **Gerar código automaticamente** com `npm run generate`
3. **Usar IA otimizada** que entende a estrutura gerada
4. **Acelerar desenvolvimento** em 10x com consistência total

---

**📝 Nota**: Este template revoluciona a experiência de desenvolvimento ao combinar automação inteligente com otimização para IA, resultando em produtividade massivamente aumentada.