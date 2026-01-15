/**
 * Template Parser
 * Converts IDTA Submodel Templates into ParsedTemplate structure for form rendering
 */

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
  Entity,
  Qualifier,
  DataTypeDefXsd,
  Cardinality,
  LangStringSet,
  ModelType,
} from '@/types/aas';
import { getSemanticIdValue, getCardinality, isRequired, isMultiple } from '@/types/aas';

// =============================================================================
// PARSED TEMPLATE TYPES
// =============================================================================

export interface ParsedTemplate {
  submodel: Submodel;
  metadata: TemplateMetadata;
  elements: ParsedElement[];
  flatElements: Map<string, ParsedElement>;
}

export interface TemplateMetadata {
  id: string;
  idShort: string;
  semanticId: string;
  version: string;
  revision: string;
  templateId: string;
  description: Record<string, string>;
}

export interface ParsedElement {
  idShort: string;
  path: string[];
  pathString: string;
  modelType: ModelType;
  listElementType?: ModelType;
  semanticId?: string;
  cardinality: Cardinality;
  isRequired: boolean;
  isArray: boolean;
  valueType?: DataTypeDefXsd;
  inputType: InputType;
  description: Record<string, string>;
  displayName: Record<string, string>;
  children?: ParsedElement[];
  constraints?: ElementConstraints;
  qualifiers: Record<string, string>;
  exampleValue?: string;
}

export interface ElementConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  allowedValues?: string[];
  contentType?: string;
}

export type InputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'integer'
  | 'decimal'
  | 'url'
  | 'email'
  | 'date'
  | 'datetime'
  | 'time'
  | 'boolean'
  | 'file'
  | 'blob'
  | 'select'
  | 'multilanguage'
  | 'range'
  | 'reference'
  | 'collection'
  | 'list'
  | 'entity'
  | 'operation'
  | 'capability'
  | 'event'
  | 'relationship'
  | 'readonly';

// =============================================================================
// MAIN PARSER
// =============================================================================

/**
 * Parse an IDTA Submodel Template into structured format
 */
export function parseSubmodelTemplate(submodel: Submodel): ParsedTemplate {
  const metadata = extractMetadata(submodel);
  const elements = parseElements(submodel.submodelElements || [], []);
  const flatElements = flattenElements(elements);

  return {
    submodel,
    metadata,
    elements,
    flatElements,
  };
}

/**
 * Extract metadata from submodel
 */
function extractMetadata(submodel: Submodel): TemplateMetadata {
  const description = langStringsToRecord(submodel.description);

  return {
    id: submodel.id,
    idShort: submodel.idShort || 'Unnamed',
    semanticId: getSemanticIdValue(submodel.semanticId) || '',
    version: submodel.administration?.version || '1',
    revision: submodel.administration?.revision || '0',
    templateId: submodel.administration?.templateId || submodel.id,
    description,
  };
}

/**
 * Parse array of submodel elements recursively
 */
function parseElements(elements: SubmodelElement[], parentPath: string[]): ParsedElement[] {
  return elements.map((el) => parseElement(el, parentPath));
}

/**
 * Parse a single submodel element
 */
function parseElement(element: SubmodelElement, parentPath: string[]): ParsedElement {
  const idShort = element.idShort || 'unnamed';
  const path = [...parentPath, idShort];
  const pathString = path.join('.');
  const qualifiers = extractQualifiers(element.qualifiers);
  const cardinality = getCardinality(element.qualifiers);
  const required = isRequired(element.qualifiers);
  const isArray = isMultiple(element.qualifiers);
  const description = langStringsToRecord(element.description);
  const displayName = langStringsToRecord(element.displayName);
  const exampleValue = qualifiers['SMT/ExampleValue'] || qualifiers['ExampleValue'];

  const base: ParsedElement = {
    idShort,
    path,
    pathString,
    modelType: element.modelType,
    semanticId: getSemanticIdValue(element.semanticId),
    cardinality,
    isRequired: required,
    isArray,
    inputType: determineInputType(element),
    description,
    displayName,
    qualifiers,
    exampleValue,
  };

  // Handle specific element types
  switch (element.modelType) {
    case 'Property':
      return parseProperty(element as Property, base);
    case 'MultiLanguageProperty':
      return { ...base, inputType: 'multilanguage' };
    case 'SubmodelElementCollection':
      return parseSMC(element as SubmodelElementCollection, base, path);
    case 'SubmodelElementList':
      return parseSML(element as SubmodelElementList, base, path);
    case 'Range':
      return parseRange(element as Range, base);
    case 'File':
      return parseFile(element as File, base);
    case 'Blob':
      return parseBlob(element as Blob, base);
    case 'ReferenceElement':
      return { ...base, inputType: 'reference' };
    case 'Entity':
      return parseEntity(element as Entity, base, path);
    case 'Operation':
      return { ...base, inputType: 'operation' };
    case 'Capability':
      return { ...base, inputType: 'capability' };
    case 'BasicEventElement':
      return { ...base, inputType: 'event' };
    case 'RelationshipElement':
    case 'AnnotatedRelationshipElement':
      return { ...base, inputType: 'relationship' };
    default:
      return base;
  }
}

