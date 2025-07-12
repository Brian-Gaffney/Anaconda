import { GAME_CONFIG } from './constants.js';

export class GameLoop {
  private isRunning = false;
  private lastTime = 0;
  private accumulator = 0;
  private animationId = 0;

  constructor(
    private updateCallback: (deltaTime: number) => void,
    private renderCallback: () => void
  ) {}

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    while (this.accumulator >= GAME_CONFIG.FRAME_TIME) {
      this.updateCallback(GAME_CONFIG.FRAME_TIME);
      this.accumulator -= GAME_CONFIG.FRAME_TIME;
    }

    this.renderCallback();
    this.animationId = requestAnimationFrame(this.loop);
  };
}