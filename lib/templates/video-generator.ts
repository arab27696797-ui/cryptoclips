import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { renderTemplate, TemplateConfig, TemplateStyle, Sentiment } from './styles';

const execAsync = promisify(exec);

export interface VideoGenerationOptions {
  style: TemplateStyle;
  sentiment: Sentiment;
  duration: number; // seconds
  outputPath: string;
}

/**
 * Generate video background from canvas animations
 * Creates beautiful video templates following golden ratio principles
 */
export async function generateVideoTemplate(
  options: VideoGenerationOptions
): Promise<string> {
  const { style, sentiment, duration, outputPath } = options;

  // Video settings
  const width = 1080;
  const height = 1920; // Vertical format for TikTok/Reels
  const fps = 30;
  const totalFrames = duration * fps;

  console.log(`Generating ${style} template (${sentiment}) - ${totalFrames} frames...`);

  // Create temp directory for frames
  const tempDir = path.join(process.cwd(), 'temp', `template_${Date.now()}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Render frames
  const config: TemplateConfig = {
    style,
    sentiment,
    width,
    height,
    duration,
    fps,
  };

  for (let frame = 0; frame < totalFrames; frame++) {
    // Create canvas for this frame
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Render frame
    renderTemplate(ctx, config, frame);

    // Save frame as image
    const framePath = path.join(tempDir, `frame_${String(frame).padStart(5, '0')}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(framePath, buffer);

    // Progress log
    if (frame % 30 === 0) {
      console.log(`  Progress: ${Math.round((frame / totalFrames) * 100)}%`);
    }
  }

  console.log('Frames rendered. Encoding video with FFmpeg...');

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Encode video using FFmpeg
  const ffmpegCommand = `ffmpeg -y -framerate ${fps} -i "${tempDir}/frame_%05d.png" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${outputPath}"`;

  try {
    await execAsync(ffmpegCommand);
    console.log(`Video generated: ${outputPath}`);
  } catch (error) {
    console.error('FFmpeg error:', error);
    throw new Error('Failed to encode video');
  }

  // Cleanup temp files
  fs.rmSync(tempDir, { recursive: true, force: true });

  return outputPath;
}

/**
 * Generate all template variations
 * Creates complete library of video backgrounds
 */
export async function generateAllTemplates(): Promise<void> {
  const templatesDir = path.join(process.cwd(), 'public', 'templates', 'backgrounds');
  
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const styles: TemplateStyle[] = [
    'crypto_matrix',
    'bull_run',
    'bear_market',
    'golden_spiral',
    'particle_flow',
    'geometric_harmony',
    'gradient_wave',
    'bitcoin_network',
    'neon_pulse',
    'data_stream',
  ];

  const sentiments: Sentiment[] = ['bullish', 'bearish', 'neutral'];

  console.log('Starting template generation...');
  console.log(`Total templates: ${styles.length * sentiments.length}`);

  let count = 0;
  for (const style of styles) {
    for (const sentiment of sentiments) {
      count++;
      console.log(`\n[${count}/${styles.length * sentiments.length}] Generating ${style}_${sentiment}...`);

      const outputPath = path.join(templatesDir, `${style}_${sentiment}.mp4`);

      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        console.log('  Already exists, skipping.');
        continue;
      }

      await generateVideoTemplate({
        style,
        sentiment,
        duration: 30, // 30 seconds
        outputPath,
      });
    }
  }

  console.log('\n✅ All templates generated successfully!');
}

/**
 * Get available templates
 */
export function getAvailableTemplates(): Array<{
  style: TemplateStyle;
  sentiment: Sentiment;
  path: string;
}> {
  const templatesDir = path.join(process.cwd(), 'public', 'templates', 'backgrounds');
  
  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  const files = fs.readdirSync(templatesDir);
  const templates: Array<{ style: TemplateStyle; sentiment: Sentiment; path: string }> = [];

  files.forEach((file) => {
    if (file.endsWith('.mp4')) {
      const [style, sentiment] = file.replace('.mp4', '').split('_');
      templates.push({
        style: style as TemplateStyle,
        sentiment: sentiment as Sentiment,
        path: `/templates/backgrounds/${file}`,
      });
    }
  });

  return templates;
}
