import { Howl, Howler } from 'howler';

export type AudioCategory = 'ui' | 'bgm' | 'sfx' | 'ambient';

export interface SoundConfig {
  id: string;
  src: string[];
  category: AudioCategory;
  volume?: number;
  loop?: boolean;
}

class AudioManager {
  private sounds: Map<string, Howl> = new Map();

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

    const howl = new Howl({
      src: config.src,
      volume: (config.volume ?? 1.0) * this.categoryVolumes[config.category],
      loop: config.loop || false,
    });

    this.sounds.set(config.id, howl);
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
  public play(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.play();
    } else {
      console.warn(`AudioManager: Sound '${id}' not found and could not be played.`);
    }
  }

  /**
   * Stop a registered sound by id.
   */
  public stop(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.stop();
    }
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
