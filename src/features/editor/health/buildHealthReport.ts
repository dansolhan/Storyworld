import type { Page } from '../../../domain/Page/Page';
import type { Item } from '../../../domain/Item/Item';
import type { Atmosphere } from '../../../domain/Atmosphere/Atmosphere';
import type { StoryVariable } from '../../../domain/Story/Variable';
import type { AudioItem } from '../../../domain/Story/Audio';
import { isUnwritten } from '../../../domain/Page/pageStatus';
import { contextIdsIn } from '../../../domain/ContextualText/contextualMark';
import { derivedIdsIn } from '../../../domain/DerivedText/derivedToken';
import { hasFallback } from '../../../domain/DerivedText/resolveDerivedText';
import type { DerivedTexts } from '../../../domain/DerivedText/DerivedText';
import type { ContextualEntries } from '../../../domain/ContextualText/ContextualEntry';
import { buildPageGraph, reachableFrom } from './pageLinks';
import type { UsageIndex } from '../usage/usageReference';
import type { HealthCheck, HealthFinding, HealthReport } from './healthFinding';

export interface HealthSources {
  pages: Record<string, Page>;
  items: Record<string, Item>;
  variables: Record<string, StoryVariable>;
  audio: Record<string, AudioItem>;
  atmospheres: Record<string, Atmosphere>;
  startPageId: string | null;
  contextualText: ContextualEntries;
  derivedTexts: DerivedTexts;
  /** So "unused" means exactly what the Data workspace's USED ON column means. */
  usage: UsageIndex;
}

const titleOf = (page: Page): string => page.title || 'Untitled page';

/** Sorted so the report reads the same twice running, whatever order the map is in. */
const byLabel = (findings: HealthFinding[]): HealthFinding[] =>
  [...findings].sort((a, b) => a.label.localeCompare(b.label));

const isUnused = (entry: { references: unknown[] } | undefined): boolean =>
  (entry?.references.length ?? 0) === 0;

/**
 * Everything derivable about a story's health, in one pass.
 *
 * Pure and total: no store, no React, no early return on the first problem — the
 * screen shows every group, including the ones with nothing to report, because
 * "no dead ends" is worth reading too.
 */
