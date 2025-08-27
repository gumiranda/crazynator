import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { recreateSandboxWithRetries } from '@/lib/sandbox-recreation';

export async function POST(request: NextRequest) {
  console.log('[API] Starting sandbox recreation request');
  
  try {
    const { userId } = await auth();
    console.log(`[API] User ID: ${userId}`);
    
    if (!userId) {
      console.log('[API] Unauthorized - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fragmentId } = await request.json();
    console.log(`[API] Fragment ID received: ${fragmentId}`);

    if (!fragmentId) {
      console.log('[API] Missing fragment ID in request');
      return NextResponse.json(
        { error: 'Fragment ID is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Looking up fragment ${fragmentId} for user ${userId}`);

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
      include: {
        message: {
          include: {
            project: true,
          },
        },
      },
    });

    console.log(`[API] Fragment lookup result:`, fragment ? {
      id: fragment.id,
      sandboxUrl: fragment.sandboxUrl,
      title: fragment.title,
      projectId: fragment.message.project.id,
      projectName: fragment.message.project.name,
    } : null);

    if (!fragment) {
      console.log('[API] Fragment not found or access denied');
      return NextResponse.json(
        { error: 'Fragment not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`[API] Starting sandbox recreation for fragment ${fragmentId} with current URL: ${fragment.sandboxUrl}`);

    // Recreate the sandbox with retries
    const result = await recreateSandboxWithRetries(fragment, 3);
    console.log(`[API] Recreation result:`, result);

    if (result.success) {
      console.log(`[API] Recreation successful, fetching updated fragment`);
      
      // Fetch the updated fragment to return the new URL
      const updatedFragment = await prisma.fragment.findUnique({
        where: { id: fragmentId },
      });

      console.log(`[API] Updated fragment URL: ${updatedFragment?.sandboxUrl}`);

      const response = {
        success: true,
        fragmentId,
        newSandboxUrl: updatedFragment?.sandboxUrl || result.newSandboxUrl,
        message: 'Sandbox recreated successfully',
      };
      
      console.log(`[API] Sending success response:`, response);
      return NextResponse.json(response);
    } else {
      console.error(`[API] Recreation failed:`, result);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          fragmentId,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Sandbox recreation API error:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}