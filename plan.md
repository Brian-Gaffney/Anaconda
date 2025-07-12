# Peanut Game Development Plan

## Visual Analysis from References

Based on the reference images:
- **Retro neon aesthetic**: Bright green segmented snake on black background
- **Articulated snake**: Visible segments with grid-like pattern, curved movement
- **Red food pellets**: Cross-shaped food items scattered around the play area
- **Score display**: Top-left corner showing current score
- **Clean UI**: Simple pause menu with Continue/Quit options
- **Bordered play area**: White rectangular border defining game bounds

## Tech Stack

### Core Technologies
- **TypeScript** - Type-safe JavaScript for better development experience
- **HTML5 Canvas** - 2D rendering for smooth game graphics
- **Vite** - Fast build tool and dev server with TypeScript support
- **CSS3** - Styling for UI elements and retro aesthetic

### Development Tools
- **ESLint** - Code linting with TypeScript rules
- **Prettier** - Code formatting
- **TypeScript** - Type checking and compilation
- **Vite dev server** - Hot module replacement for rapid development

## Project Structure

```
src/
├── main.ts              # Entry point, game initialization
├── game/
│   ├── Game.ts          # Main game class, orchestrates everything
│   ├── GameLoop.ts      # RequestAnimationFrame-based game loop
│   ├── GameState.ts     # Game state management (playing, paused, game over)
│   └── constants.ts     # Game configuration constants
├── entities/
│   ├── Snake.ts         # Snake entity with articulated movement
│   ├── Food.ts          # Food pellet generation and rendering
│   └── Vector2.ts       # 2D vector utility class
├── rendering/
│   ├── Renderer.ts      # Canvas rendering manager
│   ├── Camera.ts        # Viewport management (future-proofing)
│   └── effects/
│       └── NeonEffect.ts # Retro neon glow effects
├── input/
│   └── InputManager.ts  # Keyboard input handling
├── ui/
│   ├── HUD.ts          # Score display and game UI
│   └── PauseMenu.ts    # Pause menu implementation
└── utils/
    ├── Collision.ts     # Collision detection utilities
    └── Math.ts         # Mathematical helper functions
```

## Implementation Phases

### Phase 1: Project Setup & Basic Structure
- Initialize Vite project with TypeScript
- Set up development tooling (ESLint, Prettier)
- Create basic HTML structure with canvas
- Implement basic project architecture

### Phase 2: Core Game Loop & Rendering
- Implement game loop with requestAnimationFrame
- Create canvas rendering system
- Set up coordinate system and viewport
- Basic input handling framework

### Phase 3: Snake Entity
- Implement articulated snake with segments
- Smooth curved movement between segments
- Direction change handling
- Snake growth mechanics

### Phase 4: Game Mechanics
- Food generation and collision detection
- Boundary collision detection
- Self-collision detection
- Score tracking

### Phase 5: Visual Polish
- Retro neon aesthetic implementation
- Segment rendering with grid pattern
- Glow effects for snake and food
- Background and border styling

### Phase 6: UI Implementation
- Score display (HUD)
- Pause menu functionality
- Game over screen
- Start screen/menu

### Phase 7: Audio & Polish
- Sound effects for eating, collision
- Background music (optional)
- Particle effects
- Screen shake effects

## Key Technical Challenges

1. **Articulated Snake Movement**: Unlike classic snake, segments should curve smoothly
2. **Neon Visual Effects**: CSS/Canvas glow effects for retro aesthetic
3. **Smooth Input**: Responsive controls that feel fluid
4. **Performance**: 60fps rendering with growing snake length

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run format   # Run Prettier
npm run type-check # TypeScript type checking
```

## Game Configuration

```typescript
const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  SNAKE_SEGMENT_SIZE: 20,
  SNAKE_SPEED: 5,
  FOOD_SIZE: 16,
  INITIAL_SNAKE_LENGTH: 5,
  NEON_GLOW_SIZE: 8
}
```

## MVP Features

- Playable snake game with arrow key controls
- Growing snake that can eat food
- Collision detection (walls and self)
- Score tracking
- Pause functionality
- Retro neon visual style matching references

## Future Enhancements

- High score persistence
- Multiple difficulty levels
- Power-ups and special food types
- Multiplayer support
- Mobile touch controls
- Advanced visual effects and animations