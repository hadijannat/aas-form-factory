import { expect, test } from 'vitest';
import { importSubmodelValues } from './submodel-importer';
import type { Submodel } from '@/types/aas';

test('imports submodel elements into form values', () => {
  const submodel: Submodel = {
    modelType: 'Submodel',
    id: 'https://example.org/submodel/import',
    idShort: 'ImportTest',
    kind: 'Instance',
    submodelElements: [
      {
        modelType: 'Property',
        idShort: 'Count',
        valueType: 'xs:integer',
        value: '42',
      },
      {
        modelType: 'MultiLanguageProperty',
        idShort: 'Label',
        value: [
          { language: 'en', text: 'Hello' },
          { language: 'de', text: 'Hallo' },
        ],
      },
      {
        modelType: 'Range',
        idShort: 'Limits',
        valueType: 'xs:decimal',
        min: '1.5',
        max: '9.5',
      },
      {
        modelType: 'SubmodelElementCollection',
        idShort: 'Details',
        value: [
          {
            modelType: 'Property',
            idShort: 'Name',
            valueType: 'xs:string',
            value: 'Widget',
          },
        ],
      },
      {
        modelType: 'SubmodelElementList',
        idShort: 'Measurements',
        typeValueListElement: 'Property',
        valueTypeListElement: 'xs:decimal',
        value: [
          {
            modelType: 'Property',
            idShort: 'Measurement',
            valueType: 'xs:decimal',
            value: '3.5',
          },
          {
            modelType: 'Property',
            idShort: 'Measurement',
            valueType: 'xs:decimal',
            value: '7.25',
          },
        ],
      },
    ],
  };

  const values = importSubmodelValues(submodel);

  expect(values['Count']).toBe(42);
  expect(values['Label']).toEqual([
    { language: 'en', text: 'Hello' },
    { language: 'de', text: 'Hallo' },
  ]);
  expect(values['Limits']).toEqual({ min: 1.5, max: 9.5 });
  expect(values['Details.Name']).toBe('Widget');
  expect(values['Measurements.0.Measurement']).toBe(3.5);
  expect(values['Measurements.1.Measurement']).toBe(7.25);
});
