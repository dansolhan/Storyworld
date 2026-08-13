import { conditionalBlueprints } from '../../../../../domain/Conditionals/registry';
import type { LogicNode } from '../../../../../domain/Story/LogicNode';
import type { Item } from '../../../../../domain/Item/Item';
import type { Subplot } from '../../../../../domain/Story/Subplot';

export interface SentenceLookups {
  pageTitles: Record<string, string>;
  items: Record<string, Item>;
  subplots: Subplot[];
}

const TOKEN = /\{\{(\w+)\}\}/g;

/**
 * What a filled-in token reads as, in plain text.
 *
 * Mirrors `BlueprintToken`'s labels — deliberately, since the two are read side
 * by side: the same condition appears as interactive tokens in the editor and as
 * flat text in a table cell, and an author noticing a difference between them
 * would be right to distrust both.
 */
const tokenText = (token: string, params: Record<string, unknown>, lookups: SentenceLookups): string => {
  const asString = (key: string): string | undefined =>
    typeof params[key] === 'string' ? (params[key] as string) : undefined;

  switch (token) {
    case 'not':
      return params.not ? 'not' : '';
    case 'is_not':
      return params.not ? 'is not' : 'is';
    case 'has_not':
      return params.not ? 'has not' : 'has';
    case 'page':
    case 'pageId':
    case 'targetPageId': {
      const id = asString(token === 'page' ? 'pageId' : token);
      return (id && lookups.pageTitles[id]) || 'a page';
    }
    case 'subplotId': {
      const id = asString('subplotId');
      return lookups.subplots.find((subplot) => subplot.id === id)?.name ?? 'a subplot';
    }
    case 'variable':
      return asString('variableKey') ?? 'a variable';
    case 'value': {
      const value = params.value;
      return value === undefined || value === '' ? 'a value' : String(value);
    }
    case 'itemId': {
      const id = asString('itemId');
      return (id && lookups.items[id]?.name) || 'an item';
    }
    case 'count':
      return String(params.count ?? 1);
    case 'comparison':
      return asString('comparison') ?? 'equal';
    case 'message': {
      const message = asString('message');
      return message ? `“${message}”` : 'something';
    }
    case 'displayStyle':
      return params.displayStyle === 'paragraph' ? 'a paragraph' : 'a styled notification';
    case 'text':
      return asString('text') ?? 'something else';
    case 'data': {
      const data = Array.isArray(params.data) ? params.data : [];
      return data.length > 0 ? `${data.length} field${data.length === 1 ? '' : 's'}` : 'nothing';
    }
    default:
      return '…';
  }
};

const branchChildren = (node: LogicNode): LogicNode[] =>
  node.children?.find((child) => child.type === 'branch_conditions')?.children ?? [];

/** One condition as flat text, joining a group's clauses with its own word. */
const nodeText = (node: LogicNode, lookups: SentenceLookups, depth: number): string => {
  const blueprint = node.blueprintId ? conditionalBlueprints[node.blueprintId] : undefined;
  if (!blueprint) return 'an unrecognised condition';

  const group = blueprint as { isGroup?: boolean; joinWord?: 'and' | 'or' };
  if (group.isGroup) {
    const clauses = branchChildren(node).map((child) => nodeText(child, lookups, depth + 1));
    if (clauses.length === 0) return 'no conditions yet';
    const joined = clauses.join(` ${group.joinWord ?? 'and'} `);
    // Bracketed only when nesting could make the reading ambiguous, as in the editor.
    return depth > 0 && clauses.length > 1 ? `(${joined})` : joined;
  }

  return blueprint.template
    .replace(TOKEN, (_match, token: string) => tokenText(token, node.params ?? {}, lookups))
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * A condition tree as one readable line.
 *
 * Several roots are ANDed, which is what the evaluator does with them, so the
 * text says "and" rather than listing them separately.
 */
export const conditionText = (nodes: LogicNode[] | undefined, lookups: SentenceLookups): string => {
  const roots = nodes ?? [];
  if (roots.length === 0) return '';
  return roots.map((node) => nodeText(node, lookups, 0)).join(' and ');
};
