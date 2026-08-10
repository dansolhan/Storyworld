/**
 * A row the editor has been asked to show — set when navigation comes from
 * somewhere other than clicking the thing itself, such as the command palette
 * or a choice's target link.
 *
 * It is not cleared after being honoured. It means "the last row you asked to
 * see", so a tab re-mounting still knows what to highlight; a manual click
 * inside the tab takes precedence until the request changes.
 */
export interface RevealRequest {
  pageId: string;
  paragraphId?: string;
  choiceId?: string;
}
