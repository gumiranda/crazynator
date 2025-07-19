import type { Config } from 'tailwindcss'
import { designSystem } from './src/lib/design-system'
import { createTailwindConfig } from './src/lib/tailwind-config-generator'

// Get the current design system configuration
const currentSystem = designSystem.getCurrentSystem()

// Generate Tailwind config from design system
const generatedConfig = createTailwindConfig(currentSystem, {
  includeDarkMode: true,
  includeAnimations: true,
  includeUtilities: true,
})

const config: Config = {
  ...generatedConfig,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    ...generatedConfig.theme,
    extend: {
      ...generatedConfig.theme.extend,
      // Additional custom extensions can be added here
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    // Include generated plugins from design system
    ...generatedConfig.plugins,
    
    // Custom plugin to add design system utilities
    function({ addUtilities, addComponents, theme }: any) {
      // Add custom utilities based on design tokens
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
      })

      // Add component styles from design system
      const designSystemComponents = currentSystem.components || {}
      const components: Record<string, any> = {}

      Object.entries(designSystemComponents).forEach(([componentName, componentConfig]) => {
        components[`.ds-${componentName}`] = {
          '@apply': componentConfig.base,
        }

        if (componentConfig.variants) {
          Object.entries(componentConfig.variants).forEach(([variantName, variantStyles]) => {
            components[`.ds-${componentName}--${variantName}`] = {
              '@apply': variantStyles,
            }
          })
        }

        if (componentConfig.sizes) {
          Object.entries(componentConfig.sizes).forEach(([sizeName, sizeStyles]) => {
            components[`.ds-${componentName}--${sizeName}`] = {
              '@apply': sizeStyles,
            }
          })
        }
      })

      addComponents(components)
    },
  ],
}

export default config