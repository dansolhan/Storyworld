import type { UsageEntry } from '../../usage/usageReference';

/**
 * The USED ON cell: "4 pages", "1 page", or "unused".
 *
 * A story-level reference — a track behind an atmosphere, a variable in the
 * status ledger — belongs to no page, so it reads as "story" rather than being
 * reported as unused.
 */
export const usageLabel = (usage: UsageEntry): string => {
  if (usage.references.length === 0) return 'unused';
  if (usage.pageCount === 0) return 'story';
  return `${usage.pageCount} ${usage.pageCount === 1 ? 'page' : 'pages'}`;
};
