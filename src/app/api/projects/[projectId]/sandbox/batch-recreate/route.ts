import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get all fragments that might need recreation
    const fragments = await prisma.fragment.findMany({
      where: {
        message: {
          projectId,
        },
        sandboxUrl: {
          not: '',
        },
      },
      select: {
        id: true,
        sandboxUrl: true,
      },
    });

    if (fragments.length === 0) {
      return NextResponse.json({
        message: 'No sandboxes found for this project',
        fragmentIds: [],
      });
    }

    const fragmentIds = fragments.map(f => f.id);

    // Trigger batch recreation via Inngest
    await inngest.send({
      name: 'sandbox/batch-recreate',
      data: {
        fragmentIds,
        chunkSize: 3, // Process 3 at a time
      },
    });

    return NextResponse.json({
      message: `Batch recreation started for ${fragmentIds.length} sandboxes`,
      fragmentIds,
      projectId,
    });
  } catch (error) {
    console.error('Batch recreation API error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}