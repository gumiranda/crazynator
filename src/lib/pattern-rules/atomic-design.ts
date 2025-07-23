import { PatternRule, SuggestionCategory, SuggestionType, SuggestionSeverity } from '@/generated/prisma';

export const atomicDesignRules: Omit<PatternRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'component-too-complex',
    category: 'ATOMIC_DESIGN',
    type: 'COMPONENT_STRUCTURE',
    description: 'Detects components that are too large and complex, suggesting breakdown into smaller atomic components',
    pattern: 'function\\s+\\w+.*{[\\s\\S]{500,}}|const\\s+\\w+\\s*=.*=>\\s*{[\\s\\S]{500,}}',
    suggestion: 'This component is quite large ({lines} lines). Consider breaking it down into smaller components following Atomic Design principles:\n\n• **Atoms**: Basic building blocks (buttons, inputs, labels)\n• **Molecules**: Simple groups of atoms (search form, navigation item)\n• **Organisms**: Complex components made of molecules (header, product list)\n• **Templates**: Page-level layouts\n• **Pages**: Specific instances of templates',
    codeExample: `// Instead of one large component:
function LargeComponent() {
  // 500+ lines of code with multiple responsibilities
  return (
    <div>
      <header>...</header>
      <main>...</main>
      <footer>...</footer>
    </div>
  )
}

// Break it down following Atomic Design:
// Atoms
const Button = ({ children, onClick }) => <button onClick={onClick}>{children}</button>
const Input = ({ placeholder, value, onChange }) => <input placeholder={placeholder} value={value} onChange={onChange} />

// Molecules  
const SearchForm = () => (
  <form>
    <Input placeholder="Search..." />
    <Button>Search</Button>
  </form>
)

// Organisms
const Header = () => (
  <header>
    <Logo />
    <SearchForm />
    <Navigation />
  </header>
)

// Templates
const PageLayout = ({ children }) => (
  <div>
    <Header />
    <main>{children}</main>
    <Footer />
  </div>
)`,
    severity: 'WARNING',
    enabled: true,
    priority: 8,
  },
  {
    name: 'missing-atomic-structure',
    category: 'ATOMIC_DESIGN',
    type: 'ARCHITECTURE',
    description: 'Suggests organizing components using Atomic Design structure when components are not properly categorized',
    pattern: 'components/(?!atoms|molecules|organisms|templates|pages)',
    suggestion: 'Consider organizing components using Atomic Design structure for better maintainability:\n\n📁 **components/**\n├── 📁 **atoms/** - Basic building blocks\n├── 📁 **molecules/** - Simple component combinations\n├── 📁 **organisms/** - Complex component sections\n├── 📁 **templates/** - Page layouts\n└── 📁 **pages/** - Specific page instances',
    codeExample: `// Recommended structure:
components/
├── atoms/
│   ├── Button/
│   ├── Input/
│   └── Label/
├── molecules/
│   ├── SearchForm/
│   ├── ProductCard/
│   └── NavigationItem/
├── organisms/
│   ├── Header/
│   ├── ProductList/
│   └── Footer/
├── templates/
│   ├── PageLayout/
│   └── DashboardLayout/
└── pages/
    ├── HomePage/
    └── ProductPage/`,
    severity: 'INFO',
    enabled: true,
    priority: 5,
  },
  {
    name: 'deeply-nested-components',
    category: 'ATOMIC_DESIGN',
    type: 'COMPONENT_STRUCTURE',
    description: 'Detects deeply nested component hierarchies that should be flattened',
    pattern: '<\\w+[^>]*>\\s*<\\w+[^>]*>\\s*<\\w+[^>]*>\\s*<\\w+[^>]*>\\s*<\\w+[^>]*>',
    suggestion: 'This component has deep nesting (5+ levels). Consider extracting nested elements into separate molecules or atoms to improve readability and reusability.',
    codeExample: `// Instead of deep nesting:
function DeepComponent() {
  return (
    <div>
      <section>
        <article>
          <header>
            <h1>Title</h1>
          </header>
        </article>
      </section>
    </div>
  )
}

// Extract into atoms and molecules:
const Title = ({ children }) => <h1>{children}</h1>
const ArticleHeader = ({ title }) => (
  <header>
    <Title>{title}</Title>
  </header>
)
const Article = ({ title, children }) => (
  <article>
    <ArticleHeader title={title} />
    {children}
  </article>
)`,
    severity: 'WARNING',
    enabled: true,
    priority: 6,
  },
  {
    name: 'similar-components-need-abstraction',
    category: 'ATOMIC_DESIGN',
    type: 'COMPONENT_STRUCTURE',
    description: 'Identifies similar components that could be abstracted into reusable atoms or molecules',
    pattern: 'function\\s+(\\w*Button\\w*|\\w*Card\\w*|\\w*Form\\w*).*{[\\s\\S]*?}[\\s\\S]*?function\\s+(\\w*Button\\w*|\\w*Card\\w*|\\w*Form\\w*).*{[\\s\\S]*?}',
    suggestion: 'Found similar components that could be abstracted into reusable atoms. Consider creating a base component with configurable props to reduce code duplication.',
    codeExample: `// Instead of multiple similar components:
const PrimaryButton = ({ children }) => <button className="bg-blue-500 text-white px-4 py-2">{children}</button>
const SecondaryButton = ({ children }) => <button className="bg-gray-500 text-white px-4 py-2">{children}</button>
const DangerButton = ({ children }) => <button className="bg-red-500 text-white px-4 py-2">{children}</button>

// Create a reusable atom:
const Button = ({ variant = 'primary', children, ...props }) => {
  const variants = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white', 
    danger: 'bg-red-500 text-white'
  }
  
  return (
    <button 
      className={\`\${variants[variant]} px-4 py-2\`}
      {...props}
    >
      {children}
    </button>
  )
}`,
    severity: 'INFO',
    enabled: true,
    priority: 4,
  },
  {
    name: 'component-wrong-atomic-level',
    category: 'ATOMIC_DESIGN',
    type: 'COMPONENT_STRUCTURE',
    description: 'Suggests when a component is placed in the wrong atomic design level',
    pattern: 'atoms/.*(?:Form|List|Layout|Page)|molecules/.*(?:Button|Input|Label)(?!.*(?:Group|Set))',
    suggestion: 'This component seems to be in the wrong Atomic Design level:\n\n• **Atoms** should be basic elements (Button, Input, Label)\n• **Molecules** should be simple combinations (SearchForm, ButtonGroup)\n• **Organisms** should be complex sections (Header, ProductList)\n\nConsider moving this component to the appropriate level.',
    codeExample: `// Wrong: Complex form in atoms/
atoms/ContactForm.tsx // ❌ Too complex for atoms

// Right: Move to molecules/
molecules/ContactForm.tsx // ✅ Forms are molecule-level

// Wrong: Simple button in organisms/  
organisms/Button.tsx // ❌ Too simple for organisms

// Right: Move to atoms/
atoms/Button.tsx // ✅ Buttons are atomic-level`,
    severity: 'WARNING',
    enabled: true,
    priority: 7,
  },
];