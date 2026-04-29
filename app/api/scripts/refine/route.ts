import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireWorkspace } from '@/lib/auth/session';
import { refineScript } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await requireWorkspace();
    const body = await request.json();

    const { scriptVersionId, feedback } = body;

    // Validation
    if (!scriptVersionId || !feedback) {
      return NextResponse.json(
        { error: 'Script version ID and feedback are required' },
        { status: 400 }
      );
    }

    // Get script version
    const currentScript = await prisma.scriptVersion.findFirst({
      where: { id: scriptVersionId },
      include: {
        project: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!currentScript) {
      return NextResponse.json(
        { error: 'Script version not found' },
        { status: 404 }
      );
    }

    // Check workspace ownership
    if (currentScript.project.workspaceId !== workspace.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Refine script using OpenRouter
    const refinedData = await refineScript(currentScript.fullText, feedback);

    // Create new version
    const newVersion = currentScript.version + 1;

    const newScriptVersion = await prisma.scriptVersion.create({
      data: {
        projectId: currentScript.projectId,
        version: newVersion,
        hook: refinedData.hook,
        body: refinedData.body,
        cta: refinedData.cta,
        fullText: refinedData.fullText,
        wordCount: refinedData.wordCount,
        duration: currentScript.duration,
        angle: currentScript.angle,
        style: currentScript.style,
      },
    });

    // Update project current version
    await prisma.project.update({
      where: { id: currentScript.projectId },
      data: {
        currentScriptVersionId: newScriptVersion.id,
      },
    });

    return NextResponse.json({
      script: newScriptVersion,
      message: 'Script refined successfully',
    });
  } catch (error) {
    console.error('Refine script error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('OpenRouter')) {
      return NextResponse.json(
        { error: 'AI service error. Please try again or contact support.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to refine script' },
      { status: 500 }
    );
  }
}
