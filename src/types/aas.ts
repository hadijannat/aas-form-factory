/**
 * AAS V3.0 Type Definitions
 * Based on: https://admin-shell.io/aas-specs/
 * Spec: Part 1 - AAS Metamodel V3.0
 */

// =============================================================================
// ENUMS & LITERAL TYPES
// =============================================================================

export type ModelType =
  | 'Submodel'
  | 'SubmodelElementCollection'
  | 'SubmodelElementList'
  | 'Property'
  | 'MultiLanguageProperty'
  | 'Range'
  | 'Blob'
  | 'File'
  | 'ReferenceElement'
  | 'RelationshipElement'
  | 'AnnotatedRelationshipElement'
  | 'Entity'
  | 'EventElement'
  | 'BasicEventElement'
  | 'Operation'
  | 'Capability';

export type DataTypeDefXsd =
  | 'xs:anyURI'
  | 'xs:base64Binary'
  | 'xs:boolean'
  | 'xs:byte'
  | 'xs:date'
  | 'xs:dateTime'
  | 'xs:decimal'
  | 'xs:double'
  | 'xs:duration'
  | 'xs:float'
  | 'xs:gDay'
  | 'xs:gMonth'
  | 'xs:gMonthDay'
  | 'xs:gYear'
  | 'xs:gYearMonth'
  | 'xs:hexBinary'
  | 'xs:int'
  | 'xs:integer'
  | 'xs:long'
  | 'xs:negativeInteger'
  | 'xs:nonNegativeInteger'
  | 'xs:nonPositiveInteger'
  | 'xs:positiveInteger'
  | 'xs:short'
  | 'xs:string'
  | 'xs:time'
  | 'xs:unsignedByte'
  | 'xs:unsignedInt'
  | 'xs:unsignedLong'
  | 'xs:unsignedShort';

export type KeyType =
  | 'AnnotatedRelationshipElement'
  | 'AssetAdministrationShell'
  | 'BasicEventElement'
  | 'Blob'
  | 'Capability'
  | 'ConceptDescription'
  | 'DataElement'
  | 'Entity'
  | 'EventElement'
  | 'File'
  | 'FragmentReference'
  | 'GlobalReference'
  | 'Identifiable'
  | 'MultiLanguageProperty'
  | 'Operation'
  | 'Property'
  | 'Range'
  | 'Referable'
  | 'ReferenceElement'
  | 'RelationshipElement'
  | 'Submodel'
  | 'SubmodelElement'
  | 'SubmodelElementCollection'
  | 'SubmodelElementList';

export type ReferenceType = 'ExternalReference' | 'ModelReference';

export type EntityType = 'CoManagedEntity' | 'SelfManagedEntity';

export type Direction = 'input' | 'output';

export type StateOfEvent = 'on' | 'off';

export type QualifierKind = 'ConceptQualifier' | 'TemplateQualifier' | 'ValueQualifier';

export type AssetKind = 'Type' | 'Instance' | 'NotApplicable';

export type SubmodelKind = 'Template' | 'Instance';

export type DataTypeIec61360 =
  | 'BLOB'
  | 'BOOLEAN'
  | 'DATE'
  | 'FILE'
  | 'HTML'
  | 'INTEGER_COUNT'
  | 'INTEGER_CURRENCY'
  | 'INTEGER_MEASURE'
  | 'IRDI'
  | 'IRI'
  | 'RATIONAL'
  | 'RATIONAL_MEASURE'
  | 'REAL_COUNT'
  | 'REAL_CURRENCY'
  | 'REAL_MEASURE'
  | 'STRING'
  | 'STRING_TRANSLATABLE'
  | 'TIME'
  | 'TIMESTAMP';

// SMT Cardinality from IDTA templates
export type Cardinality = 'One' | 'ZeroToOne' | 'OneToMany' | 'ZeroToMany';

// =============================================================================
// BASE STRUCTURES
// =============================================================================

export interface Key {
  type: KeyType;
  value: string;
}

export interface Reference {
  type: ReferenceType;
  keys: Key[];
}

export interface LangStringSet {
  language: string;
  text: string;
}

export interface Qualifier {
  semanticId?: Reference;
  kind?: QualifierKind;
  type: string;
  valueType?: DataTypeDefXsd;
  value?: string;
  valueId?: Reference;
}

export interface Extension {
  semanticId?: Reference;
  name: string;
  valueType?: DataTypeDefXsd;
  value?: string;
  refersTo?: Reference[];
}

export interface AdministrativeInformation {
  version?: string;
  revision?: string;
  creator?: Reference;
  templateId?: string;
}

export interface Resource {
  path: string;
  contentType?: string;
}

export interface SpecificAssetId {
  semanticId?: Reference;
  name: string;
  value: string;
  externalSubjectId?: Reference;
}

// =============================================================================
// DATA SPECIFICATION
// =============================================================================

export interface ValueReferencePair {
  value: string;
  valueId: Reference;
}

export interface ValueList {
  valueReferencePairs: ValueReferencePair[];
}

