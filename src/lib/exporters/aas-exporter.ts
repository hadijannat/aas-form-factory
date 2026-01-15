/**
 * AAS Exporter
 * Converts form data back into valid AAS Submodel JSON
 */

import Ajv2019 from 'ajv/dist/2019';
import addFormats from 'ajv-formats';
import aasSchema from '../schemas/aas.json';
import type {
  Submodel,
  SubmodelElement,
  Property,
  MultiLanguageProperty,
  SubmodelElementCollection,
  SubmodelElementList,
  Range,
  File,
  Blob,
  ReferenceElement,
  Entity,
  DataTypeDefXsd,
  LangStringSet,
  Reference,
  ModelType,
} from '@/types/aas';
import type { ParsedTemplate, ParsedElement } from '../parser/template-parser';

// =============================================================================
// EXPORT TYPES
// =============================================================================

export interface ExportOptions {
  /** Include empty optional fields */
  includeEmpty?: boolean;
  /** Pretty print JSON output */
  prettyPrint?: boolean;
  /** Generate unique IDs for submodel */
  generateIds?: boolean;
}

export interface ExportResult {
  submodel: Submodel;
  json: string;
  warnings: string[];
}

const ajv = new Ajv2019({ allErrors: true, strict: false });
addFormats(ajv);
const schemaId = (aasSchema as Record<string, unknown>).$id as string | undefined;
const resolvedSchemaId = schemaId || 'https://admin-shell.io/aas/3/0';
ajv.addSchema(aasSchema as Record<string, unknown>, resolvedSchemaId);
const validateSubmodelSchemaFn = ajv.compile({
  $ref: `${resolvedSchemaId}#/definitions/Submodel`,
} as Record<string, unknown>);

// =============================================================================
// MAIN EXPORTER
// =============================================================================

/**
 * Export form values to AAS Submodel
 */
export function exportToSubmodel(
  template: ParsedTemplate,
  values: Record<string, unknown>,
  options: ExportOptions = {}
): ExportResult {
  const warnings: string[] = [];

  // Create base submodel from template
  const submodel: Submodel = {
    modelType: 'Submodel',
    id: options.generateIds ? generateId(template.metadata.idShort) : template.metadata.id,
    idShort: template.metadata.idShort,
    semanticId: template.submodel.semanticId,
    administration: template.submodel.administration,
    description: template.submodel.description,
    kind: 'Instance', // Export as instance, not template
    submodelElements: [],
  };

  // Convert each top-level element
  submodel.submodelElements = template.elements
    .map((el) => convertElement(el, values, options, warnings))
    .filter((el): el is SubmodelElement => el !== null);

  // Generate JSON
  const json = options.prettyPrint
    ? JSON.stringify(submodel, null, 2)
    : JSON.stringify(submodel);

  return { submodel, json, warnings };
}

// =============================================================================
// ELEMENT CONVERSION
// =============================================================================

function convertElement(
  element: ParsedElement,
  values: Record<string, unknown>,
  options: ExportOptions,
  warnings: string[]
): SubmodelElement | null {
  const pathKey = element.pathString;
  const value = values[pathKey];

  // For container types (SMC, SML, Entity), check if any children have values
  // before skipping - the children's values are stored with nested paths
  const isContainerType = ['SubmodelElementCollection', 'SubmodelElementList', 'Entity'].includes(
    element.modelType
  );
  const isArrayElement = element.isArray;

  // Skip empty optional elements unless includeEmpty is set
  // But don't skip containers based on their own value - check children instead
  if (
    !options.includeEmpty &&
    !element.isRequired &&
    isEmpty(value) &&
    !isContainerType &&
    !isArrayElement
  ) {
    return null;
  }

  // SubmodelElementList always exports as a list (uses indexed values)
  if (element.modelType === 'SubmodelElementList') {
    return convertSML(element, values, options, warnings);
  }

  // Handle array elements (cardinality *ToMany)
  if (element.isArray) {
    return convertArrayElement(element, values, options, warnings);
  }

  // Convert based on model type
  switch (element.modelType) {
    case 'Property':
      return convertProperty(element, value, warnings);

    case 'MultiLanguageProperty':
      return convertMultiLanguageProperty(element, value, warnings);

    case 'SubmodelElementCollection':
      return convertSMC(element, values, options, warnings);

    case 'Range':
      return convertRange(element, value, warnings);

    case 'File':
      return convertFile(element, value, warnings);

    case 'Blob':
      return convertBlob(element, value, warnings);

    case 'ReferenceElement':
      return convertReference(element, value, warnings);

    case 'Entity':
      return convertEntity(element, values, options, warnings);

    default:
      warnings.push(`Unsupported element type: ${element.modelType} at ${pathKey}`);
      return null;
  }
}

// =============================================================================
// TYPE-SPECIFIC CONVERTERS
// =============================================================================

