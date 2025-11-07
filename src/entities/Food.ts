import { Vector2 } from './Vector2.js';
import { COLORS, GAME_CONFIG } from '../game/constants.js';
import { Renderer } from '../rendering/Renderer.js';
import { Collision } from '../utils/Collision.js';

export enum FoodType {
  RED = 'red',
  BLUE = 'blue'
}

export class Food {
  private position: Vector2;
  private size: number;
  private points: number;
  private growthAmount: number;
  private glowPhase = 0;
  private lifetime: number; // Duration in milliseconds
  private elapsedTime = 0;
  private expired = false;
  private type: FoodType;
  private velocity: Vector2 = Vector2.zero(); // For bouncing blue food

  constructor(position: Vector2, type: FoodType = FoodType.RED) {
    this.position = position.clone();
    this.size = GAME_CONFIG.FOOD_SIZE;
    this.type = type;

    // Set points and growth based on type
    if (type === FoodType.BLUE) {
      this.points = 500;
      this.growthAmount = 10; // Significantly more growth
      // Random velocity for blue food
      const angle = Math.random() * Math.PI * 2;
      this.velocity = new Vector2(
        Math.cos(angle) * GAME_CONFIG.FOOD_SPEED_BLUE,
        Math.sin(angle) * GAME_CONFIG.FOOD_SPEED_BLUE
      );
    } else {
      this.points = 100;
      this.growthAmount = 3; // Increased from 1 to 3
    }

    // Random lifetime between 8 and 20 seconds
    this.lifetime = (8 + Math.random() * 12) * 1000;
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

  update(deltaTime: number, snakePositions: Vector2[] = []): void {
    // Animate glow effect
    this.glowPhase += deltaTime * 0.003;
    if (this.glowPhase > Math.PI * 2) {
      this.glowPhase = 0;
    }

    // Track lifetime
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.lifetime) {
      this.expired = true;
    }

    // Move blue food and handle bouncing
    if (this.type === FoodType.BLUE) {
      const dt = deltaTime * 0.001; // Convert to seconds

      // Update position
      this.position = this.position.add(this.velocity.multiply(dt));

      const margin = this.size / 2;

      // Bounce off walls
      if (this.position.x <= margin) {
        this.position.x = margin;
        this.velocity.x = Math.abs(this.velocity.x);
      } else if (this.position.x >= GAME_CONFIG.CANVAS_WIDTH - margin) {
        this.position.x = GAME_CONFIG.CANVAS_WIDTH - margin;
        this.velocity.x = -Math.abs(this.velocity.x);
      }

      if (this.position.y <= margin) {
        this.position.y = margin;
        this.velocity.y = Math.abs(this.velocity.y);
      } else if (this.position.y >= GAME_CONFIG.CANVAS_HEIGHT - margin) {
        this.position.y = GAME_CONFIG.CANVAS_HEIGHT - margin;
        this.velocity.y = -Math.abs(this.velocity.y);
      }

      // Bounce off snake
      for (const snakePos of snakePositions) {
        const distance = this.position.distance(snakePos);
        const minDistance = this.size / 2 + GAME_CONFIG.SNAKE_SEGMENT_SIZE / 2;

        if (distance < minDistance && distance > 0) {
          // Calculate bounce direction away from snake segment
          const bounceDir = this.position.subtract(snakePos).normalize();
          this.velocity = bounceDir.multiply(GAME_CONFIG.FOOD_SPEED_BLUE);
          // Push food away to avoid overlapping
          this.position = snakePos.add(bounceDir.multiply(minDistance));
          break;
        }
      }
    }
  }

  isExpired(): boolean {
    return this.expired;
  }

  checkCollisionWithSnake(snakeSegments: Vector2[]): boolean {
    const headPosition = snakeSegments[0];
    if (!headPosition) return false;

    // Slightly generous collision detection - 1.2x radius for easier collection
    const collisionMultiplier = 1.2;
    return Collision.circleToCircle(
      this.position,
      (this.size / 2) * collisionMultiplier,
      headPosition,
      (GAME_CONFIG.SNAKE_SEGMENT_SIZE / 2) * collisionMultiplier
    );
  }

  getPosition(): Vector2 {
    return this.position.clone();
  }

  getPoints(): number {
    return this.points;
  }

  getGrowthAmount(): number {
    return this.growthAmount;
  }

  render(renderer: Renderer): void {
    const ctx = renderer.getContext();
    ctx.save();

    // Draw "X" with color based on type
    const color = this.type === FoodType.BLUE ? '#00ffff' : COLORS.RED_FOOD; // Vibrant cyan/blue
    const halfSize = this.size / 2;

    // Draw glow layer first (wider, softer)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // First diagonal line (top-left to bottom-right)
    ctx.beginPath();
    ctx.moveTo(this.position.x - halfSize, this.position.y - halfSize);
    ctx.lineTo(this.position.x + halfSize, this.position.y + halfSize);
    ctx.stroke();

    // Second diagonal line (top-right to bottom-left)
    ctx.beginPath();
    ctx.moveTo(this.position.x + halfSize, this.position.y - halfSize);
    ctx.lineTo(this.position.x - halfSize, this.position.y + halfSize);
    ctx.stroke();

    // Draw sharp core layer on top
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    // First diagonal line (top-left to bottom-right)
    ctx.beginPath();
    ctx.moveTo(this.position.x - halfSize, this.position.y - halfSize);
    ctx.lineTo(this.position.x + halfSize, this.position.y + halfSize);
    ctx.stroke();

    // Second diagonal line (top-right to bottom-left)
    ctx.beginPath();
    ctx.moveTo(this.position.x + halfSize, this.position.y - halfSize);
    ctx.lineTo(this.position.x - halfSize, this.position.y + halfSize);
    ctx.stroke();

    ctx.restore();
  }
}