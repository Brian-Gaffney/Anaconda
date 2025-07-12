import { Vector2 } from './Vector2.js';
import { Direction } from '../input/InputManager.js';
import { GAME_CONFIG, COLORS } from '../game/constants.js';
import { Renderer } from '../rendering/Renderer.js';

interface SnakeSegment {
  position: Vector2;
  targetPosition: Vector2;
  interpolationProgress: number;
}

export class Snake {
  private segments: SnakeSegment[] = [];
  private direction: Direction = Direction.RIGHT;
  private nextDirection: Direction = Direction.RIGHT;
  private moveTimer = 0;
  private readonly moveInterval = 150; // milliseconds between moves
  private growthPending = 0;

  constructor(startPosition: Vector2) {
    // Initialize snake with segments
    for (let i = 0; i < GAME_CONFIG.INITIAL_SNAKE_LENGTH; i++) {
      const segmentPos = new Vector2(
        startPosition.x - i * GAME_CONFIG.SNAKE_SEGMENT_SIZE,
        startPosition.y
      );
      this.segments.push({
        position: segmentPos.clone(),
        targetPosition: segmentPos.clone(),
        interpolationProgress: 1,
      });
    }
  }

  update(deltaTime: number): void {
    this.moveTimer += deltaTime;

    // Update segment interpolation for smooth movement
    this.segments.forEach(segment => {
      if (segment.interpolationProgress < 1) {
        segment.interpolationProgress = Math.min(1, 
          segment.interpolationProgress + deltaTime / this.moveInterval
        );
        segment.position = segment.position.lerp(
          segment.targetPosition, 
          this.easeInOutQuad(segment.interpolationProgress)
        );
      }
    });

    // Move snake at regular intervals
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.move();
    }
  }

  private move(): void {
    // Update direction
    this.direction = this.nextDirection;

    // Calculate new head position
    const head = this.segments[0];
    const directionVector = this.getDirectionVector(this.direction);
    const newHeadTarget = head.targetPosition.add(
      directionVector.multiply(GAME_CONFIG.SNAKE_SEGMENT_SIZE)
    );

    // Move each segment to the position of the segment in front
    for (let i = this.segments.length - 1; i > 0; i--) {
      this.segments[i].targetPosition = this.segments[i - 1].targetPosition.clone();
      this.segments[i].interpolationProgress = 0;
    }

    // Move head to new position
    head.targetPosition = newHeadTarget;
    head.interpolationProgress = 0;

    // Handle growth
    if (this.growthPending > 0) {
      this.grow();
      this.growthPending--;
    }
  }

  private grow(): void {
    const tail = this.segments[this.segments.length - 1];
    const newSegment: SnakeSegment = {
      position: tail.position.clone(),
      targetPosition: tail.position.clone(),
      interpolationProgress: 1,
    };
    this.segments.push(newSegment);
  }

  private getDirectionVector(direction: Direction): Vector2 {
    switch (direction) {
      case Direction.UP:
        return new Vector2(0, -1);
      case Direction.DOWN:
        return new Vector2(0, 1);
      case Direction.LEFT:
        return new Vector2(-1, 0);
      case Direction.RIGHT:
        return new Vector2(1, 0);
    }
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  setDirection(newDirection: Direction): void {
    // Prevent moving directly backwards
    const opposite = this.getOppositeDirection(this.direction);
    if (newDirection !== opposite) {
      this.nextDirection = newDirection;
    }
  }

  private getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case Direction.UP:
        return Direction.DOWN;
      case Direction.DOWN:
        return Direction.UP;
      case Direction.LEFT:
        return Direction.RIGHT;
      case Direction.RIGHT:
        return Direction.LEFT;
    }
  }

  addGrowth(amount = 1): void {
    this.growthPending += amount;
  }

  getHeadPosition(): Vector2 {
    return this.segments[0].position.clone();
  }

  getSegments(): SnakeSegment[] {
    return this.segments;
  }

  checkSelfCollision(): boolean {
    const head = this.segments[0].targetPosition;
    
    // Check collision with body segments (skip head)
    for (let i = 1; i < this.segments.length; i++) {
      const segment = this.segments[i].targetPosition;
      if (head.distance(segment) < GAME_CONFIG.SNAKE_SEGMENT_SIZE * 0.8) {
        return true;
      }
    }
    return false;
  }

  checkBoundaryCollision(): boolean {
    const head = this.segments[0].targetPosition;
    const segmentSize = GAME_CONFIG.SNAKE_SEGMENT_SIZE;
    
    return (
      head.x < segmentSize / 2 ||
      head.x >= GAME_CONFIG.CANVAS_WIDTH - segmentSize / 2 ||
      head.y < segmentSize / 2 ||
      head.y >= GAME_CONFIG.CANVAS_HEIGHT - segmentSize / 2
    );
  }

  render(renderer: Renderer): void {
    renderer.enableGlow(COLORS.NEON_GREEN);
    
    this.segments.forEach((segment, index) => {
      const size = GAME_CONFIG.SNAKE_SEGMENT_SIZE;
      const x = segment.position.x - size / 2;
      const y = segment.position.y - size / 2;
      
      // Draw main segment
      renderer.drawRect(x, y, size, size, COLORS.NEON_GREEN);
      
      // Draw grid pattern on segments
      const gridSize = 4;
      for (let gx = 0; gx < size; gx += gridSize) {
        for (let gy = 0; gy < size; gy += gridSize) {
          if ((gx + gy) % (gridSize * 2) === 0) {
            renderer.drawRect(x + gx, y + gy, 1, 1, COLORS.DARK_BG);
          }
        }
      }
      
      // Highlight head
      if (index === 0) {
        renderer.drawRect(x + 2, y + 2, size - 4, size - 4, COLORS.CYAN_ACCENT);
      }
    });
    
    renderer.disableGlow();
  }
}