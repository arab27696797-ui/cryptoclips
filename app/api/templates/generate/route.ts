import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/templates/generate
 * Generate video templates - stub (canvas not available in build)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'generate_all') {
      return NextResponse.json({
        message: 'Template generation requires canvas. Run locally with canvas dependencies installed.',
        status: 'not_available',
      });
    }

    if (action === 'generate_one') {
      return NextResponse.json({
        message: 'Template generation requires canvas. Run locally with canvas dependencies installed.',
        status: 'not_available',
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
  return NextResponse.json({
    total: 0,
    expected: 30,
    templates: [],
    complete: false,
    note: 'Template backgrounds require local canvas rendering. The app uses dynamic FFmpeg-generated backgrounds instead.',
  });
}
