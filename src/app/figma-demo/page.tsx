import { FigmaImport } from '@/components/figma-import';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Palette, 
  Type, 
  Layers, 
  Code, 
  Download,
  ExternalLink,
  Info
} from 'lucide-react';

export default function FigmaDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Figma Design Import System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Import designs directly from Figma and automatically extract design context, 
          components, color palettes, typography systems, and design tokens.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="text-center">
            <FileText className="h-12 w-12 mx-auto text-blue-500 mb-2" />
            <CardTitle className="text-lg">Direct Import</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Import files directly from Figma URLs with full API integration
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Layers className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <CardTitle className="text-lg">Component Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Automatically detect and categorize design components with variants
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Palette className="h-12 w-12 mx-auto text-purple-500 mb-2" />
            <CardTitle className="text-lg">Design Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Extract colors, typography, spacing, and other design tokens
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Code className="h-12 w-12 mx-auto text-orange-500 mb-2" />
            <CardTitle className="text-lg">Code Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Generate CSS, SCSS, and design token files from Figma designs
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How It Works
          </CardTitle>
          <CardDescription>
            Follow these steps to import and analyze your Figma designs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                1
              </div>
              <h3 className="font-semibold">Get Figma Access Token</h3>
              <p className="text-sm text-gray-600">
                Generate a personal access token from your Figma account settings
              </p>
              <a 
                href="https://www.figma.com/developers/api#access-tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline inline-flex items-center gap-1 text-sm"
              >
                Get Token <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                2
              </div>
              <h3 className="font-semibold">Provide Figma File URL</h3>
              <p className="text-sm text-gray-600">
                Copy the URL of your Figma file that you want to analyze
              </p>
              <Badge variant="outline" className="text-xs">
                figma.com/file/[file-id]/...
              </Badge>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                3
              </div>
              <h3 className="font-semibold">Import & Analyze</h3>
              <p className="text-sm text-gray-600">
                Our system will extract design context, components, and tokens automatically
              </p>
              <Badge variant="outline" className="text-xs">
                Automated Analysis
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What You Get */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            What You'll Extract
          </CardTitle>
          <CardDescription>
            Comprehensive design analysis and structured data output
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Design System Analysis</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-500" />
                  Complete color palette with semantic categorization
                </li>
                <li className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-green-500" />
                  Typography hierarchy and font usage analysis
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-500" />
                  Spacing system and layout patterns
                </li>
                <li className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-orange-500" />
                  Component structure and variants
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Export Formats</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  JSON design tokens and metadata
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  CSS/SCSS variables and utilities
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Component code templates
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Design system documentation
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Output Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Example Output:</strong> The import will provide structured data including 
          component analysis, color tokens (like <code>primary-600: #2563eb</code>), 
          typography scales, spacing tokens, and accessibility information.
        </AlertDescription>
      </Alert>

      {/* Import Component */}
      <FigmaImport 
        onImportComplete={(result) => {
          console.log('Import completed:', result);
          // You could add additional handling here
        }} 
      />

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Integration</CardTitle>
          <CardDescription>
            Use the Figma import API programmatically in your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Import Endpoint</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <code className="text-sm">
                  POST /api/figma/import
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Request Body</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-xs overflow-x-auto">
{`{
  "fileUrl": "https://figma.com/file/...",
  "accessToken": "figd_...",
  "options": {
    "includeComponents": true,
    "includeStyles": true,
    "extractTokens": true,
    "generateCode": false
  }
}`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Validation Endpoints</h4>
              <div className="space-y-2">
                <div className="bg-gray-50 p-2 rounded">
                  <code className="text-xs">GET /api/figma/import?action=validate-token&accessToken=...</code>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <code className="text-xs">GET /api/figma/import?action=validate-url&fileUrl=...</code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}