/**
 * Parse Property element
 */
function parseProperty(element: Property, base: ParsedElement): ParsedElement {
  const inputType = valueTypeToInputType(element.valueType);
  const constraints = extractConstraints(base.qualifiers, element.valueType);

  return {
    ...base,
    valueType: element.valueType,
    inputType,
    constraints,
  };
}

/**
 * Parse SubmodelElementCollection
 */
function parseSMC(
  element: SubmodelElementCollection,
  base: ParsedElement,
  path: string[]
): ParsedElement {
  return {
    ...base,
    inputType: 'collection',
    children: element.value ? parseElements(element.value, path) : [],
  };
}

/**
 * Parse SubmodelElementList
 */
function parseSML(
  element: SubmodelElementList,
  base: ParsedElement,
  path: string[]
): ParsedElement {
  return {
    ...base,
    inputType: 'list',
    valueType: element.valueTypeListElement,
    listElementType: element.typeValueListElement,
    children: element.value ? parseElements(element.value, path) : [],
  };
}

/**
 * Parse Range element
 */
function parseRange(element: Range, base: ParsedElement): ParsedElement {
  return {
    ...base,
    valueType: element.valueType,
    inputType: 'range',
  };
}

/**
 * Parse File element
 */
function parseFile(element: File, base: ParsedElement): ParsedElement {
  return {
    ...base,
    inputType: 'file',
    constraints: {
      contentType: element.contentType,
    },
  };
}

/**
 * Parse Blob element
 */
function parseBlob(element: Blob, base: ParsedElement): ParsedElement {
  return {
    ...base,
    inputType: 'blob',
    constraints: {
      contentType: element.contentType,
    },
  };
}

/**
 * Parse Entity element
 */
