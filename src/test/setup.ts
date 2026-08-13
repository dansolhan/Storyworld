import { vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  // The dashboard enumerates the shelf with `keys`.
  keys: vi.fn().mockResolvedValue([]),
}));

/*
 * Radix positions floating content with Popper, which observes its trigger. jsdom has
 * no ResizeObserver, so without this a tooltip or popover never opens in a test.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

/*
 * jsdom implements pointer events but not pointer capture, which Radix's
 * swipe-to-dismiss reaches for on the first pointerdown — throwing past the test
 * as an unhandled error. Stubbed here rather than per-file because every Radix
 * component with a drag gesture hits it.
 */
if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}
