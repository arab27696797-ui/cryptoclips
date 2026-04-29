import {
  calculateGoldenGrid,
  generateFibonacciSpiral,
  generateGoldenColorPalette,
  PHI,
} from './golden-ratio';

export type TemplateStyle =
  | 'crypto_matrix'
  | 'bull_run'
  | 'bear_market'
  | 'golden_spiral'
  | 'particle_flow'
  | 'geometric_harmony'
  | 'gradient_wave'
  | 'bitcoin_network'
  | 'neon_pulse'
  | 'data_stream';

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export interface TemplateConfig {
  style: TemplateStyle;
  sentiment: Sentiment;
  width: number;
  height: number;
  duration: number; // seconds
  fps: number;
}

/**
 * Render crypto matrix style (Matrix-like falling symbols)
 */
export function renderCryptoMatrix(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height, sentiment } = config;
  const grid = calculateGoldenGrid(width, height);

  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  if (sentiment === 'bullish') {
    bgGradient.addColorStop(0, '#001a00');
    bgGradient.addColorStop(1, '#003300');
  } else if (sentiment === 'bearish') {
    bgGradient.addColorStop(0, '#1a0000');
    bgGradient.addColorStop(1, '#330000');
  } else {
    bgGradient.addColorStop(0, '#001a1a');
    bgGradient.addColorStop(1, '#003333');
  }
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Crypto symbols falling (like Matrix)
  const symbols = ['₿', 'Ξ', '◈', '⟠', '$', '€', '¥', '0', '1'];
  const columns = Math.floor(width / 20);

  for (let i = 0; i < columns; i++) {
    const x = i * 20;
    const y = ((frame * (2 + (i % 3))) % height) - 50;

    // Use golden ratio for symbol placement
    const goldenOffset = (grid.sections.left * (i % 2)) / columns;

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle =
      sentiment === 'bullish'
        ? `rgba(0, 255, 0, ${0.3 + Math.random() * 0.3})`
        : sentiment === 'bearish'
        ? `rgba(255, 0, 0, ${0.3 + Math.random() * 0.3})`
        : `rgba(0, 200, 255, ${0.3 + Math.random() * 0.3})`;

    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    ctx.fillText(symbol, x + goldenOffset, y);
  }
}

/**
 * Render bull run style (ascending lines and charts)
 */
export function renderBullRun(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height } = config;
  const grid = calculateGoldenGrid(width, height);

  // Dark green gradient background
  const bgGradient = ctx.createRadialGradient(
    grid.sections.centerX,
    grid.sections.centerY,
    0,
    grid.sections.centerX,
    grid.sections.centerY,
    height
  );
  bgGradient.addColorStop(0, '#001a00');
  bgGradient.addColorStop(1, '#000000');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Ascending lines positioned by golden ratio
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
  ctx.lineWidth = 3;

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const startY = grid.sections.bottom - (i * height) / (5 * PHI);
    const endY = grid.sections.top + (i * height) / (10 * PHI);
    const offset = (frame * 2) % width;

    ctx.moveTo(-offset, startY);
    ctx.lineTo(width - offset, endY);
    ctx.stroke();
  }

  // Glowing particles at golden points
  grid.points.forEach((point, index) => {
    const pulse = Math.sin(frame * 0.1 + index) * 0.5 + 0.5;
    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      30
    );
    gradient.addColorStop(0, `rgba(0, 255, 0, ${pulse * 0.8})`);
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(point.x - 30, point.y - 30, 60, 60);
  });
}

/**
 * Render bear market style (descending lines and red theme)
 */
