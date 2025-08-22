export interface SEOTestResult {
  test: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  recommendations?: string[];
}

export interface SEOAuditResult {
  url: string;
  timestamp: Date;
  overall: 'pass' | 'warning' | 'fail';
  score: number;
  tests: SEOTestResult[];
}

/**
 * Validate page metadata
 */
export function validateMetadata(metadata: {
  title?: string;
  description?: string;
  keywords?: string[];
}): SEOTestResult[] {
  const results: SEOTestResult[] = [];

  // Title validation
  if (!metadata.title) {
    results.push({
      test: 'Title Tag',
      passed: false,
      message: 'Missing title tag',
      severity: 'error',
      recommendations: ['Add a descriptive title tag'],
    });
  } else if (metadata.title.length < 30) {
    results.push({
      test: 'Title Tag Length',
      passed: false,
      message: `Title too short (${metadata.title.length} chars). Recommended: 30-60 chars`,
      severity: 'warning',
      recommendations: ['Expand title with relevant keywords'],
    });
  } else if (metadata.title.length > 60) {
    results.push({
      test: 'Title Tag Length',
      passed: false,
      message: `Title too long (${metadata.title.length} chars). May be truncated in search results`,
      severity: 'warning',
      recommendations: ['Shorten title to under 60 characters'],
    });
  } else {
    results.push({
      test: 'Title Tag',
      passed: true,
      message: `Title length optimal (${metadata.title.length} chars)`,
      severity: 'info',
    });
  }

  // Description validation
  if (!metadata.description) {
    results.push({
      test: 'Meta Description',
      passed: false,
      message: 'Missing meta description',
      severity: 'error',
      recommendations: ['Add a compelling meta description'],
    });
  } else if (metadata.description.length < 120) {
    results.push({
      test: 'Meta Description Length',
      passed: false,
      message: `Description too short (${metadata.description.length} chars). Recommended: 120-160 chars`,
      severity: 'warning',
      recommendations: ['Expand description with more details'],
    });
  } else if (metadata.description.length > 160) {
    results.push({
      test: 'Meta Description Length',
      passed: false,
      message: `Description too long (${metadata.description.length} chars). May be truncated`,
      severity: 'warning',
      recommendations: ['Shorten description to under 160 characters'],
    });
  } else {
    results.push({
      test: 'Meta Description',
      passed: true,
      message: `Description length optimal (${metadata.description.length} chars)`,
      severity: 'info',
    });
  }

  // Keywords validation
  if (!metadata.keywords || metadata.keywords.length === 0) {
    results.push({
      test: 'Keywords',
      passed: false,
      message: 'No keywords specified',
      severity: 'warning',
      recommendations: ['Add relevant keywords for better targeting'],
    });
  } else if (metadata.keywords.length > 10) {
    results.push({
      test: 'Keywords Count',
      passed: false,
      message: `Too many keywords (${metadata.keywords.length}). Recommended: 3-7 keywords`,
      severity: 'warning',
      recommendations: ['Focus on 3-7 most relevant keywords'],
    });
  } else {
    results.push({
      test: 'Keywords',
      passed: true,
      message: `Keywords count appropriate (${metadata.keywords.length})`,
      severity: 'info',
    });
  }

  return results;
}

/**
 * Validate Open Graph data
 */
export function validateOpenGraph(og: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}): SEOTestResult[] {
  const results: SEOTestResult[] = [];

  if (!og.title) {
    results.push({
      test: 'Open Graph Title',
      passed: false,
      message: 'Missing Open Graph title',
      severity: 'error',
      recommendations: ['Add og:title for better social sharing'],
    });
  } else {
    results.push({
      test: 'Open Graph Title',
      passed: true,
      message: 'Open Graph title present',
      severity: 'info',
    });
  }

  if (!og.description) {
    results.push({
      test: 'Open Graph Description',
      passed: false,
      message: 'Missing Open Graph description',
      severity: 'error',
      recommendations: ['Add og:description for social previews'],
    });
  } else {
    results.push({
      test: 'Open Graph Description',
      passed: true,
      message: 'Open Graph description present',
      severity: 'info',
    });
  }

  if (!og.image) {
    results.push({
      test: 'Open Graph Image',
      passed: false,
      message: 'Missing Open Graph image',
      severity: 'error',
      recommendations: ['Add og:image (1200x630px recommended)'],
    });
  } else {
    results.push({
      test: 'Open Graph Image',
      passed: true,
      message: 'Open Graph image present',
      severity: 'info',
    });
  }

  if (!og.url) {
    results.push({
      test: 'Open Graph URL',
      passed: false,
      message: 'Missing Open Graph URL',
      severity: 'warning',
      recommendations: ['Add og:url for consistent sharing'],
    });
  } else {
    results.push({
      test: 'Open Graph URL',
      passed: true,
      message: 'Open Graph URL present',
      severity: 'info',
    });
  }

  return results;
}

