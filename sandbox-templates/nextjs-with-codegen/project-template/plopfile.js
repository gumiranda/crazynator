export default function (plop) {
  // Helper functions for consistent naming
  plop.setHelper('upperCase', (text) => text.toUpperCase());
  plop.setHelper('lowerCase', (text) => text.toLowerCase());
  plop.setHelper('camelCase', (text) => {
    return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  });
  plop.setHelper('kebabCase', (text) => {
    return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  });

  // 1. React Component Generator (UI Components)
  plop.setGenerator('component', {
    description: 'Generate a React component with TypeScript',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name:',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Component name is required';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'Component type:',
        choices: [
          { name: 'UI Component (shadcn/ui style)', value: 'ui' },
          { name: 'Feature Component', value: 'feature' },
          { name: 'Layout Component', value: 'layout' },
          { name: 'Page Component', value: 'page' }
        ]
      },
      {
        type: 'confirm',
        name: 'withStories',
        message: 'Include Storybook stories?',
        default: false
      },
      {
        type: 'confirm',
        name: 'withTests',
        message: 'Include test files?',
        default: true
      }
    ],
    actions: (data) => {
      const actions = [];
      
      if (data.type === 'ui') {
        actions.push({
          type: 'add',
          path: 'src/components/ui/{{kebabCase name}}.tsx',
          templateFile: 'plop-templates/component/ui-component.hbs'
        });
      } else {
        actions.push({
          type: 'add',
          path: 'src/components/{{kebabCase name}}.tsx',
          templateFile: 'plop-templates/component/component.hbs'
        });
      }

      if (data.withTests) {
        actions.push({
          type: 'add',
          path: 'src/components/__tests__/{{kebabCase name}}.test.tsx',
          templateFile: 'plop-templates/component/component.test.hbs'
        });
      }

      if (data.withStories) {
        actions.push({
          type: 'add',
          path: 'src/components/{{kebabCase name}}.stories.tsx',
          templateFile: 'plop-templates/component/component.stories.hbs'
        });
      }

      return actions;
    }
  });

  // 2. tRPC Router Generator
  plop.setGenerator('trpc-router', {
    description: 'Generate a tRPC router with procedures',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Router name:',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Router name is required';
          }
          return true;
        }
      },
      {
        type: 'checkbox',
        name: 'procedures',
        message: 'Select procedures to include:',
        choices: [
          { name: 'List/Get All', value: 'list' },
          { name: 'Get by ID', value: 'getById' },
          { name: 'Create', value: 'create' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' }
        ]
      },
      {
        type: 'confirm',
        name: 'withAuth',
        message: 'Include authentication?',
        default: true
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'src/trpc/routers/{{camelCase name}}.ts',
        templateFile: 'plop-templates/trpc/router.hbs'
      }
    ]
  });

  // 3. Next.js Page Generator
  plop.setGenerator('page', {
    description: 'Generate a Next.js page with layout',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Page name:',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Page name is required';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'Page type:',
        choices: [
          { name: 'Static Page', value: 'static' },
          { name: 'Dynamic Page [id]', value: 'dynamic' },
          { name: 'API Route', value: 'api' }
        ]
      },
      {
        type: 'confirm',
        name: 'withLayout',
        message: 'Include custom layout?',
        default: false
      }
    ],
    actions: (data) => {
      const actions = [];
      
      if (data.type === 'api') {
        actions.push({
          type: 'add',
          path: 'src/app/api/{{kebabCase name}}/route.ts',
          templateFile: 'plop-templates/page/api-route.hbs'
        });
      } else if (data.type === 'dynamic') {
        actions.push({
          type: 'add',
          path: 'src/app/{{kebabCase name}}/[id]/page.tsx',
          templateFile: 'plop-templates/page/dynamic-page.hbs'
        });
      } else {
        actions.push({
          type: 'add',
          path: 'src/app/{{kebabCase name}}/page.tsx',
          templateFile: 'plop-templates/page/static-page.hbs'
        });
      }

      if (data.withLayout) {
        actions.push({
          type: 'add',
          path: 'src/app/{{kebabCase name}}/layout.tsx',
          templateFile: 'plop-templates/page/layout.hbs'
        });
      }

      return actions;
    }
  });

  // 4. Module Generator (Feature Module)
  plop.setGenerator('module', {
    description: 'Generate a complete feature module with UI and server components',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Module name:',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Module name is required';
          }
          return true;
        }
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to include:',
        choices: [
          { name: 'tRPC Procedures', value: 'trpc' },
          { name: 'UI Components', value: 'ui' },
          { name: 'Views/Pages', value: 'views' },
          { name: 'Types/Schemas', value: 'types' },
          { name: 'Hooks', value: 'hooks' },
          { name: 'Stores (Zustand)', value: 'stores' }
        ]
      }
    ],
    actions: (data) => {
      const actions = [];
      const modulePath = `src/modules/{{kebabCase name}}`;

      if (data.features.includes('trpc')) {
        actions.push({
          type: 'add',
          path: `${modulePath}/server/procedures.ts`,
          templateFile: 'plop-templates/module/procedures.hbs'
        });
      }

      if (data.features.includes('ui')) {
        actions.push({
          type: 'add',
          path: `${modulePath}/ui/components/index.ts`,
          templateFile: 'plop-templates/module/components-index.hbs'
        });
        actions.push({
          type: 'add',
          path: `${modulePath}/ui/components/{{pascalCase name}}List.tsx`,
          templateFile: 'plop-templates/module/list-component.hbs'
        });
        actions.push({
          type: 'add',
          path: `${modulePath}/ui/components/{{pascalCase name}}Form.tsx`,
          templateFile: 'plop-templates/module/form-component.hbs'
        });
      }

      if (data.features.includes('views')) {
        actions.push({
          type: 'add',
          path: `${modulePath}/ui/views/{{pascalCase name}}View.tsx`,
          templateFile: 'plop-templates/module/view.hbs'
        });
      }

      if (data.features.includes('types')) {
        actions.push({
          type: 'add',
          path: `${modulePath}/types/index.ts`,
          templateFile: 'plop-templates/module/types.hbs'
        });
      }

      if (data.features.includes('hooks')) {
        actions.push({
          type: 'add',
          path: `${modulePath}/hooks/use{{pascalCase name}}.ts`,
          templateFile: 'plop-templates/module/hooks.hbs'
        });
      }

      if (data.features.includes('stores')) {
        actions.push({
          type: 'add',
          path: `${modulePath}/stores/{{camelCase name}}Store.ts`,
          templateFile: 'plop-templates/module/store.hbs'
        });
      }

      return actions;
    }
  });

  // 5. Hook Generator
  plop.setGenerator('hook', {
    description: 'Generate a custom React hook',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Hook name (without "use" prefix):',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Hook name is required';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'Hook type:',
        choices: [
          { name: 'State Hook', value: 'state' },
          { name: 'Effect Hook', value: 'effect' },
          { name: 'Query Hook (tRPC)', value: 'query' },
          { name: 'Custom Hook', value: 'custom' }
        ]
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'src/hooks/use{{pascalCase name}}.ts',
        templateFile: 'plop-templates/hook/hook.hbs'
      }
    ]
  });

  // 6. Store Generator (Zustand)
  plop.setGenerator('store', {
    description: 'Generate a Zustand store',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Store name:',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Store name is required';
          }
          return true;
        }
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to include:',
        choices: [
          { name: 'Persistence', value: 'persist' },
          { name: 'DevTools', value: 'devtools' },
          { name: 'Async Actions', value: 'async' }
        ]
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'src/stores/{{camelCase name}}Store.ts',
        templateFile: 'plop-templates/store/store.hbs'
      }
    ]
  });

  // 7. AI-Optimized Template Generator
  plop.setGenerator('ai-template', {
    description: 'Generate AI-optimized code templates for common patterns',
    prompts: [
      {
        type: 'list',
        name: 'template',
        message: 'Select AI template:',
        choices: [
          { name: 'CRUD Operations Template', value: 'crud' },
          { name: 'Form with Validation Template', value: 'form' },
          { name: 'Data Table Template', value: 'table' },
          { name: 'Dashboard Layout Template', value: 'dashboard' },
          { name: 'Authentication Flow Template', value: 'auth' }
        ]
      },
      {
        type: 'input',
        name: 'entityName',
        message: 'Entity name (e.g., User, Product, etc.):',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Entity name is required';
          }
          return true;
        }
      }
    ],
    actions: (data) => {
      const actions = [];
      const entityPath = `src/generated/{{kebabCase entityName}}`;

      switch (data.template) {
        case 'crud':
          actions.push(
            {
              type: 'add',
              path: `${entityPath}/types.ts`,
              templateFile: 'plop-templates/ai-templates/crud/types.hbs'
            },
            {
              type: 'add',
              path: `${entityPath}/procedures.ts`,
              templateFile: 'plop-templates/ai-templates/crud/procedures.hbs'
            },
            {
              type: 'add',
              path: `${entityPath}/components/{{pascalCase entityName}}List.tsx`,
              templateFile: 'plop-templates/ai-templates/crud/list.hbs'
            },
            {
              type: 'add',
              path: `${entityPath}/components/{{pascalCase entityName}}Form.tsx`,
              templateFile: 'plop-templates/ai-templates/crud/form.hbs'
            }
          );
          break;
        case 'form':
          actions.push({
            type: 'add',
            path: `${entityPath}/{{pascalCase entityName}}Form.tsx`,
            templateFile: 'plop-templates/ai-templates/form/form.hbs'
          });
          break;
        case 'table':
          actions.push({
            type: 'add',
            path: `${entityPath}/{{pascalCase entityName}}Table.tsx`,
            templateFile: 'plop-templates/ai-templates/table/table.hbs'
          });
          break;
        case 'dashboard':
          actions.push(
            {
              type: 'add',
              path: `${entityPath}/DashboardLayout.tsx`,
              templateFile: 'plop-templates/ai-templates/dashboard/layout.hbs'
            },
            {
              type: 'add',
              path: `${entityPath}/DashboardStats.tsx`,
              templateFile: 'plop-templates/ai-templates/dashboard/stats.hbs'
            }
          );
          break;
        case 'auth':
          actions.push(
            {
              type: 'add',
              path: `${entityPath}/AuthProvider.tsx`,
              templateFile: 'plop-templates/ai-templates/auth/provider.hbs'
            },
            {
              type: 'add',
              path: `${entityPath}/AuthGuard.tsx`,
              templateFile: 'plop-templates/ai-templates/auth/guard.hbs'
            }
          );
          break;
      }

      return actions;
    }
  });
}