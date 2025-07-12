export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export class InputManager {
  private keys = new Set<string>();
  private lastDirection: Direction | null = null;
  private directionBuffer: Direction[] = [];
  private keyPressBuffer: string[] = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key;
    
    // Only add to keys set if it wasn't already pressed (prevents repeat events)
    if (!this.keys.has(key)) {
      this.keys.add(key);
      
      // Add to key press buffer for single-press events
      this.keyPressBuffer.push(key);
      
      const direction = this.getDirectionFromKey(key);
      if (direction && direction !== this.lastDirection) {
        this.directionBuffer.push(direction);
        this.lastDirection = direction;
        
        if (this.directionBuffer.length > 2) {
          this.directionBuffer.shift();
        }
      }
    }

    if (key === ' ' || key === 'Escape') {
      event.preventDefault();
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.key);
  };

  private getDirectionFromKey(key: string): Direction | null {
    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        return Direction.UP;
      case 'ArrowDown':
      case 's':
      case 'S':
        return Direction.DOWN;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        return Direction.LEFT;
      case 'ArrowRight':
      case 'd':
      case 'D':
        return Direction.RIGHT;
      default:
        return null;
    }
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  getNextDirection(): Direction | null {
    return this.directionBuffer.shift() || null;
  }

  getNextKeyPress(): string | null {
    return this.keyPressBuffer.shift() || null;
  }

  wasKeyPressed(key: string): boolean {
    return this.keyPressBuffer.includes(key);
  }

  isDirectionPressed(direction: Direction): boolean {
    switch (direction) {
      case Direction.LEFT:
        return this.isKeyPressed('ArrowLeft') || this.isKeyPressed('a') || this.isKeyPressed('A');
      case Direction.RIGHT:
        return this.isKeyPressed('ArrowRight') || this.isKeyPressed('d') || this.isKeyPressed('D');
      case Direction.UP:
        return this.isKeyPressed('ArrowUp') || this.isKeyPressed('w') || this.isKeyPressed('W');
      case Direction.DOWN:
        return this.isKeyPressed('ArrowDown') || this.isKeyPressed('s') || this.isKeyPressed('S');
    }
  }

  isPausePressed(): boolean {
    return this.isKeyPressed('Escape');
  }

  isBoostPressed(): boolean {
    return this.isKeyPressed(' ');
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}