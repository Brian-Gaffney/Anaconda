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
    const glowIntensity = 0.5 + Math.sin(this.glowPhase) * 0.3;
    const glowSize = GAME_CONFIG.NEON_GLOW_SIZE * glowIntensity;
    
    renderer.enableGlow(COLORS.RED_FOOD, glowSize);
    
    // Draw main food circle
    renderer.drawCircle(
      this.position.x,
      this.position.y,
      this.size / 2,
      COLORS.RED_FOOD
    );

    // Draw cross pattern like in reference image
    const crossSize = this.size * 0.6;
    const crossThickness = 2;
    
    // Horizontal line
    renderer.drawRect(
      this.position.x - crossSize / 2,
      this.position.y - crossThickness / 2,
      crossSize,
      crossThickness,
      COLORS.DARK_BG
    );
    
    // Vertical line
    renderer.drawRect(
      this.position.x - crossThickness / 2,
      this.position.y - crossSize / 2,
      crossThickness,
      crossSize,
      COLORS.DARK_BG
    );

    renderer.disableGlow();
  }
}