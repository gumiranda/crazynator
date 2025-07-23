import { PatternRule } from '@/generated/prisma';

export const featureSlicedDesignRules: Omit<PatternRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'missing-fsd-structure',
    category: 'FEATURE_SLICED_DESIGN',
    type: 'ARCHITECTURE',
    description: 'Suggests organizing code using Feature-Sliced Design when FSD structure is not detected',
    pattern: 'src/(?!shared|entities|features|widgets|pages|app)',
    suggestion: 'Consider organizing your code using Feature-Sliced Design for better scalability and maintainability:\n\n📁 **src/**\n├── 📁 **shared/** - Reusable resources\n├── 📁 **entities/** - Business entities\n├── 📁 **features/** - User interactions\n├── 📁 **widgets/** - Compositional layer\n├── 📁 **pages/** - Application pages\n└── 📁 **app/** - App initialization',
    codeExample: `// Feature-Sliced Design structure:
src/
├── shared/           // Reusable across the entire app
│   ├── ui/          // Design system components
│   ├── lib/         // Utility functions
│   ├── api/         // API configuration
│   └── config/      // App configuration
├── entities/        // Business entities (User, Product, etc.)
│   ├── user/
│   └── product/
├── features/        // User interactions (auth, cart, etc.)
│   ├── auth/
│   └── add-to-cart/
├── widgets/         // Compositional layer
│   ├── header/
│   └── product-list/
├── pages/           // Application pages
│   ├── home/
│   └── product/
└── app/             // App initialization
    ├── providers/
    └── styles/`,
    severity: 'INFO',
    enabled: true,
    priority: 3,
  },
  {
    name: 'cross-layer-import',
    category: 'FEATURE_SLICED_DESIGN',
    type: 'ARCHITECTURE',
    description: 'Detects imports that violate FSD layer hierarchy rules',
    pattern: 'import.*from.*[\'"]\\.\\./(features|widgets|pages)/',
    suggestion: 'This import violates Feature-Sliced Design layer rules. Higher layers cannot be imported from lower layers:\n\n**Import Rules:**\n• `shared` ← can import from: none\n• `entities` ← can import from: shared\n• `features` ← can import from: shared, entities\n• `widgets` ← can import from: shared, entities, features\n• `pages` ← can import from: shared, entities, features, widgets\n• `app` ← can import from: all layers\n\nConsider moving shared logic to an appropriate lower layer.',
    codeExample: `// ❌ Wrong: Lower layer importing from higher layer
// entities/user/model.ts
import { addToCart } from '../features/add-to-cart' // ❌ entities can't import features

// ✅ Right: Move shared logic to appropriate layer
// shared/lib/cart-utils.ts
export const calculateTotal = (items) => { /* ... */ }

// entities/user/model.ts
import { calculateTotal } from '../../shared/lib/cart-utils' // ✅ OK

// features/add-to-cart/model.ts  
import { calculateTotal } from '../../shared/lib/cart-utils' // ✅ OK
import { User } from '../../entities/user' // ✅ OK`,
    severity: 'ERROR',
    enabled: true,
    priority: 9,
  },
  {
    name: 'feature-too-large',
    category: 'FEATURE_SLICED_DESIGN',
    type: 'ARCHITECTURE',
    description: 'Detects features that are too large and should be split',
    pattern: 'features/\\w+/.*(?:model|ui|api|lib).*{[\\s\\S]{800,}}',
    suggestion: 'This feature is getting quite large. Consider splitting it into smaller, more focused features or moving some logic to appropriate layers:\n\n• **Split large features** into smaller ones\n• **Extract reusable logic** to `shared/lib`\n• **Move business logic** to `entities`\n• **Create composite widgets** from multiple features',
    codeExample: `// ❌ Large feature doing too much
features/user-management/
├── model.ts (800+ lines) // Too large!
├── ui/
└── api/

// ✅ Split into focused features
features/
├── auth/              // User authentication
├── profile-edit/      // Profile editing
├── user-settings/     // User preferences
└── account-deletion/  // Account management

// Move shared logic to entities
entities/user/
├── model.ts          // User business logic
└── api.ts           // User API calls`,
    severity: 'WARNING',
    enabled: true,
    priority: 6,
  },
  {
    name: 'missing-feature-segments',
    category: 'FEATURE_SLICED_DESIGN',
    type: 'ARCHITECTURE',
    description: 'Suggests proper feature segmentation when standard segments are missing',
    pattern: 'features/\\w+/(?!model|ui|api|lib|config)',
    suggestion: 'Features should be organized using standard segments for consistency:\n\n• **model** - Business logic and state\n• **ui** - React components\n• **api** - External API calls\n• **lib** - Feature-specific utilities\n• **config** - Feature configuration',
    codeExample: `// ✅ Proper feature structure:
features/add-to-cart/
├── model/
│   ├── store.ts      // Zustand store
│   └── types.ts      // TypeScript types
├── ui/
│   ├── AddToCartButton.tsx
│   └── CartIcon.tsx
├── api/
│   └── cartApi.ts    // API calls
├── lib/
│   └── utils.ts      // Feature utilities
└── index.ts          // Public API`,
    severity: 'INFO',
    enabled: true,
    priority: 4,
  },
  {
    name: 'entity-with-ui-logic',
    category: 'FEATURE_SLICED_DESIGN',
    type: 'ARCHITECTURE',
    description: 'Detects UI logic in entities layer which should be moved to features',
    pattern: 'entities/.*(?:component|hook|ui).*(?:useState|useEffect|onClick)',
    suggestion: 'Entities should contain only business logic, not UI logic. Move UI-related code to the appropriate feature:\n\n• **Entities** = Pure business logic\n• **Features** = UI interactions with business logic\n• **Widgets** = Composite UI components',
    codeExample: `// ❌ Wrong: UI logic in entity
// entities/user/UserProfile.tsx
export const UserProfile = () => {
  const [editing, setEditing] = useState(false) // ❌ UI state in entity
  return <div onClick={() => setEditing(true)}>...</div>
}

// ✅ Right: Separate concerns
// entities/user/model.ts
export class User {
  constructor(public name: string, public email: string) {}
  updateProfile(data: ProfileData) { /* business logic */ }
}

// features/profile-edit/ui/ProfileEditor.tsx
export const ProfileEditor = () => {
  const [editing, setEditing] = useState(false) // ✅ UI state in feature
  const user = useUserStore()
  
  return <div onClick={() => setEditing(true)}>...</div>
}`,
    severity: 'WARNING',
    enabled: true,
    priority: 7,
  },
  {
    name: 'shared-with-business-logic',
    category: 'FEATURE_SLICED_DESIGN',
    type: 'ARCHITECTURE',
    description: 'Detects business logic in shared layer which should be moved to entities',
    pattern: 'shared/.*(?:User|Product|Order|Customer|Account).*(?:create|update|delete|validate)',
    suggestion: 'Shared layer should contain only generic utilities, not business logic. Move business-specific code to entities:\n\n• **Shared** = Generic, reusable utilities\n• **Entities** = Business logic and domain models',
    codeExample: `// ❌ Wrong: Business logic in shared
// shared/lib/user-utils.ts
export const validateUser = (user) => { /* business validation */ } // ❌ Business logic

// ✅ Right: Move to entities
// entities/user/lib/validation.ts
export const validateUser = (user) => { /* business validation */ } // ✅ Business logic in entity

// shared/lib/validation.ts
export const validateEmail = (email) => { /* generic validation */ } // ✅ Generic utility`,
    severity: 'WARNING',
    enabled: true,
    priority: 8,
  },
];