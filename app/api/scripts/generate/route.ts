import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireWorkspace } from '@/lib/auth/session';
import { generateScript } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await requireWorkspace();
    const body = await request.json();

    const { projectId, source, sourceType, duration, angle, style } = body;

    // Validation
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!source || !sourceType || !duration || !angle) {
      return NextResponse.json(
        { error: 'Source, sourceType, duration, and angle are required' },
        { status: 400 }
      );
    }

    if (!['url', 'text', 'tweet'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'Invalid source type' },
        { status: 400 }
      );
    }

    if (!['neutral', 'bullish', 'bearish'].includes(angle)) {
      return NextResponse.json(
        { error: 'Invalid angle' },
        { status: 400 }
      );
    }

    if (duration < 10 || duration > 60) {
      return NextResponse.json(
        { error: 'Duration must be between 10 and 60 seconds' },
        { status: 400 }
      );
    }

    // Check if project exists and belongs to workspace
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: workspace.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Generate script using OpenRouter
    const scriptData = await generateScript({
      source,
      sourceType,
      duration,
      angle,
      style,
    });

    // Get current version number
    const latestVersion = await prisma.scriptVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersion = (latestVersion?.version || 0) + 1;

    // Save script version
    const scriptVersion = await prisma.scriptVersion.create({
      data: {
        projectId,
        version: newVersion,
        hook: scriptData.hook,
        body: scriptData.body,
        cta: scriptData.cta,
        fullText: scriptData.fullText,
        wordCount: scriptData.wordCount,
        duration,
        angle,
        style: style || null,
      },
    });

    // Update project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentScriptVersionId: scriptVersion.id,
      },
    });

    return NextResponse.json({
      script: scriptVersion,
      message: 'Script generated successfully',
    });
  } catch (error) {
    console.error('Generate script error:', error);

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
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}
