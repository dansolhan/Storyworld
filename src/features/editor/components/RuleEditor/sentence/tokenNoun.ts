/**
 * What a template token reads as before anyone has filled it in.
 *
 * This is deliberately separate from the placeholders `BlueprintToken` shows in a
 * live sentence: those are invitations to click ("Select item…"), while these have
 * to sit inside a sentence and still parse as English ("give the reader an item").
 */
const NOUNS: Record<string, string> = {
  not: '',
  is_not: 'is',
  has_not: 'has',
  page: 'a page',
  pageId: 'a page',
  targetPageId: 'a page',
  subplotId: 'a subplot',
  variable: 'a variable',
  value: 'a value',
  message: 'something',
  displayStyle: 'a paragraph',
  itemId: 'an item',
  count: 'a number of',
  comparison: 'is',
  data: 'the ending',
  text: 'something else',
};

/**
 * Where one token name has to read two ways.
 *
 * `{{comparison}}` compares a variable in one blueprint and a quantity in another,
 * and a count already implied by the surrounding words is better left out than
 * spelled as "a number of".
 */
const OVERRIDES: Record<string, string> = {
  'has_item:itemId': 'item',
  'has_item_count:comparison': 'at least',
  'has_item_count:count': '',
  'give_item:count': '',
  'remove_item:count': '',
};

export const tokenNoun = (blueprintId: string, token: string): string =>
  OVERRIDES[`${blueprintId}:${token}`] ?? NOUNS[token] ?? '…';
