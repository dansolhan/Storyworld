import type { Page } from '../Page/Page';
import type { Subplot } from './Subplot';
import type { StoryVariable } from './Variable';

export interface StoryData {
  version: number;
  title?: string;
  description?: string;
  startPageId?: string;
  pages: Page[];
  variables: Record<string, StoryVariable>;
  subplots?: Subplot[];
  uiMetadata?: {
    nodePositions?: Record<string, { x: number; y: number }>;
  };
}
