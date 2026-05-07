import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getUserWorkspace } from '@/lib/auth';
import { generateScript } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await getUserWorkspace(session.sub);
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
        workspaceId: workspace?.id,
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
      content: source,
      duration,
      angle,
      style,
    });

    // Get current version number
    const latestVersion = await prisma.scriptVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const newVersion = (latestVersion?.versionNumber || 0) + 1;

    // Parse script data
    const hook = scriptData.hook || 'Crypto update';
    const cta = scriptData.cta || 'Follow for more crypto updates';
    const scenes = scriptData.scenes || [{ text: scriptData.script, duration }];

    // Save script version
    const scriptVersion = await prisma.scriptVersion.create({
      data: {
        projectId,
        versionNumber: newVersion,
        hook,
        cta,
        scenes: JSON.stringify(scenes),
        totalDuration: duration,
        angle,
        isActive: true,
      },
    });

    // Deactivate old versions
    await prisma.scriptVersion.updateMany({
      where: {
        projectId,
        id: { not: scriptVersion.id },
      },
      data: { isActive: false },
    });

    return NextResponse.json({
      script: scriptVersion,
      message: 'Script generated successfully',
    });
  } catch (error) {
    console.error('Generate script error:', error);

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
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}
