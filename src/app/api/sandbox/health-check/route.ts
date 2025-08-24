import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkSandboxStatus } from '@/lib/sandbox-monitor';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fragmentId } = await request.json();

    if (!fragmentId) {
      return NextResponse.json(
        { error: 'Fragment ID is required' },
        { status: 400 }
      );
    }

    // Verify the fragment exists and belongs to the user
    const fragment = await prisma.fragment.findFirst({
      where: {
        id: fragmentId,
        message: {
          project: {
            userId,
          },
        },
      },
    });

    if (!fragment) {
      return NextResponse.json(
        { error: 'Fragment not found or access denied' },
        { status: 404 }
      );
    }

    // Check sandbox health
    const status = await checkSandboxStatus(fragment.sandboxUrl);

    return NextResponse.json({
      fragmentId,
      sandboxUrl: fragment.sandboxUrl,
      status: {
        isExpired: status.isExpired,
        isConnectable: status.isConnectable,
        error: status.error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sandbox health check API error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}