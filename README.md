# Anaconda

A web-based snake clone inspired by the "Anaconda" mini-game from Timesplitters 2.

Reference video: https://www.youtube.com/watch?v=h22thYhPCNw

## Current Version (TypeScript/Vite)

This is a 2D snake-style game with a retro neon line aesthetic. Unlike classic Snake, the player-controlled snake is articulated and can rotate smoothly, allowing for more fluid movement.

The game features a responsive 16:10 aspect ratio canvas that scales to fit your browser window while maintaining proportional gameplay elements.

### How to Play

*   Use the arrow keys to control the direction of the snake.
*   Press Space to boost your speed.
*   Press M to mute/unmute.
*   Press Esc to pause.
*   Eat the food pellets to grow longer.
*   Avoid running into the walls or your own tail.

### Tech Stack

*   TypeScript
*   Vite
*   HTML5 Canvas

### Development

```bash
npm install
npm run dev
```

## Legacy Version (jQuery)

The original jQuery-based implementation can be found in the following files:
- `anaconda.js` - Original game logic
- `anaconda.css` - Original styles
- `jquery-1.4.2.js` - jQuery library
- `music.mp3` - Background music
- `anaconda.jpg` - Reference image
