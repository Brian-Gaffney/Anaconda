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

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key;
    this.keys.add(key);

    const direction = this.getDirectionFromKey(key);
    if (direction && direction !== this.lastDirection) {
      this.directionBuffer.push(direction);
      this.lastDirection = direction;
      
      if (this.directionBuffer.length > 2) {
        this.directionBuffer.shift();
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

  isPausePressed(): boolean {
    return this.isKeyPressed(' ') || this.isKeyPressed('Escape');
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}