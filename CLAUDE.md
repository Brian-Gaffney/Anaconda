# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anaconda is a web-based snake clone inspired by the "Anaconda" mini-game from Timesplitters 2. This is a 2D snake-style game with a retro neon line aesthetic featuring an articulated snake that can rotate smoothly for more fluid movement.

## Tech Stack

- HTML5 Canvas for rendering
- Vanilla JavaScript for game logic
- CSS for styling

## Project Status

This repository currently contains only documentation and reference images. The actual game implementation (HTML, JavaScript, CSS files) has not yet been created.

## Reference Materials

- `references/anaconda.jpg` - Visual reference for the original Anaconda mini-game
- `references/pause.jpg` - Reference for pause screen design

## Development Notes

Since this is a canvas-based game, the main architecture will likely involve:
- An HTML file with a canvas element
- JavaScript modules for game state, snake logic, food generation, collision detection, and rendering
- CSS for UI styling and the retro neon aesthetic
- Game loop using requestAnimationFrame for smooth animation
- Input handling for arrow key controls