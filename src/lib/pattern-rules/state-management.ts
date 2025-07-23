import { PatternRule } from '@/generated/prisma';

export const stateManagementRules: Omit<PatternRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'local-state-should-be-global',
    category: 'ZUSTAND',
    type: 'STATE_MANAGEMENT',
    description: 'Suggests using Zustand for state that is shared across multiple components',
    pattern: 'useState.*\\[.*,.*\\].*=.*useState\\([^)]*\\)[\\s\\S]*?(?:props\\.|\\w+\\s*=\\s*\\{[^}]*\\w+[^}]*\\})',
    suggestion: 'This state appears to be passed between components or used in multiple places. Consider using Zustand for global state management to avoid prop drilling and improve state consistency.',
    codeExample: `// ❌ Prop drilling with local state
function App() {
  const [user, setUser] = useState(null)
  return <Dashboard user={user} setUser={setUser} />
}

function Dashboard({ user, setUser }) {
  return <Profile user={user} setUser={setUser} />
}

// ✅ Use Zustand for global state
import { create } from 'zustand'

const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null })
}))

function Dashboard() {
  const { user, setUser } = useUserStore()
  return <Profile />
}

function Profile() {
  const { user, setUser } = useUserStore()
  // Use user and setUser directly
}`,
    severity: 'INFO',
    enabled: true,
    priority: 5,
  },
  {
    name: 'zustand-store-too-large',
    category: 'ZUSTAND',
    type: 'STATE_MANAGEMENT',
    description: 'Detects Zustand stores that are too large and should be split into smaller stores',
    pattern: 'create\\s*\\(\\s*\\([^)]*\\)\\s*=>\\s*\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]{400,}\\}',
    suggestion: 'This Zustand store is getting quite large. Consider splitting it into smaller, focused stores based on domain boundaries for better maintainability and performance.',
    codeExample: `// ❌ Large monolithic store
const useAppStore = create((set) => ({
  // User state (100+ lines)
  user: null,
  setUser: (user) => set({ user }),
  // Cart state (100+ lines)  
  cart: [],
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  // UI state (100+ lines)
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  // ... many more properties
}))

// ✅ Split into focused stores
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null })
}))

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter(item => item.id !== id) 
  }))
}))

const useUIStore = create((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading })
}))`,
    severity: 'WARNING',
    enabled: true,
    priority: 7,
  },
  {
    name: 'zustand-mutation-detected',
    category: 'ZUSTAND',
    type: 'STATE_MANAGEMENT',
    description: 'Detects direct state mutations in Zustand stores which should use immutable updates',
    pattern: 'set\\s*\\(\\s*\\([^)]*state[^)]*\\)\\s*=>\\s*[^{]*state\\.[^=]*=[^,}]',
    suggestion: 'Direct state mutation detected in Zustand store. Always use immutable update patterns to ensure proper state updates and re-renders.',
    codeExample: `// ❌ Direct mutation (wrong)
const useStore = create((set) => ({
  user: { name: '', email: '' },
  updateUser: (data) => set((state) => {
    state.user.name = data.name // ❌ Direct mutation
    return state
  })
}))

// ✅ Immutable updates (correct)
const useStore = create((set) => ({
  user: { name: '', email: '' },
  updateUser: (data) => set((state) => ({
    user: { ...state.user, ...data } // ✅ Immutable update
  }))
}))

// ✅ Using Immer for complex updates
import { produce } from 'immer'

const useStore = create((set) => ({
  users: [],
  updateUser: (id, data) => set(
    produce((state) => {
      const user = state.users.find(u => u.id === id)
      if (user) {
        Object.assign(user, data) // ✅ Safe with Immer
      }
    })
  )
}))`,
    severity: 'ERROR',
    enabled: true,
    priority: 9,
  },
  {
    name: 'missing-zustand-selectors',
    category: 'ZUSTAND',
    type: 'STATE_MANAGEMENT',
    description: 'Suggests using selectors to optimize Zustand store subscriptions',
    pattern: 'const\\s+\\{[^}]+\\}\\s*=\\s*use\\w+Store\\(\\)',
    suggestion: 'Consider using selectors to optimize performance by subscribing only to the state you need. This prevents unnecessary re-renders when other parts of the store update.',
    codeExample: `// ❌ Subscribing to entire store
const { user, cart, ui } = useAppStore() // Re-renders on any store change

// ✅ Use selectors for specific data
const user = useAppStore((state) => state.user)
const cartCount = useAppStore((state) => state.cart.length)
const isLoading = useAppStore((state) => state.ui.isLoading)

// ✅ Create reusable selectors
const selectUser = (state) => state.user
const selectCartCount = (state) => state.cart.length

function Profile() {
  const user = useAppStore(selectUser) // Only re-renders when user changes
  return <div>{user.name}</div>
}

// ✅ Shallow equality for objects
import { shallow } from 'zustand/shallow'

const { addToCart, removeFromCart } = useCartStore(
  (state) => ({ 
    addToCart: state.addToCart, 
    removeFromCart: state.removeFromCart 
  }),
  shallow
)`,
    severity: 'INFO',
    enabled: true,
    priority: 4,
  },
  {
    name: 'zustand-async-action-pattern',
    category: 'ZUSTAND',
    type: 'STATE_MANAGEMENT',
    description: 'Suggests proper patterns for async actions in Zustand stores',
    pattern: 'async\\s+\\w+\\s*:\\s*\\([^)]*\\)\\s*=>\\s*\\{[^}]*(?:fetch|axios|api)[^}]*set\\s*\\(',
    suggestion: 'Consider implementing proper loading and error states for async actions in your Zustand store to improve user experience.',
    codeExample: `// ❌ Basic async action without proper state management
const useUserStore = create((set) => ({
  user: null,
  fetchUser: async (id) => {
    const user = await api.getUser(id)
    set({ user })
  }
}))

// ✅ Proper async action with loading and error states
const useUserStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  
  fetchUser: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const user = await api.getUser(id)
      set({ user, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  clearError: () => set({ error: null })
}))

// ✅ Generic async action wrapper
const createAsyncAction = (actionFn) => async (...args) => {
  const { set } = get()
  set({ isLoading: true, error: null })
  try {
    const result = await actionFn(...args)
    set({ isLoading: false })
    return result
  } catch (error) {
    set({ error: error.message, isLoading: false })
    throw error
  }
}`,
    severity: 'INFO',
    enabled: true,
    priority: 6,
  },
  {
    name: 'zustand-devtools-missing',
    category: 'ZUSTAND',
    type: 'STATE_MANAGEMENT',
    description: 'Suggests adding devtools support for better debugging experience',
    pattern: 'create\\s*\\(\\s*\\([^)]*\\)\\s*=>\\s*\\([^)]*\\)\\s*=>\\s*\\{(?![\\s\\S]*devtools)',
    suggestion: 'Consider adding Zustand devtools support for better debugging experience during development.',
    codeExample: `// ❌ Store without devtools
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))

// ✅ Store with devtools (development only)
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }))
    }),
    {
      name: 'counter-store', // Store name in devtools
    }
  )
)

// ✅ Conditional devtools for production
const useStore = create(
  process.env.NODE_ENV === 'development'
    ? devtools((set) => ({ /* store */ }))
    : (set) => ({ /* store */ })
)`,
    severity: 'INFO',
    enabled: true,
    priority: 2,
  },
];