function convertProperty(
  element: ParsedElement,
  value: unknown,
  warnings: string[]
): Property {
  const property: Property = {
    modelType: 'Property',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    valueType: element.valueType || 'xs:string',
    value: formatPropertyValue(value, element.valueType),
  };

  // Copy qualifiers from original if they exist
  // (Excluding SMT/Cardinality which is template-only)

  return property;
}

function convertMultiLanguageProperty(
  element: ParsedElement,
  value: unknown,
  warnings: string[]
): MultiLanguageProperty {
  let langStrings: LangStringSet[] = [];

  if (Array.isArray(value)) {
    langStrings = value.map((v) => ({
      language: v.language || 'en',
      text: String(v.text || ''),
    }));
  }

  return {
    modelType: 'MultiLanguageProperty',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    value: langStrings,
  };
}

function convertSMC(
  element: ParsedElement,
  values: Record<string, unknown>,
  options: ExportOptions,
  warnings: string[]
): SubmodelElementCollection | null {
  const children = (element.children || [])
    .map((child) => convertElement(child, values, options, warnings))
    .filter((el): el is SubmodelElement => el !== null);

  // Skip empty collections when includeEmpty is false (unless required)
  if (!options.includeEmpty && !element.isRequired && children.length === 0) {
    return null;
  }

  return {
    modelType: 'SubmodelElementCollection',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    value: children,
  };
}

function convertSML(
  element: ParsedElement,
  values: Record<string, unknown>,
  options: ExportOptions,
  warnings: string[]
): SubmodelElementList | null {
  const pathKey = element.pathString;
  const indices = getArrayIndices(values, pathKey);
  const itemTemplate = element.children?.[0];

  if (!itemTemplate && element.children && element.children.length > 1) {
    warnings.push(`SubmodelElementList ${pathKey} has multiple template children; using first as list item template.`);
  }

  const items = indices
    .map((index) => {
      if (!itemTemplate) {
        warnings.push(`SubmodelElementList ${pathKey} missing item template; skipping item ${index}.`);
        return null;
      }
      const scoped = scopeArrayValues(values, pathKey, index);
      const converted = convertElement(
        { ...itemTemplate, isArray: false },
        scoped,
        options,
        warnings
      );
      return converted;
    })
    .filter((el): el is SubmodelElement => el !== null);

  if (items.length === 0 && !options.includeEmpty && !element.isRequired) {
    return null;
  }

  const listElementType =
    element.listElementType || itemTemplate?.modelType || 'Property';

  return {
    modelType: 'SubmodelElementList',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    typeValueListElement: listElementType,
    valueTypeListElement: element.valueType,
    value: items,
  };
}

function convertRange(
  element: ParsedElement,
  value: unknown,
  warnings: string[]
): Range {
  const rangeValue = value as { min?: number; max?: number } | undefined;

  return {
    modelType: 'Range',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    valueType: element.valueType || 'xs:decimal',
    min: rangeValue?.min !== undefined ? String(rangeValue.min) : undefined,
    max: rangeValue?.max !== undefined ? String(rangeValue.max) : undefined,
  };
}

function convertFile(
  element: ParsedElement,
  value: unknown,
  warnings: string[]
): File {
  const fileValue = value as { path?: string; contentType?: string } | string | undefined;

  let path = '';
  let contentType = element.constraints?.contentType || 'application/octet-stream';

  if (typeof fileValue === 'string') {
    path = fileValue;
  } else if (fileValue) {
    path = fileValue.path || '';
    contentType = fileValue.contentType || contentType;
  }

  return {
    modelType: 'File',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    contentType,
    value: path,
  };
}

function convertBlob(
  element: ParsedElement,
  value: unknown,
  warnings: string[]
): Blob {
  return {
    modelType: 'Blob',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    contentType: element.constraints?.contentType || 'application/octet-stream',
    value: typeof value === 'string' ? value : undefined,
  };
}

function convertReference(
  element: ParsedElement,
  value: unknown,
  warnings: string[]
): ReferenceElement {
  let ref: Reference | undefined;

  if (typeof value === 'string' && value) {
    ref = createReference(value);
  } else if (value && typeof value === 'object' && 'type' in value) {
    ref = value as Reference;
  }

  return {
    modelType: 'ReferenceElement',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    value: ref,
  };
}

function convertEntity(
  element: ParsedElement,
  values: Record<string, unknown>,
  options: ExportOptions,
  warnings: string[]
): Entity {
  const statements = (element.children || [])
    .map((child) => convertElement(child, values, options, warnings))
    .filter((el): el is SubmodelElement => el !== null);

  return {
    modelType: 'Entity',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    entityType: 'CoManagedEntity',
    statements,
  };
}

