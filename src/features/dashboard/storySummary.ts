import { buildUsageIndex } from '../editor/usage/buildUsageIndex';
import { buildHealthReport } from '../editor/health/buildHealthReport';
import type { Page } from '../../domain/Page/Page';
import type { Item } from '../../domain/Item/Item';
import type { Atmosphere } from '../../domain/Atmosphere/Atmosphere';
import type { StatusData } from '../../domain/Story/StatusData';
import type { StoryVariable } from '../../domain/Story/Variable';
import type { AudioItem } from '../../domain/Story/Audio';

/**
 * The autosave envelope as it sits in IndexedDB.
 *
 * Read defensively: these blobs are written by whatever version of the app the
 * author last used, so every field is treated as possibly absent. `savedAt` is
 * genuinely missing on anything saved before it was introduced.
 */
export interface StoredSnapshot {
  version?: number;
  savedAt?: number;
  state?: {
    pages?: Record<string, Page>;
    items?: Record<string, Item>;
    variables?: Record<string, StoryVariable>;
    audio?: Record<string, AudioItem>;
    atmospheres?: Record<string, Atmosphere>;
    statusData?: StatusData[];
    subplots?: unknown[];
    contextualText?: import('../../domain/ContextualText/ContextualEntry').ContextualEntries;
    storyTitle?: string;
    storyDescription?: string;
    startPageId?: string | null;
  };
}

export interface StorySummary {
  id: string;
  title: string;
  description: string;
  pageCount: number;
  choiceCount: number;
  subplotCount: number;
  /** 4b's breaking findings — the figure that says which story needs attention. */
  problemCount: number;
  /** Undefined for a story last saved before the envelope carried a timestamp. */
  savedAt?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * One story's row on the shelf, derived from its saved snapshot.
 *
 * The counts are computed rather than stored, and "things to fix" comes from the
 * same `buildHealthReport` the Story health screen reads — so the dashboard and
 * that screen can never disagree about how many problems a story has.
 */
export const summariseStory = (id: string, snapshot: unknown): StorySummary => {
  const envelope = (isRecord(snapshot) ? snapshot : {}) as StoredSnapshot;
  const state = envelope.state ?? {};
  const pages = state.pages ?? {};
  const pageList = Object.values(pages);

  const usage = buildUsageIndex({
    pages,
    items: state.items ?? {},
    atmospheres: state.atmospheres ?? {},
    statusData: state.statusData ?? [],
  });

  const health = buildHealthReport({
    pages,
    items: state.items ?? {},
    variables: state.variables ?? {},
    audio: state.audio ?? {},
    atmospheres: state.atmospheres ?? {},
    startPageId: state.startPageId ?? null,
    contextualText: state.contextualText ?? {},
    usage,
  });

  return {
    id,
    title: state.storyTitle || 'Untitled story',
    description: state.storyDescription || '',
    pageCount: pageList.length,
    choiceCount: pageList.reduce((total, page) => total + (page.choices?.length ?? 0), 0),
    subplotCount: (state.subplots ?? []).length,
    problemCount: health.breakingCount,
    savedAt: typeof envelope.savedAt === 'number' ? envelope.savedAt : undefined,
  };
};
