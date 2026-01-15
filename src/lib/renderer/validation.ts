import type { DataTypeDefXsd } from '@/types/aas';
import type { ParsedElement } from '../parser/template-parser';

export function isNumericSegment(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export function stripNumericSegments(path: string[]): string[] {
  return path.filter((segment) => !isNumericSegment(segment));
}

export function stripNumericSegmentsFromKey(key: string): string {
  return key
    .split('.')
    .filter((segment) => !isNumericSegment(segment))
    .join('.');
}

export function hasValueWithPrefix(values: Record<string, unknown>, pathKey: string): boolean {
  const prefix = `${pathKey}.`;
  return Object.keys(values).some((key) => key === pathKey || key.startsWith(prefix));
}

export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

function isValidDateTime(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?$/.test(value);
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

const INTEGER_TYPES = new Set<DataTypeDefXsd>([
  'xs:integer',
  'xs:int',
  'xs:long',
  'xs:short',
  'xs:byte',
  'xs:positiveInteger',
  'xs:nonNegativeInteger',
  'xs:negativeInteger',
  'xs:nonPositiveInteger',
  'xs:unsignedLong',
  'xs:unsignedInt',
  'xs:unsignedShort',
  'xs:unsignedByte',
  'xs:gYear',
]);

const DECIMAL_TYPES = new Set<DataTypeDefXsd>(['xs:decimal', 'xs:double', 'xs:float']);

export function validateValue(element: ParsedElement, value: unknown): string | undefined {
  if (isEmptyValue(value)) return undefined;

  switch (element.inputType) {
    case 'multilanguage': {
      if (!Array.isArray(value)) return 'Expected translations';
      for (const entry of value) {
        if (!entry || typeof entry !== 'object') return 'Invalid translation entry';
        const record = entry as { language?: string; text?: string };
        if (!record.language || !record.text) return 'Translation must include language and text';
      }
      return undefined;
    }
    case 'range': {
      if (!value || typeof value !== 'object') return 'Expected range values';
      const range = value as { min?: number; max?: number };
      const min = parseNumber(range.min);
      const max = parseNumber(range.max);
      if (range.min !== undefined && min === undefined) return 'Minimum must be a number';
      if (range.max !== undefined && max === undefined) return 'Maximum must be a number';
      if (min !== undefined && max !== undefined && min > max) return 'Minimum cannot exceed maximum';
      return undefined;
    }
    default:
      break;
  }

  const valueType = element.valueType;

  if (valueType === 'xs:boolean') {
    return typeof value === 'boolean' ? undefined : 'Expected a boolean value';
  }

  if (valueType === 'xs:anyURI') {
    return typeof value === 'string' && isValidUrl(value) ? undefined : 'Expected a valid URL';
  }

  if (valueType === 'xs:date') {
    return typeof value === 'string' && isValidDate(value) ? undefined : 'Expected a valid date';
  }

  if (valueType === 'xs:dateTime') {
    return typeof value === 'string' && isValidDateTime(value) ? undefined : 'Expected a valid date/time';
  }

  if (valueType === 'xs:time') {
    return typeof value === 'string' && isValidTime(value) ? undefined : 'Expected a valid time';
  }

  if (valueType && INTEGER_TYPES.has(valueType)) {
    const num = parseNumber(value);
    if (num === undefined || !Number.isInteger(num)) return 'Expected an integer';
    if (element.constraints?.min !== undefined && num < element.constraints.min) {
      return `Minimum value is ${element.constraints.min}`;
    }
    if (element.constraints?.max !== undefined && num > element.constraints.max) {
      return `Maximum value is ${element.constraints.max}`;
    }
    return undefined;
  }

  if (valueType && DECIMAL_TYPES.has(valueType)) {
    const num = parseNumber(value);
    if (num === undefined) return 'Expected a number';
    if (element.constraints?.min !== undefined && num < element.constraints.min) {
      return `Minimum value is ${element.constraints.min}`;
    }
    if (element.constraints?.max !== undefined && num > element.constraints.max) {
      return `Maximum value is ${element.constraints.max}`;
    }
    return undefined;
  }

  if (typeof value === 'string') {
    if (element.constraints?.minLength !== undefined && value.length < element.constraints.minLength) {
      return `Minimum length is ${element.constraints.minLength}`;
    }
    if (element.constraints?.maxLength !== undefined && value.length > element.constraints.maxLength) {
      return `Maximum length is ${element.constraints.maxLength}`;
    }
    if (element.constraints?.pattern) {
      try {
        const regex = new RegExp(element.constraints.pattern);
        if (!regex.test(value)) return 'Value does not match required pattern';
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}
