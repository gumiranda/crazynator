export interface UILibrary {
  id: string;
  name: string;
  description: string;
  npmPackages: string[]; // packages to install in sandbox
  importPrefix: string; // e.g. "@/components/aceternity"
  category: 'landing' | 'dashboard' | 'general' | 'animation';
  recommended: string[]; // recommended use cases
  installCommand: string; // full install command for sandbox
  setupFiles?: Record<string, string>; // files to create after install
  docs: string;
  icon: string; // emoji
}

export const UI_LIBRARIES: UILibrary[] = [
  {
    id: 'aceternity',
    name: 'Aceternity UI',
    description:
      'Beautiful animated components perfect for landing pages, hero sections, and marketing sites.',
    npmPackages: ['framer-motion', 'clsx', 'tailwind-merge', 'mini-svg-data-uri'],
    importPrefix: '@/components/aceternity',
    category: 'landing',
    recommended: ['Landing pages', 'Hero sections', 'Marketing sites', 'Portfolios'],
    installCommand: 'npm install framer-motion mini-svg-data-uri --yes',
    docs: 'https://ui.aceternity.com',
    icon: '✨',
  },
  {
    id: 'magic-ui',
    name: 'Magic UI',
    description:
      'Animated components and effects for creating magical user experiences with smooth transitions.',
    npmPackages: ['framer-motion', '@number-flow/react'],
    importPrefix: '@/components/magicui',
    category: 'animation',
    recommended: ['Animations', 'Transitions', 'Interactive elements', 'Data visualization'],
    installCommand: 'npm install framer-motion @number-flow/react --yes',
    docs: 'https://magicui.design',
    icon: '🪄',
  },
  {
    id: 'cult-ui',
    name: 'Cult UI',
    description:
      'Experimental and creative UI components for building unique, cutting-edge interfaces.',
    npmPackages: ['framer-motion'],
    importPrefix: '@/components/cult-ui',
    category: 'general',
    recommended: ['Creative layouts', 'Experimental UIs', 'Unique interactions'],
    installCommand: 'npm install framer-motion --yes',
    docs: 'https://www.cult-ui.com',
    icon: '🔮',
  },
  {
    id: 'origin-ui',
    name: 'Origin UI',
    description:
      'Clean, minimal components focused on simplicity and accessibility. Great for SaaS and web apps.',
    npmPackages: [],
    importPrefix: '@/components/origin-ui',
    category: 'general',
    recommended: ['SaaS apps', 'Web applications', 'Clean interfaces', 'Forms'],
    installCommand: '', // Uses shadcn as base, no extra deps
    docs: 'https://originui.com',
    icon: '🎯',
  },
  {
    id: 'kibo-ui',
    name: 'Kibo UI',
    description:
      'Feature-rich dashboard components including data tables, charts, kanban boards, and admin panels.',
    npmPackages: ['@tanstack/react-table', 'recharts', '@hello-pangea/dnd'],
    importPrefix: '@/components/kibo',
    category: 'dashboard',
    recommended: ['Dashboards', 'Admin panels', 'Data tables', 'Analytics'],
    installCommand: 'npm install @tanstack/react-table @hello-pangea/dnd --yes',
    docs: 'https://www.kibo-ui.com',
    icon: '📊',
  },
] as const;

// Preset combinations users can choose
export const UI_LIBRARY_PRESETS = [
  {
    id: 'landing-dashboard',
    name: 'Landing + Dashboard',
    description: 'Aceternity for marketing pages, Kibo for admin dashboards',
    libraries: ['aceternity', 'kibo-ui'],
    icon: '🚀',
  },
  {
    id: 'full-saas',
    name: 'Full SaaS Stack',
    description: 'Origin UI for clean forms, Kibo for dashboards, Magic UI for animations',
    libraries: ['origin-ui', 'kibo-ui', 'magic-ui'],
    icon: '💼',
  },
  {
    id: 'creative',
    name: 'Creative & Experimental',
    description: 'Aceternity + Cult UI + Magic UI for unique, animated experiences',
    libraries: ['aceternity', 'cult-ui', 'magic-ui'],
    icon: '🎨',
  },
  {
    id: 'minimal',
    name: 'Minimal & Clean',
    description: 'Just Origin UI + shadcn for clean, accessible interfaces',
    libraries: ['origin-ui'],
    icon: '🧘',
  },
] as const;

// Get libraries by IDs
export function getUILibraries(ids: string[]): UILibrary[] {
  return UI_LIBRARIES.filter((lib) => ids.includes(lib.id));
}

// Get combined install command for selected libraries
export function getInstallCommand(ids: string[]): string {
  const libs = getUILibraries(ids);
  const allPackages = new Set<string>();
  for (const lib of libs) {
    for (const pkg of lib.npmPackages) {
      allPackages.add(pkg);
    }
  }
  if (allPackages.size === 0) return '';
  return `npm install ${[...allPackages].join(' ')} --yes`;
}

// Generate prompt context about available UI libraries for the AI
export function generateUILibraryPromptContext(selectedLibraryIds: string[]): string {
  if (!selectedLibraryIds || selectedLibraryIds.length === 0) {
    return '';
  }

  const libs = getUILibraries(selectedLibraryIds);
  if (libs.length === 0) return '';

  const sections = libs.map((lib) => {
    return `- ${lib.name} (${lib.id}): ${lib.description}
  Import from: "${lib.importPrefix}/*"
  Best for: ${lib.recommended.join(', ')}`;
  });

  return `
## Available UI Component Libraries (User Selected)
The user has chosen these UI libraries. PREFER using components from these libraries over writing custom components from scratch. This saves tokens and produces better results.

${sections.join('\n\n')}

IMPORTANT: When a user requests a feature that matches one of these library's strengths, use that library's components. For example:
- Landing pages → Use Aceternity UI components
- Dashboards → Use Kibo UI components
- Animations → Use Magic UI components
- Clean forms → Use Origin UI components
- Creative UIs → Use Cult UI components

Components from these libraries are pre-installed in the sandbox under their respective import paths.
`;
}
