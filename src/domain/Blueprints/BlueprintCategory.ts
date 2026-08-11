/**
 * How the rule picker groups blueprints.
 *
 * Declared on each blueprint rather than guessed from its id: a blueprint named
 * off-pattern would silently land in the wrong group, and a new one should have
 * to say where it belongs.
 */
export type BlueprintCategory =
  | 'conditions'
  | 'inventory'
  | 'variables'
  | 'navigation'
  | 'presentation'
  | 'storyFlow';

/** Rail order in the picker, and the order results are grouped in. */
export const BLUEPRINT_CATEGORIES: BlueprintCategory[] = [
  'conditions',
  'inventory',
  'variables',
  'navigation',
  'presentation',
  'storyFlow',
];

export const CATEGORY_LABELS: Record<BlueprintCategory, string> = {
  conditions: 'Conditions',
  inventory: 'Inventory',
  variables: 'Variables',
  navigation: 'Navigation',
  presentation: 'Presentation',
  storyFlow: 'Story flow',
};
