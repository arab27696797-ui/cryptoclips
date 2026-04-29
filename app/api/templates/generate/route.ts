import { NextRequest, NextResponse } from 'next/server';
import { generateAllTemplates, generateVideoTemplate } from '@/lib/templates/video-generator';
import { TemplateStyle, Sentiment } from '@/lib/templates/styles';
import * as path from 'path';

/**
 * POST /api/templates/generate
 * Generate video templates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, style, sentiment } = body;

    if (action === 'generate_all') {
      // Generate all templates (long operation - run in background)
      console.log('Starting generation of all templates...');
      
      // Run async without waiting
      generateAllTemplates().catch((error) => {
        console.error('Template generation failed:', error);
      });

      return NextResponse.json({
        message: 'Template generation started in background. This may take 30-60 minutes.',
        status: 'processing',
      });
    }

    if (action === 'generate_one' && style && sentiment) {
      // Generate single template
      const outputPath = path.join(
        process.cwd(),
        'public',
        'templates',
        'backgrounds',
        `${style}_${sentiment}.mp4`
      );

      await generateVideoTemplate({
        style: style as TemplateStyle,
        sentiment: sentiment as Sentiment,
        duration: 30,
        outputPath,
      });

      return NextResponse.json({
        message: 'Template generated successfully',
        path: `/templates/backgrounds/${style}_${sentiment}.mp4`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Template generation failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/templates/generate
 * Get generation status and available templates
 */
export async function GET() {
  try {
    const { getAvailableTemplates } = await import('@/lib/templates/video-generator');
    const templates = getAvailableTemplates();

    return NextResponse.json({
      total: templates.length,
      expected: 30, // 10 styles × 3 sentiments
      templates,
      complete: templates.length === 30,
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}
