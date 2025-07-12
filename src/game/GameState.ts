export enum GameStateType {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  MENU = 'MENU',
}

export class GameState {
  private state: GameStateType = GameStateType.PLAYING;
  private score = 0;

  getState(): GameStateType {
    return this.state;
  }

  setState(newState: GameStateType): void {
    this.state = newState;
  }

  isPlaying(): boolean {
    return this.state === GameStateType.PLAYING;
  }

  isPaused(): boolean {
    return this.state === GameStateType.PAUSED;
  }

  isGameOver(): boolean {
    return this.state === GameStateType.GAME_OVER;
  }

  pause(): void {
    if (this.state === GameStateType.PLAYING) {
      this.state = GameStateType.PAUSED;
    }
  }

  resume(): void {
    if (this.state === GameStateType.PAUSED) {
      this.state = GameStateType.PLAYING;
    }
  }

  gameOver(): void {
    this.state = GameStateType.GAME_OVER;
  }

  reset(): void {
    this.state = GameStateType.PLAYING;
    this.score = 0;
  }

  getScore(): number {
    return this.score;
  }

  addScore(points: number): void {
    this.score += points;
  }
}