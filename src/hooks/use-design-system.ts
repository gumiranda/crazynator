import { useState, useEffect, useCallback } from 'react'
import { designSystem, DesignSystemConfig, builtInDesignSystems } from '@/lib/design-system'

export interface UseDesignSystemReturn {
  currentSystem: DesignSystemConfig
  availableSystems: { builtin: string[], custom: string[] }
  loadBuiltInSystem: (systemName: keyof typeof builtInDesignSystems) => void
  loadCustomSystem: (id: string) => void
  registerCustomSystem: (id: string, config: DesignSystemConfig) => void
  generateTailwindConfig: () => Record<string, any>
  generateCSSVariables: () => string
  exportSystem: () => string
  importSystem: (configJson: string) => DesignSystemConfig
  cn: (...classes: (string | undefined | null | false)[]) => string
  getComponentStyles: (component: string, variant?: string, size?: string, state?: string) => string
}

export function useDesignSystem(): UseDesignSystemReturn {
  const [currentSystem, setCurrentSystem] = useState<DesignSystemConfig>(
    designSystem.getCurrentSystem()
  )
  const [availableSystems, setAvailableSystems] = useState(
    designSystem.getAvailableSystems()
  )

  // Update state when design system changes
  useEffect(() => {
    const handleSystemChange = (event: CustomEvent) => {
      setCurrentSystem(event.detail.system)
      setAvailableSystems(designSystem.getAvailableSystems())
    }

    window.addEventListener('designSystemChanged', handleSystemChange as EventListener)
    return () => {
      window.removeEventListener('designSystemChanged', handleSystemChange as EventListener)
    }
  }, [])

  const loadBuiltInSystem = useCallback((systemName: keyof typeof builtInDesignSystems) => {
    designSystem.loadBuiltInSystem(systemName)
  }, [])

  const loadCustomSystem = useCallback((id: string) => {
    designSystem.loadCustomSystem(id)
  }, [])

  const registerCustomSystem = useCallback((id: string, config: DesignSystemConfig) => {
    designSystem.registerCustomSystem(id, config)
    setAvailableSystems(designSystem.getAvailableSystems())
  }, [])

  const generateTailwindConfig = useCallback(() => {
    return designSystem.generateTailwindConfig()
  }, [currentSystem])

  const generateCSSVariables = useCallback(() => {
    return designSystem.generateCSSVariables()
  }, [currentSystem])

  const exportSystem = useCallback(() => {
    return designSystem.exportSystem()
  }, [currentSystem])

  const importSystem = useCallback((configJson: string) => {
    return designSystem.importSystem(configJson)
  }, [])

  const cn = useCallback((...classes: (string | undefined | null | false)[]) => {
    return designSystem.cn(...classes)
  }, [])

  const getComponentStyles = useCallback((
    component: string, 
    variant?: string, 
    size?: string, 
    state?: string
  ) => {
    return designSystem.getComponentStyles(component, variant, size, state)
  }, [currentSystem])

  return {
    currentSystem,
    availableSystems,
    loadBuiltInSystem,
    loadCustomSystem,
    registerCustomSystem,
    generateTailwindConfig,
    generateCSSVariables,
    exportSystem,
    importSystem,
    cn,
    getComponentStyles,
  }
}