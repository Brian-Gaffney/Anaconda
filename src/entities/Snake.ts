import { Vector2 } from './Vector2.js';
import { Direction } from '../input/InputManager.js';
import { GAME_CONFIG, COLORS } from '../game/constants.js';
import { Renderer } from '../rendering/Renderer.js';

interface SnakeSegment {
  position: Vector2;
  velocity: Vector2;
  distanceFromHead: number;
}

export class Snake {
  private segments: SnakeSegment[] = [];
  private headPosition: Vector2;
  private headVelocity: Vector2;
  private currentAngle: number = 0; // Current heading in radians
  private baseSpeed = 80; // pixels per second
  private baseTurnRate = 2.5; // radians per second turning speed
  private segmentSpacing = GAME_CONFIG.SNAKE_SEGMENT_SIZE;
  private growthPending = 0;
  private isLeftPressed = false;
  private isRightPressed = false;
  private isBoosting = false;

  constructor(startPosition: Vector2) {
    this.headPosition = startPosition.clone();
    this.currentAngle = 0; // Start facing right
    this.headVelocity = new Vector2(this.baseSpeed, 0);
    
    // Initialize segments trailing behind the head
    this.segments = [];
    for (let i = 0; i < GAME_CONFIG.INITIAL_SNAKE_LENGTH; i++) {
      const segmentPos = new Vector2(
        startPosition.x - (i + 1) * this.segmentSpacing,
        startPosition.y
      );
      this.segments.push({
        position: segmentPos.clone(),
        velocity: Vector2.zero(),
        distanceFromHead: (i + 1) * this.segmentSpacing,
      });
    }
  }

  update(deltaTime: number): void {
    const dt = deltaTime * 0.001; // Convert to seconds
    
    // Calculate current speed and turn rate based on boost state
    const currentSpeed = this.isBoosting ? this.baseSpeed * 1.3 : this.baseSpeed;
    const currentTurnRate = this.isBoosting ? this.baseTurnRate * 0.7 : this.baseTurnRate;
    
    // Apply continuous rotation based on input
    if (this.isLeftPressed) {
      this.currentAngle -= currentTurnRate * dt; // Counter-clockwise
    }
    if (this.isRightPressed) {
      this.currentAngle += currentTurnRate * dt; // Clockwise
    }
    
    // Normalize angle to [0, 2π]
    while (this.currentAngle < 0) this.currentAngle += 2 * Math.PI;
    while (this.currentAngle >= 2 * Math.PI) this.currentAngle -= 2 * Math.PI;
    
    // Update velocity based on current angle and speed
    this.headVelocity = new Vector2(
      Math.cos(this.currentAngle) * currentSpeed,
      Math.sin(this.currentAngle) * currentSpeed
    );
    
    // Move head continuously
    this.headPosition = this.headPosition.add(this.headVelocity.multiply(dt));
    
    // Update segments to follow the head smoothly
    this.updateSegments(dt);
    
    // Handle growth
    if (this.growthPending > 0) {
      this.grow();
      this.growthPending--;
    }
  }

