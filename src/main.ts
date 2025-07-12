import './style.css';
import { Game } from './game/Game.js';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

console.log('Peanut Snake Game Starting...');

const game = new Game(canvas);
game.start();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  game.stop();
});
