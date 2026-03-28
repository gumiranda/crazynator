import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSandbox } from '@/lib/sandbox';

/**
 * POST /api/sandbox/terminal
 * Execute a command in the project's sandbox terminal.
 * This gives users full terminal access to their sandbox environment.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fragmentId, command } = await request.json();

    if (!fragmentId || !command) {
      return NextResponse.json(
        { error: 'Fragment ID and command are required' },
        { status: 400 },
      );
    }

    // Verify ownership
    const fragment = await prisma.fragment.findFirst({
      where: {
        id: fragmentId,
        message: { project: { userId } },
      },
    });

    if (!fragment) {
      return NextResponse.json({ error: 'Fragment not found or access denied' }, { status: 404 });
    }

    // Extract sandboxId from URL
    const url = new URL(fragment.sandboxUrl);
    const hostname = url.hostname;
    const sandboxId = hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');

    if (!sandboxId || sandboxId === 'www') {
      return NextResponse.json({ error: 'Invalid sandbox URL' }, { status: 400 });
    }

    const sandbox = await getSandbox(sandboxId);

    const buffers = { stdout: '', stderr: '' };
    try {
      const result = await sandbox.commands.run(command, {
        onStdout: (data: string) => {
          buffers.stdout += data;
        },
        onStderr: (data: string) => {
          buffers.stderr += data;
        },
      });

      return NextResponse.json({
        success: true,
        stdout: result.stdout || buffers.stdout,
        stderr: buffers.stderr,
        exitCode: result.exitCode,
      });
    } catch (e) {
      return NextResponse.json({
        success: false,
        stdout: buffers.stdout,
        stderr: buffers.stderr || (e instanceof Error ? e.message : 'Command execution failed'),
        exitCode: 1,
      });
    }
  } catch (error) {
    console.error('[Terminal API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
