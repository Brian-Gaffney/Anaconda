import './style.css';
import { Game } from './game/Game.js';
import { GAME_CONFIG } from './game/constants.js';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

console.log('Anaconda Snake Game Starting...');

// Function to resize canvas maintaining aspect ratio
function resizeCanvas() {
  const maxWidth = window.innerWidth * 0.95;
  const maxHeight = window.innerHeight * 0.85;

  // Calculate dimensions based on aspect ratio
  let width = maxWidth;
  let height = width / GAME_CONFIG.ASPECT_RATIO;

  // If height exceeds max, scale by height instead
  if (height > maxHeight) {
    height = maxHeight;
    width = height * GAME_CONFIG.ASPECT_RATIO;
  }

  // Update canvas dimensions
  canvas.width = Math.floor(width);
  canvas.height = Math.floor(height);

  // Calculate scale factor based on width
  const scale = canvas.width / GAME_CONFIG.BASE_CANVAS_WIDTH;

  // Update game config to match
  GAME_CONFIG.CANVAS_WIDTH = canvas.width;
  GAME_CONFIG.CANVAS_HEIGHT = canvas.height;
  GAME_CONFIG.SCALE = scale;

  // Update all scaled dimensions
  GAME_CONFIG.SNAKE_SEGMENT_SIZE = Math.floor(20 * scale);
  GAME_CONFIG.FOOD_SIZE = Math.floor(16 * scale);
  GAME_CONFIG.SNAKE_BASE_SPEED = 120 * scale;
  GAME_CONFIG.FOOD_SPEED_BLUE = 200 * scale;

  // Update snake-specific dimensions
  GAME_CONFIG.HEAD_SEGMENT_LENGTH = Math.floor(15 * scale);
  GAME_CONFIG.TAIL_TAPER_LENGTH = Math.floor(100 * scale);
  GAME_CONFIG.CROSS_LINE_SPACING = Math.floor(20 * scale);
  GAME_CONFIG.MAX_TRAIL_LENGTH = Math.floor(300 * scale);
  GAME_CONFIG.TRAIL_POINT_SPACING = Math.max(1, Math.floor(4 * scale)); // At least 1
  GAME_CONFIG.GROWTH_PIXELS = Math.floor(20 * scale);
}

// Initial resize
resizeCanvas();

// Resize on window resize (debounced)
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(resizeCanvas, 100);
});

const game = new Game(canvas);
game.start();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  game.stop();
});
