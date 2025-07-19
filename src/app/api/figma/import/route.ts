import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { importFigmaFile, createImportConfig, validateFigmaToken } from '@/lib/figma-import';
import { isValidFigmaUrl } from '@/lib/figma-client';
import { OutputFormat } from '@/types/figma';

// Request schema validation
const importRequestSchema = z.object({
  fileUrl: z.string().min(1, 'File URL is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  options: z.object({
    includeComponents: z.boolean().default(true),
    includeStyles: z.boolean().default(true),
    includeAssets: z.boolean().default(false),
    extractTokens: z.boolean().default(true),
    generateCode: z.boolean().default(false),
    outputFormat: z.array(z.nativeEnum(OutputFormat)).default([OutputFormat.JSON])
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = importRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { fileUrl, accessToken, options = {} } = validationResult.data;

    // Validate Figma URL format
    if (!isValidFigmaUrl(fileUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Figma URL format',
          message: 'Please provide a valid Figma file URL'
        },
        { status: 400 }
      );
    }

    // Validate access token
    const isTokenValid = await validateFigmaToken(accessToken);
    if (!isTokenValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid access token',
          message: 'The provided Figma access token is invalid or expired'
        },
        { status: 401 }
      );
    }

    // Create import configuration
    const config = createImportConfig(fileUrl, accessToken, options);

    // Perform the import
    console.log(`[API] Starting Figma import for: ${fileUrl}`);
    const importResult = await importFigmaFile(config);

    // Return the result
    if (importResult.success) {
      console.log(`[API] Import completed successfully`);
      return NextResponse.json({
        success: true,
        data: importResult.data,
        stats: importResult.stats,
        warnings: importResult.warnings
      });
    } else {
      console.error(`[API] Import failed:`, importResult.errors);
      return NextResponse.json(
        {
          success: false,
          errors: importResult.errors,
          warnings: importResult.warnings,
          stats: importResult.stats
        },
        { status: 422 }
      );
    }

  } catch (error) {
    console.error('[API] Unexpected error during Figma import:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred during the import process'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Handle different GET actions
  switch (action) {
    case 'validate-token':
      return handleTokenValidation(searchParams);
    
    case 'validate-url':
      return handleUrlValidation(searchParams);
    
    default:
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action',
          availableActions: ['validate-token', 'validate-url']
        },
        { status: 400 }
      );
  }
}

async function handleTokenValidation(searchParams: URLSearchParams) {
  const accessToken = searchParams.get('accessToken');
  
  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'Access token is required'
      },
      { status: 400 }
    );
  }

  try {
    const isValid = await validateFigmaToken(accessToken);
    
    return NextResponse.json({
      success: true,
      valid: isValid,
      message: isValid ? 'Token is valid' : 'Token is invalid or expired'
    });
  } catch (error) {
    console.error('[API] Token validation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate token',
        message: 'An error occurred while validating the access token'
      },
      { status: 500 }
    );
  }
}

async function handleUrlValidation(searchParams: URLSearchParams) {
  const fileUrl = searchParams.get('fileUrl');
  
  if (!fileUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'File URL is required'
      },
      { status: 400 }
    );
  }

  const isValid = isValidFigmaUrl(fileUrl);
  
  return NextResponse.json({
    success: true,
    valid: isValid,
    message: isValid ? 'URL is valid' : 'Invalid Figma URL format'
  });
}