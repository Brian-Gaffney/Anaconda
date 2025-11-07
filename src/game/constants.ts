// Base dimensions (reference size at 1200x750)
const BASE_WIDTH = 1200;
const BASE_HEIGHT = 750;

// Mutable game config for responsive canvas
export const GAME_CONFIG = {
  // Canvas dimensions (mutable)
  CANVAS_WIDTH: BASE_WIDTH,
  CANVAS_HEIGHT: BASE_HEIGHT,
  ASPECT_RATIO: 16 / 10, // 16:10 aspect ratio (wider field)

  // Base dimensions (constant reference)
  BASE_CANVAS_WIDTH: BASE_WIDTH,
  BASE_CANVAS_HEIGHT: BASE_HEIGHT,

  // Scale factor (mutable, updated on resize)
  SCALE: 1.0,

  // Scaled dimensions (mutable, updated on resize)
  SNAKE_SEGMENT_SIZE: 20,
  FOOD_SIZE: 16,
  SNAKE_BASE_SPEED: 120, // pixels per second
  FOOD_SPEED_BLUE: 200, // pixels per second

  // Snake dimensions (mutable, updated on resize)
  HEAD_SEGMENT_LENGTH: 15,
  TAIL_TAPER_LENGTH: 100,
  CROSS_LINE_SPACING: 20,
  MAX_TRAIL_LENGTH: 300,
  TRAIL_POINT_SPACING: 4,
  GROWTH_PIXELS: 20, // Pixels to add per growth

  // Constants (never change)
  INITIAL_SNAKE_LENGTH: 5,
  NEON_GLOW_SIZE: 8,
  TARGET_FPS: 60,
  FRAME_TIME: 1000 / 60,
};

export const COLORS = {
  NEON_GREEN: '#00ff00',
  DARK_BG: '#000000',
  BORDER_COLOR: '#ffffff',
  RED_FOOD: '#ff0000',
  CYAN_ACCENT: '#00ffff',
} as const;