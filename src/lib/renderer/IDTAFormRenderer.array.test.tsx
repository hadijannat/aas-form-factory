import { renderToStaticMarkup } from 'react-dom/server';
import { IDTAFormRenderer } from './IDTAFormRenderer';
import type { Submodel } from '@/types/aas';
import { expect, test } from 'vitest';

test('renders array items from initialValues', () => {
  const submodel: Submodel = {
    modelType: 'Submodel',
    id: 'https://example.org/submodel/test',
    idShort: 'TestSubmodel',
    kind: 'Template',
    submodelElements: [
      {
        modelType: 'Property',
        idShort: 'SerialNumber',
        valueType: 'xs:string',
        qualifiers: [
          {
            type: 'SMT/Cardinality',
            valueType: 'xs:string',
            value: 'ZeroToMany',
          },
        ],
      },
    ],
  };

  const html = renderToStaticMarkup(
    <IDTAFormRenderer
      submodel={submodel}
      initialValues={{
        'SerialNumber.0': 'A-001',
        'SerialNumber.1': 'A-002',
      }}
    />
  );

  expect(html).toContain('Serial Number 1');
  expect(html).toContain('Serial Number 2');
  expect(html).toContain('(2');
});
