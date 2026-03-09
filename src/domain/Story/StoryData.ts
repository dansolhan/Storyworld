import type { Page } from '../Page/Page';
import type { Subplot } from './Subplot';
import type { StoryVariable } from './Variable';
import type { AudioItem } from './Audio';

export interface StoryData {
  version: number;
  title?: string;
  description?: string;
  startPageId?: string;
  pages: Page[];
  variables: Record<string, StoryVariable>;
  subplots?: Subplot[];
  audio?: Record<string, AudioItem>;
  uiMetadata?: {
    nodePositions?: Record<string, { x: number; y: number }>;
  };
}