  private updateSegments(dt: number): void {
    if (this.segments.length === 0) return;
    
    // Each segment follows the path of the segment in front of it
    let leadPosition = this.headPosition;
    
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      
      // Calculate direction from segment to lead position
      const toTarget = leadPosition.subtract(segment.position);
      const distance = toTarget.length();
      
      // If segment is too far from its target, move it closer
      if (distance > this.segmentSpacing) {
        const direction = toTarget.normalize();
        const moveDistance = (distance - this.segmentSpacing) * 8 * dt; // Smooth following
        segment.velocity = direction.multiply(moveDistance / dt);
        segment.position = segment.position.add(direction.multiply(moveDistance));
      } else {
        // Apply dampening when close to target
        segment.velocity = segment.velocity.multiply(0.9);
      }
      
      // Update lead position for next segment
      leadPosition = segment.position;
    }
  }

  private grow(): void {
    const tail = this.segments.length > 0 
      ? this.segments[this.segments.length - 1] 
      : { position: this.headPosition.subtract(this.currentDirection.multiply(this.segmentSpacing)) };
    
    const newSegment: SnakeSegment = {
      position: tail.position.clone(),
      velocity: Vector2.zero(),
      distanceFromHead: (this.segments.length + 1) * this.segmentSpacing,
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

  setDirection(newDirection: Direction): void {
    // Handle input as turning left/right instead of absolute directions
    switch (newDirection) {
      case Direction.LEFT:
        this.isLeftPressed = true;
        this.isRightPressed = false;
        break;
      case Direction.RIGHT:
        this.isLeftPressed = false;
        this.isRightPressed = true;
        break;
      case Direction.UP:
      case Direction.DOWN:
        // For now, stop turning when up/down is pressed
        this.isLeftPressed = false;
        this.isRightPressed = false;
        break;
    }
  }

  stopTurning(): void {
    this.isLeftPressed = false;
    this.isRightPressed = false;
  }

  setBoost(boosting: boolean): void {
    this.isBoosting = boosting;
  }

  addGrowth(amount = 1): void {
    this.growthPending += amount;
  }

  getHeadPosition(): Vector2 {
    return this.headPosition.clone();
  }

  getSegments(): SnakeSegment[] {
    return this.segments;
  }

  getAllPositions(): Vector2[] {
    return [this.headPosition, ...this.segments.map(s => s.position)];
  }

  checkSelfCollision(): boolean {
    const head = this.headPosition;
    const collisionRadius = GAME_CONFIG.SNAKE_SEGMENT_SIZE * 0.4;
    
    // Check collision with body segments (skip first few segments to avoid immediate collision)
    for (let i = 3; i < this.segments.length; i++) {
      const segment = this.segments[i];
      if (head.distance(segment.position) < collisionRadius) {
        return true;
      }
    }
    return false;
  }

  checkBoundaryCollision(): boolean {
    const head = this.headPosition;
    const margin = GAME_CONFIG.SNAKE_SEGMENT_SIZE / 2;
    
    return (
      head.x < margin ||
      head.x >= GAME_CONFIG.CANVAS_WIDTH - margin ||
      head.y < margin ||
      head.y >= GAME_CONFIG.CANVAS_HEIGHT - margin
    );
  }

  render(renderer: Renderer): void {
    // Render segments from tail to head (back to front)
    for (let i = this.segments.length - 1; i >= 0; i--) {
      this.renderSegment(renderer, this.segments[i], i);
    }
    
    // Render head last (on top)
    this.renderHead(renderer);
  }

  private renderHead(renderer: Renderer): void {
    const baseSize = GAME_CONFIG.SNAKE_SEGMENT_SIZE;
    const headSize = baseSize * 1.4; // Bulbous head - 40% larger
    
    const ctx = renderer.getContext();
    const currentDirection = new Vector2(Math.cos(this.currentAngle), Math.sin(this.currentAngle));
    
    // Draw bulbous head as rounded rectangle
    ctx.save();
    
    // Enable glow
    ctx.shadowColor = COLORS.NEON_GREEN;
    ctx.shadowBlur = 12;
    
    // Draw rounded head shape
    ctx.fillStyle = COLORS.NEON_GREEN;
    ctx.beginPath();
    ctx.ellipse(
      this.headPosition.x, 
      this.headPosition.y, 
      headSize / 2, 
      headSize / 2.2, 
      this.currentAngle, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    // Add inner highlight
    ctx.shadowBlur = 6;
    ctx.fillStyle = COLORS.CYAN_ACCENT;
    ctx.beginPath();
    ctx.ellipse(
      this.headPosition.x, 
      this.headPosition.y, 
      headSize / 3, 
      headSize / 3.5, 
      this.currentAngle, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw grid pattern on head
    this.drawGridPatternOnCircle(renderer, this.headPosition, headSize);
    
    // Direction-based "eyes"
    const eyeSize = 3;
    const directionOffset = currentDirection.multiply(headSize * 0.25);
    const perpendicular = new Vector2(-currentDirection.y, currentDirection.x).multiply(headSize * 0.2);
    
    const eye1Pos = this.headPosition.add(directionOffset).add(perpendicular);
    const eye2Pos = this.headPosition.add(directionOffset).subtract(perpendicular);
    
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    
    ctx.beginPath();
    ctx.arc(eye1Pos.x, eye1Pos.y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(eye2Pos.x, eye2Pos.y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  private renderSegment(renderer: Renderer, segment: SnakeSegment, index: number): void {
    const baseSize = GAME_CONFIG.SNAKE_SEGMENT_SIZE;
    
    // Calculate tapered size - tail gets progressively smaller
    const tailProgress = index / (this.segments.length - 1); // 0 at head, 1 at tail
    const minSize = baseSize * 0.3; // Tail tapers to 30% of base size
    const segmentSize = baseSize - (baseSize - minSize) * Math.pow(tailProgress, 1.5);
    
    const ctx = renderer.getContext();
    
    // Get connection info for smooth segments
    const prevPos = index > 0 ? this.segments[index - 1].position : this.headPosition;
    const nextPos = index < this.segments.length - 1 ? this.segments[index + 1].position : null;
    
    ctx.save();
    
    // Enable glow
    const velocity = segment.velocity.length();
    const glowIntensity = 0.7 + Math.min(velocity * 0.01, 0.5);
    ctx.shadowColor = COLORS.NEON_GREEN;
    ctx.shadowBlur = 8 * glowIntensity;
    
    // Draw connected segment
    this.drawConnectedSegment(ctx, segment.position, prevPos, nextPos, segmentSize);
    
    // Draw grid pattern
    this.drawGridPattern(renderer, 
      segment.position.x - segmentSize / 2, 
      segment.position.y - segmentSize / 2, 
      segmentSize
    );
    
    ctx.restore();
  }

  private drawConnectedSegment(
    ctx: CanvasRenderingContext2D, 
    pos: Vector2, 
    prevPos: Vector2, 
    nextPos: Vector2 | null, 
    size: number
  ): void {
    ctx.fillStyle = COLORS.NEON_GREEN;
    
    // Draw main segment body
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw connections to previous segment
    if (prevPos) {
      const toPrev = prevPos.subtract(pos);
      const distance = toPrev.length();
      if (distance > 0) {
        const direction = toPrev.normalize();
        const perpendicular = new Vector2(-direction.y, direction.x);
        
        // Draw connection rectangle
        const connectionLength = Math.min(distance, size);
        const connectionWidth = size * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
          pos.x + perpendicular.x * connectionWidth / 2,
          pos.y + perpendicular.y * connectionWidth / 2
        );
        ctx.lineTo(
          pos.x - perpendicular.x * connectionWidth / 2,
          pos.y - perpendicular.y * connectionWidth / 2
        );
        ctx.lineTo(
          pos.x + direction.x * connectionLength - perpendicular.x * connectionWidth / 2,
          pos.y + direction.y * connectionLength - perpendicular.y * connectionWidth / 2
        );
        ctx.lineTo(
          pos.x + direction.x * connectionLength + perpendicular.x * connectionWidth / 2,
          pos.y + direction.y * connectionLength + perpendicular.y * connectionWidth / 2
        );
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawGridPattern(renderer: Renderer, x: number, y: number, size: number): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = COLORS.DARK_BG;
    
    const gridSpacing = Math.max(2, size / 8);
    const lineWidth = 1;
    
    // Vertical lines
    for (let gx = gridSpacing; gx < size; gx += gridSpacing) {
      ctx.fillRect(x + gx, y, lineWidth, size);
    }
    
    // Horizontal lines
    for (let gy = gridSpacing; gy < size; gy += gridSpacing) {
      ctx.fillRect(x, y + gy, size, lineWidth);
    }
    
    ctx.restore();
  }

  private drawGridPatternOnCircle(renderer: Renderer, center: Vector2, size: number): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.strokeStyle = COLORS.DARK_BG;
    ctx.lineWidth = 1;
    
    const radius = size / 2;
    const gridSpacing = Math.max(3, size / 10);
    
    // Draw radial lines
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(
        center.x + Math.cos(angle) * radius * 0.8,
        center.y + Math.sin(angle) * radius * 0.8
      );
      ctx.stroke();
    }
    
    // Draw concentric circles
    for (let r = gridSpacing; r < radius; r += gridSpacing) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
}