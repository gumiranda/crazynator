import { z } from 'zod'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Design Token Schema
export const DesignTokenSchema = z.object({
  colors: z.record(z.string()).optional(),
  spacing: z.record(z.string()).optional(),
  typography: z.object({
    fontFamilies: z.record(z.string()).optional(),
    fontSizes: z.record(z.string()).optional(),
    fontWeights: z.record(z.string()).optional(),
    lineHeights: z.record(z.string()).optional(),
    letterSpacing: z.record(z.string()).optional(),
  }).optional(),
  borders: z.object({
    radius: z.record(z.string()).optional(),
    width: z.record(z.string()).optional(),
  }).optional(),
  shadows: z.record(z.string()).optional(),
  breakpoints: z.record(z.string()).optional(),
  animations: z.record(z.object({
    keyframes: z.record(z.any()),
    duration: z.string(),
    timingFunction: z.string().optional(),
    fillMode: z.string().optional(),
  })).optional(),
})

export type DesignTokens = z.infer<typeof DesignTokenSchema>

// Design System Configuration Schema
export const DesignSystemConfigSchema = z.object({
  name: z.string(),
  version: z.string().optional().default('1.0.0'),
  description: z.string().optional(),
  tokens: DesignTokenSchema,
  components: z.record(z.object({
    base: z.string(),
    variants: z.record(z.string()).optional(),
    sizes: z.record(z.string()).optional(),
    states: z.record(z.string()).optional(),
  })).optional(),
  utilities: z.record(z.string()).optional(),
  customCSS: z.string().optional(),
})

export type DesignSystemConfig = z.infer<typeof DesignSystemConfigSchema>

// Built-in Design Systems
export const builtInDesignSystems = {
  default: {
    name: 'Default System',
    version: '1.0.0',
    description: 'Default design system based on shadcn/ui',
    tokens: {
      colors: {
        primary: 'oklch(0.5417 0.179 288.0332)',
        secondary: 'oklch(0.9174 0.0435 292.6901)',
        background: 'oklch(0.973 0.0133 286.1503)',
        foreground: 'oklch(0.3015 0.0572 282.4176)',
        muted: 'oklch(0.958 0.0133 286.1454)',
        accent: 'oklch(0.9221 0.0373 262.141)',
        destructive: 'oklch(0.6861 0.2061 14.9941)',
        border: 'oklch(0.9115 0.0216 285.9625)',
        input: 'oklch(0.9115 0.0216 285.9625)',
        ring: 'oklch(0.5417 0.179 288.0332)',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
      typography: {
        fontFamilies: {
          sans: 'Inter, sans-serif',
          serif: 'Georgia, serif',
          mono: 'JetBrains Mono, monospace',
        },
        fontSizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
        },
      },
      borders: {
        radius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1rem',
        },
      },
    },
  },
  material: {
    name: 'Material Design 3',
    version: '1.0.0',
    description: 'Google Material Design 3 system',
    tokens: {
      colors: {
        primary: '#6750A4',
        secondary: '#625B71',
        tertiary: '#7D5260',
        background: '#FFFBFE',
        surface: '#FFFBFE',
        error: '#BA1A1A',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onTertiary: '#FFFFFF',
        onBackground: '#1C1B1F',
        onSurface: '#1C1B1F',
        onError: '#FFFFFF',
      },
      borders: {
        radius: {
          none: '0',
          xs: '4px',
          sm: '8px',
          md: '12px',
          lg: '16px',
          xl: '28px',
          full: '9999px',
        },
      },
      typography: {
        fontFamilies: {
          sans: 'Roboto, sans-serif',
        },
      },
    },
  },
  fluent: {
    name: 'Microsoft Fluent',
    version: '1.0.0',
    description: 'Microsoft Fluent Design System',
    tokens: {
      colors: {
        primary: '#0078D4',
        secondary: '#107C10',
        tertiary: '#881798',
        background: '#FFFFFF',
        surface: '#F3F2F1',
        error: '#D13438',
        neutral: '#323130',
      },
      borders: {
        radius: {
          sm: '2px',
          md: '4px',
          lg: '6px',
        },
      },
      typography: {
        fontFamilies: {
          sans: 'Segoe UI, sans-serif',
        },
      },
    },
  },
} as const satisfies Record<string, DesignSystemConfig>

// Design System Manager Class
export class DesignSystemManager {
  private currentSystem: DesignSystemConfig
  private customSystems: Map<string, DesignSystemConfig> = new Map()

  constructor(initialSystem: keyof typeof builtInDesignSystems = 'default') {
    this.currentSystem = builtInDesignSystems[initialSystem]
  }

  // Load a built-in design system
  loadBuiltInSystem(systemName: keyof typeof builtInDesignSystems): void {
    this.currentSystem = builtInDesignSystems[systemName]
    this.applySystemToDOM()
  }

  // Register a custom design system
  registerCustomSystem(id: string, config: DesignSystemConfig): void {
    const validatedConfig = DesignSystemConfigSchema.parse(config)
    this.customSystems.set(id, validatedConfig)
  }

  // Load a custom design system
  loadCustomSystem(id: string): void {
    const system = this.customSystems.get(id)
    if (!system) {
      throw new Error(`Custom design system "${id}" not found`)
    }
    this.currentSystem = system
    this.applySystemToDOM()
  }

