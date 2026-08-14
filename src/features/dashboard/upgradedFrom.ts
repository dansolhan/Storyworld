/**
 * What a story was upgraded from, in words an author can act on.
 *
 * A save made before the schema version was recorded has none, and the snapshot
 * envelope's own number is not a substitute — it would read as a version the author
 * had never heard of.
 */
export const upgradedFrom = (fromVersion?: string): string =>
  fromVersion ? `version ${fromVersion}` : 'an earlier version';
