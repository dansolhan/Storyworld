/**
 * Whether a finding misbehaves for a reader, or is only worth a look.
 *
 * The rail's figure counts `breaks` alone. A story mid-draft always has
 * unwritten pages and unused variables, so counting those would leave the badge
 * permanently lit and mean nothing.
 */
export type HealthSeverity = 'breaks' | 'note';

export type HealthCheckId =
  | 'no-start-page'
  | 'unreachable-pages'
  | 'dangling-targets'
  | 'endings'
  | 'inert-choices'
  | 'unwritten-pages'
  | 'empty-moments'
  | 'unused-data';

export interface HealthFinding {
  /** Stable across rebuilds, so React keeps rows identified. */
  id: string;
  label: string;
  /** What is wrong with this one, in the words an author would use. */
  detail: string;
  /** Set when the finding is somewhere on the canvas, which makes the row clickable. */
  pageId?: string;
}

export interface HealthCheck {
  id: HealthCheckId;
  title: string;
  /** Why this matters — shown under the title, so the group teaches as it reports. */
  explanation: string;
  severity: HealthSeverity;
  findings: HealthFinding[];
  /** Shown in place of rows when the check found nothing. */
  clear: string;
}

export interface HealthReport {
  checks: HealthCheck[];
  /** What the rail counts. */
  breakingCount: number;
  totalCount: number;
}
