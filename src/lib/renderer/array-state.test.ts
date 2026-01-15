import {
  addArrayItem,
  deriveArrayItems,
  ensureMinArrayItems,
  removeArrayItem,
  removeArrayValues,
  reorderArrayItems,
} from './array-state';
import { expect, test } from 'vitest';

test('deriveArrayItems collects indices from values', () => {
  const values = {
    'SerialNumber.0': 'A-001',
    'SerialNumber.1': 'A-002',
    'Address.2.Street': 'Main',
  };

  const result = deriveArrayItems(values);
  expect(result.SerialNumber).toEqual([0, 1]);
  expect(result.Address).toEqual([2]);
});

test('addArrayItem appends next index', () => {
  const result = addArrayItem({ SerialNumber: [0, 2] }, 'SerialNumber');
  expect(result.SerialNumber).toEqual([0, 2, 3]);
});

test('removeArrayItem removes by position and reports index', () => {
  const result = removeArrayItem({ SerialNumber: [0, 2, 3] }, 'SerialNumber', 1);
  expect(result.arrayItems.SerialNumber).toEqual([0, 3]);
  expect(result.removedIndex).toBe(2);
});

test('removeArrayValues strips values/errors/touched for an index', () => {
  const cleaned = removeArrayValues(
    { 'SerialNumber.0': 'A', 'SerialNumber.1': 'B', 'SerialNumber.1.Unit': 'X' },
    { 'SerialNumber.1': 'err' },
    { 'SerialNumber.1': true },
    'SerialNumber',
    1
  );

  expect(cleaned.values).toEqual({ 'SerialNumber.0': 'A' });
  expect(cleaned.errors).toEqual({});
  expect(cleaned.touched).toEqual({});
});

test('reorderArrayItems changes order by positions', () => {
  const result = reorderArrayItems({ SerialNumber: [0, 1, 2] }, 'SerialNumber', 0, 2);
  expect(result.SerialNumber).toEqual([1, 2, 0]);
});

test('ensureMinArrayItems adds missing items', () => {
  const result = ensureMinArrayItems({}, { SerialNumber: 2 });
  expect(result.SerialNumber.length).toBe(2);
});