export function renderBearMarket(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height } = config;
  const grid = calculateGoldenGrid(width, height);

  // Dark red gradient background
  const bgGradient = ctx.createRadialGradient(
    grid.sections.centerX,
    grid.sections.centerY,
    0,
    grid.sections.centerX,
    grid.sections.centerY,
    height
  );
  bgGradient.addColorStop(0, '#1a0000');
  bgGradient.addColorStop(1, '#000000');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Descending lines positioned by golden ratio
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
  ctx.lineWidth = 3;

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const startY = grid.sections.top + (i * height) / (5 * PHI);
    const endY = grid.sections.bottom - (i * height) / (10 * PHI);
    const offset = (frame * 2) % width;

    ctx.moveTo(-offset, startY);
    ctx.lineTo(width - offset, endY);
    ctx.stroke();
  }

  // Glowing particles at golden points
  grid.points.forEach((point, index) => {
    const pulse = Math.sin(frame * 0.1 + index) * 0.5 + 0.5;
    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      30
    );
    gradient.addColorStop(0, `rgba(255, 0, 0, ${pulse * 0.8})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(point.x - 30, point.y - 30, 60, 60);
  });
}

/**
 * Render golden spiral (Fibonacci spiral animation)
 */
export function renderGoldenSpiral(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height, sentiment } = config;
  const grid = calculateGoldenGrid(width, height);

  // Gradient background
  const colors = generateGoldenColorPalette(sentiment === 'bullish' ? 120 : sentiment === 'bearish' ? 0 : 200);
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#000000');
  bgGradient.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Fibonacci spiral
  const spiral = generateFibonacciSpiral(
    grid.sections.centerX,
    grid.sections.centerY,
    Math.min(width, height) * 0.4,
    150
  );

  // Draw spiral with color gradient
  ctx.strokeStyle = colors[0];
  ctx.lineWidth = 4;
  ctx.beginPath();

  spiral.forEach((point, index) => {
    const progress = index / spiral.length;
    const colorIndex = Math.floor(progress * (colors.length - 1));
    
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }

    // Animated glow on spiral
    if (index % 5 === Math.floor(frame / 2) % 5) {
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 15);
      gradient.addColorStop(0, colors[colorIndex]);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(point.x - 15, point.y - 15, 30, 30);
    }
  });

  ctx.stroke();
}

/**
 * Render particle flow (flowing particles along golden ratio paths)
 */
export function renderParticleFlow(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height, sentiment } = config;
  const grid = calculateGoldenGrid(width, height);

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Particle color based on sentiment
  const particleColor =
    sentiment === 'bullish'
      ? 'rgba(0, 255, 100, 0.8)'
      : sentiment === 'bearish'
      ? 'rgba(255, 50, 50, 0.8)'
      : 'rgba(100, 150, 255, 0.8)';

  // Particles flow along golden ratio lines
  for (let i = 0; i < 50; i++) {
    const t = (frame * 2 + i * 10) % width;
    const goldenY = grid.sections.top + (t / width) * (grid.sections.bottom - grid.sections.top);

    // Particle
    const gradient = ctx.createRadialGradient(t, goldenY, 0, t, goldenY, 8);
    gradient.addColorStop(0, particleColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(t, goldenY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    ctx.strokeStyle = particleColor.replace('0.8', '0.3');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(t - 20, goldenY);
    ctx.lineTo(t, goldenY);
    ctx.stroke();
  }
}

/**
 * Render geometric harmony (geometric shapes following golden ratio)
 */
export function renderGeometricHarmony(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height, sentiment } = config;
  const grid = calculateGoldenGrid(width, height);

  // Background
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0a0a0a');
  bgGradient.addColorStop(1, '#000000');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Color palette
  const colors = generateGoldenColorPalette(sentiment === 'bullish' ? 120 : sentiment === 'bearish' ? 0 : 200);

  // Rotating geometric shapes at golden points
  grid.points.forEach((point, index) => {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate((frame * 0.02) + (index * Math.PI / 2));

    // Golden rectangle
    const size = 100 / PHI;
    ctx.strokeStyle = colors[index % colors.length];
    ctx.lineWidth = 3;
    ctx.strokeRect(-size / 2, -size * PHI / 2, size, size * PHI);

    ctx.restore();
  });

  // Center ornament
  ctx.save();
  ctx.translate(grid.sections.centerX, grid.sections.centerY);
  ctx.rotate(frame * 0.01);

  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -150 / PHI);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Render gradient wave (flowing gradient waves)
 */
export function renderGradientWave(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height, sentiment } = config;

  // Color scheme based on sentiment
  const color1 = sentiment === 'bullish' ? '#00ff00' : sentiment === 'bearish' ? '#ff0000' : '#00aaff';
  const color2 = sentiment === 'bullish' ? '#00aa00' : sentiment === 'bearish' ? '#aa0000' : '#0066aa';

  // Animated gradient
  const angle = (frame * 2) % 360;
  const x1 = width / 2 + Math.cos((angle * Math.PI) / 180) * width;
  const y1 = height / 2 + Math.sin((angle * Math.PI) / 180) * height;

  const gradient = ctx.createLinearGradient(0, 0, x1, y1);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(0.618, color2); // Golden ratio position
  gradient.addColorStop(1, '#000000');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Wave overlay
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;

  for (let y = 0; y < height; y += height / (10 * PHI)) {
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const waveY = y + Math.sin((x + frame * 3) * 0.02) * 30;
      if (x === 0) {
        ctx.moveTo(x, waveY);
      } else {
        ctx.lineTo(x, waveY);
      }
    }
    ctx.stroke();
  }
}

/**
 * Render bitcoin network (network nodes and connections)
 */
export function renderBitcoinNetwork(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height, sentiment } = config;
  const grid = calculateGoldenGrid(width, height);

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Network nodes at golden ratio positions
  const nodes: { x: number; y: number }[] = [];
  
  // Add golden points
  grid.points.forEach(point => nodes.push(point));
  
  // Add random nodes following golden distribution
  for (let i = 0; i < 20; i++) {
    nodes.push({
      x: (Math.random() * width) % grid.sections.left,
      y: (Math.random() * height) % grid.sections.top,
    });
  }

  // Draw connections
  ctx.strokeStyle = sentiment === 'bullish' ? 'rgba(0, 255, 0, 0.2)' : sentiment === 'bearish' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(100, 150, 255, 0.2)';
  ctx.lineWidth = 1;

  nodes.forEach((node1, i) => {
    nodes.slice(i + 1).forEach(node2 => {
      const dist = Math.hypot(node1.x - node2.x, node1.y - node2.y);
      if (dist < width / (3 * PHI)) {
        ctx.beginPath();
        ctx.moveTo(node1.x, node1.y);
        ctx.lineTo(node2.x, node2.y);
        ctx.stroke();
      }
    });
  });

  // Draw nodes
  nodes.forEach((node, index) => {
    const pulse = Math.sin(frame * 0.05 + index) * 0.3 + 0.7;
    const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 10);
    
    const color = sentiment === 'bullish' ? `rgba(0, 255, 0, ${pulse})` : sentiment === 'bearish' ? `rgba(255, 0, 0, ${pulse})` : `rgba(100, 150, 255, ${pulse})`;
    
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Render neon pulse (pulsing neon lines)
 */
export function renderNeonPulse(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height, sentiment } = config;
  const grid = calculateGoldenGrid(width, height);

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Neon color
  const neonColor = sentiment === 'bullish' ? '#00ff00' : sentiment === 'bearish' ? '#ff0000' : '#00ffff';

  // Pulsing circles at golden points
  grid.points.forEach((point, index) => {
    const pulse = Math.sin(frame * 0.1 + index * Math.PI / 2) * 50 + 100;

    // Outer glow
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pulse);
    gradient.addColorStop(0, neonColor);
    gradient.addColorStop(0.5, neonColor.replace(')', ', 0.5)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(point.x - pulse, point.y - pulse, pulse * 2, pulse * 2);

    // Inner bright circle
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(point.x, point.y, pulse * 0.618, 0, Math.PI * 2); // Golden ratio radius
    ctx.stroke();
  });
}

/**
 * Render data stream (streaming data visualization)
 */
export function renderDataStream(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  const { width, height, sentiment } = config;
  const grid = calculateGoldenGrid(width, height);

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Stream color
  const streamColor = sentiment === 'bullish' ? 'rgba(0, 255, 0, 0.6)' : sentiment === 'bearish' ? 'rgba(255, 0, 0, 0.6)' : 'rgba(0, 200, 255, 0.6)';

  // Vertical data streams
  const streams = 15;
  for (let i = 0; i < streams; i++) {
    const x = (width / streams) * i;
    const offset = (frame * 5 + i * 50) % (height + 200);

    // Bar
    const barHeight = 100 + Math.sin(frame * 0.05 + i) * 50;
    
    const gradient = ctx.createLinearGradient(x, offset - barHeight, x, offset);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.618, streamColor); // Golden ratio position
    gradient.addColorStop(1, streamColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, offset - barHeight, width / streams - 5, barHeight);
  }

  // Horizontal golden ratio lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, grid.sections.top);
  ctx.lineTo(width, grid.sections.top);
  ctx.moveTo(0, grid.sections.bottom);
  ctx.lineTo(width, grid.sections.bottom);
  ctx.stroke();
}

/**
 * Main render function - routes to specific style renderer
 */
export function renderTemplate(
  ctx: CanvasRenderingContext2D,
  config: TemplateConfig,
  frame: number
): void {
  switch (config.style) {
    case 'crypto_matrix':
      renderCryptoMatrix(ctx, config, frame);
      break;
    case 'bull_run':
      renderBullRun(ctx, config, frame);
      break;
    case 'bear_market':
      renderBearMarket(ctx, config, frame);
      break;
    case 'golden_spiral':
      renderGoldenSpiral(ctx, config, frame);
      break;
    case 'particle_flow':
      renderParticleFlow(ctx, config, frame);
      break;
    case 'geometric_harmony':
      renderGeometricHarmony(ctx, config, frame);
      break;
    case 'gradient_wave':
      renderGradientWave(ctx, config, frame);
      break;
    case 'bitcoin_network':
      renderBitcoinNetwork(ctx, config, frame);
      break;
    case 'neon_pulse':
      renderNeonPulse(ctx, config, frame);
      break;
    case 'data_stream':
      renderDataStream(ctx, config, frame);
      break;
    default:
      // Default: simple gradient
      const gradient = ctx.createLinearGradient(0, 0, config.width, config.height);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, config.width, config.height);
  }
}