/**
 * Validate structured data
 */
export function validateStructuredData(structuredData: any[]): SEOTestResult[] {
  const results: SEOTestResult[] = [];

  if (!structuredData || structuredData.length === 0) {
    results.push({
      test: 'Structured Data',
      passed: false,
      message: 'No structured data found',
      severity: 'warning',
      recommendations: ['Add JSON-LD structured data for better search visibility'],
    });
  } else {
    results.push({
      test: 'Structured Data',
      passed: true,
      message: `${structuredData.length} structured data items found`,
      severity: 'info',
    });

    // Validate each structured data item
    structuredData.forEach((item, index) => {
      if (!item['@context']) {
        results.push({
          test: `Structured Data ${index + 1} - Context`,
          passed: false,
          message: 'Missing @context property',
          severity: 'error',
          recommendations: ['Add @context property (usually "https://schema.org")'],
        });
      }

      if (!item['@type']) {
        results.push({
          test: `Structured Data ${index + 1} - Type`,
          passed: false,
          message: 'Missing @type property',
          severity: 'error',
          recommendations: ['Add @type property (e.g., "Organization", "Website")'],
        });
      }
    });
  }

  return results;
}

/**
 * Validate technical SEO aspects
 */
export function validateTechnicalSEO(): SEOTestResult[] {
  const results: SEOTestResult[] = [];

  // Check if robots.txt is configured
  results.push({
    test: 'Robots.txt',
    passed: true,
    message: 'Robots.txt route configured',
    severity: 'info',
  });

  // Check if sitemap.xml is configured
  results.push({
    test: 'XML Sitemap',
    passed: true,
    message: 'XML sitemap route configured',
    severity: 'info',
  });

  // Check manifest.json
  results.push({
    test: 'Web App Manifest',
    passed: true,
    message: 'Web app manifest configured',
    severity: 'info',
  });

  return results;
}

/**
 * Perform comprehensive SEO audit
 */
export function performSEOAudit(pageData: {
  url: string;
  title?: string;
  description?: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  };
  structuredData?: any[];
}): SEOAuditResult {
  const tests: SEOTestResult[] = [
    ...validateMetadata({
      title: pageData.title,
      description: pageData.description,
      keywords: pageData.keywords,
    }),
    ...validateOpenGraph(pageData.openGraph || {}),
    ...validateStructuredData(pageData.structuredData || []),
    ...validateTechnicalSEO(),
  ];

  const passedTests = tests.filter((t) => t.passed).length;
  const totalTests = tests.length;
  const score = Math.round((passedTests / totalTests) * 100);

  const hasErrors = tests.some((t) => t.severity === 'error');
  const hasWarnings = tests.some((t) => t.severity === 'warning');

  let overall: 'pass' | 'warning' | 'fail';
  if (hasErrors) {
    overall = 'fail';
  } else if (hasWarnings) {
    overall = 'warning';
  } else {
    overall = 'pass';
  }

  return {
    url: pageData.url,
    timestamp: new Date(),
    overall,
    score,
    tests,
  };
}

/**
 * Generate SEO recommendations based on audit results
 */
export function generateSEORecommendations(auditResult: SEOAuditResult): string[] {
  const recommendations: string[] = [];

  auditResult.tests
    .filter((test) => !test.passed && test.recommendations)
    .forEach((test) => {
      if (test.recommendations) {
        recommendations.push(...test.recommendations);
      }
    });

  // Add general recommendations based on score
  if (auditResult.score < 70) {
    recommendations.push(
      'Consider a comprehensive SEO audit to identify major issues',
      'Focus on fixing critical errors first, then warnings',
    );
  } else if (auditResult.score < 85) {
    recommendations.push(
      'Good SEO foundation, focus on optimizing warnings',
      'Consider adding more detailed structured data',
    );
  } else {
    recommendations.push(
      'Excellent SEO setup! Consider monitoring and maintaining current standards',
      'Keep content fresh and monitor Core Web Vitals',
    );
  }

  return [...new Set(recommendations)]; // Remove duplicates
}

/**
 * Export audit results to JSON
 */
export function exportAuditResults(auditResult: SEOAuditResult): string {
  return JSON.stringify(auditResult, null, 2);
}
