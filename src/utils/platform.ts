const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;

/**
 * Whether app shortcuts should read as ⌘ rather than Ctrl.
 *
 * `navigator.platform` is deprecated but still the most reliable signal for
 * this, with the user-agent as a fallback.
 */
export const isApplePlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return APPLE_PLATFORM.test(navigator.platform || navigator.userAgent);
};

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere. */
export const shortcutLabel = (key: string): string =>
  isApplePlatform() ? `⌘${key}` : `Ctrl ${key}`;

/**
 * Whether the event carries the platform's app-shortcut modifier.
 *
 * Both are accepted regardless of platform: an external keyboard, a remote
 * session or a VM can produce either, and no shortcut here means something
 * different under one modifier than the other.
 */
export const hasShortcutModifier = (event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey'>): boolean =>
  event.metaKey || event.ctrlKey;
