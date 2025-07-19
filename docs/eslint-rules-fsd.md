# Regras ESLint para Feature Sliced Design

## 📋 Regras Customizadas para FSD

Este documento descreve as regras ESLint customizadas que ajudam a manter a arquitetura Feature Sliced Design.

## 🚫 Import Restrictions

### 1. Dependency Rule
```javascript
// .eslintrc.js
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          // shared não pode importar de outras camadas
          {
            "target": "./src/shared/**/*",
            "from": "./src/app/**/*",
            "message": "shared layer cannot import from app layer"
          },
          {
            "target": "./src/shared/**/*",
            "from": "./src/pages/**/*",
            "message": "shared layer cannot import from pages layer"
          },
          {
            "target": "./src/shared/**/*",
            "from": "./src/widgets/**/*",
            "message": "shared layer cannot import from widgets layer"
          },
          {
            "target": "./src/shared/**/*",
            "from": "./src/features/**/*",
            "message": "shared layer cannot import from features layer"
          },
          {
            "target": "./src/shared/**/*",
            "from": "./src/entities/**/*",
            "message": "shared layer cannot import from entities layer"
          },
          
          // entities não pode importar de features, widgets, pages, app
          {
            "target": "./src/entities/**/*",
            "from": "./src/features/**/*",
            "message": "entities layer cannot import from features layer"
          },
          {
            "target": "./src/entities/**/*",
            "from": "./src/widgets/**/*",
            "message": "entities layer cannot import from widgets layer"
          },
          {
            "target": "./src/entities/**/*",
            "from": "./src/pages/**/*",
            "message": "entities layer cannot import from pages layer"
          },
          {
            "target": "./src/entities/**/*",
            "from": "./src/app/**/*",
            "message": "entities layer cannot import from app layer"
          },
          
          // features não pode importar de widgets, pages, app
          {
            "target": "./src/features/**/*",
            "from": "./src/widgets/**/*",
            "message": "features layer cannot import from widgets layer"
          },
          {
            "target": "./src/features/**/*",
            "from": "./src/pages/**/*",
            "message": "features layer cannot import from pages layer"
          },
          {
            "target": "./src/features/**/*",
            "from": "./src/app/**/*",
            "message": "features layer cannot import from app layer"
          },
          
          // widgets não pode importar de pages, app
          {
            "target": "./src/widgets/**/*",
            "from": "./src/pages/**/*",
            "message": "widgets layer cannot import from pages layer"
          },
          {
            "target": "./src/widgets/**/*",
            "from": "./src/app/**/*",
            "message": "widgets layer cannot import from app layer"
          },
          
          // pages não pode importar de app
          {
            "target": "./src/pages/**/*",
            "from": "./src/app/**/*",
            "message": "pages layer cannot import from app layer"
          }
        ]
      }
    ]
  }
}
```

### 2. Slice Isolation
```javascript
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          // features não podem importar entre si diretamente
          {
            "target": "./src/features/auth/**/*",
            "from": "./src/features/!(auth)/**/*",
            "message": "Cross-feature imports are not allowed. Use shared layer instead."
          },
          {
            "target": "./src/features/user/**/*",
            "from": "./src/features/!(user)/**/*",
            "message": "Cross-feature imports are not allowed. Use shared layer instead."
          },
          
          // entities não podem importar entre si diretamente
          {
            "target": "./src/entities/user/**/*",
            "from": "./src/entities/!(user)/**/*",
            "message": "Cross-entity imports are not allowed. Use shared layer instead."
          }
        ]
      }
    ]
  }
}
```

## 📝 Naming Conventions

### 1. File Naming
```javascript
{
  "rules": {
    "unicorn/filename-case": [
      "error",
      {
        "cases": {
          "kebabCase": true,
          "pascalCase": true
        }
      }
    ]
  }
}
```

### 2. Component Naming
```javascript
{
  "rules": {
    "react/jsx-pascal-case": ["error", { "allowAllCaps": true }],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "custom": {
          "regex": "^I[A-Z]|Props$|State$|Config$",
          "match": true
        }
      },
      {
        "selector": "typeAlias",
        "format": ["PascalCase"]
      },
      {
        "selector": "enum",
        "format": ["PascalCase"]
      },
      {
        "selector": "variable",
        "modifiers": ["const"],
        "format": ["camelCase", "PascalCase", "UPPER_CASE"]
      }
    ]
  }
}
```

## 🏗️ Architecture Rules

### 1. Prefer Barrel Exports
```javascript
{
  "rules": {
    "import/no-internal-modules": [
      "error",
      {
        "allow": [
          "**/shared/**",
          "**/ui/**",
          "**/lib/**",
          "**/config/**"
        ]
      }
    ]
  }
}
```

### 2. Component Structure
```javascript
{
  "rules": {
    "react/function-component-definition": [
      "error",
      {
        "namedComponents": "arrow-function",
        "unnamedComponents": "arrow-function"
      }
    ],
    "react/jsx-props-no-spreading": "off",
    "react/require-default-props": "off"
  }
}
```

## 🎯 TypeScript Rules

### 1. Strict Type Checking
```javascript
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error"
  }
}
```

### 2. Import Order
```javascript
{
  "rules": {
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "pathGroups": [
          {
            "pattern": "react",
            "group": "external",
            "position": "before"
          },
          {
            "pattern": "next/**",
            "group": "external",
            "position": "before"
          },
          {
            "pattern": "@/app/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/pages/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/widgets/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/features/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/entities/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/shared/**",
            "group": "internal",
            "position": "before"
          }
        ],
        "pathGroupsExcludedImportTypes": ["react"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ]
  }
}
```

## 🔧 Configuration Example

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: [
    '@typescript-eslint',
    'import',
    'react',
    'react-hooks',
    'unicorn'
  ],
  rules: {
    // FSD Architecture Rules
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Add your FSD rules here
        ]
      }
    ],
    
    // Import organization
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before'
          },
          {
            pattern: '@/shared/**',
            group: 'internal',
            position: 'after'
          }
        ],
        'newlines-between': 'always'
      }
    ],
    
    // TypeScript
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' }
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    
    // React
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
    
    // Naming
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          kebabCase: true,
          pascalCase: true
        }
      }
    ]
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  }
};
```

## 🚀 VSCode Settings

```json
// .vscode/settings.json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.includeAutomaticOptionalChainCompletions": true
}
```

## 📋 Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```