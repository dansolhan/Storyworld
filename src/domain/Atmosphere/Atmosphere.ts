export interface Atmosphere {
  id: string;
  title: string;
  music?: string; // ID of the audio track
  color?: string; // CSS color for the node background in GraphMap
  /**
   * How long the track takes to reach full volume, in milliseconds.
   *
   * Optional: a story written before this existed simply has no value, and
   * `atmosphereSettings` supplies what the player did before — so nothing needs
   * migrating and an old story sounds exactly as it did.
   */
  fadeIn?: number;
  /** Track volume as a fraction of its category's level, 0–1. */
  volume?: number;
}
