import { describe, it, expect } from 'vitest';
import { parseSubmodelTemplate } from '../parser/template-parser';
import {
  generateUITree,
  flattenUITree,
  countUINodes,
  findUINode,
  type UINode,
} from './tree-generator';
import type { Submodel } from '@/types/aas';

const submodel: Submodel = {
  modelType: 'Submodel',
  id: 'https://example.org/submodel/test',
  idShort: 'TestSubmodel',
  kind: 'Template',
  description: [{ language: 'en', text: 'Test description' }],
  submodelElements: [
    {
      modelType: 'Property',
      idShort: 'Serials',
      valueType: 'xs:string',
      qualifiers: [
        {
          type: 'SMT/Cardinality',
          valueType: 'xs:string',
          value: 'ZeroToMany',
        },
      ],
    },
    {
      modelType: 'SubmodelElementCollection',
      idShort: 'Contact',
      value: [
        {
          modelType: 'Property',
          idShort: 'Name',
          valueType: 'xs:string',
        },
      ],
    },
  ],
};

describe('tree-generator', () => {
  it('generates a UI tree with metadata and array wrapper', () => {
    const parsed = parseSubmodelTemplate(submodel);
    const tree = generateUITree(parsed);

    expect(tree.root.component).toBe('FormSection');
    expect(tree.metadata.templateId).toBe(submodel.id);
    expect(tree.metadata.templateName).toBe(submodel.idShort);

    const firstChild = tree.root.children?.[0] as UINode;
    expect(firstChild.component).toBe('ArrayContainer');
    expect(firstChild.props.idShort).toBe('Serials');
  });

  it('flattens, counts, and finds nodes', () => {
    const parsed = parseSubmodelTemplate(submodel);
    const tree = generateUITree(parsed);

    const flattened = flattenUITree(tree);
    expect(flattened.length).toBeGreaterThan(0);

    const count = countUINodes(tree);
    expect(count).toBe(flattened.length);

    const found = findUINode(tree, ['Contact', 'Name']);
    expect(found?.props.idShort).toBe('Name');
  });
});
