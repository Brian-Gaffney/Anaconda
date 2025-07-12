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
  private gameTime = 0; // Track total game time for animations

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
    this.gameTime += dt; // Update game time for animations
    
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
      : { position: this.headPosition.subtract(new Vector2(Math.cos(this.currentAngle), Math.sin(this.currentAngle)).multiply(this.segmentSpacing)) };
    
    const newSegment: SnakeSegment = {
      position: tail.position.clone(),
      velocity: Vector2.zero(),
      distanceFromHead: (this.segments.length + 1) * this.segmentSpacing,
    };
    this.segments.push(newSegment);
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
    const ctx = renderer.getContext();
    ctx.save();
    
    // Set up minimal green line style
    ctx.strokeStyle = COLORS.NEON_GREEN;
    ctx.lineWidth = 2;
    
    // Get the continuous path of the snake
    const pathPoints = this.calculateSnakePath();
    
    if (pathPoints.length < 2) {
      ctx.restore();
      return;
    }
    
    // Draw the continuous tube outline
    this.drawTubeOutline(ctx, pathPoints);
    
    // Draw perpendicular cross-lines every ~20px
    this.drawCrossLines(ctx, pathPoints);
    
    ctx.restore();
  }

  private calculateSnakePath(): Vector2[] {
    const pathPoints: Vector2[] = [];
    
    // Start with head position
    pathPoints.push(this.headPosition.clone());
    
    // Add all segment positions
    for (const segment of this.segments) {
      pathPoints.push(segment.position.clone());
    }
    
    return pathPoints;
  }

  private drawTubeOutline(ctx: CanvasRenderingContext2D, pathPoints: Vector2[]): void {
    const tubeWidth = GAME_CONFIG.SNAKE_SEGMENT_SIZE * 0.8;
    const halfWidth = tubeWidth / 2;
    
    if (pathPoints.length < 2) return;
    
    // Calculate the outline points for both sides of the tube
    const leftSide: Vector2[] = [];
    const rightSide: Vector2[] = [];
    
    for (let i = 0; i < pathPoints.length; i++) {
      const current = pathPoints[i];
      let direction: Vector2;
      
      if (i === 0) {
        // First point - use direction to next point
        direction = pathPoints[i + 1].subtract(current).normalize();
      } else if (i === pathPoints.length - 1) {
        // Last point - use direction from previous point
        direction = current.subtract(pathPoints[i - 1]).normalize();
      } else {
        // Middle points - average direction
        const dirToPrev = current.subtract(pathPoints[i - 1]).normalize();
        const dirToNext = pathPoints[i + 1].subtract(current).normalize();
        direction = dirToPrev.add(dirToNext).normalize();
      }
      
      const perpendicular = new Vector2(-direction.y, direction.x);
      leftSide.push(current.add(perpendicular.multiply(halfWidth)));
      rightSide.push(current.subtract(perpendicular.multiply(halfWidth)));
    }
    
    // Draw left side
    ctx.beginPath();
    ctx.moveTo(leftSide[0].x, leftSide[0].y);
    for (let i = 1; i < leftSide.length; i++) {
      ctx.lineTo(leftSide[i].x, leftSide[i].y);
    }
    ctx.stroke();
    
    // Draw right side
    ctx.beginPath();
    ctx.moveTo(rightSide[0].x, rightSide[0].y);
    for (let i = 1; i < rightSide.length; i++) {
      ctx.lineTo(rightSide[i].x, rightSide[i].y);
    }
    ctx.stroke();
  }

  private drawCrossLines(ctx: CanvasRenderingContext2D, pathPoints: Vector2[]): void {
    const crossLineSpacing = 20; // Every 20px
    const tubeWidth = GAME_CONFIG.SNAKE_SEGMENT_SIZE * 0.8;
    const halfWidth = tubeWidth / 2;
    
    if (pathPoints.length < 2) return;
    
    // Calculate total path length and sample points
    let totalLength = 0;
    const segmentLengths: number[] = [];
    
    for (let i = 1; i < pathPoints.length; i++) {
      const length = pathPoints[i].distance(pathPoints[i - 1]);
      segmentLengths.push(length);
      totalLength += length;
    }
    
    // Draw cross-lines at regular intervals
    let nextCrossLine = crossLineSpacing;
    
    while (nextCrossLine < totalLength) {
      const position = this.getPositionAtDistance(pathPoints, segmentLengths, nextCrossLine);
      const direction = this.getDirectionAtDistance(pathPoints, segmentLengths, nextCrossLine);
      
      if (position && direction) {
        const perpendicular = new Vector2(-direction.y, direction.x);
        const start = position.add(perpendicular.multiply(halfWidth));
        const end = position.subtract(perpendicular.multiply(halfWidth));
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      
      nextCrossLine += crossLineSpacing;
    }
  }

  private getPositionAtDistance(pathPoints: Vector2[], segmentLengths: number[], targetDistance: number): Vector2 | null {
    let currentDistance = 0;
    
    for (let i = 0; i < segmentLengths.length; i++) {
      const segmentLength = segmentLengths[i];
      
      if (currentDistance + segmentLength >= targetDistance) {
        // Target is within this segment
        const segmentProgress = (targetDistance - currentDistance) / segmentLength;
        const start = pathPoints[i];
        const end = pathPoints[i + 1];
        return start.add(end.subtract(start).multiply(segmentProgress));
      }
      
      currentDistance += segmentLength;
    }
    
    return null;
  }

  private getDirectionAtDistance(pathPoints: Vector2[], segmentLengths: number[], targetDistance: number): Vector2 | null {
    let currentDistance = 0;
    
    for (let i = 0; i < segmentLengths.length; i++) {
      const segmentLength = segmentLengths[i];
      
      if (currentDistance + segmentLength >= targetDistance) {
        // Target is within this segment
        const start = pathPoints[i];
        const end = pathPoints[i + 1];
        return end.subtract(start).normalize();
      }
      
      currentDistance += segmentLength;
    }
    
    return null;
  }

}