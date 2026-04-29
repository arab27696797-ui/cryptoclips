import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { checkQuota } from '@/lib/billing/quota';
import { renderVideo } from '@/lib/render/video-render';
import { generateSpeech } from '@/lib/tts/edge-tts';
import * as path from 'path';
import * as fs from 'fs';

/**
 * POST /api/renders/start
 * Start video rendering
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      scriptVersionId,
      templateStyle,
      sentiment,
      voiceId,
      brandPresetId,
    } = body;

    // Get script version
    const scriptVersion = await prisma.scriptVersion.findUnique({
      where: { id: scriptVersionId },
      include: {
        project: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!scriptVersion) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Verify ownership
    if (scriptVersion.project.workspace.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check quota
    const canGenerate = await checkQuota(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        {
          error: 'Generation quota exceeded',
          message: 'You have reached your monthly generation limit. Please upgrade your plan.',
        },
        { status: 403 }
      );
    }

    // Get brand preset if specified
    let brandPreset = null;
    if (brandPresetId) {
      brandPreset = await prisma.brandPreset.findUnique({
        where: { id: brandPresetId },
      });
    }

    // Create render job
    const renderJob = await prisma.renderJob.create({
      data: {
        scriptVersionId,
        status: 'QUEUED',
        templateStyle: templateStyle || 'crypto_matrix',
        voiceId: voiceId || 'en-US-GuyNeural',
        brandPresetId: brandPresetId || null,
      },
    });

    // Start rendering (async)
    processRenderJob(renderJob.id, scriptVersion.content, {
      templateStyle: templateStyle || 'crypto_matrix',
      sentiment: sentiment || 'neutral',
      voiceId: voiceId || 'en-US-GuyNeural',
      brandPreset: brandPreset
        ? {
            primaryColor: brandPreset.primaryColor,
            secondaryColor: brandPreset.secondaryColor,
            fontFamily: brandPreset.fontFamily,
            logoPath: brandPreset.logoUrl || undefined,
          }
        : undefined,
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
  scriptText: string,
  options: {
    templateStyle: string;
    sentiment: string;
    voiceId: string;
    brandPreset?: any;
  }
) {
  try {
    // Update status
    await prisma.renderJob.update({
      where: { id: renderJobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    // Generate audio
    console.log('Generating speech...');
    const audioDir = path.join(process.cwd(), 'temp', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioPath = path.join(audioDir, `${renderJobId}.mp3`);
    await generateSpeech(scriptText, options.voiceId, audioPath);

    // Render video
    console.log('Rendering video...');
    const videoDir = path.join(process.cwd(), 'public', 'renders');
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    const videoPath = path.join(videoDir, `${renderJobId}.mp4`);

    await renderVideo({
      scriptText,
      audioPath,
      templateStyle: options.templateStyle as any,
      sentiment: options.sentiment as any,
      brandPreset: options.brandPreset,
      outputPath: videoPath,
    });

    // Cleanup audio
    fs.unlinkSync(audioPath);

    // Get video file size
    const stats = fs.statSync(videoPath);
    const fileSizeInBytes = stats.size;

    // Update render job
    await prisma.renderJob.update({
      where: { id: renderJobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        outputUrl: `/renders/${renderJobId}.mp4`,
        fileSize: fileSizeInBytes,
      },
    });

    // Decrement quota
    const renderJob = await prisma.renderJob.findUnique({
      where: { id: renderJobId },
      include: {
        scriptVersion: {
          include: {
            project: {
              include: {
                workspace: {
                  include: {
                    subscription: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (renderJob?.scriptVersion.project.workspace.subscription) {
      await prisma.subscription.update({
        where: {
          id: renderJob.scriptVersion.project.workspace.subscription.id,
        },
        data: {
          generationsUsed: {
            increment: 1,
          },
        },
      });
    }

    console.log(`Render completed: ${renderJobId}`);
  } catch (error: any) {
    console.error('Render processing error:', error);
    throw error;
  }
}
