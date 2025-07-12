import { COLORS } from '../../game/constants.js';

export class NeonEffect {
  static applyMultiLayerGlow(
    ctx: CanvasRenderingContext2D,
    color: string,
    intensity: number = 1
  ): void {
    // Multiple glow layers for more realistic neon effect
    const baseBlur = 4 * intensity;
    
    // Outer glow (largest)
    ctx.shadowColor = color;
    ctx.shadowBlur = baseBlur * 3;
    ctx.globalCompositeOperation = 'source-over';
  }

  static applyInnerGlow(
    ctx: CanvasRenderingContext2D,
    color: string,
    intensity: number = 1
  ): void {
    // Inner glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 2 * intensity;
    ctx.globalCompositeOperation = 'lighter';
  }

  static resetGlow(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  static drawGlowingRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    glowIntensity: number = 1
  ): void {
    // Save context
    ctx.save();

    // Draw outer glow
    NeonEffect.applyMultiLayerGlow(ctx, color, glowIntensity);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    // Draw inner bright core
    NeonEffect.applyInnerGlow(ctx, '#ffffff', glowIntensity * 0.5);
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, width - 2, height - 2);

    // Restore context
    NeonEffect.resetGlow(ctx);
    ctx.restore();
  }

  static drawGlowingCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    glowIntensity: number = 1
  ): void {
    // Save context
    ctx.save();

    // Draw outer glow
    NeonEffect.applyMultiLayerGlow(ctx, color, glowIntensity);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw inner bright core
    NeonEffect.applyInnerGlow(ctx, '#ffffff', glowIntensity * 0.3);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Restore context
    NeonEffect.resetGlow(ctx);
    ctx.restore();
  }

  static drawScanLines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number = 4,
    opacity: number = 0.1
  ): void {
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
    ctx.lineWidth = 1;
    ctx.globalCompositeOperation = 'overlay';

    for (let y = 0; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  static drawBackgroundGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gridSize: number = 20,
    opacity: number = 0.05
  ): void {
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
    ctx.lineWidth = 1;
    ctx.globalCompositeOperation = 'overlay';

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }
}