export interface LevelType {
  min: boolean;
  nom: boolean;
  typ: boolean;
  max: boolean;
}

export interface DataSpecificationIec61360 {
  preferredName: LangStringSet[];
  shortName?: LangStringSet[];
  unit?: string;
  unitId?: Reference;
  sourceOfDefinition?: string;
  symbol?: string;
  dataType?: DataTypeIec61360;
  definition?: LangStringSet[];
  valueFormat?: string;
  valueList?: ValueList;
  value?: string;
  levelType?: LevelType;
}

export type DataSpecificationContent = DataSpecificationIec61360;

export interface EmbeddedDataSpecification {
  dataSpecification: Reference;
  dataSpecificationContent: DataSpecificationContent;
}

// =============================================================================
// ABSTRACT BASE TYPES
// =============================================================================

export interface Referable {
  idShort?: string;
  displayName?: LangStringSet[];
  description?: LangStringSet[];
  extensions?: Extension[];
}

export interface HasSemantics {
  semanticId?: Reference;
  supplementalSemanticIds?: Reference[];
}

export interface Qualifiable {
  qualifiers?: Qualifier[];
}

export interface HasDataSpecification {
  embeddedDataSpecifications?: EmbeddedDataSpecification[];
}

// =============================================================================
// SUBMODEL ELEMENT TYPES
// =============================================================================

interface SubmodelElementBase extends Referable, HasSemantics, Qualifiable {
  modelType: ModelType;
}

export interface Property extends SubmodelElementBase {
  modelType: 'Property';
  valueType: DataTypeDefXsd;
  value?: string;
  valueId?: Reference;
}

export interface MultiLanguageProperty extends SubmodelElementBase {
  modelType: 'MultiLanguageProperty';
  value?: LangStringSet[];
  valueId?: Reference;
}

export interface Range extends SubmodelElementBase {
  modelType: 'Range';
  valueType: DataTypeDefXsd;
  min?: string;
  max?: string;
}

export interface Blob extends SubmodelElementBase {
  modelType: 'Blob';
  contentType: string;
  value?: string; // Base64 encoded
}

export interface File extends SubmodelElementBase {
  modelType: 'File';
  contentType: string;
  value?: string; // Path or URL
}

export interface ReferenceElement extends SubmodelElementBase {
  modelType: 'ReferenceElement';
  value?: Reference;
}

export interface SubmodelElementCollection extends SubmodelElementBase {
  modelType: 'SubmodelElementCollection';
  value?: SubmodelElement[];
}

export interface SubmodelElementList extends SubmodelElementBase {
  modelType: 'SubmodelElementList';
  orderRelevant?: boolean;
  semanticIdListElement?: Reference;
  typeValueListElement: ModelType;
  valueTypeListElement?: DataTypeDefXsd;
  value?: SubmodelElement[];
}

export interface Entity extends SubmodelElementBase {
  modelType: 'Entity';
  entityType: EntityType;
  globalAssetId?: string;
  specificAssetIds?: SpecificAssetId[];
  statements?: SubmodelElement[];
}

export interface BasicEventElement extends SubmodelElementBase {
  modelType: 'BasicEventElement';
  observed: Reference;
  direction: Direction;
  state: StateOfEvent;
  messageTopic?: string;
  messageBroker?: Reference;
  lastUpdate?: string;
  minInterval?: string;
  maxInterval?: string;
}

export interface RelationshipElement extends SubmodelElementBase {
  modelType: 'RelationshipElement';
  first: Reference;
  second: Reference;
}

export interface AnnotatedRelationshipElement extends SubmodelElementBase {
  modelType: 'AnnotatedRelationshipElement';
  first: Reference;
  second: Reference;
  annotations?: DataElement[];
}

export interface OperationVariable {
  value: SubmodelElement;
}

export interface Operation extends SubmodelElementBase {
  modelType: 'Operation';
  inputVariables?: OperationVariable[];
  outputVariables?: OperationVariable[];
  inoutputVariables?: OperationVariable[];
}

export interface Capability extends SubmodelElementBase {
  modelType: 'Capability';
}

// =============================================================================
// UNION TYPES
// =============================================================================

export type DataElement =
  | Property
  | MultiLanguageProperty
  | Range
  | Blob
  | File
  | ReferenceElement;

export type SubmodelElement =
  | Property
  | MultiLanguageProperty
  | Range
  | Blob
  | File
  | ReferenceElement
  | SubmodelElementCollection
  | SubmodelElementList
  | Entity
  | Operation
  | Capability
  | BasicEventElement
  | RelationshipElement
  | AnnotatedRelationshipElement;

// =============================================================================
// TOP-LEVEL STRUCTURES
// =============================================================================

export interface Submodel extends Referable, HasSemantics, Qualifiable, HasDataSpecification {
  id: string;
  kind?: SubmodelKind;
  administration?: AdministrativeInformation;
  submodelElements?: SubmodelElement[];
  modelType: 'Submodel';
}

