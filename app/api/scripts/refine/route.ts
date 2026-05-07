import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getUserWorkspace } from '@/lib/auth';
import { OpenRouterProvider } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await getUserWorkspace(session.sub);
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
    if (currentScript.project.workspaceId !== workspace?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Build full text from script
    const scenes = typeof currentScript.scenes === 'string'
      ? JSON.parse(currentScript.scenes)
      : currentScript.scenes || [];
    const fullText = [currentScript.hook, ...scenes.map((s: any) => s.text), currentScript.cta].join('. ');

    // Refine script using OpenRouter
    const provider = new OpenRouterProvider();
    const refinedData = await provider.refineScript(fullText, feedback);

    // Create new version
    const latestVersion = await prisma.scriptVersion.findFirst({
      where: { projectId: currentScript.projectId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const newVersion = (latestVersion?.versionNumber || 0) + 1;

    const hook = refinedData.hook || 'Updated script';
    const cta = refinedData.cta || 'Follow for more updates';
    const newScenes = refinedData.scenes || [{ text: refinedData.script, duration: currentScript.totalDuration }];

    const newScriptVersion = await prisma.scriptVersion.create({
      data: {
        projectId: currentScript.projectId,
        versionNumber: newVersion,
        hook,
        cta,
        scenes: JSON.stringify(newScenes),
        totalDuration: currentScript.totalDuration,
        angle: currentScript.angle,
        isActive: true,
      },
    });

    // Deactivate old versions
    await prisma.scriptVersion.updateMany({
      where: {
        projectId: currentScript.projectId,
        id: { not: newScriptVersion.id },
      },
      data: { isActive: false },
    });

    return NextResponse.json({
      script: newScriptVersion,
      message: 'Script refined successfully',
    });
  } catch (error) {
    console.error('Refine script error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
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
