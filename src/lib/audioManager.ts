import { Howl, Howler } from 'howler';

export type AudioCategory = 'ui' | 'bgm' | 'sfx' | 'ambient';

export interface SoundConfig {
  id: string;
  src: string[];
  category: AudioCategory;
  volume?: number;
  loop?: boolean;
  html5?: boolean;
}

class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private configs: Map<string, SoundConfig> = new Map();
  private pendingStops: Map<string, () => void> = new Map();

  // Master volumes per category
  private categoryVolumes: Record<AudioCategory, number> = {
    ui: 1.0,
    bgm: 0.5,
    sfx: 1.0,
    ambient: 0.5,
  };

  private muted: boolean = false;

  constructor() {
    // Optionally register default UI sounds if we have paths.
    // For now we assume sounds are registered lazily or via a config.
  }

  /**
   * Initialize and cache a new Howl sound instance.
   */
  public registerSound(config: SoundConfig): void {
    if (this.sounds.has(config.id)) {
      return;
    }

    const isMusic = config.category === 'bgm' || config.category === 'ambient';

    const howl = new Howl({
      src: config.src,
      volume: (config.volume ?? 1.0) * this.categoryVolumes[config.category],
      loop: config.loop || false,
      html5: config.html5 !== undefined ? config.html5 : isMusic, // Use HTML5 for BGM to stream large files
      onloaderror: (_id, error) => {
        console.error(`AudioManager [${config.id}]: Load error`, error);
      },
      onplayerror: (_id, error) => {
        console.error(`AudioManager [${config.id}]: Play error (Autoplay blocked?)`, error);
        howl.once('unlock', () => {
          howl.play();
        });
      }
    });

    this.configs.set(config.id, config);
    this.sounds.set(config.id, howl);
  }

  /**
   * Helper to compute current target volume
   */
  private getTargetVolume(id: string): number {
    const config = this.configs.get(id);
    if (!config) return 1.0;
    return (config.volume ?? 1.0) * this.categoryVolumes[config.category];
  }

  /**
   * Check if a sound is already loaded
   */
  public hasSound(id: string): boolean {
    return this.sounds.has(id);
  }

  /**
   * Play a registered sound by id.
   */
  public play(id: string, options?: { fadeIn?: number }): void {
    const sound = this.sounds.get(id);
    if (sound) {
      if (this.pendingStops.has(id)) {
        const cancelStop = this.pendingStops.get(id);
        if (cancelStop) cancelStop();
        this.pendingStops.delete(id);
      }
      sound.off('fade'); // Clear any pending fade out handlers

      if (options?.fadeIn) {
        const targetVol = this.getTargetVolume(id);
        if (!sound.playing()) {
          sound.volume(0);
          sound.play();
        }
        sound.fade(sound.volume(), targetVol, options.fadeIn);
      } else {
        sound.volume(this.getTargetVolume(id));
        if (!sound.playing()) {
          sound.play();
        }
      }
    } else {
      console.warn(`AudioManager: Sound '${id}' not found and could not be played.`);
    }
  }

  /**
   * Stop a registered sound by id. Resolves when the sound is fully stopped (after fadeout if applicable).
   */
  public stop(id: string, options?: { fadeOut?: number }): Promise<void> {
    return new Promise((resolve) => {
      const sound = this.sounds.get(id);
      if (sound) {
        sound.off('fade'); // Clear previous fade handlers
        if (options?.fadeOut) {
          const currentVol = sound.volume();
          sound.fade(currentVol, 0, options.fadeOut);

          const onFadeComplete = () => {
            if (this.pendingStops.has(id)) {
              this.pendingStops.delete(id);
              sound.stop();
              sound.unload();
              this.sounds.delete(id);
              this.configs.delete(id);
              resolve();
            }
          };

          this.pendingStops.set(id, () => {
            // Cancelled by play()
            resolve();
          });

          sound.once('fade', onFadeComplete);
        } else {
          sound.stop();
          sound.unload();
          this.sounds.delete(id);
          this.configs.delete(id);
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  /**
   * Stop all registered sounds immediately.
   */
  public stopAll(): void {
    // Clear all pending stops
    this.pendingStops.forEach((cancel) => cancel());
    this.pendingStops.clear();

    // Stop and unload all sounds
    this.sounds.forEach((sound) => {
      sound.stop();
      sound.unload();
    });

    this.sounds.clear();
    this.configs.clear();
  }

  /**
   * Adjust master volume for all Howler sounds
   */
  public setMasterVolume(volume: number): void {
    Howler.volume(volume);
  }

  /**
   * Update category volumes (will affect future plays of category sounds unless dynamically updated)
   */
  public setCategoryVolume(category: AudioCategory, volume: number): void {
    this.categoryVolumes[category] = volume;
    // Note: Updating existing Howl instances could be added here if needed.
  }

  /**
   * Global mute toggle
   */
  public toggleMute(): boolean {
    this.muted = !this.muted;
    Howler.mute(this.muted);
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }
}

export const audioManager = new AudioManager();
