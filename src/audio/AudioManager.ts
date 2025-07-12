export class AudioManager {
  private backgroundMusic: HTMLAudioElement;
  private isMuted = true; // Start muted by default
  private volume = 0.5;

  constructor() {
    this.backgroundMusic = new Audio('/references/background-audio.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0; // Start with volume 0 since muted
    
    // Preload the audio
    this.backgroundMusic.preload = 'auto';
    
    // Handle audio loading errors gracefully
    this.backgroundMusic.addEventListener('error', (e) => {
      console.warn('Background music failed to load:', e);
    });
    
    // Auto-play when audio is loaded (with user interaction requirement)
    this.backgroundMusic.addEventListener('canplaythrough', () => {
      this.attemptAutoPlay();
    });
  }

  private async attemptAutoPlay(): Promise<void> {
    try {
      await this.backgroundMusic.play();
    } catch (error) {
      // Auto-play blocked by browser, will need user interaction
      console.log('Auto-play blocked, waiting for user interaction');
      this.setupUserInteractionHandler();
    }
  }

  private setupUserInteractionHandler(): void {
    const startAudio = async () => {
      try {
        await this.backgroundMusic.play();
        // Remove listeners after successful play
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
      } catch (error) {
        console.warn('Could not start audio:', error);
      }
    };

    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('keydown', startAudio, { once: true });
  }

  play(): void {
    if (!this.isMuted && this.backgroundMusic.paused) {
      this.backgroundMusic.play().catch(error => {
        console.warn('Could not play background music:', error);
      });
    }
  }

  pause(): void {
    if (!this.backgroundMusic.paused) {
      this.backgroundMusic.pause();
    }
  }

  stop(): void {
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.backgroundMusic.volume = this.isMuted ? 0 : this.volume;
  }

  getVolume(): number {
    return this.volume;
  }

  mute(): void {
    this.isMuted = true;
    this.backgroundMusic.volume = 0;
  }

  unmute(): void {
    this.isMuted = false;
    this.backgroundMusic.volume = this.volume;
  }

  toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  isMutedState(): boolean {
    return this.isMuted;
  }

  isPlaying(): boolean {
    return !this.backgroundMusic.paused;
  }

  destroy(): void {
    this.stop();
    this.backgroundMusic.removeEventListener('error', () => {});
    this.backgroundMusic.removeEventListener('canplaythrough', () => {});
  }
}