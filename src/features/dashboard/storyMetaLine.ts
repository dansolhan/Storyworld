import { relativeTime } from '../../utils/relativeTime';
import type { StorySummary } from './storySummary';

const count = (value: number, singular: string, plural = `${singular}s`): string =>
  `${value} ${value === 1 ? singular : plural}`;

/**
 * The row's meta line: real counts, in the order the design sets them.
 *
 * Where the design said "dead ends" this says what needs fixing, because a page
 * with no choices is how an ending is written in this engine — see
 * `buildHealthReport`. "Nothing to fix" is stated rather than omitted, so a
 * healthy story says so instead of going quiet.
 */
export const storyMetaLine = (summary: StorySummary, now?: number): string[] => {
  const parts = [
    count(summary.pageCount, 'page'),
    count(summary.choiceCount, 'choice'),
  ];

  // A story with no subplots never had them; saying "0 subplots" is noise.
  if (summary.subplotCount > 0) parts.push(count(summary.subplotCount, 'subplot'));

  parts.push(summary.problemCount > 0 ? `${summary.problemCount} to fix` : 'nothing to fix');

  if (summary.savedAt !== undefined) parts.push(`edited ${relativeTime(summary.savedAt, now)}`);

  return parts;
};