export const buildHealthReport = ({
  pages,
  items,
  variables,
  audio,
  atmospheres,
  startPageId,
  contextualText,
  derivedTexts,
  usage,
}: HealthSources): HealthReport => {
  const allPages = Object.values(pages ?? {});
  const graph = buildPageGraph(pages ?? {}, items ?? {});
  const hasStart = Boolean(startPageId && pages?.[startPageId]);

  const checks: HealthCheck[] = [];

  checks.push({
    id: 'no-start-page',
    title: 'Start page',
    explanation: 'The page a reader opens on. Without it the story has no way in.',
    severity: 'breaks',
    clear: 'Set, and the page exists.',
    findings: hasStart
      ? []
      : [
          {
            id: 'no-start-page',
            label: startPageId ? 'The start page is missing' : 'No start page set',
            detail: startPageId
              ? `Settings names ${startPageId}, but no such page exists.`
              : 'Choose one in Settings.',
          },
        ],
  });

  /*
   * Reachability is walked forward from the start rather than counting inbound
   * choices, because a cluster of pages that only link to each other would pass
   * an inbound count while still being unreachable.
   */
  const reachable = hasStart ? reachableFrom(startPageId!, graph) : new Set<string>();

  checks.push({
    id: 'unreachable-pages',
    title: 'Unreachable pages',
    explanation: 'No path from the start page arrives here, so a reader never sees it.',
    severity: 'breaks',
    clear: hasStart
      ? 'Every page can be reached.'
      : 'Not checked — without a start page there is no path to follow.',
    findings: hasStart
      ? byLabel(
          allPages
            .filter((page) => !reachable.has(page.id))
            .map((page) => ({
              id: `unreachable:${page.id}`,
              label: titleOf(page),
              detail: 'nothing leads here',
              pageId: page.id,
            }))
        )
      : [],
  });

  checks.push({
    id: 'dangling-targets',
    title: 'Choices pointing nowhere',
    explanation: 'The page this choice named has been deleted, so choosing it does nothing.',
    severity: 'breaks',
    clear: 'Every choice with a target names a page that exists.',
    findings: graph.danglingTargets.map((dangling) => ({
      id: `dangling:${dangling.pageId}:${dangling.choiceId}`,
      label: dangling.choiceText || 'Untitled choice',
      detail: `on ${titleOf(pages[dangling.pageId])}, points at ${dangling.targetPageId}`,
      pageId: dangling.pageId,
    })),
  });

  /*
   * A mark pointing at a deleted entry. The player renders those words as ordinary
   * prose so a reader never meets a dead link, which means the author would never
   * notice without this — the story looks fine and quietly says less than it did.
   */
  checks.push({
    id: 'dangling-marks',
    title: 'Marks pointing nowhere',
    explanation:
      'A phrase is marked for contextual text whose entry has been deleted. The reader sees the words as plain prose.',
    severity: 'breaks',
    clear: 'Every marked phrase names an entry that exists.',
    findings: allPages.flatMap((page) =>
      page.paragraphs.flatMap((paragraph) =>
        contextIdsIn(paragraph.text)
          .filter((entryId) => !(contextualText ?? {})[entryId])
          .map((entryId) => ({
            id: `dangling-mark:${paragraph.id}:${entryId}`,
            label: titleOf(page),
            detail: 'a marked phrase has lost its entry',
            pageId: page.id,
          }))
      )
    ),
  });

  /*
   * A derived text that can come out empty: either its token has lost the entry, or
   * every outcome carries a condition and none need hold. Both read to a reader as a
   * sentence with a hole in it, and neither is visible while writing — the chip
   * looks the same either way.
   */
  checks.push({
    id: 'derived-gaps',
    title: 'Derived text that could say nothing',
    explanation:
      'Every outcome has a condition, or the derived text has been deleted, so the sentence can come out with a gap in it.',
    severity: 'breaks',
    clear: 'Every derived text will always resolve to something.',
    findings: allPages.flatMap((page) =>
      page.paragraphs.flatMap((paragraph) =>
        derivedIdsIn(paragraph.text)
          .map((id) => {
            const derived = (derivedTexts ?? {})[id];
            if (!derived) return { reason: 'its derived text has been deleted' };
            if (derived.outcomes.length === 0) return { reason: 'it has no outcomes yet' };
            if (!hasFallback(derived)) return { reason: 'no outcome is unconditional' };
            return null;
          })
          .map((gap, index) =>
            gap
              ? {
                  id: `derived-gap:${paragraph.id}:${index}`,
                  label: titleOf(page),
                  detail: gap.reason,
                  pageId: page.id,
                }
              : null
          )
          .filter((finding): finding is NonNullable<typeof finding> => finding !== null)
      )
    ),
  });

  /*
   * An inventory, not a fault. The player ends the story whenever a page offers no
   * choices, so this is how an ending is written — `end_story` only records data on
   * the way out. Nothing in the data distinguishes "an ending" from "I forgot the
   * choices", so the honest report is the list, for the author to check against the
   * endings they meant to write. Calling these dead ends would flag every ending in
   * every story, which is how a health screen stops being read.
   */
  checks.push({
    id: 'endings',
    title: 'Endings',
    explanation:
      'The story stops here — nothing leads onward, so the reader sees "The End". Check the list matches the endings you meant.',
    severity: 'note',
    clear: 'No page ends the story, so a reader can always go on.',
    findings: byLabel(
      allPages
        .filter((page) => (graph.outgoing[page.id]?.size ?? 0) === 0)
        .map((page) => ({
          id: `ending:${page.id}`,
          label: titleOf(page),
          detail: graph.recordsOnEnd.has(page.id)
            ? 'nothing leads onward, and it records an ending'
            : 'nothing leads onward',
          pageId: page.id,
        }))
    ),
  });

  /*
   * A choice with no target but with rules is an action-only choice, which the
   * engine supports on purpose — it does something and leaves the reader in
   * place. Only a choice with neither does literally nothing.
   */
  checks.push({
    id: 'inert-choices',
    title: 'Choices that do nothing',
    explanation: 'No target page and no rules — clicking it leaves the reader exactly where they were.',
    severity: 'note',
    clear: 'Every choice either leads somewhere or does something.',
    findings: allPages.flatMap((page) =>
      page.choices
        .filter(
          (choice) =>
            !choice.targetPageId &&
            (choice.actions?.length ?? 0) === 0 &&
            (choice.events ?? []).every((event) => event.logicTree.length === 0)
        )
        .map((choice) => ({
          id: `inert:${page.id}:${choice.id}`,
          label: choice.text || 'Untitled choice',
          detail: `on ${titleOf(page)}`,
          pageId: page.id,
        }))
    ),
  });

  checks.push({
    id: 'unwritten-pages',
    title: 'Unwritten pages',
    explanation: 'No prose yet. Fine while drafting — this is the list of what is left to write.',
    severity: 'note',
    clear: 'Every page has prose.',
    findings: byLabel(
      allPages
        .filter(isUnwritten)
        .map((page) => ({
          id: `unwritten:${page.id}`,
          label: titleOf(page),
          detail: 'nothing for the reader to read',
          pageId: page.id,
        }))
    ),
  });

  checks.push({
    id: 'empty-moments',
    title: 'Moments with no rules',
    explanation: 'A moment was added but never given anything to do, so it never has an effect.',
    severity: 'note',
    clear: 'Every moment carries at least one rule.',
    findings: allPages.flatMap((page) =>
      (page.events ?? [])
        .filter((event) => event.logicTree.length === 0)
        .map((event) => ({
          id: `empty-moment:${page.id}:${event.id}`,
          label: titleOf(page),
          detail: `${event.name} has no rules`,
          pageId: page.id,
        }))
    ),
  });

  const unused: HealthFinding[] = [
    ...Object.values(items ?? {})
      .filter((item) => isUnused(usage.item[item.id]))
      .map((item) => ({ id: `unused:item:${item.id}`, label: item.name || item.id, detail: 'item, never given or tested' })),
    ...Object.keys(variables ?? {})
      .filter((name) => isUnused(usage.variable[name]))
      .map((name) => ({ id: `unused:variable:${name}`, label: name, detail: 'variable, never set, read or printed' })),
    ...Object.entries(audio ?? {})
      .filter(([id]) => isUnused(usage.audio[id]))
      .map(([id, track]) => ({ id: `unused:audio:${id}`, label: track.title || id, detail: 'audio, never played' })),
    ...Object.entries(atmospheres ?? {})
      .filter(([id]) => isUnused(usage.atmosphere[id]))
      .map(([id, atmosphere]) => ({
        id: `unused:atmosphere:${id}`,
        label: atmosphere.title || id,
        detail: 'atmosphere, on no page',
      })),
  ];

  checks.push({
    id: 'unused-data',
    title: 'Unused data',
    explanation: 'Defined but never referenced. Not a fault — usually either a leftover or a plan.',
    severity: 'note',
    clear: 'Everything defined is used somewhere.',
    findings: byLabel(unused),
  });

  return {
    checks,
    breakingCount: checks
      .filter((check) => check.severity === 'breaks')
      .reduce((total, check) => total + check.findings.length, 0),
    totalCount: checks.reduce((total, check) => total + check.findings.length, 0),
  };
};
