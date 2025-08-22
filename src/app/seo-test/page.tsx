'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { performSEOAudit, generateSEORecommendations, exportAuditResults, SEOAuditResult, SEOTestResult } from '@/lib/seo-testing';
import { pageSEO } from '@/lib/seo-utils';

export default function SEOTestPage() {
  const [auditResults, setAuditResults] = useState<SEOAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runSEOAudit = () => {
    setIsLoading(true);
    
    // Simulate audit delay
    setTimeout(() => {
      const homePageSEO = pageSEO.home();

      
      const auditData = {
        url: window.location.origin,
        title: homePageSEO.title,
        description: homePageSEO.description,
        keywords: homePageSEO.keywords,
        openGraph: homePageSEO.openGraph,
        structuredData: [
          { '@context': 'https://schema.org', '@type': 'Organization' },
          { '@context': 'https://schema.org', '@type': 'WebSite' },
          { '@context': 'https://schema.org', '@type': 'SoftwareApplication' },
        ],
      };
      
      const result = performSEOAudit(auditData);
      setAuditResults(result);
      setIsLoading(false);
    }, 1000);
  };

  const getTestIcon = (test: SEOTestResult) => {
    if (test.passed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (test.severity === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary',
      info: 'default',
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity}
      </Badge>
    );
  };

  const downloadReport = () => {
    if (!auditResults) return;
    
    const reportData = exportAuditResults(auditResults);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-audit-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">SEO Audit Tool</h1>
          <p className="text-muted-foreground">
            Test and validate the SEO implementation of CrazyNator
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Run SEO Audit</CardTitle>
            <CardDescription>
              Analyze the current page for SEO best practices and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runSEOAudit} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Running Audit...' : 'Start SEO Audit'}
            </Button>
          </CardContent>
        </Card>

        {auditResults && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Audit Results</CardTitle>
                    <CardDescription>
                      Completed on {auditResults.timestamp.toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{auditResults.score}%</div>
                      <Badge 
                        variant={
                          auditResults.overall === 'pass' ? 'default' :
                          auditResults.overall === 'warning' ? 'secondary' : 'destructive'
                        }
                      >
                        {auditResults.overall}
                      </Badge>
                    </div>
                    <Button 
                      onClick={downloadReport}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditResults.tests.map((test, index) => (
                    <div 
                      key={index}
                      className="flex items-start space-x-3 p-3 rounded-lg border"
                    >
                      {getTestIcon(test)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{test.test}</h4>
                          {getSeverityBadge(test.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {test.message}
                        </p>
                        {test.recommendations && test.recommendations.length > 0 && (
                          <ul className="mt-2 text-sm space-y-1">
                            {test.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="text-blue-600">
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Prioritized actions to improve your SEO score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {generateSEORecommendations(auditResults).map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>SEO Features Implemented</CardTitle>
            <CardDescription>
              Overview of SEO optimizations in place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Technical SEO</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Dynamic metadata generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Robots.txt configuration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>XML sitemap generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Canonical URLs</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Content & Social</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Open Graph meta tags</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Twitter Card support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>JSON-LD structured data</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Semantic HTML structure</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Performance & UX</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Optimized image loading</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Web App Manifest (PWA)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Font optimization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Mobile-responsive design</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Privacy & Performance</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Privacy-first design</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>No third-party tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>GDPR compliant</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Fast loading times</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}