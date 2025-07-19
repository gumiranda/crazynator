'use client'

import React, { useState } from 'react'
import { useDesignSystem } from '@/hooks/use-design-system'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Copy, Download, Upload, Palette, Settings, Eye, Code } from 'lucide-react'
import { DesignSystemConfig } from '@/lib/design-system'

export function DesignSystemManager() {
  const {
    currentSystem,
    availableSystems,
    loadBuiltInSystem,
    loadCustomSystem,
    registerCustomSystem,
    generateTailwindConfig,
    generateCSSVariables,
    exportSystem,
    importSystem,
  } = useDesignSystem()

  const [importConfig, setImportConfig] = useState('')
  const [customSystemName, setCustomSystemName] = useState('')
  const [customSystemConfig, setCustomSystemConfig] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [previewConfig, setPreviewConfig] = useState<string>('')

  const handleImport = () => {
    try {
      const config = importSystem(importConfig)
      registerCustomSystem(config.name.toLowerCase().replace(/\s+/g, '-'), config)
      setImportConfig('')
    } catch (error) {
      console.error('Failed to import design system:', error)
    }
  }

  const handleExport = () => {
    const config = exportSystem()
    navigator.clipboard.writeText(config)
  }

  const handleDownloadConfig = () => {
    const config = exportSystem()
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSystem.name.toLowerCase().replace(/\s+/g, '-')}-design-system.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadTailwindConfig = () => {
    const config = generateTailwindConfig()
    const configString = `export default ${JSON.stringify(config, null, 2)}`
    const blob = new Blob([configString], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tailwind.config.js'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCreateCustomSystem = () => {
    try {
      const config = JSON.parse(customSystemConfig) as DesignSystemConfig
      config.name = customSystemName
      registerCustomSystem(customSystemName.toLowerCase().replace(/\s+/g, '-'), config)
      setCustomSystemName('')
      setCustomSystemConfig('')
    } catch (error) {
      console.error('Failed to create custom design system:', error)
    }
  }

  const renderColorPreview = (colors: Record<string, string>) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {Object.entries(colors).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border border-border"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm font-mono">{key}</span>
        </div>
      ))}
    </div>
  )

  const renderTypographyPreview = (typography: any) => (
    <div className="space-y-4">
      {typography.fontFamilies && (
        <div>
          <h4 className="font-semibold mb-2">Font Families</h4>
          <div className="space-y-1">
            {Object.entries(typography.fontFamilies).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="font-mono">{key}:</span> 
                <span style={{ fontFamily: value as string }} className="ml-2">
                  {value as string}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {typography.fontSizes && (
        <div>
          <h4 className="font-semibold mb-2">Font Sizes</h4>
          <div className="space-y-1">
            {Object.entries(typography.fontSizes).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-mono text-sm">{key}:</span>
                <span style={{ fontSize: value as string }}>Sample Text</span>
                <span className="text-muted-foreground text-xs">({value as string})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design System Manager</h1>
          <p className="text-muted-foreground">
            Manage and customize your design systems with Tailwind integration
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Current: {currentSystem.name}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="systems" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Systems
          </TabsTrigger>
          <TabsTrigger value="customize" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Customize
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Design System</CardTitle>
              <CardDescription>
                {currentSystem.description || 'No description provided'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">System Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {currentSystem.name}</div>
                    <div><strong>Version:</strong> {currentSystem.version}</div>
                  </div>
                </div>
              </div>

              {currentSystem.tokens.colors && (
                <div>
                  <h3 className="font-semibold mb-3">Colors</h3>
                  {renderColorPreview(currentSystem.tokens.colors)}
                </div>
              )}

              {currentSystem.tokens.typography && (
                <div>
                  <h3 className="font-semibold mb-3">Typography</h3>
                  {renderTypographyPreview(currentSystem.tokens.typography)}
                </div>
              )}

              {currentSystem.tokens.spacing && (
                <div>
                  <h3 className="font-semibold mb-3">Spacing Scale</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(currentSystem.tokens.spacing).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <div 
                          className="bg-primary/20 border border-primary/30"
                          style={{ width: value, height: '1rem' }}
                        />
                        <span className="font-mono">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Built-in Systems</CardTitle>
                <CardDescription>
                  Pre-configured design systems ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableSystems.builtin.map((systemName) => (
                  <div key={systemName} className="flex items-center justify-between">
                    <span className="capitalize">{systemName}</span>
                    <Button
                      size="sm"
                      variant={currentSystem.name.toLowerCase().includes(systemName) ? "default" : "outline"}
                      onClick={() => loadBuiltInSystem(systemName as any)}
                    >
                      {currentSystem.name.toLowerCase().includes(systemName) ? 'Active' : 'Load'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custom Systems</CardTitle>
                <CardDescription>
                  Your personalized design systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableSystems.custom.length > 0 ? (
                  availableSystems.custom.map((systemName) => (
                    <div key={systemName} className="flex items-center justify-between">
                      <span className="capitalize">{systemName.replace('-', ' ')}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadCustomSystem(systemName)}
                      >
                        Load
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No custom systems created yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Design System</CardTitle>
              <CardDescription>
                Build your own design system from scratch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="system-name">System Name</Label>
                  <Input
                    id="system-name"
                    placeholder="My Custom System"
                    value={customSystemName}
                    onChange={(e) => setCustomSystemName(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="system-config">Configuration (JSON)</Label>
                <Textarea
                  id="system-config"
                  placeholder={JSON.stringify({
                    name: "Custom System",
                    tokens: {
                      colors: {
                        primary: "#3b82f6",
                        secondary: "#64748b"
                      },
                      spacing: {
                        sm: "0.5rem",
                        md: "1rem"
                      }
                    }
                  }, null, 2)}
                  value={customSystemConfig}
                  onChange={(e) => setCustomSystemConfig(e.target.value)}
                  rows={15}
                  className="font-mono text-xs"
                />
              </div>
              
              <Button 
                onClick={handleCreateCustomSystem}
                disabled={!customSystemName || !customSystemConfig}
              >
                Create Custom System
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Design System</CardTitle>
                <CardDescription>
                  Export current system configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleExport} className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button onClick={handleDownloadConfig} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Tailwind Config</CardTitle>
                <CardDescription>
                  Generate Tailwind CSS configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleDownloadTailwindConfig} className="w-full">
                  <Code className="w-4 h-4 mr-2" />
                  Download Tailwind Config
                </Button>
                <div className="text-xs text-muted-foreground">
                  Generates a tailwind.config.js file with your design tokens
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>CSS Variables Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generateCSSVariables()}
                readOnly
                rows={10}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Design System</CardTitle>
              <CardDescription>
                Import a design system configuration from JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="import-config">Configuration JSON</Label>
                <Textarea
                  id="import-config"
                  placeholder="Paste your design system configuration here..."
                  value={importConfig}
                  onChange={(e) => setImportConfig(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
              
              <Button 
                onClick={handleImport}
                disabled={!importConfig}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import System
              </Button>

              <Alert>
                <AlertDescription>
                  Make sure your JSON configuration follows the design system schema. 
                  The system will be automatically validated on import.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}