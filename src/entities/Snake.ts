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
  private segments: SnakeSegment[] = []; // Keep for collision detection
  private trailPoints: Vector2[] = []; // Fixed trail points for rendering
  private headPosition: Vector2;
  private headVelocity: Vector2;
  private currentAngle: number = 0; // Current heading in radians
  private baseTurnRate = 2.5; // radians per second turning speed
  private segmentSpacing = GAME_CONFIG.SNAKE_SEGMENT_SIZE;
  private growthPending = 0;
  private isLeftPressed = false;
  private isRightPressed = false;
  private isBoosting = false;
  private gameTime = 0; // Track total game time for animations
  private maxTrailLength = GAME_CONFIG.MAX_TRAIL_LENGTH; // Maximum length of trail in pixels
  private lastTrailPoint: Vector2 | null = null;
  
  // Performance optimization caches
  private cachedSegmentLengths: number[] = [];
  private cachedTotalLength = 0;
  private cacheValid = false;

  constructor(startPosition: Vector2) {
    this.headPosition = startPosition.clone();
    this.currentAngle = 0; // Start facing right
    this.headVelocity = new Vector2(GAME_CONFIG.SNAKE_BASE_SPEED, 0);

    // Initialize trail with full length going backwards from start position
    this.trailPoints = [];
    for (let i = 0; i <= this.maxTrailLength; i += GAME_CONFIG.TRAIL_POINT_SPACING) {
      const trailPoint = new Vector2(
        startPosition.x - i, // Extend backwards (to the left)
        startPosition.y
      );
      this.trailPoints.push(trailPoint);
    }
    this.lastTrailPoint = startPosition.clone();

    // Initialize segments for collision detection (still needed for game logic)
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
    const currentSpeed = this.isBoosting ? GAME_CONFIG.SNAKE_BASE_SPEED * 1.8 : GAME_CONFIG.SNAKE_BASE_SPEED;
    const currentTurnRate = this.isBoosting ? this.baseTurnRate * 0.85 : this.baseTurnRate;
    
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
    
    // Update trail points - add new points as head moves
    this.updateTrail();
    
    // Update segments to follow the head smoothly (for collision detection)
    this.updateSegments(dt);
    
    // Handle growth
    if (this.growthPending > 0) {
      this.grow();
      this.growthPending--;
    }
  }

  private updateTrail(): void {
    // Add new trail point if head has moved far enough
    if (this.lastTrailPoint) {
      const distanceMoved = this.headPosition.distance(this.lastTrailPoint);
      if (distanceMoved >= GAME_CONFIG.TRAIL_POINT_SPACING) {
        // Add new point at head position
        this.trailPoints.unshift(this.headPosition.clone());
        this.lastTrailPoint = this.headPosition.clone();

        // Invalidate cache when trail changes
        this.cacheValid = false;

        // Remove old points to maintain max trail length
        this.trimTrail();
      }
    }
  }

  private trimTrail(): void {
    // Use cached calculation if available
    if (!this.cacheValid) {
      this.updateLengthCache();
    }
    
    // Remove points from the tail until we're under max length
    while (this.cachedTotalLength > this.maxTrailLength && this.trailPoints.length > 2) {
      const removedPoint = this.trailPoints.pop();
      if (removedPoint && this.trailPoints.length > 0) {
        const lastPoint = this.trailPoints[this.trailPoints.length - 1];
        const removedLength = lastPoint.distance(removedPoint);
        this.cachedTotalLength -= removedLength;
        this.cachedSegmentLengths.pop();
      }
    }
  }

  private updateLengthCache(): void {
    this.cachedSegmentLengths = [];
    this.cachedTotalLength = 0;
    
    for (let i = 1; i < this.trailPoints.length; i++) {
      const length = this.trailPoints[i - 1].distance(this.trailPoints[i]);
      this.cachedSegmentLengths.push(length);
      this.cachedTotalLength += length;
    }
    
    this.cacheValid = true;
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
    // Increase max trail length to make tube longer
    this.maxTrailLength += GAME_CONFIG.GROWTH_PIXELS;

    // Also add segment for collision detection
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
    // Use trail points for collision detection with food
    return [...this.trailPoints];
  }

  checkSelfCollision(): boolean {
    const head = this.headPosition;
    const collisionRadius = GAME_CONFIG.SNAKE_SEGMENT_SIZE * 0.4;

    // Check collision with trail points (skip first few points to avoid immediate collision)
    const minPointsToSkip = Math.max(3, Math.floor(20 * GAME_CONFIG.SCALE / GAME_CONFIG.TRAIL_POINT_SPACING)); // Skip about 20 scaled pixels worth
    for (let i = minPointsToSkip; i < this.trailPoints.length; i++) {
      const trailPoint = this.trailPoints[i];
      if (head.distance(trailPoint) < collisionRadius) {
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

    // Get the continuous path of the snake
    const pathPoints = this.calculateSnakePath();

    if (pathPoints.length < 2) {
      ctx.restore();
      return;
    }

    // Draw glow layer first (wider, softer)
    ctx.strokeStyle = COLORS.NEON_GREEN;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.NEON_GREEN;
    ctx.shadowBlur = 8;
    this.drawTubeOutline(ctx, pathPoints);
    this.drawCrossLines(ctx, pathPoints);

    // Draw sharp core layer on top
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    this.drawTubeOutline(ctx, pathPoints);
    this.drawCrossLines(ctx, pathPoints);

    ctx.restore();
  }

  private calculateSnakePath(): Vector2[] {
    // Return direct reference to avoid copying - rendering won't modify it
    return this.trailPoints;
  }

  private drawTubeOutline(ctx: CanvasRenderingContext2D, pathPoints: Vector2[]): void {
    const tubeWidth = GAME_CONFIG.SNAKE_SEGMENT_SIZE * 1.0;
    const halfWidth = tubeWidth / 2;
    const headSegmentLength = GAME_CONFIG.HEAD_SEGMENT_LENGTH;
    const tailTaperLength = GAME_CONFIG.TAIL_TAPER_LENGTH;

    if (pathPoints.length < 2) return;

    // Use cached segment lengths if available
    if (!this.cacheValid) {
      this.updateLengthCache();
    }

    const totalLength = this.cachedTotalLength;

    // Calculate width at each point based on distance from head
    // Creates a bulbous hexagonal head shape and tapered tail
    const getWidthAtDistance = (distance: number): number => {
      const distanceFromTail = totalLength - distance;

      // Head bulge (first 30px)
      if (distance <= headSegmentLength) {
        // First segment: expand from 100% to 140% (bulge outward)
        const t = distance / headSegmentLength; // 0 to 1
        return halfWidth * (1.0 + 0.4 * t); // 100% -> 140%
      } else if (distance <= headSegmentLength * 2) {
        // Second segment: contract from 140% back to 100% (normal width)
        const t = (distance - headSegmentLength) / headSegmentLength; // 0 to 1
        return halfWidth * (1.4 - 0.4 * t); // 140% -> 100%
      }

      // Tail taper (last 100px)
      if (distanceFromTail <= tailTaperLength) {
        // Taper from 100% to 20% over last 5 segments
        const t = distanceFromTail / tailTaperLength; // 0 to 1 (0 at tail tip)
        return halfWidth * (0.2 + 0.8 * t); // 20% -> 100%
      }

      return halfWidth;
    };

    // More efficient: draw both sides without pre-calculating all points
    ctx.beginPath();

    // Calculate and draw left side
    let currentDistance = 0;
    for (let i = 0; i < pathPoints.length; i++) {
      const current = pathPoints[i];
      let direction: Vector2;

      if (i === 0) {
        direction = pathPoints[i + 1].subtract(current).normalize();
      } else if (i === pathPoints.length - 1) {
        direction = current.subtract(pathPoints[i - 1]).normalize();
      } else {
        // Simplified direction calculation - just use current segment direction
        direction = pathPoints[i + 1].subtract(pathPoints[i - 1]).normalize();
      }

      const width = getWidthAtDistance(currentDistance);
      const perpendicular = new Vector2(-direction.y, direction.x);
      const leftPoint = current.add(perpendicular.multiply(width));

      if (i === 0) {
        ctx.moveTo(leftPoint.x, leftPoint.y);
      } else {
        ctx.lineTo(leftPoint.x, leftPoint.y);
      }

      // Update distance for next iteration
      if (i < this.cachedSegmentLengths.length) {
        currentDistance += this.cachedSegmentLengths[i];
      }
    }
    ctx.stroke();

    // Draw right side
    ctx.beginPath();
    currentDistance = 0;
    for (let i = 0; i < pathPoints.length; i++) {
      const current = pathPoints[i];
      let direction: Vector2;

      if (i === 0) {
        direction = pathPoints[i + 1].subtract(current).normalize();
      } else if (i === pathPoints.length - 1) {
        direction = current.subtract(pathPoints[i - 1]).normalize();
      } else {
        direction = pathPoints[i + 1].subtract(pathPoints[i - 1]).normalize();
      }

      const width = getWidthAtDistance(currentDistance);
      const perpendicular = new Vector2(-direction.y, direction.x);
      const rightPoint = current.subtract(perpendicular.multiply(width));

      if (i === 0) {
        ctx.moveTo(rightPoint.x, rightPoint.y);
      } else {
        ctx.lineTo(rightPoint.x, rightPoint.y);
      }

      // Update distance for next iteration
      if (i < this.cachedSegmentLengths.length) {
        currentDistance += this.cachedSegmentLengths[i];
      }
    }
    ctx.stroke();
  }

  private drawCrossLines(ctx: CanvasRenderingContext2D, pathPoints: Vector2[]): void {
    const crossLineSpacing = GAME_CONFIG.CROSS_LINE_SPACING;
    const tubeWidth = GAME_CONFIG.SNAKE_SEGMENT_SIZE * 1.0;
    const halfWidth = tubeWidth / 2;
    const headSegmentLength = GAME_CONFIG.HEAD_SEGMENT_LENGTH;
    const tailTaperLength = GAME_CONFIG.TAIL_TAPER_LENGTH;

    if (pathPoints.length < 2) return;

    // Use cached segment lengths if available
    if (!this.cacheValid) {
      this.updateLengthCache();
    }

    const totalLength = this.cachedTotalLength;

    // Calculate width at each point based on distance from head
    // Creates a bulbous hexagonal head shape and tapered tail
    const getWidthAtDistance = (distance: number): number => {
      const distanceFromTail = totalLength - distance;

      // Head bulge (first 30px)
      if (distance <= headSegmentLength) {
        // First segment: expand from 100% to 140% (bulge outward)
        const t = distance / headSegmentLength; // 0 to 1
        return halfWidth * (1.0 + 0.4 * t); // 100% -> 140%
      } else if (distance <= headSegmentLength * 2) {
        // Second segment: contract from 140% back to 100% (normal width)
        const t = (distance - headSegmentLength) / headSegmentLength; // 0 to 1
        return halfWidth * (1.4 - 0.4 * t); // 140% -> 100%
      }

      // Tail taper (last 100px)
      if (distanceFromTail <= tailTaperLength) {
        // Taper from 100% to 20% over last 5 segments
        const t = distanceFromTail / tailTaperLength; // 0 to 1 (0 at tail tip)
        return halfWidth * (0.2 + 0.8 * t); // 20% -> 100%
      }

      return halfWidth;
    };

    // Draw cross-line at the very front (the cap)
    if (pathPoints.length >= 2) {
      const direction = pathPoints[1].subtract(pathPoints[0]).normalize();
      const perpendicular = new Vector2(-direction.y, direction.x);
      const width = getWidthAtDistance(0);
      const start = this.headPosition.add(perpendicular.multiply(width));
      const end = this.headPosition.subtract(perpendicular.multiply(width));

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // Draw cross-line at the very end (tail cap)
    if (pathPoints.length >= 2) {
      const tailPoint = pathPoints[pathPoints.length - 1];
      const prevPoint = pathPoints[pathPoints.length - 2];
      const direction = tailPoint.subtract(prevPoint).normalize();
      const perpendicular = new Vector2(-direction.y, direction.x);
      const width = getWidthAtDistance(totalLength);
      const start = tailPoint.add(perpendicular.multiply(width));
      const end = tailPoint.subtract(perpendicular.multiply(width));

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // Draw cross-lines at regular intervals
    let nextCrossLine = crossLineSpacing;

    while (nextCrossLine < this.cachedTotalLength) {
      const position = this.getPositionAtDistance(pathPoints, this.cachedSegmentLengths, nextCrossLine);
      const direction = this.getDirectionAtDistance(pathPoints, this.cachedSegmentLengths, nextCrossLine);

      if (position && direction) {
        const width = getWidthAtDistance(nextCrossLine);
        const perpendicular = new Vector2(-direction.y, direction.x);
        const start = position.add(perpendicular.multiply(width));
        const end = position.subtract(perpendicular.multiply(width));

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