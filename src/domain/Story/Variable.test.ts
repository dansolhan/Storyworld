import { describe, it, expect } from 'vitest';
import { assignVariableValue, coerceVariableValue, inferVariableType } from './Variable';

describe('coerceVariableValue', () => {
  it('forces a written value into the declared type', () => {
    expect(coerceVariableValue('42', 'number')).toBe(42);
    expect(coerceVariableValue(7, 'string')).toBe('7');
    expect(coerceVariableValue(1, 'boolean')).toBe(true);
  });

  /*
   * The regression this exists for: `set_variable` carries its value as a string,
   * so an author turning a flag off wrote the string "false" — and `Boolean('false')`
   * is `true`. Every boolean an action set to false stayed true.
   */
  it('reads the strings that mean "off" as false', () => {
    for (const off of ['false', 'FALSE', ' false ', '0', 'no', 'off', '']) {
      expect(coerceVariableValue(off, 'boolean')).toBe(false);
    }
  });

  it('still reads other strings as true', () => {
    expect(coerceVariableValue('true', 'boolean')).toBe(true);
    expect(coerceVariableValue('yes', 'boolean')).toBe(true);
  });
});

describe('inferVariableType', () => {
  it('types an undeclared variable from what was written to it', () => {
    expect(inferVariableType(true)).toBe('boolean');
    expect(inferVariableType(3)).toBe('number');
    expect(inferVariableType('a')).toBe('string');
  });
});

describe('assignVariableValue', () => {
  it('keeps the declared type when a value of another type is written', () => {
    expect(assignVariableValue({ type: 'number', value: 5 }, '12')).toEqual({
      type: 'number',
      value: 12,
    });
  });

  it("carries the author's tags through a write", () => {
    expect(assignVariableValue({ type: 'number', value: 5, tags: ['combat'] }, 9)).toEqual({
      type: 'number',
      value: 9,
      tags: ['combat'],
    });
  });

  it('infers a type for a variable the story never declared', () => {
    expect(assignVariableValue(undefined, true)).toEqual({ type: 'boolean', value: true });
  });
});
