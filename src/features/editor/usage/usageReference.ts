/** The kinds of thing whose references we track. */
export type UsageKind = 'item' | 'variable' | 'audio' | 'atmosphere' | 'subplot';

/**
 * How an entity is referenced at a particular site, in the words an author
 * would use. `WHERE IT APPEARS` renders these directly.
 */
export type UsageRelationship =
  | 'given'
  | 'taken away'
  | 'required by choice'
  | 'required to show'
  | 'printed'
  | 'set'
  | 'condition'
  | 'atmosphere'
  | 'plays'
  | 'crossing'
  | 'shown in status'
  | 'context choice';

export interface UsageReference {
  /** The page the reference sits on, or undefined for story-level sites. */
  pageId?: string;
  /** Page title at build time, so rows do not need a second lookup. */
  pageTitle?: string;
  relationship: UsageRelationship;
}

export interface UsageEntry {
  references: UsageReference[];
  /** Distinct pages involved — what `USED ON` counts. */
  pageCount: number;
}

/** References keyed by entity id (or, for variables, by name). */
export type UsageByEntity = Record<string, UsageEntry>;

export type UsageIndex = Record<UsageKind, UsageByEntity>;

export const EMPTY_USAGE: UsageEntry = { references: [], pageCount: 0 };

export const emptyUsageIndex = (): UsageIndex => ({
  item: {},
  variable: {},
  audio: {},
  atmosphere: {},
  subplot: {},
});
