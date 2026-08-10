/**
 * The inspector's tabs, in the order they are drawn.
 *
 * The old partition was Page / Events / Choices, where "Page" held both the
 * prose and the page's settings — two different jobs sharing a scroll. Writing
 * now has a tab to itself, settings have their own, and "Events" is called
 * Logic, which is what it is.
 */
export type InspectorTab = 'write' | 'choices' | 'logic' | 'settings';

export const DEFAULT_INSPECTOR_TAB: InspectorTab = 'write';
