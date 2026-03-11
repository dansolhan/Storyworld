import type { Page } from '../Page/Page';
import type { Subplot } from './Subplot';
import type { StoryVariable } from './Variable';
import type { AudioItem } from './Audio';
import type { StatusData } from './StatusData';

export interface StoryData {
  version: string | number;
  title?: string;
  description?: string;
  startPageId?: string;
  pages: Page[];
  variables: Record<string, StoryVariable>;
  items?: Record<string, import('../Item/Item').Item>;
  subplots?: Subplot[];
  atmospheres?: Record<string, import('../Atmosphere/Atmosphere').Atmosphere>;
  audio?: Record<string, AudioItem>;
  statusData?: StatusData[];
  uiMetadata?: {
    nodes?: any[];
    edges?: any[];
  };
}