function convertArrayElement(
  element: ParsedElement,
  values: Record<string, unknown>,
  options: ExportOptions,
  warnings: string[]
): SubmodelElementList | null {
  const pathKey = element.pathString;
  const indices = getArrayIndices(values, pathKey);
  const items: SubmodelElement[] = [];

  for (const index of indices) {
    const scoped = scopeArrayValues(values, pathKey, index);
    const item = convertElement({ ...element, isArray: false }, scoped, options, warnings);
    if (item) items.push(item);
  }

  if (items.length === 0) {
    const directValue = values[pathKey];
    if (directValue !== undefined) {
      const item = convertElement({ ...element, isArray: false }, values, options, warnings);
      if (item) items.push(item);
    }
  }

  if (items.length === 0 && !options.includeEmpty && !element.isRequired) {
    return null;
  }

  return {
    modelType: 'SubmodelElementList',
    idShort: element.idShort,
    semanticId: element.semanticId ? createReference(element.semanticId) : undefined,
    description: recordToLangStrings(element.description),
    displayName: recordToLangStrings(element.displayName),
    typeValueListElement: element.modelType,
    valueTypeListElement: element.valueType,
    value: items,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

function getArrayIndices(values: Record<string, unknown>, pathKey: string): number[] {
  const indices = new Set<number>();
  const prefix = `${pathKey}.`;
  const pattern = new RegExp(`^${escapeRegExp(prefix)}(\\d+)(?:\\.|$)`);

  for (const key of Object.keys(values)) {
    const match = key.match(pattern);
    if (!match) continue;
    indices.add(Number(match[1]));
  }

  return Array.from(indices).sort((a, b) => a - b);
}

// Array values use dot-index path segments, e.g. "SerialNumber.0" or "Address.1.Street".
function scopeArrayValues(
  values: Record<string, unknown>,
  pathKey: string,
  index: number
): Record<string, unknown> {
  const scoped: Record<string, unknown> = {};
  const prefix = `${pathKey}.${index}`;

  for (const [key, value] of Object.entries(values)) {
    if (key === prefix) {
      scoped[pathKey] = value;
      continue;
    }
    if (key.startsWith(prefix + '.')) {
      const rest = key.slice(prefix.length + 1);
      scoped[`${pathKey}.${rest}`] = value;
    }
  }

  return scoped;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatPropertyValue(value: unknown, valueType?: DataTypeDefXsd): string | undefined {
  if (value === undefined || value === null) return undefined;

  // Handle boolean
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Handle numbers
  if (typeof value === 'number') {
    if (valueType?.includes('integer') || valueType?.includes('Int')) {
      return Math.round(value).toString();
    }
    return value.toString();
  }

  // Handle dates
  if (value instanceof Date) {
    if (valueType === 'xs:date') {
      return value.toISOString().split('T')[0];
    }
    return value.toISOString();
  }

  return String(value);
}

function createReference(value: string): Reference {
  // Determine reference type based on value pattern
  const isModelRef = value.includes('://') === false && !value.startsWith('urn:');

  return {
    type: isModelRef ? 'ModelReference' : 'ExternalReference',
    keys: [
      {
        type: isModelRef ? 'Submodel' : 'GlobalReference',
        value,
      },
    ],
  };
}

function recordToLangStrings(record?: Record<string, string>): LangStringSet[] | undefined {
  if (!record || Object.keys(record).length === 0) return undefined;

  return Object.entries(record).map(([language, text]) => ({
    language,
    text,
  }));
}

function generateId(idShort: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `urn:aas:${idShort}:${timestamp}-${random}`;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate exported submodel against basic AAS requirements
 */
export function validateSubmodel(submodel: Submodel): string[] {
  const errors: string[] = [];

  if (!submodel.id) {
    errors.push('Submodel must have an id');
  }

  if (!submodel.idShort) {
    errors.push('Submodel must have an idShort');
  }

  // Recursively validate elements
  function validateElements(elements: SubmodelElement[] | undefined, path: string) {
    if (!elements) return;

    for (const element of elements) {
      const el = element as { idShort?: string; modelType?: string; value?: unknown; statements?: unknown };

      if (!el.idShort) {
        errors.push(`Element at ${path} is missing idShort`);
      }

      if (!el.modelType) {
        errors.push(`Element ${el.idShort || 'unknown'} at ${path} is missing modelType`);
      }

      // Validate nested elements
      if (el.value && Array.isArray(el.value)) {
        validateElements(el.value as SubmodelElement[], `${path}.${el.idShort || 'unknown'}`);
      }

      if (el.statements && Array.isArray(el.statements)) {
        validateElements(el.statements as SubmodelElement[], `${path}.${el.idShort || 'unknown'}`);
      }
    }
  }

  validateElements(submodel.submodelElements, 'root');

  return errors;
}

/**
 * Validate submodel against the official AAS JSON Schema (v3.0).
 * The schema is defined for an Environment, so we wrap the submodel.
 */
export function validateSubmodelSchema(submodel: Submodel): string[] {
  const valid = validateSubmodelSchemaFn(submodel);
  if (valid) return [];

  return (
    validateSubmodelSchemaFn.errors?.map((err) => {
      const path = err.instancePath || err.schemaPath || 'schema';
      const message = err.message || 'validation error';
      return `${path}: ${message}`;
    }) ?? ['Schema validation failed']
  );
}
