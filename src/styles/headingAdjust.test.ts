import { describe, it, expect } from 'vitest';
import { globSync, readFileSync } from 'node:fs';

/**
 * Guards the x-height correction on the heading face.
 *
 * Cormorant's x-height is 0.39em against Lora's 0.50, so at the same declared size
 * its letters render about a fifth shorter — at kicker and meta sizes that reads as
 * text not filling its own line. `--font-adjust-heading` corrects it, and every
 * small heading rule has to carry it or the app drifts back one new kicker at a
 * time. This is the only thing that notices: nothing renders a webfont in jsdom, so
 * there is no assertion to make against the DOM.
 *
 * Display sizes (16px and up) are deliberately left alone — they are set by eye
 * against the design and want the face's own delicacy.
 */
const SIZES: Record<string, number> = {
  '--text-kicker-sm': 9,
  '--text-kicker': 10,
  '--text-meta': 11,
  '--text-xs': 12,
  '--text-ui': 13,
  '--text-sm': 14,
  '--text-base': 16,
  '--text-md': 16,
  '--text-lg': 18,
  '--text-xl': 20,
  '--text-2xl': 24,
  '--text-3xl': 30,
};

/** The body sets 14px, so a block that declares no size of its own inherits a small one. */
const INHERITED_SIZE = 14;

const pixelsOf = (value: string): number | undefined => {
  const token = value.match(/var\((--text-[a-z0-9-]+)\)/);
  if (token) return SIZES[token[1]];
  const rem = value.match(/([\d.]+)rem/);
  if (rem) return Number(rem[1]) * 16;
  const px = value.match(/([\d.]+)px/);
  if (px) return Number(px[1]);
  return undefined;
};

interface HeadingRule {
  where: string;
  size: number | undefined;
  adjusted: boolean;
}

const headingRules = (): HeadingRule[] => {
  const rules: HeadingRule[] = [];

  for (const file of globSync('src/**/*.module.css')) {
    const lines = readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, index) => {
      if (!/^\s*font-family: var\(--font-heading\);\s*$/.test(line)) return;

      /* The enclosing block: back to the last `{`, forward to the next `}`. */
      let start = index;
      while (start > 0 && !lines[start].includes('{')) start--;
      let end = index;
      while (end < lines.length - 1 && !lines[end].includes('}')) end++;
      const block = lines.slice(start, end + 1).join('\n');

      const declared = block.match(/font-size:\s*([^;]+);/);
      rules.push({
        where: `${file.replace(/\\/g, '/')}:${index + 1}`,
        size: declared ? pixelsOf(declared[1].trim()) : INHERITED_SIZE,
        adjusted: block.includes('font-size-adjust: var(--font-adjust-heading)'),
      });
    });
  }

  return rules;
};

describe('the heading face at interface sizes', () => {
  const rules = headingRules();

  /* If this finds nothing, the scan is broken rather than the CSS being clean. */
  it('finds the heading rules to check', () => {
    expect(rules.length).toBeGreaterThan(40);
  });

  it('resolves every declared size', () => {
    expect(rules.filter((rule) => rule.size === undefined).map((rule) => rule.where)).toEqual([]);
  });

  it('corrects the x-height everywhere the size is under 16px', () => {
    const missing = rules
      .filter((rule) => rule.size !== undefined && rule.size < 16 && !rule.adjusted)
      .map((rule) => `${rule.where} (${rule.size}px)`);

    expect(missing).toEqual([]);
  });

  /* The other half of the rule: display type keeps the face's own proportions. */
  it('leaves display sizes alone', () => {
    const overreach = rules
      .filter((rule) => rule.size !== undefined && rule.size >= 16 && rule.adjusted)
      .map((rule) => `${rule.where} (${rule.size}px)`);

    expect(overreach).toEqual([]);
  });
});
