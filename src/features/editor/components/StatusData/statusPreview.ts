import { byStatusPriority, statusEntryIsVisible } from '../../../../lib/engine/logic/statusVisibility';
import { conditionText, type SentenceLookups } from '../RuleEditor/sentence/conditionText';
import type { StatusData } from '../../../../domain/Story/StatusData';
import type { StoryVariable } from '../../../../domain/Story/Variable';

export interface PreviewEntry {
  entry: StatusData;
  value: string;
  isVisible: boolean;
  /** Why it is hidden, or empty when it is shown. */
  reason: string;
}

/** Fills `{{token}}` holes from the variables' starting values. */
const interpolate = (template: string, variables: Record<string, StoryVariable>): string =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const variable = variables[key];
    return variable === undefined ? `{{${key}}}` : String(variable.value);
  });

/**
 * The reader's ledger as it would look at the start of the story.
 *
 * Evaluated with the same `statusEntryIsVisible` the player uses, against the
 * variables' *starting* values — the only state the editor can know about without
 * playing. Hidden entries are kept and marked rather than dropped, because in the
 * editor the useful thing is seeing that an entry exists and why it is not
 * showing; the player omits them entirely.
 *
 * The reason names the entry's own condition rather than working out which clause
 * failed. It is always true, and it points at exactly what to edit.
 */
export const buildStatusPreview = (
  entries: StatusData[],
  variables: Record<string, StoryVariable>,
  lookups: SentenceLookups
): PreviewEntry[] => {
  const context = {
    variables: variables as unknown as Record<string, unknown>,
    visitedPageIds: [],
    currentPageId: '',
    inventory: {},
  };

  return byStatusPriority(entries).map((entry) => {
    const isVisible = statusEntryIsVisible(entry, context);
    const text = conditionText(entry.condition, lookups);

    return {
      entry,
      value: entry.value ? interpolate(entry.value, variables) : '',
      isVisible,
      reason: isVisible ? '' : text ? `hidden — needs: ${text}` : 'hidden',
    };
  });
};
