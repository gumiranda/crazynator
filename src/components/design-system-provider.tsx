'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { designSystem, DesignSystemConfig, builtInDesignSystems } from '@/lib/design-system'

interface DesignSystemContextType {
  currentSystem: DesignSystemConfig
  isReady: boolean
}

const DesignSystemContext = createContext<DesignSystemContextType | undefined>(undefined)

interface DesignSystemProviderProps {
  children: React.ReactNode
  initialSystem?: keyof typeof builtInDesignSystems
  enablePersistence?: boolean
  storageKey?: string
}

export function DesignSystemProvider({
  children,
  initialSystem = 'default',
  enablePersistence = true,
  storageKey = 'design-system-config',
}: DesignSystemProviderProps) {
  const [currentSystem, setCurrentSystem] = useState<DesignSystemConfig>(
    builtInDesignSystems[initialSystem]
  )
  const [isReady, setIsReady] = useState(false)

  // Initialize design system
  useEffect(() => {
    let systemToLoad = initialSystem

    // Try to load from localStorage if persistence is enabled
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        const savedConfig = localStorage.getItem(storageKey)
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig)
          
          // Check if it's a built-in system reference
          if (typeof parsed === 'string' && parsed in builtInDesignSystems) {
            systemToLoad = parsed as keyof typeof builtInDesignSystems
          } else if (parsed && typeof parsed === 'object' && parsed.name) {
            // It's a custom system configuration
            designSystem.registerCustomSystem('saved-custom', parsed)
            designSystem.loadCustomSystem('saved-custom')
            setCurrentSystem(designSystem.getCurrentSystem())
            setIsReady(true)
            return
          }
        }
      } catch (error) {
        console.warn('Failed to load saved design system:', error)
      }
    }

    // Load the initial system
    designSystem.loadBuiltInSystem(systemToLoad)
    setCurrentSystem(designSystem.getCurrentSystem())
    setIsReady(true)
  }, [initialSystem, enablePersistence, storageKey])

  // Listen for design system changes
  useEffect(() => {
    const handleSystemChange = (event: CustomEvent) => {
      const newSystem = event.detail.system as DesignSystemConfig
      setCurrentSystem(newSystem)

      // Persist the current system if enabled
      if (enablePersistence && typeof window !== 'undefined') {
        try {
          // Check if it's a built-in system
          const builtInKey = Object.keys(builtInDesignSystems).find(
            key => builtInDesignSystems[key as keyof typeof builtInDesignSystems].name === newSystem.name
          )
          
          if (builtInKey) {
            localStorage.setItem(storageKey, JSON.stringify(builtInKey))
          } else {
            // It's a custom system, save the entire configuration
            localStorage.setItem(storageKey, JSON.stringify(newSystem))
          }
        } catch (error) {
          console.warn('Failed to persist design system:', error)
        }
      }
    }

    window.addEventListener('designSystemChanged', handleSystemChange as EventListener)
    return () => {
      window.removeEventListener('designSystemChanged', handleSystemChange as EventListener)
    }
  }, [enablePersistence, storageKey])

  // Apply system to DOM on mount and changes
  useEffect(() => {
    if (isReady && typeof window !== 'undefined') {
      // Ensure the design system styles are applied
      const css = designSystem.generateCSSVariables()
      
      let styleElement = document.getElementById('design-system-styles')
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = 'design-system-styles'
        document.head.appendChild(styleElement)
      }
      
      styleElement.textContent = css
    }
  }, [currentSystem, isReady])

  const contextValue: DesignSystemContextType = {
    currentSystem,
    isReady,
  }

  return (
    <DesignSystemContext.Provider value={contextValue}>
      {children}
    </DesignSystemContext.Provider>
  )
}

// Hook to access design system context
export function useDesignSystemContext(): DesignSystemContextType {
  const context = useContext(DesignSystemContext)
  if (!context) {
    throw new Error('useDesignSystemContext must be used within a DesignSystemProvider')
  }
  return context
}

// HOC for components that need design system access
export function withDesignSystem<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    const { isReady } = useDesignSystemContext()
    
    if (!isReady) {
      return <div>Loading design system...</div>
    }
    
    return <Component {...props} />
  }
}