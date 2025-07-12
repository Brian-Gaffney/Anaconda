import { Vector2 } from './Vector2.js';
import { COLORS, GAME_CONFIG } from '../game/constants.js';
import { Renderer } from '../rendering/Renderer.js';
import { Collision } from '../utils/Collision.js';

export class Food {
  private position: Vector2;
  private size: number;
  private points: number;
  private glowPhase = 0;

  constructor(position: Vector2, points = 10) {
    this.position = position.clone();
    this.size = GAME_CONFIG.FOOD_SIZE;
    this.points = points;
  }

  static generateRandomPosition(
    avoidPositions: Vector2[] = [],
    minDistance = GAME_CONFIG.SNAKE_SEGMENT_SIZE * 2
  ): Vector2 {
    const margin = GAME_CONFIG.FOOD_SIZE;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const x = margin + Math.random() * (GAME_CONFIG.CANVAS_WIDTH - margin * 2);
      const y = margin + Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - margin * 2);
      const newPosition = new Vector2(x, y);

      // Check if position is far enough from avoid positions
      let validPosition = true;
      for (const avoidPos of avoidPositions) {
        if (newPosition.distance(avoidPos) < minDistance) {
          validPosition = false;
          break;
        }
      }

      if (validPosition) {
        return newPosition;
      }
      attempts++;
    }

    // Fallback: return center if no valid position found
    return new Vector2(
      GAME_CONFIG.CANVAS_WIDTH / 2,
      GAME_CONFIG.CANVAS_HEIGHT / 2
    );
  }

  update(deltaTime: number): void {
    // Animate glow effect
    this.glowPhase += deltaTime * 0.003;
    if (this.glowPhase > Math.PI * 2) {
      this.glowPhase = 0;
    }
  }

  checkCollisionWithSnake(snakeSegments: Vector2[]): boolean {
    const headPosition = snakeSegments[0];
    if (!headPosition) return false;

    return Collision.circleToCircle(
      this.position,
      this.size / 2,
      headPosition,
      GAME_CONFIG.SNAKE_SEGMENT_SIZE / 2
    );
  }

  getPosition(): Vector2 {
    return this.position.clone();
  }

  getPoints(): number {
    return this.points;
  }

  render(renderer: Renderer): void {
    // Animated glow effect
    const glowIntensity = 0.8 + Math.sin(this.glowPhase) * 0.4;
    const pulseScale = 1 + Math.sin(this.glowPhase * 1.5) * 0.1;
    
    const currentSize = this.size * pulseScale;
    
    // Draw main food circle with enhanced glow
    renderer.drawGlowingCircle(
      this.position.x,
      this.position.y,
      currentSize / 2,
      COLORS.RED_FOOD,
      glowIntensity
    );

    // Enhanced cross pattern with glow
    const crossSize = currentSize * 0.7;
    const crossThickness = 3;
    
    const ctx = renderer.getContext();
    ctx.save();
    
    // Add glow to cross pattern
    ctx.shadowColor = COLORS.DARK_BG;
    ctx.shadowBlur = 2;
    ctx.fillStyle = COLORS.DARK_BG;
    
    // Horizontal line with rounded ends
    const hx = this.position.x - crossSize / 2;
    const hy = this.position.y - crossThickness / 2;
    ctx.fillRect(hx, hy, crossSize, crossThickness);
    
    // Vertical line with rounded ends
    const vx = this.position.x - crossThickness / 2;
    const vy = this.position.y - crossSize / 2;
    ctx.fillRect(vx, vy, crossThickness, crossSize);
    
    // Add small bright center dot
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, 1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}