import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { getAvailableTemplates } from '@/lib/templates/video-generator';
import { TemplateStyle, Sentiment } from '@/lib/templates/styles';

const execAsync = promisify(exec);

export interface RenderOptions {
  scriptText: string;
  audioPath: string;
  templateStyle?: TemplateStyle;
  sentiment?: Sentiment;
  brandPreset?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoPath?: string;
  };
  outputPath: string;
}

/**
 * Render final video with template, audio, and text overlay
 */
export async function renderVideo(options: RenderOptions): Promise<string> {
  const {
    scriptText,
    audioPath,
    templateStyle = 'crypto_matrix',
    sentiment = 'neutral',
    brandPreset,
    outputPath,
  } = options;

  console.log('Starting video render...');

  // Get template background
  const templates = getAvailableTemplates();
  const template = templates.find(
    (t) => t.style === templateStyle && t.sentiment === sentiment
  );

  if (!template) {
    throw new Error(`Template not found: ${templateStyle}_${sentiment}`);
  }

  const templatePath = path.join(process.cwd(), 'public', template.path);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  console.log(`Using template: ${template.path}`);

  // Prepare text overlay
  const textLines = scriptText.split('\n').filter((line) => line.trim());
  const fontSize = 48;
  const fontColor = brandPreset?.primaryColor || '#FFFFFF';
  const fontFamily = brandPreset?.fontFamily || 'Arial';

  // Build FFmpeg filter for text overlay
  // Position text using golden ratio (lower third)
  const textY = Math.round(1920 * 0.618); // Golden ratio position from top

  const textFilter = textLines
    .map((line, index) => {
      const yOffset = textY + index * (fontSize + 10);
      return `drawtext=text='${line.replace(/'/g, "\\'")}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=${yOffset}:shadowcolor=black:shadowx=2:shadowy=2`;
    })
    .join(',');

  // Add logo if provided
  let logoFilter = '';
  if (brandPreset?.logoPath && fs.existsSync(brandPreset.logoPath)) {
    // Logo at top-left golden ratio position
    const logoX = Math.round(1080 * (1 - 0.618));
    const logoY = Math.round(1920 * (1 - 0.618));
    logoFilter = `[0:v]overlay=${logoX}:${logoY}[v1];[v1]`;
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // FFmpeg command
  const ffmpegCommand = `ffmpeg -y \
    -i "${templatePath}" \
    -i "${audioPath}" \
    ${brandPreset?.logoPath ? `-i "${brandPreset.logoPath}"` : ''} \
    -filter_complex "${logoFilter}${textFilter}" \
    -map 0:v -map 1:a \
    -c:v libx264 -preset medium -crf 23 \
    -c:a aac -b:a 128k \
    -shortest \
    "${outputPath}"`;

  console.log('Running FFmpeg...');

  try {
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    console.log('FFmpeg output:', stdout);
    if (stderr) console.log('FFmpeg stderr:', stderr);
    console.log(`Video rendered: ${outputPath}`);
    return outputPath;
  } catch (error: any) {
    console.error('FFmpeg error:', error);
    throw new Error(`Video rendering failed: ${error.message}`);
  }
}

/**
 * Get audio duration using FFprobe
 */
export async function getAudioDuration(audioPath: string): Promise<number> {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('Error getting audio duration:', error);
    throw new Error('Failed to get audio duration');
  }
}
