export type AudioType = 'effect' | 'music';

export interface AudioItem {
  id: string;
  title: string;
  description: string;
  type: AudioType;
  src: string; // Base64 data string
}
