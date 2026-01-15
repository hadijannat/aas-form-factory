/**
 * Array state helpers
 * Canonical array path shape: dot-index segments, e.g. "SerialNumber.0" or "Address.1.Street".
 */

export type ArrayItemsMap = Record<string, number[]>;

function isNumericSegment(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export function deriveArrayItems(values: Record<string, unknown>): ArrayItemsMap {
  const map = new Map<string, Set<number>>();

  for (const key of Object.keys(values)) {
    const segments = key.split('.');
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (isNumericSegment(segment)) {
        const arrayPath = segments.slice(0, i).join('.');
        if (!arrayPath) continue;
        const index = Number(segment);
        const set = map.get(arrayPath) ?? new Set<number>();
        set.add(index);
        map.set(arrayPath, set);
      }
    }
  }

  const result: ArrayItemsMap = {};
  for (const [pathKey, indices] of map) {
    result[pathKey] = Array.from(indices).sort((a, b) => a - b);
  }
  return result;
}

export function nextArrayIndex(indices: number[]): number {
  if (indices.length === 0) return 0;
  return Math.max(...indices) + 1;
}

export function addArrayItem(arrayItems: ArrayItemsMap, pathKey: string): ArrayItemsMap {
  const current = arrayItems[pathKey] ?? [];
  const updated = [...current, nextArrayIndex(current)];
  return { ...arrayItems, [pathKey]: updated };
}

export function reorderArrayItems(
  arrayItems: ArrayItemsMap,
  pathKey: string,
  fromPosition: number,
  toPosition: number
): ArrayItemsMap {
  const current = arrayItems[pathKey] ?? [];
  if (
    fromPosition < 0 ||
    fromPosition >= current.length ||
    toPosition < 0 ||
    toPosition >= current.length
  ) {
    return arrayItems;
  }

  const updated = [...current];
  const [moved] = updated.splice(fromPosition, 1);
  updated.splice(toPosition, 0, moved);
  return { ...arrayItems, [pathKey]: updated };
}

function removeKeysWithPrefix<T extends Record<string, unknown>>(
  obj: T,
  prefix: string
): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !key.startsWith(prefix))
  ) as T;
}

export function removeArrayValues(
  values: Record<string, unknown>,
  errors: Record<string, string>,
  touched: Record<string, boolean>,
  pathKey: string,
  index: number
): { values: Record<string, unknown>; errors: Record<string, string>; touched: Record<string, boolean> } {
  const prefix = `${pathKey}.${index}`;
  return {
    values: removeKeysWithPrefix(values, prefix),
    errors: removeKeysWithPrefix(errors, prefix),
    touched: removeKeysWithPrefix(touched, prefix),
  };
}

export function removeArrayItem(
  arrayItems: ArrayItemsMap,
  pathKey: string,
  position: number
): { arrayItems: ArrayItemsMap; removedIndex: number | null } {
  const current = arrayItems[pathKey] ?? [];
  if (position < 0 || position >= current.length) {
    return { arrayItems, removedIndex: null };
  }
  const removedIndex = current[position];
  const updated = current.filter((_, idx) => idx !== position);
  return { arrayItems: { ...arrayItems, [pathKey]: updated }, removedIndex };
}

export function ensureMinArrayItems(
  arrayItems: ArrayItemsMap,
  minByPath: Record<string, number>
): ArrayItemsMap {
  let updated: ArrayItemsMap = arrayItems;
  let changed = false;

  for (const [pathKey, minItems] of Object.entries(minByPath)) {
    const current = updated[pathKey] ?? [];
    if (current.length >= minItems) continue;
    const next = [...current];
    while (next.length < minItems) {
      next.push(nextArrayIndex(next));
    }
    if (!changed) {
      updated = { ...updated };
      changed = true;
    }
    updated[pathKey] = next;
  }

  return updated;
}
