import { GameLoop } from './GameLoop.js';
import { GameState, GameStateType } from './GameState.js';
import { Renderer } from '../rendering/Renderer.js';
import { InputManager } from '../input/InputManager.js';
import { Snake } from '../entities/Snake.js';
import { Vector2 } from '../entities/Vector2.js';
import { COLORS, GAME_CONFIG } from './constants.js';

export class Game {
  private gameLoop: GameLoop;
  private gameState: GameState;
  private renderer: Renderer;
  private inputManager: InputManager;
  private snake: Snake;
  private scoreElement: HTMLElement;
  private pauseMenuElement: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.inputManager = new InputManager();
    this.gameState = new GameState();
    
    // Initialize snake at center of screen
    const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
    const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
    this.snake = new Snake(new Vector2(centerX, centerY));

    this.scoreElement = document.getElementById('score')!;
    this.pauseMenuElement = document.getElementById('pauseMenu')!;

    this.gameLoop = new GameLoop(
      (deltaTime) => this.update(deltaTime),
      () => this.render()
    );

    this.setupPauseMenu();
  }

  private setupPauseMenu(): void {
    const continueBtn = document.getElementById('continueBtn')!;
    const quitBtn = document.getElementById('quitBtn')!;

    continueBtn.addEventListener('click', () => {
      this.gameState.resume();
      this.updatePauseMenuVisibility();
    });

    quitBtn.addEventListener('click', () => {
      this.gameState.gameOver();
      this.updatePauseMenuVisibility();
    });
  }

  start(): void {
    this.gameLoop.start();
  }

  stop(): void {
    this.gameLoop.stop();
    this.inputManager.destroy();
  }

  private update(deltaTime: number): void {
    if (this.inputManager.isPausePressed()) {
      if (this.gameState.isPlaying()) {
        this.gameState.pause();
      } else if (this.gameState.isPaused()) {
        this.gameState.resume();
      }
      this.updatePauseMenuVisibility();
    }

    if (!this.gameState.isPlaying()) {
      return;
    }

    // Handle snake direction input
    const nextDirection = this.inputManager.getNextDirection();
    if (nextDirection) {
      this.snake.setDirection(nextDirection);
    }

    // Update snake
    this.snake.update(deltaTime);

    // Check collisions
    if (this.snake.checkBoundaryCollision() || this.snake.checkSelfCollision()) {
      this.gameState.gameOver();
      this.updatePauseMenuVisibility();
    }
  }

  private render(): void {
    this.renderer.clear();

    if (this.gameState.isPlaying() || this.gameState.isPaused()) {
      this.renderGame();
    }

    this.updateUI();
  }

  private renderGame(): void {
    // Render snake
    this.snake.render(this.renderer);

    // Demo food - will be replaced with actual food entity
    this.renderer.enableGlow(COLORS.RED_FOOD);
    this.renderer.drawCircle(300, 200, 8, COLORS.RED_FOOD);
    this.renderer.disableGlow();

    if (this.gameState.isPaused()) {
      this.renderer.drawText('PAUSED', 350, 250, COLORS.CYAN_ACCENT);
    }

    if (this.gameState.isGameOver()) {
      this.renderer.drawText('GAME OVER', 320, 280, COLORS.RED_FOOD);
      this.renderer.drawText('Press Space to restart', 280, 320, COLORS.NEON_GREEN);
    }
  }

  private updateUI(): void {
    this.scoreElement.textContent = `Score: ${this.gameState.getScore()}`;
  }

  private updatePauseMenuVisibility(): void {
    if (this.gameState.isPaused()) {
      this.pauseMenuElement.classList.remove('hidden');
    } else {
      this.pauseMenuElement.classList.add('hidden');
    }
  }
}