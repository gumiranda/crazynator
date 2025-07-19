import { DesignSystemConfig } from './design-system'

export interface TailwindConfigOptions {
  includeDarkMode?: boolean
  includeAnimations?: boolean
  includeUtilities?: boolean
  prefix?: string
  important?: boolean | string
  separator?: string
}

export class TailwindConfigGenerator {
  private designSystem: DesignSystemConfig
  private options: TailwindConfigOptions

  constructor(designSystem: DesignSystemConfig, options: TailwindConfigOptions = {}) {
    this.designSystem = designSystem
    this.options = {
      includeDarkMode: true,
      includeAnimations: true,
      includeUtilities: true,
      prefix: '',
      important: false,
      separator: ':',
      ...options,
    }
  }

  // Generate complete Tailwind configuration
  generateConfig(): Record<string, any> {
    const config: Record<string, any> = {
      content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
      ],
      prefix: this.options.prefix,
      important: this.options.important,
      separator: this.options.separator,
      theme: this.generateTheme(),
      plugins: this.generatePlugins(),
    }

    if (this.options.includeDarkMode) {
      config.darkMode = 'class'
    }

    return config
  }

  // Generate theme configuration
  private generateTheme(): Record<string, any> {
    const theme: Record<string, any> = {
      extend: {},
    }

    const { tokens } = this.designSystem

    // Colors
    if (tokens.colors) {
      theme.extend.colors = this.generateColors(tokens.colors)
    }

    // Typography
    if (tokens.typography) {
      if (tokens.typography.fontFamilies) {
        theme.extend.fontFamily = tokens.typography.fontFamilies
      }
      if (tokens.typography.fontSizes) {
        theme.extend.fontSize = this.generateFontSizes(tokens.typography.fontSizes)
      }
      if (tokens.typography.fontWeights) {
        theme.extend.fontWeight = tokens.typography.fontWeights
      }
      if (tokens.typography.lineHeights) {
        theme.extend.lineHeight = tokens.typography.lineHeights
      }
      if (tokens.typography.letterSpacing) {
        theme.extend.letterSpacing = tokens.typography.letterSpacing
      }
    }

    // Spacing
    if (tokens.spacing) {
      theme.extend.spacing = tokens.spacing
    }

    // Borders
    if (tokens.borders) {
      if (tokens.borders.radius) {
        theme.extend.borderRadius = tokens.borders.radius
      }
      if (tokens.borders.width) {
        theme.extend.borderWidth = tokens.borders.width
      }
    }

    // Shadows
    if (tokens.shadows) {
      theme.extend.boxShadow = tokens.shadows
      theme.extend.dropShadow = tokens.shadows
    }

    // Breakpoints
    if (tokens.breakpoints) {
      theme.extend.screens = tokens.breakpoints
    }

    // Animations
    if (tokens.animations && this.options.includeAnimations) {
      const { keyframes, animation } = this.generateAnimations(tokens.animations)
      theme.extend.keyframes = keyframes
      theme.extend.animation = animation
    }

    return theme
  }

  // Generate color palette with semantic naming
  private generateColors(colors: Record<string, string>): Record<string, any> {
    const colorConfig: Record<string, any> = {}

    Object.entries(colors).forEach(([key, value]) => {
      // Handle CSS custom properties and oklch values
      if (value.startsWith('oklch(') || value.startsWith('hsl(') || value.startsWith('rgb(')) {
        colorConfig[key] = value
      } else if (value.startsWith('#')) {
        colorConfig[key] = value
      } else {
        // Assume it's a CSS custom property reference
        colorConfig[key] = `var(--${key}, ${value})`
      }
    })

    return colorConfig
  }

  // Generate font sizes with line heights
  private generateFontSizes(fontSizes: Record<string, string>): Record<string, any> {
    const fontSizeConfig: Record<string, any> = {}

    Object.entries(fontSizes).forEach(([key, value]) => {
      // Calculate optimal line height based on font size
      const lineHeight = this.calculateLineHeight(value)
      fontSizeConfig[key] = [value, lineHeight]
    })

    return fontSizeConfig
  }

  // Calculate optimal line height for a font size
  private calculateLineHeight(fontSize: string): string {
    const sizeInRem = parseFloat(fontSize.replace('rem', ''))
    
    if (sizeInRem <= 0.875) { // 14px and below
      return '1.5'
    } else if (sizeInRem <= 1.125) { // 18px and below
      return '1.4'
    } else if (sizeInRem <= 1.5) { // 24px and below
      return '1.3'
    } else {
      return '1.2'
    }
  }

  // Generate animations and keyframes
  private generateAnimations(animations: Record<string, any>): { keyframes: Record<string, any>, animation: Record<string, string> } {
    const keyframes: Record<string, any> = {}
    const animation: Record<string, string> = {}

    Object.entries(animations).forEach(([key, animationConfig]) => {
      keyframes[key] = animationConfig.keyframes
      
      const duration = animationConfig.duration || '1s'
      const timingFunction = animationConfig.timingFunction || 'ease'
      const fillMode = animationConfig.fillMode || 'both'
      
      animation[key] = `${key} ${duration} ${timingFunction} ${fillMode}`
    })

    return { keyframes, animation }
  }

  // Generate plugins for custom utilities
  private generatePlugins(): any[] {
    const plugins: any[] = []

    if (this.options.includeUtilities && this.designSystem.utilities) {
      plugins.push(this.createUtilitiesPlugin())
    }

    // Add component styles plugin
    if (this.designSystem.components) {
      plugins.push(this.createComponentsPlugin())
    }

    return plugins
  }

  // Create plugin for custom utilities
  private createUtilitiesPlugin(): any {
    return ({ addUtilities }: { addUtilities: (utilities: Record<string, any>) => void }) => {
      const utilities: Record<string, any> = {}

      if (this.designSystem.utilities) {
        Object.entries(this.designSystem.utilities).forEach(([className, styles]) => {
          utilities[`.${className}`] = this.parseStyleString(styles)
        })
      }

      addUtilities(utilities)
    }
  }

  // Create plugin for component styles
  private createComponentsPlugin(): any {
    return ({ addComponents }: { addComponents: (components: Record<string, any>) => void }) => {
      const components: Record<string, any> = {}

      if (this.designSystem.components) {
        Object.entries(this.designSystem.components).forEach(([componentName, componentConfig]) => {
          // Base styles
          components[`.${componentName}`] = this.parseStyleString(componentConfig.base)

          // Variants
          if (componentConfig.variants) {
            Object.entries(componentConfig.variants).forEach(([variantName, variantStyles]) => {
              components[`.${componentName}--${variantName}`] = this.parseStyleString(variantStyles)
            })
          }

          // Sizes
          if (componentConfig.sizes) {
            Object.entries(componentConfig.sizes).forEach(([sizeName, sizeStyles]) => {
              components[`.${componentName}--${sizeName}`] = this.parseStyleString(sizeStyles)
            })
          }

          // States
          if (componentConfig.states) {
            Object.entries(componentConfig.states).forEach(([stateName, stateStyles]) => {
              components[`.${componentName}--${stateName}`] = this.parseStyleString(stateStyles)
            })
          }
        })
      }

      addComponents(components)
    }
  }

  // Parse Tailwind class string to CSS object
  private parseStyleString(styleString: string): Record<string, string> {
    // This is a simplified parser - in a real implementation,
    // you might want to use a more sophisticated CSS-in-JS parser
    // or integrate with Tailwind's internal utilities
    
    const styles: Record<string, string> = {}
    
    // For now, return the class string as-is for Tailwind to process
    return { '@apply': styleString }
  }

  // Generate CSS-in-JS theme object for styled-components or emotion
  generateCSSInJSTheme(): Record<string, any> {
    const theme: Record<string, any> = {}
    const { tokens } = this.designSystem

    if (tokens.colors) {
      theme.colors = tokens.colors
    }

    if (tokens.spacing) {
      theme.spacing = tokens.spacing
    }

    if (tokens.typography) {
      theme.typography = tokens.typography
    }

    if (tokens.borders) {
      theme.borders = tokens.borders
    }

    if (tokens.shadows) {
      theme.shadows = tokens.shadows
    }

    if (tokens.breakpoints) {
      theme.breakpoints = tokens.breakpoints
    }

    return theme
  }

  // Generate PostCSS configuration for Tailwind v4
  generatePostCSSConfig(): string {
    const { tokens } = this.designSystem
    let css = `@import 'tailwindcss';\n\n`

    // Add design system configuration as CSS custom properties
    css += '@layer theme {\n'
    css += '  :root {\n'

    // Colors
    if (tokens.colors) {
      Object.entries(tokens.colors).forEach(([key, value]) => {
        css += `    --color-${key}: ${value};\n`
      })
    }

    // Typography
    if (tokens.typography) {
      if (tokens.typography.fontFamilies) {
        Object.entries(tokens.typography.fontFamilies).forEach(([key, value]) => {
          css += `    --font-family-${key}: ${value};\n`
        })
      }
      if (tokens.typography.fontSizes) {
        Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
          css += `    --font-size-${key}: ${value};\n`
        })
      }
    }

    // Spacing
    if (tokens.spacing) {
      Object.entries(tokens.spacing).forEach(([key, value]) => {
        css += `    --spacing-${key}: ${value};\n`
      })
    }

    // Borders
    if (tokens.borders?.radius) {
      Object.entries(tokens.borders.radius).forEach(([key, value]) => {
        css += `    --border-radius-${key}: ${value};\n`
      })
    }

    css += '  }\n'
    css += '}\n\n'

    // Add custom utilities
    if (this.designSystem.utilities) {
      css += '@layer utilities {\n'
      Object.entries(this.designSystem.utilities).forEach(([className, styles]) => {
        css += `  .${className} {\n`
        css += `    ${styles};\n`
        css += '  }\n'
      })
      css += '}\n\n'
    }

    // Add component styles
    if (this.designSystem.components) {
      css += '@layer components {\n'
      Object.entries(this.designSystem.components).forEach(([componentName, componentConfig]) => {
        css += `  .${componentName} {\n`
        css += `    @apply ${componentConfig.base};\n`
        css += '  }\n'

        if (componentConfig.variants) {
          Object.entries(componentConfig.variants).forEach(([variantName, variantStyles]) => {
            css += `  .${componentName}--${variantName} {\n`
            css += `    @apply ${variantStyles};\n`
            css += '  }\n'
          })
        }
      })
      css += '}\n'
    }

    return css
  }

  // Generate TypeScript types for the design system
  generateTypeDefinitions(): string {
    const { tokens } = this.designSystem
    let types = `// Generated design system types\n\n`

    // Color types
    if (tokens.colors) {
      const colorKeys = Object.keys(tokens.colors)
      types += `export type ColorKey = ${colorKeys.map(key => `'${key}'`).join(' | ')};\n\n`
    }

    // Spacing types
    if (tokens.spacing) {
      const spacingKeys = Object.keys(tokens.spacing)
      types += `export type SpacingKey = ${spacingKeys.map(key => `'${key}'`).join(' | ')};\n\n`
    }

    // Typography types
    if (tokens.typography?.fontFamilies) {
      const fontKeys = Object.keys(tokens.typography.fontFamilies)
      types += `export type FontFamilyKey = ${fontKeys.map(key => `'${key}'`).join(' | ')};\n\n`
    }

    if (tokens.typography?.fontSizes) {
      const sizeKeys = Object.keys(tokens.typography.fontSizes)
      types += `export type FontSizeKey = ${sizeKeys.map(key => `'${key}'`).join(' | ')};\n\n`
    }

    // Design system interface
    types += `export interface DesignSystemTokens {\n`
    
    if (tokens.colors) {
      types += `  colors: Record<ColorKey, string>;\n`
    }
    if (tokens.spacing) {
      types += `  spacing: Record<SpacingKey, string>;\n`
    }
    if (tokens.typography?.fontFamilies) {
      types += `  fontFamilies: Record<FontFamilyKey, string>;\n`
    }
    
    types += `}\n`

    return types
  }
}

// Utility function to create a Tailwind config from a design system
export function createTailwindConfig(
  designSystem: DesignSystemConfig,
  options?: TailwindConfigOptions
): Record<string, any> {
  const generator = new TailwindConfigGenerator(designSystem, options)
  return generator.generateConfig()
}

// Utility function to create PostCSS config for Tailwind v4
export function createPostCSSConfig(
  designSystem: DesignSystemConfig
): string {
  const generator = new TailwindConfigGenerator(designSystem)
  return generator.generatePostCSSConfig()
}