export interface AssetInformation {
  assetKind: AssetKind;
  globalAssetId?: string;
  specificAssetIds?: SpecificAssetId[];
  assetType?: string;
  defaultThumbnail?: Resource;
}

export interface AssetAdministrationShell extends Referable, HasDataSpecification {
  id: string;
  administration?: AdministrativeInformation;
  derivedFrom?: Reference;
  assetInformation: AssetInformation;
  submodels?: Reference[];
  modelType: 'AssetAdministrationShell';
}

export interface ConceptDescription extends Referable, HasDataSpecification {
  id: string;
  administration?: AdministrativeInformation;
  isCaseOf?: Reference[];
  modelType: 'ConceptDescription';
}

export interface Environment {
  assetAdministrationShells?: AssetAdministrationShell[];
  submodels?: Submodel[];
  conceptDescriptions?: ConceptDescription[];
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isProperty(element: SubmodelElement): element is Property {
  return element.modelType === 'Property';
}

export function isMultiLanguageProperty(element: SubmodelElement): element is MultiLanguageProperty {
  return element.modelType === 'MultiLanguageProperty';
}

export function isRange(element: SubmodelElement): element is Range {
  return element.modelType === 'Range';
}

export function isBlob(element: SubmodelElement): element is Blob {
  return element.modelType === 'Blob';
}

export function isFile(element: SubmodelElement): element is File {
  return element.modelType === 'File';
}

export function isReferenceElement(element: SubmodelElement): element is ReferenceElement {
  return element.modelType === 'ReferenceElement';
}

export function isSubmodelElementCollection(element: SubmodelElement): element is SubmodelElementCollection {
  return element.modelType === 'SubmodelElementCollection';
}

export function isSubmodelElementList(element: SubmodelElement): element is SubmodelElementList {
  return element.modelType === 'SubmodelElementList';
}

export function isEntity(element: SubmodelElement): element is Entity {
  return element.modelType === 'Entity';
}

export function isOperation(element: SubmodelElement): element is Operation {
  return element.modelType === 'Operation';
}

export function isCapability(element: SubmodelElement): element is Capability {
  return element.modelType === 'Capability';
}

export function isBasicEventElement(element: SubmodelElement): element is BasicEventElement {
  return element.modelType === 'BasicEventElement';
}

export function isRelationshipElement(element: SubmodelElement): element is RelationshipElement {
  return element.modelType === 'RelationshipElement';
}

export function isAnnotatedRelationshipElement(element: SubmodelElement): element is AnnotatedRelationshipElement {
  return element.modelType === 'AnnotatedRelationshipElement';
}

export function isDataElement(element: SubmodelElement): element is DataElement {
  return ['Property', 'MultiLanguageProperty', 'Range', 'Blob', 'File', 'ReferenceElement'].includes(element.modelType);
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract the semantic ID string from a Reference
 */
export function getSemanticIdValue(ref: Reference | undefined): string | undefined {
  return ref?.keys?.[0]?.value;
}

/**
 * Create a GlobalReference
 */
export function createGlobalReference(value: string): Reference {
  return {
    type: 'ExternalReference',
    keys: [{ type: 'GlobalReference', value }],
  };
}

/**
 * Create a ModelReference to a Submodel
 */
export function createSubmodelReference(id: string): Reference {
  return {
    type: 'ModelReference',
    keys: [{ type: 'Submodel', value: id }],
  };
}

/**
 * Get display text for a multi-language string set
 */
export function getDisplayText(
  strings: LangStringSet[] | undefined,
  preferredLanguage = 'en'
): string | undefined {
  if (!strings || strings.length === 0) return undefined;

  // Try preferred language first
  const preferred = strings.find((s) => s.language === preferredLanguage);
  if (preferred) return preferred.text;

  // Fallback to English
  const english = strings.find((s) => s.language === 'en');
  if (english) return english.text;

  // Fallback to first available
  return strings[0]?.text;
}

/**
 * Get qualifier value by type
 */
export function getQualifierValue(
  qualifiers: Qualifier[] | undefined,
  type: string
): string | undefined {
  return qualifiers?.find((q) => q.type === type)?.value;
}

/**
 * Get cardinality from qualifiers
 */
export function getCardinality(qualifiers: Qualifier[] | undefined): Cardinality {
  const value = getQualifierValue(qualifiers, 'SMT/Cardinality');
  if (value && ['One', 'ZeroToOne', 'OneToMany', 'ZeroToMany'].includes(value)) {
    return value as Cardinality;
  }
  return 'ZeroToOne'; // Default cardinality
}

/**
 * Check if element is required based on cardinality
 */
export function isRequired(qualifiers: Qualifier[] | undefined): boolean {
  const cardinality = getCardinality(qualifiers);
  return cardinality === 'One' || cardinality === 'OneToMany';
}

/**
 * Check if element allows multiple values based on cardinality
 */
export function isMultiple(qualifiers: Qualifier[] | undefined): boolean {
  const cardinality = getCardinality(qualifiers);
  return cardinality === 'OneToMany' || cardinality === 'ZeroToMany';
}
