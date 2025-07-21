# 🚀 Editor de Código em Tempo Real

Esta funcionalidade permite editar e sincronizar código gerado pelos fragmentos da IA em tempo real com o sandbox.

## ✨ Funcionalidades

### 📝 **Editor Monaco Integrado**

- Syntax highlighting completo
- Autocomplete e IntelliSense
- Detecção automática de linguagem
- Tema claro/escuro automático
- Bracket matching e guias de indentação

### 🔄 **Sincronização em Tempo Real**

- Debounce de 500ms para otimizar performance
- Sincronização automática com sandbox E2B
- Persistência no banco de dados
- Indicadores visuais de mudanças não salvas

### 🎛️ **Interface de Usuário**

- Toggle entre modo edição e visualização
- Botão de salvar para mudanças pendentes
- Indicador de "unsaved changes" com animação
- Refresh do preview automático
- Timestamps de última atualização

## 🔧 **Como Usar**

### 1. **Visualizar Código**

- Navegue para um projeto e selecione um fragmento
- Clique na aba "Code" para ver os arquivos
- Por padrão, o código abre em modo de edição

### 2. **Editar Arquivos**

- Clique em qualquer arquivo na árvore de arquivos
- O editor Monaco carrega automaticamente
- Digite para editar - mudanças são detectadas instantaneamente
- Indicador "Unsaved changes" aparece quando há modificações

### 3. **Salvar Mudanças**

- Clique no botão "Save" quando há mudanças pendentes
- As mudanças são sincronizadas com:
  - Banco de dados (persistência)
  - Sandbox E2B (execução)
  - Preview iframe (visualização)

### 4. **Alternar Modos**

- 👁️ **Modo Visualização**: Código somente leitura com syntax highlighting
- ✏️ **Modo Edição**: Editor Monaco completo com autocomplete

### 5. **Atualizar Preview**

- Clique em "Refresh" no preview para ver mudanças
- Timestamp mostra quando foi atualizado pela última vez
- Preview atualiza automaticamente quando arquivos mudam

## 🏗️ **Arquitetura Técnica**

### **Componentes Principais**

```
CodeEditor.tsx          // Editor Monaco wrapper
FileExplore.tsx         // Gerenciador de arquivos com edição
FragmentPreview.tsx     // Preview com refresh automático
procedures.ts          // API TRPC para updates
```

### **Fluxo de Dados**

1. **Edição** → Editor Monaco detecta mudanças
2. **Debounce** → 500ms delay para otimizar
3. **Local State** → Atualiza estado local imediatamente
4. **API Call** → TRPC mutation para salvar
5. **Database** → Persiste no PostgreSQL
6. **E2B Sync** → Atualiza arquivos no sandbox
7. **Preview** → Refresh automático do iframe

### **Tratamento de Erros**

- Conexão com sandbox perdida → Log warning, continua salvando
- Erro de rede → Toast de erro, permite retry
- Timeout → Graceful degradation

## 🎯 **Benefícios**

### **Para Desenvolvedores**

- ✅ Edição imediata do código gerado
- ✅ Teste em tempo real no sandbox
- ✅ Workflow natural de desenvolvimento
- ✅ Persistência automática

### **Para Experiência do Usuário**

- ✅ Interface intuitiva e responsiva
- ✅ Feedback visual claro
- ✅ Performance otimizada
- ✅ Mobile-friendly (drawer)

### **Para o Produto**

- ✅ Diferencial competitivo
- ✅ Aumento de engagement
- ✅ Redução de friction
- ✅ Melhor retenção de usuários

## 🔮 **Próximos Passos**

### **Funcionalidades Futuras**

- [ ] **WebSocket** para colaboração em tempo real
- [ ] **Git integration** para versionamento
- [ ] **Code snippets** e templates
- [ ] **AI-powered suggestions** no editor
- [ ] **Multi-file editing** em tabs
- [ ] **Download/upload** de projetos

### **Otimizações**

- [ ] **Lazy loading** de arquivos grandes
- [ ] **Compression** para sync de arquivos
- [ ] **Offline support** com sync queue
- [ ] **Performance monitoring** de edições

---

_Implementado com ❤️ usando Monaco Editor, TRPC, e E2B Sandbox_