  // Get current system
  getCurrentSystem(): DesignSystemConfig {
    return this.currentSystem
  }

  // Get all available systems
  getAvailableSystems(): { builtin: string[], custom: string[] } {
    return {
      builtin: Object.keys(builtInDesignSystems),
      custom: Array.from(this.customSystems.keys()),
    }
  }

  // Generate CSS variables from design tokens
  generateCSSVariables(): string {
    const { tokens } = this.currentSystem
    let css = ':root {\n'

    // Colors
    if (tokens.colors) {
      Object.entries(tokens.colors).forEach(([key, value]) => {
        css += `  --color-${key}: ${value};\n`
      })
    }

    // Spacing
    if (tokens.spacing) {
      Object.entries(tokens.spacing).forEach(([key, value]) => {
        css += `  --spacing-${key}: ${value};\n`
      })
    }

    // Typography
    if (tokens.typography) {
      if (tokens.typography.fontFamilies) {
        Object.entries(tokens.typography.fontFamilies).forEach(([key, value]) => {
          css += `  --font-${key}: ${value};\n`
        })
      }
      if (tokens.typography.fontSizes) {
        Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
          css += `  --text-${key}: ${value};\n`
        })
      }
    }

    // Borders
    if (tokens.borders) {
      if (tokens.borders.radius) {
        Object.entries(tokens.borders.radius).forEach(([key, value]) => {
          css += `  --radius-${key}: ${value};\n`
        })
      }
    }

    // Shadows
    if (tokens.shadows) {
      Object.entries(tokens.shadows).forEach(([key, value]) => {
        css += `  --shadow-${key}: ${value};\n`
      })
    }

    css += '}\n'

    // Add custom CSS if provided
    if (this.currentSystem.customCSS) {
      css += '\n' + this.currentSystem.customCSS
    }

    return css
  }

  // Generate Tailwind CSS configuration
  generateTailwindConfig(): Record<string, any> {
    const { tokens } = this.currentSystem
    const config: Record<string, any> = {
      theme: {
        extend: {},
      },
    }

    // Colors
    if (tokens.colors) {
      config.theme.extend.colors = {}
      Object.entries(tokens.colors).forEach(([key, value]) => {
        config.theme.extend.colors[key] = value
      })
    }

    // Spacing
    if (tokens.spacing) {
      config.theme.extend.spacing = tokens.spacing
    }

    // Typography
    if (tokens.typography) {
      if (tokens.typography.fontFamilies) {
        config.theme.extend.fontFamily = tokens.typography.fontFamilies
      }
      if (tokens.typography.fontSizes) {
        config.theme.extend.fontSize = tokens.typography.fontSizes
      }
    }

    // Border Radius
    if (tokens.borders?.radius) {
      config.theme.extend.borderRadius = tokens.borders.radius
    }

    // Box Shadow
    if (tokens.shadows) {
      config.theme.extend.boxShadow = tokens.shadows
    }

    // Breakpoints
    if (tokens.breakpoints) {
      config.theme.extend.screens = tokens.breakpoints
    }

    // Animations
    if (tokens.animations) {
      config.theme.extend.animation = {}
      config.theme.extend.keyframes = {}
      
      Object.entries(tokens.animations).forEach(([key, animation]) => {
        config.theme.extend.keyframes[key] = animation.keyframes
        config.theme.extend.animation[key] = `${key} ${animation.duration} ${animation.timingFunction || 'ease'} ${animation.fillMode || 'both'}`
      })
    }

    return config
  }

  // Apply system to DOM
  private applySystemToDOM(): void {
    if (typeof window === 'undefined') return

    // Remove existing design system styles
    const existingStyle = document.getElementById('design-system-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    // Create and inject new styles
    const style = document.createElement('style')
    style.id = 'design-system-styles'
    style.textContent = this.generateCSSVariables()
    document.head.appendChild(style)

    // Dispatch event for other components to react to system change
    window.dispatchEvent(new CustomEvent('designSystemChanged', {
      detail: { system: this.currentSystem }
    }))
  }

  // Utility function for component styling
  cn(...classes: (string | undefined | null | false)[]): string {
    return twMerge(clsx(...classes))
  }

  // Get component styles with variants
  getComponentStyles(component: string, variant?: string, size?: string, state?: string): string {
    const componentConfig = this.currentSystem.components?.[component]
    if (!componentConfig) return ''

    let styles = componentConfig.base

    if (variant && componentConfig.variants?.[variant]) {
      styles += ' ' + componentConfig.variants[variant]
    }

    if (size && componentConfig.sizes?.[size]) {
      styles += ' ' + componentConfig.sizes[size]
    }

    if (state && componentConfig.states?.[state]) {
      styles += ' ' + componentConfig.states[state]
    }

    return this.cn(styles)
  }

  // Export system configuration
  exportSystem(): string {
    return JSON.stringify(this.currentSystem, null, 2)
  }

  // Import system configuration
  importSystem(configJson: string): DesignSystemConfig {
    const config = JSON.parse(configJson)
    return DesignSystemConfigSchema.parse(config)
  }
}

// Create singleton instance
export const designSystem = new DesignSystemManager()

// Utility functions
export const cn = (...classes: (string | undefined | null | false)[]) => 
  designSystem.cn(...classes)

export const getComponentStyles = (component: string, variant?: string, size?: string, state?: string) =>
  designSystem.getComponentStyles(component, variant, size, state)