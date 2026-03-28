import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSandbox } from '@/lib/sandbox';

/**
 * POST /api/sandbox/env
 * Set environment variables in the project's sandbox.
 * Variables are persisted to the project and written to the sandbox .env file.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, fragmentId, envVariables } = await request.json();

    if (!projectId || !envVariables || typeof envVariables !== 'object') {
      return NextResponse.json(
        { error: 'Project ID and envVariables object are required' },
        { status: 400 },
      );
    }

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Persist env variables to the project
    await prisma.project.update({
      where: { id: projectId },
      data: { envVariables: envVariables as Record<string, string> },
    });

    // If a fragmentId is provided, also write to the sandbox
    if (fragmentId) {
      try {
        const fragment = await prisma.fragment.findFirst({
          where: { id: fragmentId, message: { project: { userId } } },
        });

        if (fragment?.sandboxUrl) {
          const url = new URL(fragment.sandboxUrl);
          const hostname = url.hostname;
          const sandboxId = hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');

          if (sandboxId && sandboxId !== 'www') {
            const sandbox = await getSandbox(sandboxId);

            // Write .env.local file in the sandbox
            const envContent = Object.entries(envVariables as Record<string, string>)
              .map(([key, value]) => `${key}=${value}`)
              .join('\n');

            await sandbox.files.write('.env.local', envContent);

            return NextResponse.json({
              success: true,
              message: 'Environment variables saved and written to sandbox',
              writtenToSandbox: true,
            });
          }
        }
      } catch (sandboxError) {
        // Sandbox might have expired, but we still saved to DB
        console.warn('[Env API] Could not write to sandbox:', sandboxError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Environment variables saved to project',
      writtenToSandbox: false,
    });
  } catch (error) {
    console.error('[Env API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/sandbox/env?projectId=xxx
 * Retrieve environment variables for a project (keys only, not values for security).
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { envVariables: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      envVariables: project.envVariables || {},
    });
  } catch (error) {
    console.error('[Env API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