function parseEntity(element: Entity, base: ParsedElement, path: string[]): ParsedElement {
  return {
    ...base,
    inputType: 'entity',
    children: element.statements ? parseElements(element.statements, path) : [],
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract all qualifiers into a key-value map
 */
function extractQualifiers(qualifiers?: Qualifier[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (!qualifiers) return result;

  for (const q of qualifiers) {
    if (q.type && q.value) {
      result[q.type] = q.value;
    }
  }

  return result;
}

/**
 * Extract constraints from qualifiers and valueType
 */
function extractConstraints(
  qualifiers: Record<string, string>,
  valueType?: DataTypeDefXsd
): ElementConstraints | undefined {
  const constraints: ElementConstraints = {};

  // SMT standard qualifiers
  if (qualifiers['SMT/MinLength']) {
    constraints.minLength = parseInt(qualifiers['SMT/MinLength'], 10);
  }
  if (qualifiers['SMT/MaxLength']) {
    constraints.maxLength = parseInt(qualifiers['SMT/MaxLength'], 10);
  }
  if (qualifiers['SMT/Pattern']) {
    constraints.pattern = qualifiers['SMT/Pattern'];
  }
  if (qualifiers['SMT/Min']) {
    constraints.min = parseFloat(qualifiers['SMT/Min']);
  }
  if (qualifiers['SMT/Max']) {
    constraints.max = parseFloat(qualifiers['SMT/Max']);
  }

  // ECLASS value list qualifier
  if (qualifiers['SMT/AllowedValue']) {
    constraints.allowedValues = qualifiers['SMT/AllowedValue'].split(',').map((v) => v.trim());
  }

  return Object.keys(constraints).length > 0 ? constraints : undefined;
}

/**
 * Determine input type from element
 */
function determineInputType(element: SubmodelElement): InputType {
  switch (element.modelType) {
    case 'Property':
      return valueTypeToInputType((element as Property).valueType);
    case 'MultiLanguageProperty':
      return 'multilanguage';
    case 'SubmodelElementCollection':
      return 'collection';
    case 'SubmodelElementList':
      return 'list';
    case 'Range':
      return 'range';
    case 'File':
      return 'file';
    case 'Blob':
      return 'blob';
    case 'ReferenceElement':
      return 'reference';
    case 'Entity':
      return 'entity';
    case 'Operation':
      return 'operation';
    case 'Capability':
      return 'capability';
    case 'BasicEventElement':
      return 'event';
    case 'RelationshipElement':
    case 'AnnotatedRelationshipElement':
      return 'relationship';
    default:
      return 'text';
  }
}

/**
 * Map XSD valueType to form input type
 */
function valueTypeToInputType(valueType?: DataTypeDefXsd): InputType {
  if (!valueType) return 'text';

  const mapping: Partial<Record<DataTypeDefXsd, InputType>> = {
    'xs:string': 'text',
    'xs:boolean': 'boolean',
    'xs:decimal': 'decimal',
    'xs:double': 'decimal',
    'xs:float': 'decimal',
    'xs:integer': 'integer',
    'xs:int': 'integer',
    'xs:long': 'integer',
    'xs:short': 'integer',
    'xs:byte': 'integer',
    'xs:positiveInteger': 'integer',
    'xs:nonNegativeInteger': 'integer',
    'xs:negativeInteger': 'integer',
    'xs:nonPositiveInteger': 'integer',
    'xs:unsignedLong': 'integer',
    'xs:unsignedInt': 'integer',
    'xs:unsignedShort': 'integer',
    'xs:unsignedByte': 'integer',
    'xs:date': 'date',
    'xs:dateTime': 'datetime',
    'xs:time': 'time',
    'xs:gYear': 'integer',
    'xs:anyURI': 'url',
    'xs:base64Binary': 'blob',
    'xs:hexBinary': 'blob',
  };

  return mapping[valueType] || 'text';
}

/**
 * Convert LangStringSet array to Record<language, text>
 */
function langStringsToRecord(strings?: LangStringSet[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (!strings) return result;

  for (const { language, text } of strings) {
    result[language] = text;
  }

  return result;
}

/**
 * Flatten element tree into a Map keyed by path string
 */
function flattenElements(
  elements: ParsedElement[],
  map: Map<string, ParsedElement> = new Map()
): Map<string, ParsedElement> {
  for (const el of elements) {
    map.set(el.pathString, el);
    if (el.children) {
      flattenElements(el.children, map);
    }
  }
  return map;
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Find element by path string
 */
export function findElementByPath(
  template: ParsedTemplate,
  pathString: string
): ParsedElement | undefined {
  return template.flatElements.get(pathString);
}

/**
 * Get all semantic IDs from template
 */
export function extractSemanticIds(template: ParsedTemplate): string[] {
  const ids: string[] = [];

  function collect(elements: ParsedElement[]) {
    for (const el of elements) {
      if (el.semanticId) ids.push(el.semanticId);
      if (el.children) collect(el.children);
    }
  }

  collect(template.elements);
  return [...new Set(ids)];
}

/**
 * Get all required elements from template
 */
export function getRequiredElements(template: ParsedTemplate): ParsedElement[] {
  return Array.from(template.flatElements.values()).filter((el) => el.isRequired);
}

/**
 * Get all elements of a specific input type
 */
export function getElementsByInputType(
  template: ParsedTemplate,
  inputType: InputType
): ParsedElement[] {
  return Array.from(template.flatElements.values()).filter((el) => el.inputType === inputType);
}

/**
 * Count total elements in template
 */
export function countElements(template: ParsedTemplate): {
  total: number;
  required: number;
  optional: number;
  collections: number;
} {
  const elements = Array.from(template.flatElements.values());
  return {
    total: elements.length,
    required: elements.filter((el) => el.isRequired).length,
    optional: elements.filter((el) => !el.isRequired).length,
    collections: elements.filter((el) => el.inputType === 'collection').length,
  };
}
