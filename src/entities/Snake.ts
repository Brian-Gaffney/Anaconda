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
    ctx.shadowBlur = 15; // Enhanced glow
    
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
    
    // Add border/outline
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#44ff44'; // Brighter green border
    ctx.lineWidth = 2;
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
    ctx.stroke();
    
    // Add inner highlight
    ctx.shadowBlur = 8;
    ctx.shadowColor = COLORS.CYAN_ACCENT;
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
    
    // Draw grid pattern on head with animation
    this.drawGridPatternOnCircle(renderer, this.headPosition, headSize, this.gameTime);
    
    // Direction-based "eyes" - make them more prominent and snake-like
    const eyeSize = 4;
    const directionOffset = currentDirection.multiply(headSize * 0.3);
    const perpendicular = new Vector2(-currentDirection.y, currentDirection.x).multiply(headSize * 0.25);
    
    const eye1Pos = this.headPosition.add(directionOffset).add(perpendicular);
    const eye2Pos = this.headPosition.add(directionOffset).subtract(perpendicular);
    
    // Draw eye sockets first (dark background)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#003300';
    
    ctx.beginPath();
    ctx.arc(eye1Pos.x, eye1Pos.y, eyeSize * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(eye2Pos.x, eye2Pos.y, eyeSize * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the actual eyes (bright white/cyan)
    ctx.shadowColor = COLORS.CYAN_ACCENT;
    ctx.shadowBlur = 6;
    ctx.fillStyle = COLORS.CYAN_ACCENT;
    
    ctx.beginPath();
    ctx.arc(eye1Pos.x, eye1Pos.y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(eye2Pos.x, eye2Pos.y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Add eye pupils for direction
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    const pupilSize = eyeSize * 0.4;
    const pupilOffset = currentDirection.multiply(eyeSize * 0.3);
    
    ctx.beginPath();
    ctx.arc(eye1Pos.x + pupilOffset.x, eye1Pos.y + pupilOffset.y, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(eye2Pos.x + pupilOffset.x, eye2Pos.y + pupilOffset.y, pupilSize, 0, Math.PI * 2);
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
    
    // Enhanced glow effects
    const velocity = segment.velocity.length();
    const glowIntensity = 0.8 + Math.min(velocity * 0.01, 0.7);
    ctx.shadowColor = COLORS.NEON_GREEN;
    ctx.shadowBlur = 12 * glowIntensity; // More pronounced glow
    
    // Draw connected segment
    this.drawConnectedSegment(ctx, segment.position, prevPos, nextPos, segmentSize);
    
    // Add segment border/outline
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#44ff44'; // Brighter green border
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(segment.position.x, segment.position.y, segmentSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw grid pattern with animation
    this.drawGridPattern(renderer, 
      segment.position.x - segmentSize / 2, 
      segment.position.y - segmentSize / 2, 
      segmentSize,
      this.gameTime
    );
    
    ctx.restore();
  }

  private drawConnectedSegment(
    ctx: CanvasRenderingContext2D, 
    pos: Vector2, 
    prevPos: Vector2, 
    _nextPos: Vector2 | null, 
    size: number
  ): void {
    ctx.fillStyle = COLORS.NEON_GREEN;
    
    // Draw main segment body
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw connections to previous segment with better blending
    if (prevPos) {
      const toPrev = prevPos.subtract(pos);
      const distance = toPrev.length();
      if (distance > 0 && distance < size * 2) { // Only connect if close enough
        const direction = toPrev.normalize();
        const perpendicular = new Vector2(-direction.y, direction.x);
        
        // Draw smoother connection with rounded ends
        const connectionLength = Math.min(distance * 0.8, size * 1.2);
        const connectionWidth = size * 0.9; // Wider connection for seamless look
        
        // Create rounded rectangle connection
        ctx.beginPath();
        
        // Start point (current segment edge)
        const startX = pos.x + direction.x * (size / 2 * 0.3);
        const startY = pos.y + direction.y * (size / 2 * 0.3);
        
        // End point (toward previous segment)
        const endX = pos.x + direction.x * connectionLength;
        const endY = pos.y + direction.y * connectionLength;
        
        // Draw connection as a rounded rectangle
        const halfWidth = connectionWidth / 2;
        
        ctx.moveTo(startX + perpendicular.x * halfWidth, startY + perpendicular.y * halfWidth);
        ctx.lineTo(endX + perpendicular.x * halfWidth, endY + perpendicular.y * halfWidth);
        ctx.lineTo(endX - perpendicular.x * halfWidth, endY - perpendicular.y * halfWidth);
        ctx.lineTo(startX - perpendicular.x * halfWidth, startY - perpendicular.y * halfWidth);
        ctx.closePath();
        ctx.fill();
        
        // Add small connecting circles for even smoother appearance
        ctx.beginPath();
        ctx.arc(startX, startY, size / 2 * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(endX, endY, size / 2 * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawGridPattern(renderer: Renderer, x: number, y: number, size: number, gameTime = 0): void {
    const ctx = renderer.getContext();
    ctx.save();
    
    // Subtle animation - grid opacity pulses very slowly
    const pulseIntensity = 0.3 + 0.2 * Math.sin(gameTime * 0.5);
    const baseColor = Math.floor(17 * pulseIntensity); // Animate from #001100 to slightly lighter
    const colorHex = `#00${baseColor.toString(16).padStart(2, '0')}00`;
    
    // Make grid lines more prominent and darker
    ctx.strokeStyle = colorHex;
    ctx.fillStyle = colorHex;
    ctx.lineWidth = 1.5;
    
    const gridSpacing = Math.max(3, size / 6); // Larger, more visible grid
    
    // Draw crosshatch pattern like the reference
    ctx.beginPath();
    
    // Vertical lines with subtle offset animation
    const offsetX = Math.sin(gameTime * 0.3) * 0.5;
    for (let gx = gridSpacing; gx < size; gx += gridSpacing) {
      ctx.moveTo(x + gx + offsetX, y);
      ctx.lineTo(x + gx + offsetX, y + size);
    }
    
    // Horizontal lines with subtle offset animation
    const offsetY = Math.cos(gameTime * 0.3) * 0.5;
    for (let gy = gridSpacing; gy < size; gy += gridSpacing) {
      ctx.moveTo(x, y + gy + offsetY);
      ctx.lineTo(x + size, y + gy + offsetY);
    }
    
    ctx.stroke();
    
    // Add subtle inner shadow effect to grid lines
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;
    ctx.stroke();
    
    ctx.restore();
  }

  private drawGridPatternOnCircle(renderer: Renderer, center: Vector2, size: number, gameTime = 0): void {
    const ctx = renderer.getContext();
    ctx.save();
    
    // Subtle animation - grid opacity pulses very slowly
    const pulseIntensity = 0.3 + 0.2 * Math.sin(gameTime * 0.4);
    const baseColor = Math.floor(17 * pulseIntensity);
    const colorHex = `#00${baseColor.toString(16).padStart(2, '0')}00`;
    
    // Make head grid more prominent
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1.5;
    
    const radius = size / 2;
    const gridSpacing = Math.max(4, size / 8);
    
    // Rotating animation offset for radial lines
    const rotationOffset = gameTime * 0.1;
    
    // Draw radial lines (more of them for better crosshatch effect)
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12 + rotationOffset;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(
        center.x + Math.cos(angle) * radius * 0.85,
        center.y + Math.sin(angle) * radius * 0.85
      );
      ctx.stroke();
    }
    
    // Draw concentric circles with subtle pulsing
    const radiusPulse = Math.sin(gameTime * 0.6) * 0.5;
    for (let r = gridSpacing; r < radius; r += gridSpacing) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, r + radiusPulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Add shadow effect
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;
    
    // Redraw for shadow effect
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12 + rotationOffset;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(
        center.x + Math.cos(angle) * radius * 0.85,
        center.y + Math.sin(angle) * radius * 0.85
      );
      ctx.stroke();
    }
    
    for (let r = gridSpacing; r < radius; r += gridSpacing) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, r + radiusPulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
}