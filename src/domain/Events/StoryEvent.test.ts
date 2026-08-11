import { describe, it, expect } from 'vitest';
import { AVAILABLE_EVENTS, eventLabel, eventsForDomain } from './StoryEvent';

describe('eventLabel', () => {
  it('titles a section in plain language', () => {
    expect(eventLabel('onEnter')).toBe('When the reader arrives');
    expect(eventLabel('onSelect')).toBe('When the reader chooses this');
  });

  it('still labels the legacy name, so old stories show their rules', () => {
    expect(eventLabel('onEvaluate')).toBe('Whether this is shown at all');
  });

  it('falls back to the raw name for a moment this build does not know', () => {
    expect(eventLabel('onSomethingNew')).toBe('onSomethingNew');
  });
});

describe('eventsForDomain', () => {
  it('offers only the moments that make sense for the target', () => {
    expect(eventsForDomain('page').map((event) => event.name)).toEqual([
      'onEnter',
      'onExit',
      'calculateVisibility',
    ]);
    expect(eventsForDomain('choice').map((event) => event.name)).toEqual([
      'calculateVisibility',
      'onSelect',
      'onHover',
    ]);
    expect(eventsForDomain('paragraph').map((event) => event.name)).toEqual([
      'calculateVisibility',
    ]);
  });

  it('never offers a legacy name to author against', () => {
    for (const domain of ['page', 'paragraph', 'choice']) {
      expect(eventsForDomain(domain).map((event) => event.name)).not.toContain('onEvaluate');
    }
  });

  it('offers no two moments under the same title', () => {
    for (const domain of ['page', 'paragraph', 'choice']) {
      const labels = eventsForDomain(domain).map((event) => event.label);
      expect(new Set(labels).size, domain).toBe(labels.length);
    }
  });

  it('gives every moment a label', () => {
    for (const event of AVAILABLE_EVENTS) {
      expect(event.label, event.name).toBeTruthy();
    }
  });
});
