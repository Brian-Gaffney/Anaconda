import { GAME_CONFIG, COLORS } from '../game/constants.js';

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = context;
    
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
  }

  clear(): void {
    this.ctx.fillStyle = COLORS.DARK_BG;
    this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  }

  drawRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  drawCircle(x: number, y: number, radius: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawText(text: string, x: number, y: number, color: string = COLORS.NEON_GREEN): void {
    this.ctx.fillStyle = color;
    this.ctx.font = '20px "Courier New", monospace';
    this.ctx.fillText(text, x, y);
  }

  enableGlow(color: string, blur: number = GAME_CONFIG.NEON_GLOW_SIZE): void {
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = blur;
  }

  disableGlow(): void {
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }
}