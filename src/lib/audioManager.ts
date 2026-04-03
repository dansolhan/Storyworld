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
  private activeSounds: Map<AudioCategory, string> = new Map();

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
    // HTML5 mode is great for streaming large files, but it doesn't work with data URIs (Base64)
    // and can be more restrictive with autoplay. We disable it for data URIs.
    const isDataUri = config.src.some(s => s.startsWith('data:'));
    const useHtml5 = config.html5 !== undefined ? config.html5 : (isMusic && !isDataUri);

    const howl = new Howl({
      src: config.src,
      volume: (config.volume ?? 1.0) * this.categoryVolumes[config.category],
      loop: config.loop || false,
      html5: useHtml5,
      onloaderror: (_id, error) => {
        console.error(`AudioManager [${config.id}]: Load error`, error);
      },
      onplayerror: (_id, error) => {
        console.error(`AudioManager [${config.id}]: Play error (Autoplay blocked?)`, error);
        // If autoplay is blocked, wait for an unlock gesture and try again
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
  public play(id: string, options?: { fadeIn?: number, delay?: number, stopOtherInCategory?: boolean }): void {
    // Resume AudioContext if it was suspended (handles some browser autoplay restrictions)
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().catch((e) => console.warn('AudioManager: Failed to resume context', e));
    }

    const config = this.configs.get(id);
    const sound = this.sounds.get(id);
    
    if (sound && config) {
      const activeInCat = this.activeSounds.get(config.category);
      
      // If it's already the active track in its category AND it is currently playing or loading,
      // skip restarting it. This prevents echoes on re-renders.
      if (activeInCat === id && (sound.playing() || sound.state() === 'loading')) {
        return;
      }

      if (options?.stopOtherInCategory) {
        // Fade out others immediately
        this.stopByCategory(config.category, { fadeOut: 600, exceptId: id });
      }

      // To satisfy browser autoplay/gesture requirements, we call .play() IMMEDIATELY
      // but keep it silent if a delay is requested.
      const targetVol = this.getTargetVolume(id);

      if (!sound.playing()) {
        sound.volume(0);
        sound.play();
      }

      if (this.pendingStops.has(id)) {
        const cancelStop = this.pendingStops.get(id);
        if (cancelStop) cancelStop();
        this.pendingStops.delete(id);
      }
      sound.off('fade');

      const startFade = () => {
        // Re-fetch in case of rapid changes
        const currentSound = this.sounds.get(id);
        if (!currentSound) return;

        // If it's not playing yet (possibly still blocked or loading), 
        // we should WAIT for it to play before fading.
        if (!currentSound.playing()) {
          currentSound.once('play', startFade);
          return;
        }

        if (options?.fadeIn) {
          currentSound.fade(currentSound.volume(), targetVol, options.fadeIn);
        } else {
          currentSound.volume(targetVol);
        }
      };

      // Track as the primary active sound for this category
      this.activeSounds.set(config.category, id);

      if (options?.delay) {
        setTimeout(startFade, options.delay);
      } else {
        startFade();
      }
    } else {
      console.warn(`AudioManager: Sound '${id}' not found or not registered.`);
    }
  }

  /**
   * Stop a registered sound by id.
   */
  public stop(id: string, options?: { fadeOut?: number }): Promise<void> {
    return new Promise((resolve) => {
      const sound = this.sounds.get(id);
      if (sound) {
        sound.off('fade'); // Clear previous fade handlers
        if (options?.fadeOut && sound.playing()) {
          const currentVol = sound.volume();
          sound.fade(currentVol, 0, options.fadeOut);

          const onFadeComplete = () => {
            if (this.pendingStops.has(id)) {
              this.pendingStops.delete(id);
              sound.stop();
              // No longer unloading immediately to keep a cache/buffer for BGM
              resolve();
            }
          };

          this.pendingStops.set(id, () => {
            resolve();
          });

          sound.once('fade', onFadeComplete);
        } else {
          sound.stop();
          const config = this.configs.get(id);
          if (config && this.activeSounds.get(config.category) === id) {
            this.activeSounds.delete(config.category);
          }
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

    // Stop all sounds
    this.sounds.forEach((sound) => {
      sound.stop();
    });

    this.activeSounds.clear();
  }

  /**
   * Stop all sounds in a specific category (e.g., all 'bgm').
   */
  public async stopByCategory(category: AudioCategory, options?: { fadeOut?: number, exceptId?: string }): Promise<void> {
    const stopPromises: Promise<void>[] = [];
    
    for (const [id, config] of this.configs) {
      if (config.category === category && id !== options?.exceptId) {
        stopPromises.push(this.stop(id, options));
      }
    }
    
    await Promise.all(stopPromises);
    if (!options?.exceptId) {
      this.activeSounds.delete(category);
    }
  }

  /**
   * Check if any sound in a category is currently playing
   */
  public isCategoryPlaying(category: AudioCategory): boolean {
    const activeId = this.activeSounds.get(category);
    if (!activeId) return false;
    
    const sound = this.sounds.get(activeId);
    return !!sound?.playing();
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
