import { actionBlueprints } from '../../../../domain/Actions/registry';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import type { BlueprintCategory } from '../../../../domain/Blueprints/BlueprintCategory';
import { matchPosition, queryTerms } from '../../search/matchEntries';
import { tokenNoun } from './sentence/tokenNoun';

export interface RuleOption {
  kind: 'action' | 'condition';
  blueprintId: string;
  /** Blueprint name — "Has Item". */
  name: string;
  /** The sentence with its tokens left as placeholders. */
  sentence: string;
  category: BlueprintCategory;
  haystack: string;
}

const TOKEN = /\{\{(\w+)\}\}/g;

/**
 * The sentence a rule would become, with nothing filled in yet.
 *
 * Tokens become nouns rather than ellipses: three tokens in a row would otherwise
 * render as "… … …", which tells the author nothing. Some nouns come out empty on
 * purpose, so the whitespace is collapsed afterwards.
 */
export const previewSentence = (blueprintId: string, template: string): string =>
  template
    .replace(TOKEN, (_match, token: string) => tokenNoun(blueprintId, token))
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Every rule that can be inserted, as the picker lists them.
 *
 * Built from the registries, so a new blueprint appears here by existing —
 * there is no second list to keep in step.
 */
export const ruleOptions = (): RuleOption[] => {
  const options: RuleOption[] = [];

  const add = (kind: RuleOption['kind'], blueprint: { id: string; name: string; template: string; category: BlueprintCategory }) => {
    const sentence = previewSentence(blueprint.id, blueprint.template);
    options.push({
      kind,
      blueprintId: blueprint.id,
      name: blueprint.name,
      sentence,
      category: blueprint.category,
      haystack: `${sentence} ${blueprint.name} ${blueprint.id}`.toLowerCase(),
    });
  };

  for (const blueprint of Object.values(conditionalBlueprints)) {
    add('condition', blueprint as Parameters<typeof add>[1]);
  }
  for (const blueprint of Object.values(actionBlueprints)) {
    add('action', blueprint as Parameters<typeof add>[1]);
  }

  return options;
};

/** Filters with the same rules as the palette: every term must appear. */
export const filterRuleOptions = (options: RuleOption[], query: string): RuleOption[] => {
  const terms = queryTerms(query);
  if (terms.length === 0) return options;
  return options.filter((option) => matchPosition(option.haystack, terms) !== -1);
};

export const countByCategory = (
  options: RuleOption[]
): Record<BlueprintCategory, number> => {
  const counts = {} as Record<BlueprintCategory, number>;
  for (const option of options) {
    counts[option.category] = (counts[option.category] ?? 0) + 1;
  }
  return counts;
};
