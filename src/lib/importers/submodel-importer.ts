/**
 * Submodel Importer
 * Converts AAS Submodel instances into form value maps.
 */

import type {
  Submodel,
  SubmodelElement,
  Property,
  MultiLanguageProperty,
  Range,
  File,
  Blob,
  ReferenceElement,
  SubmodelElementCollection,
  SubmodelElementList,
  Entity,
  DataTypeDefXsd,
  Reference,
} from '@/types/aas';

export function importSubmodelValues(submodel: Submodel): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const element of submodel.submodelElements ?? []) {
    addElementValues(element, [], values);
  }

  return values;
}

function addElementValues(
  element: SubmodelElement,
  parentPath: string[],
  values: Record<string, unknown>
) {
  const idShort = element.idShort;
  const nextPath = idShort ? [...parentPath, idShort] : parentPath;
  const pathKey = nextPath.join('.');

  switch (element.modelType) {
    case 'Property':
      values[pathKey] = parsePropertyValue(element as Property);
      return;

    case 'MultiLanguageProperty':
      values[pathKey] = (element as MultiLanguageProperty).value ?? [];
      return;

    case 'Range':
      values[pathKey] = parseRangeValue(element as Range);
      return;

    case 'File':
      values[pathKey] = parseFileValue(element as File);
      return;

    case 'Blob':
      values[pathKey] = (element as Blob).value ?? undefined;
      return;

    case 'ReferenceElement':
      values[pathKey] = parseReferenceValue(element as ReferenceElement);
      return;

    case 'SubmodelElementCollection':
      for (const child of (element as SubmodelElementCollection).value ?? []) {
        addElementValues(child, nextPath, values);
      }
      return;

    case 'SubmodelElementList':
      for (const [index, child] of ((element as SubmodelElementList).value ?? []).entries()) {
        addElementValues(child, [...nextPath, String(index)], values);
      }
      return;

    case 'Entity':
      for (const child of (element as Entity).statements ?? []) {
        addElementValues(child, nextPath, values);
      }
      return;

    default:
      return;
  }
}

function parsePropertyValue(property: Property): unknown {
  const raw = property.value;
  if (raw === undefined || raw === null) return undefined;
  const valueType = property.valueType;

  if (valueType === 'xs:boolean') {
    return raw === 'true';
  }

  if (isNumericType(valueType)) {
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  }

  return raw;
}

function parseRangeValue(range: Range): { min?: number; max?: number } {
  const min = range.min !== undefined ? Number(range.min) : undefined;
  const max = range.max !== undefined ? Number(range.max) : undefined;

  return {
    min: Number.isNaN(min ?? NaN) ? undefined : min,
    max: Number.isNaN(max ?? NaN) ? undefined : max,
  };
}

function parseFileValue(file: File): { path: string; contentType?: string } | undefined {
  if (!file.value) return undefined;
  return {
    path: file.value,
    contentType: file.contentType,
  };
}

function parseReferenceValue(ref: ReferenceElement): string | Reference | undefined {
  if (!ref.value) return undefined;
  const firstKey = ref.value.keys?.[0]?.value;
  return firstKey || ref.value;
}

function isNumericType(valueType: DataTypeDefXsd): boolean {
  return (
    valueType === 'xs:decimal' ||
    valueType === 'xs:double' ||
    valueType === 'xs:float' ||
    valueType === 'xs:integer' ||
    valueType === 'xs:int' ||
    valueType === 'xs:long' ||
    valueType === 'xs:short' ||
    valueType === 'xs:byte' ||
    valueType === 'xs:positiveInteger' ||
    valueType === 'xs:nonNegativeInteger' ||
    valueType === 'xs:negativeInteger' ||
    valueType === 'xs:nonPositiveInteger' ||
    valueType === 'xs:unsignedLong' ||
    valueType === 'xs:unsignedInt' ||
    valueType === 'xs:unsignedShort' ||
    valueType === 'xs:unsignedByte'
  );
}
