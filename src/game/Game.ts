import { GameLoop } from './GameLoop.js';
import { GameState, GameStateType } from './GameState.js';
import { Renderer } from '../rendering/Renderer.js';
import { InputManager, Direction } from '../input/InputManager.js';
import { Snake } from '../entities/Snake.js';
import { Food } from '../entities/Food.js';
import { Vector2 } from '../entities/Vector2.js';
import { ParticleSystem } from '../rendering/effects/ParticleSystem.js';
import { AudioManager } from '../audio/AudioManager.js';
import { COLORS, GAME_CONFIG } from './constants.js';

export class Game {
  private gameLoop: GameLoop;
  private gameState: GameState;
  private renderer: Renderer;
  private inputManager: InputManager;
  private snake: Snake;
  private food: Food | null = null;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;
  private scoreElement: HTMLElement;
  private pauseMenuElement: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.inputManager = new InputManager();
    this.gameState = new GameState();
    this.particleSystem = new ParticleSystem();
    this.audioManager = new AudioManager();
    
    // Initialize snake at center of screen
    const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
    const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
    this.snake = new Snake(new Vector2(centerX, centerY));
    
    // Generate initial food
    this.generateFood();

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
    this.audioManager.play();
  }

  stop(): void {
    this.gameLoop.stop();
    this.inputManager.destroy();
    this.audioManager.destroy();
  }

  private update(deltaTime: number): void {
    // Handle single key presses
    const keyPress = this.inputManager.getNextKeyPress();
    if (keyPress) {
      if (keyPress === 'Escape') {
        if (this.gameState.isPlaying()) {
          this.gameState.pause();
          this.audioManager.pause();
        } else if (this.gameState.isPaused()) {
          this.gameState.resume();
          this.audioManager.play();
        }
        this.updatePauseMenuVisibility();
      } else if (keyPress === 'm' || keyPress === 'M') {
        this.audioManager.toggleMute();
      } else if (keyPress === ' ' && this.gameState.isGameOver()) {
        this.restartGame();
      }
    }

    if (!this.gameState.isPlaying()) {
      return;
    }

    // Handle snake boost
    this.snake.setBoost(this.inputManager.isBoostPressed());

    // Handle snake rotation input continuously
    if (this.inputManager.isDirectionPressed(Direction.LEFT)) {
      this.snake.setDirection(Direction.LEFT);
    } else if (this.inputManager.isDirectionPressed(Direction.RIGHT)) {
      this.snake.setDirection(Direction.RIGHT);
    } else {
      this.snake.stopTurning();
    }

    // Update snake
    this.snake.update(deltaTime);
    
    // Update food
    if (this.food) {
      this.food.update(deltaTime);
    }
    
    // Update particle system
    this.particleSystem.update(deltaTime);

    // Check food collision
    if (this.food && this.food.checkCollisionWithSnake(this.snake.getAllPositions())) {
      // Snake ate food - create particle effects
      this.particleSystem.createFoodEatenEffect(this.food.getPosition());
      this.particleSystem.createSnakeGrowthEffect(this.snake.getHeadPosition());
      
      this.gameState.addScore(this.food.getPoints());
      this.snake.addGrowth(1);
      this.generateFood();
    }

    // Check collisions
    if (this.snake.checkBoundaryCollision() || this.snake.checkSelfCollision()) {
      // Create collision particle effect
      this.particleSystem.createCollisionEffect(this.snake.getHeadPosition());
      
      this.gameState.gameOver();
      this.audioManager.pause();
      this.updatePauseMenuVisibility();
    }
  }

  private render(): void {
    this.renderer.clear();

    if (this.gameState.isPlaying() || this.gameState.isPaused()) {
      this.renderGame();
    } else if (this.gameState.isGameOver()) {
      // Still render the game scene in background
      this.renderGame();
      // Then render game over screen on top
      this.renderGameOverScreen();
    }

    this.updateUI();
  }

  private renderGame(): void {
    // Render snake
    this.snake.render(this.renderer);

    // Render food
    if (this.food) {
      this.food.render(this.renderer);
    }
    
    // Render particle effects
    this.particleSystem.render(this.renderer);

    if (this.gameState.isPaused()) {
      this.renderer.drawText('PAUSED', 350, 250, COLORS.CYAN_ACCENT);
    }
  }

  private generateFood(): void {
    const snakePositions = this.snake.getAllPositions();
    const foodPosition = Food.generateRandomPosition(snakePositions);
    this.food = new Food(foodPosition);
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

  private renderGameOverScreen(): void {
    const ctx = this.renderer.getContext();
    const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
    const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
    
    // Semi-transparent overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    ctx.restore();
    
    // Game Over title with large font
    ctx.save();
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.RED_FOOD;
    ctx.shadowColor = COLORS.RED_FOOD;
    ctx.shadowBlur = 12;
    ctx.fillText('GAME OVER', centerX, centerY - 60);
    ctx.restore();
    
    // Final score display
    const finalScore = this.gameState.getScore();
    ctx.save();
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.NEON_GREEN;
    ctx.shadowColor = COLORS.NEON_GREEN;
    ctx.shadowBlur = 8;
    ctx.fillText(`Final Score: ${finalScore}`, centerX, centerY - 10);
    ctx.restore();
    
    // Restart instructions
    ctx.save();
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.CYAN_ACCENT;
    ctx.shadowColor = COLORS.CYAN_ACCENT;
    ctx.shadowBlur = 6;
    ctx.fillText('Press SPACE to restart', centerX, centerY + 40);
    ctx.restore();
    
    // Additional instructions
    ctx.save();
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.BORDER_COLOR;
    ctx.shadowColor = COLORS.BORDER_COLOR;
    ctx.shadowBlur = 4;
    ctx.fillText('Press M to mute/unmute', centerX, centerY + 70);
    ctx.restore();
  }

  private restartGame(): void {
    // Reset game state
    this.gameState.reset();
    
    // Reset snake to initial position and state
    const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
    const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
    this.snake = new Snake(new Vector2(centerX, centerY));
    
    // Clear particles
    this.particleSystem.clear();
    
    // Generate new food
    this.generateFood();
    
    // Restart audio
    this.audioManager.play();
    
    // Update UI
    this.updateUI();
    this.updatePauseMenuVisibility();
  }
}