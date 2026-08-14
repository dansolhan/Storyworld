import type { Page } from '../Page/Page';
import type { Subplot } from './Subplot';
import type { StoryVariable } from './Variable';
import type { AudioItem } from './Audio';
import type { StatusData } from './StatusData';
import type { ContextualEntries } from '../ContextualText/ContextualEntry';
import type { DerivedTexts } from '../DerivedText/DerivedText';
import type { DebugSnapshot } from './DebugSnapshot';

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
   * Derived texts, referenced from paragraph tokens.
   *
   * Optional and additive: a story written before this has none, and the tokens
   * only exist where an author put one — so there is nothing to upcast and no
   * `CURRENT_VERSION` bump.
   */
  derivedTexts?: DerivedTexts;
  /**
   * Named runtime states the author saved from the debug console.
   *
   * Authoring data, like `uiMetadata` — it rides along in the project file and in
   * the readable JSON export, and `exportToStoryworld` drops it before a reader
   * ever sees the bundle. Optional and additive, so there is nothing to upcast
   * and no `CURRENT_VERSION` bump, on the same terms as `derivedTexts`.
   */
  debugSnapshots?: DebugSnapshot[];
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
