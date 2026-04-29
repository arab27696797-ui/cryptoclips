// Golden Ratio utilities for beautiful composition
export const PHI = 1.618033988749895; // Golden Ratio (φ)
export const PHI_INVERSE = 0.618033988749895; // 1/φ

export interface GoldenPoint {
  x: number;
  y: number;
}

export interface GoldenGrid {
  width: number;
  height: number;
  points: GoldenPoint[];
  sections: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
  };
}

/**
 * Calculate golden ratio grid for canvas composition
 * Places key elements at aesthetically pleasing positions
 */
export function calculateGoldenGrid(width: number, height: number): GoldenGrid {
  // Divide canvas using golden ratio
  const leftSection = width * PHI_INVERSE;
  const rightSection = width - leftSection;
  const topSection = height * PHI_INVERSE;
  const bottomSection = height - topSection;

  // Golden ratio intersection points (most visually appealing positions)
  const points: GoldenPoint[] = [
    { x: leftSection, y: topSection }, // Top-left golden point
    { x: rightSection, y: topSection }, // Top-right golden point
    { x: leftSection, y: bottomSection }, // Bottom-left golden point
    { x: rightSection, y: bottomSection }, // Bottom-right golden point
  ];

  return {
    width,
    height,
    points,
    sections: {
      left: leftSection,
      right: rightSection,
      top: topSection,
      bottom: bottomSection,
      centerX: width / 2,
      centerY: height / 2,
    },
  };
}

/**
 * Generate Fibonacci spiral coordinates
 * Beautiful natural spiral based on golden ratio
 */
export function generateFibonacciSpiral(
  centerX: number,
  centerY: number,
  maxRadius: number,
  points: number = 100
): GoldenPoint[] {
  const spiral: GoldenPoint[] = [];
  const angleStep = (2 * Math.PI) / PHI; // Golden angle

  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const radius = maxRadius * Math.sqrt(i / points); // Spiral growth

    spiral.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }

  return spiral;
}

/**
 * Generate harmonious color palette using golden ratio
 */
export function generateGoldenColorPalette(baseHue: number): string[] {
  const goldenAngle = 137.508; // Golden angle in degrees

  return [
    `hsl(${baseHue}, 70%, 50%)`,
    `hsl(${(baseHue + goldenAngle) % 360}, 70%, 50%)`,
    `hsl(${(baseHue + goldenAngle * 2) % 360}, 70%, 50%)`,
    `hsl(${(baseHue + goldenAngle * 3) % 360}, 70%, 50%)`,
  ];
}

/**
 * Apply golden ratio easing to animation
 * Creates natural, pleasing motion
 */
export function goldenEasing(t: number): number {
  // Smooth ease-in-out based on golden ratio
  return t < 0.5
    ? Math.pow(t * 2, PHI) / 2
    : 1 - Math.pow((1 - t) * 2, PHI) / 2;
}
