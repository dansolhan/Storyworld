import type { Page } from '../Page/Page';
import type { Subplot } from './Subplot';
import type { StoryVariable } from './Variable';
import type { AudioItem } from './Audio';
import type { StatusData } from './StatusData';
import type { ContextualEntries } from '../ContextualText/ContextualEntry';

export interface StoryData {
  version: string | number;
  title?: string;
  titleLocId?: string;
  description?: string;
  descriptionLocId?: string;
  startPageId?: string;
  pages: Page[];
  variables: Record<string, StoryVariable>;
  items?: Record<string, import('../Item/Item').Item>;
  subplots?: Subplot[];
  atmospheres?: Record<string, import('../Atmosphere/Atmosphere').Atmosphere>;
  audio?: Record<string, AudioItem>;
  statusData?: StatusData[];
  /** Shared contextual entries, referenced from paragraph marks. Schema 1.3.0. */
  contextualText?: ContextualEntries;
  /**
   * Editor layout, opaque to the domain: React Flow nodes and edges, whose
   * shape belongs to the editor feature. `storyMapper` is the only place that
   * gives them a concrete type, at the boundary where it reads and writes them.
   */
  uiMetadata?: {
    nodes?: unknown[];
    edges?: unknown[];
  };
}
