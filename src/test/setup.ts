import { vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

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
