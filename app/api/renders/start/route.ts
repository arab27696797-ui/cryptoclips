import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserWorkspace } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkGenerationsQuota, incrementGenerationsUsed } from '@/lib/billing/subscription';
import { renderVideo } from '@/lib/render/renderer';
import { generateSpeech } from '@/lib/tts/edge-tts';
import * as path from 'path';
import * as fs from 'fs';

/**
 * POST /api/renders/start
 * Start video rendering
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await getUserWorkspace(session.sub);

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const quotaCheck = await checkGenerationsQuota(workspace.id);
    if (!quotaCheck.hasQuota) {
      return NextResponse.json(
        {
          error: 'Generation quota exceeded',
          message: 'You have reached your monthly generation limit. Please upgrade your plan.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      projectId,
      templateKey,
      voiceId,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project with active script
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: workspace.id,
      },
      include: {
        scriptVersions: {
          where: { isActive: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        voiceovers: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const activeScript = project.scriptVersions[0];
    if (!activeScript) {
      return NextResponse.json({ error: 'No active script found' }, { status: 400 });
    }

    // Create render job
    const renderJob = await prisma.renderJob.create({
      data: {
        projectId: project.id,
        status: 'PENDING',
        templateKey: templateKey || 'clean-news',
      },
    });

    // Start rendering (async)
    processRenderJob(renderJob.id, activeScript, {
      templateKey: templateKey || 'clean-news',
      voiceId: voiceId || 'en-US-GuyNeural',
      workspaceId: workspace.id,
    }).catch((error) => {
      console.error('Render job failed:', error);
      prisma.renderJob
        .update({
          where: { id: renderJob.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        })
        .catch(console.error);
    });

    return NextResponse.json({
      renderJob: {
        id: renderJob.id,
        status: renderJob.status,
        createdAt: renderJob.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Render start error:', error);
    return NextResponse.json(
      { error: 'Failed to start render', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process render job
 */
async function processRenderJob(
  renderJobId: string,
  scriptVersion: any,
  options: {
    templateKey: string;
    voiceId: string;
    workspaceId: string;
  }
) {
  try {
    // Update status
    await prisma.renderJob.update({
      where: { id: renderJobId },
      data: { status: 'RENDERING', startedAt: new Date() },
    });

    // Parse scenes from script
    const scenes = typeof scriptVersion.scenes === 'string'
      ? JSON.parse(scriptVersion.scenes)
      : scriptVersion.scenes || [];

    const scriptText = [scriptVersion.hook, ...scenes.map((s: any) => s.text), scriptVersion.cta].join('. ');

    // Generate audio
    console.log('Generating speech...');
    const audioDir = path.join(process.cwd(), 'temp', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioPath = path.join(audioDir, `${renderJobId}.mp3`);
    await generateSpeech(scriptText, options.voiceId, audioPath);

    // Read audio buffer
    const audioBuffer = fs.readFileSync(audioPath);

    // Render video using new renderer
    console.log('Rendering video...');
    const renderResult = await renderVideo({
      templateKey: options.templateKey,
      hook: scriptVersion.hook,
      scenes: scenes.map((s: any) => ({
        text: s.text,
        duration: s.duration || 5,
      })),
      cta: scriptVersion.cta,
      voiceoverAudio: audioBuffer,
      projectId: scriptVersion.projectId,
      renderId: renderJobId,
    });

    // Cleanup audio
    fs.unlinkSync(audioPath);

    if (!renderResult.success) {
      throw new Error(renderResult.error || 'Video rendering failed');
    }

    // Update render job
    await prisma.renderJob.update({
      where: { id: renderJobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        outputUrl: renderResult.outputUrl,
        outputDuration: renderResult.duration,
        outputFileSize: renderResult.fileSize,
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: scriptVersion.projectId },
      data: { status: 'COMPLETED' },
    });

    // Increment usage
    await incrementGenerationsUsed(options.workspaceId);

    console.log(`Render completed: ${renderJobId}`);
  } catch (error: any) {
    console.error('Render processing error:', error);
  
    await prisma.renderJob.update({
      where: { id: renderJobId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });

    throw error;
  }
}
