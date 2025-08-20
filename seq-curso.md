Continuação do Curso CrazyNator │ │
│ │ │ │
│ │ Analisando o estado atual do curso vs o projeto completo, aqui está a ordem de continuação necessária: │ │
│ │ │ │
│ │ PRÓXIMOS ARQUIVOS PARA O CURSO (em ordem de dependência): │ │
│ │ │ │
│ │ FASE 1: Configurações Base Faltantes │ │
│ │ │ │
│ │ 1. package.json - Dependências e scripts do projeto │ │
│ │ 2. tsconfig.json - Configuração TypeScript │ │
│ │ 3. next.config.ts - Configuração do Next.js │ │
│ │ 4. eslint.config.mjs - Configuração de linting │ │
│ │ 5. postcss.config.mjs - Configuração PostCSS │ │
│ │ 6. components.json - Configuração shadcn/ui │ │
│ │ 7. next-env.d.ts - Tipos globais Next.js │ │
│ │ │ │
│ │ FASE 2: Schema e Tipos │ │
│ │ │ │
│ │ 8. prisma/schema.prisma - Schema do banco de dados │ │
│ │ 9. src/types/files.ts - Tipos para arquivos │ │
│ │ │ │
│ │ FASE 3: Hooks e Utilitários Adicionais │ │
│ │ │ │
│ │ 10. src/hooks/use-current-theme.ts │ │
│ │ 11. src/hooks/use-scroll.ts │ │
│ │ 12. src/lib/font.ts │ │
│ │ 13. src/lib/convert.ts │ │
│ │ 14. src/lib/usage.ts │ │
│ │ 15. src/lib/sandbox.ts │ │
│ │ │ │
│ │ FASE 4: Constantes │ │
│ │ │ │
│ │ 16. src/constants/projects.ts │ │
│ │ 17. src/constants/prompt.ts │ │
│ │ 18. src/constants/sandbox.ts │ │
│ │ │ │
│ │ FASE 5: tRPC Setup │ │
│ │ │ │
│ │ 19. src/trpc/init.ts │ │
│ │ 20. src/trpc/query-client.ts │ │
│ │ 21. src/trpc/routers/\_app.ts │ │
│ │ 22. src/trpc/server.tsx │ │
│ │ 23. src/trpc/client.tsx │ │
│ │ 24. src/app/api/trpc/[trpc]/route.ts │ │
│ │ │ │
│ │ FASE 6: Inngest (Background Jobs) │ │
│ │ │ │
│ │ 25. src/inngest/client.ts │ │
│ │ 26. src/inngest/channels.ts │ │
│ │ 27. src/inngest/utils.ts │ │
│ │ 28. src/stores/inngest-connection-store.ts │ │
│ │ │ │
│ │ FASE 7: Procedures tRPC │ │
│ │ │ │
│ │ 29. src/modules/usage/server/procedures.ts │ │
│ │ 30. src/modules/subscription/server/procedures.ts │ │
│ │ 31. src/modules/messages/server/procedures.ts │ │
│ │ 32. src/modules/projects/server/procedures.ts │ │
│ │ │ │
│ │ FASE 8: Componentes Específicos │ │
│ │ │ │
│ │ 33. src/components/hint.tsx │ │
│ │ 34. src/components/user-control.tsx │ │
│ │ 35. src/components/inngest-connection-status.tsx │ │
│ │ 36. src/components/ui/inngest-provider.tsx │ │
│ │ 37. src/components/ui/kibo-ui/status/index.tsx │ │
│ │ │ │
│ │ FASE 9: Componentes de Código │ │
│ │ │ │
│ │ 38. src/components/file-tree-view.tsx │ │
│ │ 39. src/components/code-view/style.css │ │
│ │ 40. src/components/code-view/index.tsx │ │
│ │ 41. src/components/code-editor.tsx │ │
│ │ 42. src/components/file-explore.tsx │ │
│ │ │ │
│ │ FASE 10: Módulos Home │ │
│ │ │ │
│ │ 43. src/modules/home/ui/components/projects-list.tsx │ │
│ │ 44. src/modules/home/ui/components/project-form.tsx │ │
│ │ 45. src/modules/home/ui/navbar.tsx │ │
│ │ │ │
│ │ FASE 11: Módulos Projects │ │
│ │ │ │
│ │ 46. src/modules/projects/ui/components/usage.tsx │ │
│ │ 47. src/modules/projects/ui/components/project-header.tsx │ │
│ │ 48. src/modules/projects/ui/components/message-loading.tsx │ │
│ │ 49. src/modules/projects/ui/components/message-card.tsx │ │
│ │ 50. src/modules/projects/ui/components/message-form.tsx │ │
│ │ 51. src/modules/projects/ui/components/messages-container.tsx │ │
│ │ 52. src/modules/projects/ui/components/fragment-preview.tsx │ │
│ │ 53. src/modules/projects/ui/components/inngest-provider.tsx │ │
│ │ 54. src/modules/projects/ui/views/project-view.tsx │ │
│ │ │ │
│ │ FASE 12: Inngest Functions │ │
│ │ │ │
│ │ 55. src/inngest/claude-functions.ts │ │
│ │ 56. src/inngest/functions.ts │ │
│ │ 57. src/app/api/inngest/route.ts │ │
│ │ │ │
│ │ FASE 13: Layout Updates │ │
│ │ │ │
│ │ 58. src/app/(home)/layout.tsx (atualizar o existente) │ │
│ │ 59. src/app/projects/[projectId]/page.tsx (página principal do projeto) │ │
│ │ │ │
│ │ FASE 14: Arquivos de Configuração do E2B │ │
│ │ │ │
│ │ 60. sandbox-templates/nextjs/e2b.toml │ │
│ │ 61. sandbox-templates/nextjs/e2b.Dockerfile │ │
│ │ 62. sandbox-templates/nextjs/compile_page.sh
Here is Claude's plan: │
│ ╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮ │
│ │ Guia Detalhado de Continuação do Curso CrazyNator │ │
│ │ │ │
│ │ STATUS ATUAL DO CURSO │ │
│ │ │ │
│ │ ✅ Já implementado: │ │
│ │ - Todos os componentes UI (shadcn/ui completo) │ │
│ │ - Páginas básicas (home, sign-in, sign-up, dashboard, pricing, blog) │ │
│ │ - Middleware de autenticação │ │
│ │ - Lib básica (utils.ts, prisma.ts) │ │
│ │ - APIs de pagamento Stripe │ │
│ │ - Hook use-mobile │ │
│ │ │ │
│ │ ❌ Faltando implementar: As funcionalidades core do CrazyNator │ │
│ │ │ │
│ │ --- │ │
│ │ PRÓXIMAS AULAS - ORDEM DETALHADA │ │
│ │ │ │
│ │ AULA 1: Configurações de Projeto │ │
│ │ │ │
│ │ Arquivos: package.json, tsconfig.json, next.config.ts, eslint.config.mjs │ │
│ │ Conceitos: │ │
│ │ - Dependências essenciais (tRPC, Prisma, Inngest, E2B, CodeMirror) │ │
│ │ - Configuração TypeScript strict │ │
│ │ - Next.js 15 com Turbopack │ │
│ │ Tempo estimado: 30 min │ │
│ │ │ │
│ │ AULA 2: Schema de Dados e Tipos │ │
│ │ │ │
│ │ Arquivos: prisma/schema.prisma, src/types/files.ts │ │
│ │ Conceitos: │ │
│ │ - Modelagem: Project, Message, Fragment, Usage, Subscription │ │
│ │ - Relações entre entidades (1:N, 1:1) │ │
│ │ - Tipos TypeScript para manipulação de arquivos │ │
│ │ Tempo estimado: 45 min │ │
│ │ │ │
│ │ AULA 3: Hooks e Utilitários Avançados │ │
│ │ │ │
│ │ Arquivos: src/hooks/use-current-theme.ts, src/hooks/use-scroll.ts, src/lib/font.ts, src/lib/convert.ts │ │
│ │ Conceitos: │ │
│ │ - Custom hooks para tema e scroll │ │
│ │ - Gerenciamento de fontes │ │
│ │ - Conversão de tipos de dados │ │
│ │ Tempo estimado: 30 min │ │
│ │ │ │
│ │ AULA 4: Constantes e Configurações │ │
│ │ │ │
│ │ Arquivos: src/constants/projects.ts, src/constants/prompt.ts, src/constants/sandbox.ts │ │
│ │ Conceitos: │ │
│ │ - Templates de projetos (Netflix clone, Admin dashboard, etc.) │ │
│ │ - Prompts de sistema para IA │ │
│ │ - Configurações de sandbox E2B │ │
│ │ Tempo estimado: 25 min │ │
│ │ │ │
│ │ AULA 5: tRPC - Configuração Base │ │
│ │ │ │
│ │ Arquivos: src/trpc/init.ts, src/trpc/query-client.ts, src/trpc/routers/\_app.ts │ │
│ │ Conceitos: │ │
│ │ - Context tRPC com autenticação Clerk │ │
│ │ - Middleware de proteção │ │
│ │ - SuperJSON transformer │ │
│ │ - Router principal │ │
│ │ Tempo estimado: 50 min │ │
│ │ │ │
│ │ AULA 6: tRPC - Cliente e Servidor │ │
│ │ │ │
│ │ Arquivos: src/trpc/server.tsx, src/trpc/client.tsx, src/app/api/trpc/[trpc]/route.ts │ │
│ │ Conceitos: │ │
│ │ - Provider tRPC para React │ │
│ │ - Integração com TanStack Query │ │
│ │ - API route handler │ │
│ │ Tempo estimado: 35 min │ │
│ │ │ │
│ │ AULA 7: Inngest - Background Jobs Base │ │
│ │ │ │
│ │ Arquivos: src/inngest/client.ts, src/inngest/channels.ts, src/inngest/utils.ts │ │
│ │ Conceitos: │ │
│ │ - Cliente Inngest │ │
│ │ - Canais de comunicação real-time │ │
│ │ - Utilitários para jobs │ │
│ │ Tempo estimado: 40 min │ │
│ │ │ │
│ │ AULA 8: State Management │ │
│ │ │ │
│ │ Arquivos: src/stores/inngest-connection-store.ts │ │
│ │ Conceitos: │ │
│ │ - Zustand para estado global │ │
│ │ - Estado de conexão Inngest │ │
│ │ - Padrões de store │ │
│ │ Tempo estimado: 20 min │ │
│ │ │ │
│ │ AULA 9: Sandbox e Usage │ │
│ │ │ │
│ │ Arquivos: src/lib/sandbox.ts, src/lib/usage.ts │ │
│ │ Conceitos: │ │
│ │ - Integração com E2B API │ │
│ │ - Gerenciamento de sandboxes │ │
│ │ - Sistema de créditos/usage │ │
│ │ Tempo estimado: 45 min │ │
│ │ │ │
│ │ AULA 10: Procedures tRPC - Usage e Subscription │ │
│ │ │ │
│ │ Arquivos: src/modules/usage/server/procedures.ts, src/modules/subscription/server/procedures.ts │ │
│ │ Conceitos: │ │
│ │ - Procedures protegidas │ │
│ │ - Validação com Zod │ │
│ │ - Lógica de negócio para créditos │ │
│ │ - Integração Stripe │ │
│ │ Tempo estimado: 55 min │ │
│ │ │ │
│ │ AULA 11: Procedures tRPC - Messages e Projects │ │
│ │ │ │
│ │ Arquivos: src/modules/messages/server/procedures.ts, src/modules/projects/server/procedures.ts │ │
│ │ Conceitos: │ │
│ │ - CRUD operations │ │
│ │ - Relações Prisma complexas │ │
│ │ - Filtros e paginação │ │
│ │ Tempo estimado: 60 min │ │
│ │ │ │
│ │ AULA 12: Componentes de Interface │ │
│ │ │ │
│ │ Arquivos: src/components/hint.tsx, src/components/user-control.tsx, src/components/inngest-connection-status.tsx │ │
│ │ Conceitos: │ │
│ │ - Componentes reutilizáveis │ │
│ │ - Estado de conexão UI │ │
│ │ - Controles de usuário │ │
│ │ Tempo estimado: 30 min │ │
│ │ │ │
│ │ AULA 13: Editor de Código - Base │ │
│ │ │ │
│ │ Arquivos: src/components/file-tree-view.tsx, src/components/code-view/style.css, src/components/code-view/index.tsx │ │
│ │ Conceitos: │ │
│ │ - Tree view para arquivos │ │
│ │ - Syntax highlighting │ │
│ │ - Tema Dracula │ │
│ │ Tempo estimado: 50 min │ │
│ │ │ │
│ │ AULA 14: Editor de Código - Interativo │ │
│ │ │ │
│ │ Arquivos: src/components/code-editor.tsx, src/components/file-explore.tsx │ │
│ │ Conceitos: │ │
│ │ - CodeMirror 6 integration │ │
│ │ - File management │ │
│ │ - Auto-save e sync │ │
│ │ Tempo estimado: 60 min │ │
│ │ │ │
│ │ AULA 15: Módulos Home │ │
│ │ │ │
│ │ Arquivos: src/modules/home/ui/components/projects-list.tsx, src/modules/home/ui/components/project-form.tsx, src/modules/home/ui/navbar.tsx │ │
│ │ Conceitos: │ │
│ │ - Lista de projetos │ │
│ │ - Formulário de criação │ │
│ │ - Navegação principal │ │
│ │ Tempo estimado: 45 min │ │
│ │ │ │
│ │ AULA 16-18: Módulos Projects (3 aulas) │ │
│ │ │ │
│ │ Arquivos: Todos os componentes em src/modules/projects/ui/components/ │ │
│ │ Conceitos: │ │
│ │ - Chat interface │ │
│ │ - Message rendering │ │
│ │ - Loading states │ │
│ │ - Fragment preview │ │
│ │ - Real-time updates │ │
│ │ Tempo estimado: 180 min (3 aulas de 60 min) │ │
│ │ │ │
│ │ AULA 19: Inngest Functions - IA Integration │ │
│ │ │ │
│ │ Arquivos: src/inngest/claude-functions.ts, src/inngest/functions.ts │ │
│ │ Conceitos: │ │
│ │ - Integração Claude/OpenAI │ │
│ │ - Background code generation │ │
│ │ - Error handling │ │
│ │ Tempo estimado: 70 min │ │
│ │ │ │
│ │ AULA 20: API Integration │ │
│ │ │ │
│ │ Arquivos: src/app/api/inngest/route.ts │ │
│ │ Conceitos: │ │
│ │ - Webhook handling │ │
│ │ - Job triggering │ │
│ │ - API security │ │
│ │ Tempo estimado: 30 min │ │
│ │ │ │
│ │ AULA 21: Pages Integration │ │
│ │ │ │
│ │ Arquivos: src/app/(home)/layout.tsx, src/app/projects/[projectId]/page.tsx │ │
│ │ Conceitos: │ │
│ │ - Layout composition │ │
│ │ - Dynamic routing │ │
│ │ - Data fetching patterns │ │
│ │ Tempo estimado: 40 min │ │
│ │ │ │
│ │ AULA 22: E2B Sandbox Setup │ │
│ │ │ │
│ │ Arquivos: sandbox-templates/nextjs/\* │ │
│ │ Conceitos: │ │
│ │ - Docker configuration │ │
│ │ - Sandbox templates │ │
│ │ - Deployment scripts │ │
│ │ Tempo estimado: 35 min │ │
│ │ │ │
│ │ --- │ │
│ │ RESUMO PARA PLANEJAMENTO │ │
│ │ │ │
│ │ - Total de aulas: 22 │ │
│ │ - Tempo total estimado: ~16 horas │ │
│ │ - Complexidade crescente: De configuração básica até integração completa de IA │ │
│ │ - Pontos críticos: tRPC setup, Inngest integration, CodeMirror implementation │ │
│ ╰──────────────────────────
