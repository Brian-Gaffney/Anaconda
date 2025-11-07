import { GameLoop } from './GameLoop.js';
import { GameState, GameStateType } from './GameState.js';
import { Renderer } from '../rendering/Renderer.js';
import { InputManager, Direction } from '../input/InputManager.js';
import { Snake } from '../entities/Snake.js';
import { Food, FoodType } from '../entities/Food.js';
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
  private foodItems: Food[] = [];
  private maxFoodItems = 5; // Allow up to 5 food items at once
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;
  private scoreElement: HTMLElement;
  private pauseMenuElement: HTMLElement;
  private gameOverMenuElement: HTMLElement;

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

    // Generate initial food items
    for (let i = 0; i < this.maxFoodItems; i++) {
      this.generateFood();
    }

    this.scoreElement = document.getElementById('score')!;
    this.pauseMenuElement = document.getElementById('pauseMenu')!;
    this.gameOverMenuElement = document.getElementById('gameOverMenu')!;

    this.gameLoop = new GameLoop(
      (deltaTime) => this.update(deltaTime),
      () => this.render()
    );
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
        this.updateMenuVisibility();
      } else if (keyPress === 'm' || keyPress === 'M') {
        this.audioManager.toggleMute();
      } else if (keyPress === 'Enter' && this.gameState.isGameOver()) {
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

    // Update food items
    const snakePositions = this.snake.getAllPositions();
    for (let i = this.foodItems.length - 1; i >= 0; i--) {
      const food = this.foodItems[i];
      food.update(deltaTime, snakePositions);

      // Check if food has expired
      if (food.isExpired()) {
        this.foodItems.splice(i, 1);
        this.generateFood(); // Spawn new food to replace expired one
        continue;
      }

      // Check food collision
      if (food.checkCollisionWithSnake(snakePositions)) {
        this.gameState.addScore(food.getPoints());
        this.snake.addGrowth(food.getGrowthAmount());

        // Remove eaten food and spawn new one
        this.foodItems.splice(i, 1);
        this.generateFood();
      }
    }

    // Update particle system
    this.particleSystem.update(deltaTime);

    // Check collisions
    if (this.snake.checkBoundaryCollision() || this.snake.checkSelfCollision()) {
      this.gameState.gameOver();
      this.audioManager.pause();
      this.updateMenuVisibility();
    }
  }

  private render(): void {
    this.renderer.clear();
    this.renderGame();
    this.updateUI();
  }

  private renderGame(): void {
    // Render snake
    this.snake.render(this.renderer);

    // Render all food items
    for (const food of this.foodItems) {
      food.render(this.renderer);
    }

    // Render particle effects
    this.particleSystem.render(this.renderer);
  }

  private generateFood(): void {
    const snakePositions = this.snake.getAllPositions();
    const foodPosition = Food.generateRandomPosition(snakePositions);

    // 1 in 10 chance to spawn blue food
    const foodType = Math.random() < 0.1 ? FoodType.BLUE : FoodType.RED;

    this.foodItems.push(new Food(foodPosition, foodType));
  }

  private updateUI(): void {
    // Format score as 5 digits with leading zeros
    const score = this.gameState.getScore();
    this.scoreElement.textContent = score.toString().padStart(5, '0');
  }

  private updateMenuVisibility(): void {
    if (this.gameState.isPaused()) {
      this.pauseMenuElement.classList.remove('hidden');
      this.gameOverMenuElement.classList.add('hidden');
    } else if (this.gameState.isGameOver()) {
      this.pauseMenuElement.classList.add('hidden');
      this.gameOverMenuElement.classList.remove('hidden');
    } else {
      this.pauseMenuElement.classList.add('hidden');
      this.gameOverMenuElement.classList.add('hidden');
    }
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

    // Clear old food and generate new food items
    this.foodItems = [];
    for (let i = 0; i < this.maxFoodItems; i++) {
      this.generateFood();
    }

    // Restart audio
    this.audioManager.play();

    // Update UI
    this.updateUI();
    this.updateMenuVisibility();
  }
}