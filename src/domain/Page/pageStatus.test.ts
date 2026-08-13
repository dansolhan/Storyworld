import { describe, it, expect } from 'vitest';
import { isUnwritten } from './pageStatus';

describe('isUnwritten', () => {
  it('counts a page with no paragraphs as unwritten', () => {
    expect(isUnwritten({ paragraphs: [] })).toBe(true);
  });

  it('counts a page whose prose is empty rich text as unwritten', () => {
    // What the editor leaves behind when you add a paragraph and type nothing.
    expect(isUnwritten({ paragraphs: [{ id: 'p1', text: '<p></p>' }] })).toBe(true);
    expect(isUnwritten({ paragraphs: [{ id: 'p1', text: '<p><br></p>' }] })).toBe(true);
    expect(isUnwritten({ paragraphs: [{ id: 'p1', text: '<p>&nbsp;</p>' }] })).toBe(true);
    expect(isUnwritten({ paragraphs: [{ id: 'p1', text: '   ' }] })).toBe(true);
  });

  it('stops being unwritten as soon as there is a sentence', () => {
    expect(isUnwritten({ paragraphs: [{ id: 'p1', text: '<p>The door is oak.</p>' }] })).toBe(false);
  });

  it('needs only one written paragraph among several empty ones', () => {
    expect(
      isUnwritten({
        paragraphs: [
          { id: 'p1', text: '<p></p>' },
          { id: 'p2', text: '<p>A key turns.</p>' },
        ],
      })
    ).toBe(false);
  });

  it('does not mistake markup for prose', () => {
    expect(isUnwritten({ paragraphs: [{ id: 'p1', text: '<p><em></em></p>' }] })).toBe(true);
  });

  it('tolerates a page from before paragraphs were required', () => {
    expect(isUnwritten({ paragraphs: undefined as unknown as [] })).toBe(true);
  });
});
