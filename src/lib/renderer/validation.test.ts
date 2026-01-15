import { expect, test } from 'vitest';
import { validateValue } from './validation';
import type { ParsedElement } from '../parser/template-parser';

function makeElement(overrides: Partial<ParsedElement>): ParsedElement {
  return {
    idShort: 'Field',
    path: ['Field'],
    pathString: 'Field',
    modelType: 'Property',
    cardinality: 'ZeroToOne',
    isRequired: false,
    isArray: false,
    inputType: 'text',
    description: {},
    displayName: {},
    qualifiers: {},
    ...overrides,
  };
}

test('validates integer range constraints', () => {
  const element = makeElement({
    inputType: 'integer',
    valueType: 'xs:integer',
    constraints: { min: 0, max: 10 },
  });

  expect(validateValue(element, 5)).toBeUndefined();
  expect(validateValue(element, 11)).toBe('Maximum value is 10');
});

test('validates string pattern constraints', () => {
  const element = makeElement({
    inputType: 'text',
    valueType: 'xs:string',
    constraints: { pattern: '^[A-Z]{3}$' },
  });

  expect(validateValue(element, 'ABC')).toBeUndefined();
  expect(validateValue(element, 'abc')).toBe('Value does not match required pattern');
});

test('validates anyURI values', () => {
  const element = makeElement({
    inputType: 'url',
    valueType: 'xs:anyURI',
  });

  expect(validateValue(element, 'https://example.com')).toBeUndefined();
  expect(validateValue(element, 'not-a-url')).toBe('Expected a valid URL');
});

test('validates date values', () => {
  const element = makeElement({
    inputType: 'date',
    valueType: 'xs:date',
  });

  expect(validateValue(element, '2024-01-01')).toBeUndefined();
  expect(validateValue(element, '2024-13-01')).toBe('Expected a valid date');
});

test('validates multi-language entries', () => {
  const element = makeElement({
    inputType: 'multilanguage',
  });

  expect(validateValue(element, [{ language: 'en', text: 'Hello' }])).toBeUndefined();
  expect(validateValue(element, [{ language: 'en', text: '' }])).toBe(
    'Translation must include language and text'
  );
});
