/**
 * AAS Exporter Tests
 */

import { describe, it, expect } from 'vitest';
import { exportToSubmodel, validateSubmodel } from './aas-exporter';
import { parseSubmodelTemplate } from '../parser/template-parser';
import type { Submodel } from '@/types/aas';

// =============================================================================
// TEST DATA
// =============================================================================

const testSubmodel: Submodel = {
  modelType: 'Submodel',
  id: 'https://example.org/submodel/nameplate',
  idShort: 'Nameplate',
  kind: 'Template',
  semanticId: {
    type: 'ExternalReference',
    keys: [{ type: 'GlobalReference', value: 'https://admin-shell.io/idta/nameplate/3/0/Nameplate' }],
  },
  submodelElements: [
    {
      modelType: 'Property',
      idShort: 'ManufacturerName',
      valueType: 'xs:string',
      semanticId: {
        type: 'ExternalReference',
        keys: [{ type: 'GlobalReference', value: 'https://admin-shell.io/zvei/nameplate/1/0/ManufacturerName' }],
      },
    },
    {
      modelType: 'Property',
      idShort: 'SerialNumber',
      valueType: 'xs:string',
    },
    {
      modelType: 'Property',
      idShort: 'YearOfConstruction',
      valueType: 'xs:integer',
    },
    {
      modelType: 'MultiLanguageProperty',
      idShort: 'ProductDesignation',
    },
    {
      modelType: 'SubmodelElementCollection',
      idShort: 'PhysicalAddress',
      value: [
        {
          modelType: 'Property',
          idShort: 'Street',
          valueType: 'xs:string',
        },
        {
          modelType: 'Property',
          idShort: 'City',
          valueType: 'xs:string',
        },
      ],
    },
  ],
};

// =============================================================================
// TESTS
// =============================================================================

describe('exportToSubmodel', () => {
  it('should export a submodel with filled values', () => {
    const template = parseSubmodelTemplate(testSubmodel);
    const values = {
      ManufacturerName: 'ACME Corp',
      SerialNumber: 'SN-12345',
      YearOfConstruction: 2024,
    };

    const result = exportToSubmodel(template, values);

    expect(result.submodel.modelType).toBe('Submodel');
    expect(result.submodel.idShort).toBe('Nameplate');
    expect(result.submodel.kind).toBe('Instance');
    expect(result.warnings).toHaveLength(0);
  });

  it('should preserve semantic IDs', () => {
    const template = parseSubmodelTemplate(testSubmodel);
    const values = { ManufacturerName: 'ACME Corp' };

    const result = exportToSubmodel(template, values, { includeEmpty: true });

    const manufacturerElement = result.submodel.submodelElements?.find(
      (e) => e.idShort === 'ManufacturerName'
    );

    expect(manufacturerElement?.semanticId).toBeDefined();
    expect(manufacturerElement?.semanticId?.keys?.[0]?.value).toBe(
      'https://admin-shell.io/zvei/nameplate/1/0/ManufacturerName'
    );
  });

  it('should handle nested SMC values', () => {
    const template = parseSubmodelTemplate(testSubmodel);
    const values = {
      'PhysicalAddress.Street': '123 Main St',
      'PhysicalAddress.City': 'Berlin',
    };

    const result = exportToSubmodel(template, values, { includeEmpty: false });

    const addressElement = result.submodel.submodelElements?.find(
      (e) => e.idShort === 'PhysicalAddress'
    ) as { value?: Array<{ idShort?: string; value?: string }> };

    expect(addressElement).toBeDefined();
    expect(addressElement.value).toBeDefined();

    const streetElement = addressElement.value?.find((e) => e.idShort === 'Street');
    const cityElement = addressElement.value?.find((e) => e.idShort === 'City');

    expect(streetElement?.value).toBe('123 Main St');
    expect(cityElement?.value).toBe('Berlin');
  });

  it('should handle MultiLanguageProperty values', () => {
    const template = parseSubmodelTemplate(testSubmodel);
    const values = {
      ProductDesignation: [
        { language: 'en', text: 'Industrial Motor' },
        { language: 'de', text: 'Industriemotor' },
      ],
    };

    const result = exportToSubmodel(template, values);

    const mlpElement = result.submodel.submodelElements?.find(
      (e) => e.idShort === 'ProductDesignation'
    ) as { value?: Array<{ language: string; text: string }> };

    expect(mlpElement?.value).toHaveLength(2);
    expect(mlpElement?.value?.[0]).toEqual({ language: 'en', text: 'Industrial Motor' });
    expect(mlpElement?.value?.[1]).toEqual({ language: 'de', text: 'Industriemotor' });
  });

  it('should skip empty optional fields when includeEmpty is false', () => {
    const template = parseSubmodelTemplate(testSubmodel);
    const values = { ManufacturerName: 'ACME Corp' };

    const result = exportToSubmodel(template, values, { includeEmpty: false });

    // Only ManufacturerName should be present
    const elementShorts = result.submodel.submodelElements?.map((e) => e.idShort);
    expect(elementShorts).toContain('ManufacturerName');
  });

  it('should generate unique IDs when generateIds is true', () => {
    const template = parseSubmodelTemplate(testSubmodel);
    const values = {};

    const result1 = exportToSubmodel(template, values, { generateIds: true });
    const result2 = exportToSubmodel(template, values, { generateIds: true });

    expect(result1.submodel.id).not.toBe(result2.submodel.id);
    expect(result1.submodel.id).toContain('urn:aas:Nameplate:');
  });

  it('should output valid JSON', () => {
    const template = parseSubmodelTemplate(testSubmodel);
    const values = { ManufacturerName: 'ACME Corp' };

    const result = exportToSubmodel(template, values, { prettyPrint: true });

    expect(() => JSON.parse(result.json)).not.toThrow();
    const parsed = JSON.parse(result.json);
    expect(parsed.idShort).toBe('Nameplate');
  });
});

describe('validateSubmodel', () => {
  it('should validate a complete submodel', () => {
    const template = parseSubmodelTemplate(testSubmodel);
    const values = { ManufacturerName: 'ACME Corp' };
    const result = exportToSubmodel(template, values);

    const errors = validateSubmodel(result.submodel);
    expect(errors).toHaveLength(0);
  });

  it('should detect missing id', () => {
    const submodel = {
      modelType: 'Submodel',
      idShort: 'Test',
    } as Submodel;

    const errors = validateSubmodel(submodel);
    expect(errors).toContain('Submodel must have an id');
  });

  it('should detect missing idShort', () => {
    const submodel = {
      modelType: 'Submodel',
      id: 'https://example.org/test',
    } as Submodel;

    const errors = validateSubmodel(submodel);
    expect(errors).toContain('Submodel must have an idShort');
  });
});
