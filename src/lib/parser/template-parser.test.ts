/**
 * Template Parser Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseSubmodelTemplate,
  findElementByPath,
  extractSemanticIds,
  getRequiredElements,
  getElementsByInputType,
  countElements,
} from './template-parser';
import type { Submodel } from '@/types/aas';

// =============================================================================
// TEST DATA
// =============================================================================

const minimalSubmodel: Submodel = {
  modelType: 'Submodel',
  id: 'https://example.org/submodel/test',
  idShort: 'TestSubmodel',
  kind: 'Template',
};

const submodelWithProperty: Submodel = {
  modelType: 'Submodel',
  id: 'https://example.org/submodel/test',
  idShort: 'TestSubmodel',
  kind: 'Template',
  submodelElements: [
    {
      modelType: 'Property',
      idShort: 'SerialNumber',
      valueType: 'xs:string',
      description: [{ language: 'en', text: 'Product serial number' }],
    },
  ],
};

const submodelWithSMC: Submodel = {
  modelType: 'Submodel',
  id: 'https://example.org/submodel/test',
  idShort: 'TestSubmodel',
  kind: 'Template',
  submodelElements: [
    {
      modelType: 'SubmodelElementCollection',
      idShort: 'ContactInfo',
      value: [
        {
          modelType: 'Property',
          idShort: 'Name',
          valueType: 'xs:string',
        },
        {
          modelType: 'Property',
          idShort: 'Email',
          valueType: 'xs:string',
        },
      ],
    },
  ],
};

const submodelWithQualifiers: Submodel = {
  modelType: 'Submodel',
  id: 'https://example.org/submodel/test',
  idShort: 'TestSubmodel',
  kind: 'Template',
  submodelElements: [
    {
      modelType: 'Property',
      idShort: 'OptionalField',
      valueType: 'xs:string',
      qualifiers: [
        {
          type: 'SMT/Cardinality',
          valueType: 'xs:string',
          value: 'ZeroToOne',
        },
      ],
    },
    {
      modelType: 'Property',
      idShort: 'RequiredField',
      valueType: 'xs:string',
      qualifiers: [
        {
          type: 'SMT/Cardinality',
          valueType: 'xs:string',
          value: 'One',
        },
      ],
    },
  ],
};

const submodelWithMixedTypes: Submodel = {
  modelType: 'Submodel',
  id: 'https://example.org/submodel/test',
  idShort: 'TestSubmodel',
  kind: 'Template',
  semanticId: {
    type: 'ExternalReference',
    keys: [{ type: 'GlobalReference', value: 'https://example.org/semantic/main' }],
  },
  submodelElements: [
    {
      modelType: 'Property',
      idShort: 'StringProp',
      valueType: 'xs:string',
      semanticId: {
        type: 'ExternalReference',
        keys: [{ type: 'GlobalReference', value: 'https://example.org/semantic/string' }],
      },
    },
    {
      modelType: 'Property',
      idShort: 'NumberProp',
      valueType: 'xs:integer',
    },
    {
      modelType: 'Property',
      idShort: 'DateProp',
      valueType: 'xs:date',
    },
    {
      modelType: 'MultiLanguageProperty',
      idShort: 'MLProp',
    },
    {
      modelType: 'File',
      idShort: 'FileProp',
    },
  ],
};

// =============================================================================
// TESTS
// =============================================================================

describe('parseSubmodelTemplate', () => {
  it('should parse a minimal submodel', () => {
    const result = parseSubmodelTemplate(minimalSubmodel);

    expect(result.metadata.id).toBe('https://example.org/submodel/test');
    expect(result.metadata.idShort).toBe('TestSubmodel');
    expect(result.elements).toHaveLength(0);
  });

  it('should parse a submodel with a property', () => {
    const result = parseSubmodelTemplate(submodelWithProperty);

    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].idShort).toBe('SerialNumber');
    expect(result.elements[0].modelType).toBe('Property');
    expect(result.elements[0].valueType).toBe('xs:string');
    expect(result.elements[0].inputType).toBe('text');
    expect(result.elements[0].description).toEqual({ en: 'Product serial number' });
  });

  it('should parse nested SubmodelElementCollections', () => {
    const result = parseSubmodelTemplate(submodelWithSMC);

    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].idShort).toBe('ContactInfo');
    expect(result.elements[0].modelType).toBe('SubmodelElementCollection');
    expect(result.elements[0].children).toHaveLength(2);
    expect(result.elements[0].children![0].idShort).toBe('Name');
    expect(result.elements[0].children![1].idShort).toBe('Email');
  });

  it('should parse cardinality qualifiers', () => {
    const result = parseSubmodelTemplate(submodelWithQualifiers);

    const optionalField = result.elements[0];
    const requiredField = result.elements[1];

    expect(optionalField.cardinality).toBe('ZeroToOne');
    expect(optionalField.isRequired).toBe(false);
    expect(optionalField.isArray).toBe(false);

    expect(requiredField.cardinality).toBe('One');
    expect(requiredField.isRequired).toBe(true);
    expect(requiredField.isArray).toBe(false);
  });

  it('should build correct paths for nested elements', () => {
    const result = parseSubmodelTemplate(submodelWithSMC);

    const smc = result.elements[0];
    const nameChild = smc.children![0];
    const emailChild = smc.children![1];

    expect(smc.path).toEqual(['ContactInfo']);
    expect(smc.pathString).toBe('ContactInfo');
    expect(nameChild.path).toEqual(['ContactInfo', 'Name']);
    expect(nameChild.pathString).toBe('ContactInfo.Name');
    expect(emailChild.path).toEqual(['ContactInfo', 'Email']);
    expect(emailChild.pathString).toBe('ContactInfo.Email');
  });

  it('should map value types to input types', () => {
    const result = parseSubmodelTemplate(submodelWithMixedTypes);

    const stringEl = result.elements.find((e) => e.idShort === 'StringProp');
    const numberEl = result.elements.find((e) => e.idShort === 'NumberProp');
    const dateEl = result.elements.find((e) => e.idShort === 'DateProp');
    const mlpEl = result.elements.find((e) => e.idShort === 'MLProp');
    const fileEl = result.elements.find((e) => e.idShort === 'FileProp');

    expect(stringEl?.inputType).toBe('text');
    expect(numberEl?.inputType).toBe('integer'); // xs:integer maps to 'integer' input type
    expect(dateEl?.inputType).toBe('date');
    expect(mlpEl?.inputType).toBe('multilanguage'); // Full name for MultiLanguageProperty
    expect(fileEl?.inputType).toBe('file');
  });
});

describe('findElementByPath', () => {
  it('should find top-level elements', () => {
    const template = parseSubmodelTemplate(submodelWithProperty);
    const element = findElementByPath(template, 'SerialNumber');

    expect(element).toBeDefined();
    expect(element?.idShort).toBe('SerialNumber');
  });

  it('should find nested elements', () => {
    const template = parseSubmodelTemplate(submodelWithSMC);
    const element = findElementByPath(template, 'ContactInfo.Email');

    expect(element).toBeDefined();
    expect(element?.idShort).toBe('Email');
  });

  it('should return undefined for non-existent paths', () => {
    const template = parseSubmodelTemplate(submodelWithProperty);
    const element = findElementByPath(template, 'NonExistent');

    expect(element).toBeUndefined();
  });
});

describe('extractSemanticIds', () => {
  it('should extract semantic IDs from elements', () => {
    const template = parseSubmodelTemplate(submodelWithMixedTypes);
    const ids = extractSemanticIds(template);

    expect(ids).toContain('https://example.org/semantic/string');
  });
});

describe('getRequiredElements', () => {
  it('should return only required elements', () => {
    const template = parseSubmodelTemplate(submodelWithQualifiers);
    const required = getRequiredElements(template);

    expect(required).toHaveLength(1);
    expect(required[0].idShort).toBe('RequiredField');
  });
});

describe('getElementsByInputType', () => {
  it('should filter elements by input type', () => {
    const template = parseSubmodelTemplate(submodelWithMixedTypes);
    const textElements = getElementsByInputType(template, 'text');

    expect(textElements).toHaveLength(1);
    expect(textElements[0].idShort).toBe('StringProp');
  });
});

describe('countElements', () => {
  it('should count total and required elements', () => {
    const template = parseSubmodelTemplate(submodelWithQualifiers);
    const counts = countElements(template);

    expect(counts.total).toBe(2);
    expect(counts.required).toBe(1);
    expect(counts.optional).toBe(1);
  });

  it('should count nested elements', () => {
    const template = parseSubmodelTemplate(submodelWithSMC);
    const counts = countElements(template);

    // ContactInfo + Name + Email
    expect(counts.total).toBe(3);
  });
});
