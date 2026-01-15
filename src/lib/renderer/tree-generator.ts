/**
 * UI Tree Generator
 * Converts ParsedTemplate into json-render compatible UI tree
 */

import type { ParsedTemplate, ParsedElement, InputType } from '../parser/template-parser';

// =============================================================================
// UI TREE TYPES
// =============================================================================

export interface UINode {
  component: string;
  props: Record<string, unknown>;
  children?: UINode[];
}

export interface UITree {
  root: UINode;
  metadata: {
    templateId: string;
    templateName: string;
    elementCount: number;
  };
}

// =============================================================================
// COMPONENT MAPPING
// =============================================================================

const INPUT_TYPE_TO_COMPONENT: Record<InputType, string> = {
  text: 'TextInput',
  textarea: 'TextInput',
  number: 'NumberInput',
  integer: 'NumberInput',
  decimal: 'NumberInput',
  url: 'URLInput',
  email: 'TextInput',
  date: 'DateInput',
  datetime: 'DateInput',
  time: 'DateInput',
  boolean: 'BooleanInput',
  file: 'FileInput',
  blob: 'FileInput',
  select: 'SelectInput',
  multilanguage: 'MultiLanguageInput',
  range: 'RangeInput',
  reference: 'TextInput', // TODO: ReferenceInput
  collection: 'SMCContainer',
  list: 'ArrayContainer',
  entity: 'SMCContainer',
  operation: 'ReadOnlyValue',
  capability: 'ReadOnlyValue',
  event: 'ReadOnlyValue',
  relationship: 'ReadOnlyValue',
  readonly: 'ReadOnlyValue',
};

// =============================================================================
// TREE GENERATION
// =============================================================================

/**
 * Generate UI tree from parsed template
 */
export function generateUITree(template: ParsedTemplate): UITree {
  const rootChildren = template.elements.map((el) => elementToNode(el, 0));

  return {
    root: {
      component: 'FormSection',
      props: {
        title: template.metadata.idShort,
        subtitle: template.metadata.description?.en || template.metadata.semanticId,
      },
      children: rootChildren,
    },
    metadata: {
      templateId: template.metadata.id,
      templateName: template.metadata.idShort,
      elementCount: template.flatElements.size,
    },
  };
}

/**
 * Convert a single ParsedElement to UINode
 */
function elementToNode(element: ParsedElement, level: number): UINode {
  // If element has *ToMany cardinality, wrap in ArrayContainer
  if (element.isArray && !isContainerType(element.inputType)) {
    return createArrayWrapper(element, level);
  }

  return createNode(element, level);
}

/**
 * Create UINode for an element
 */
function createNode(element: ParsedElement, level: number): UINode {
  const component = INPUT_TYPE_TO_COMPONENT[element.inputType] || 'TextInput';
  const props = buildProps(element, level);

  // Handle container types with children
  if (isContainerType(element.inputType) && element.children) {
    const children = element.children.map((child) => elementToNode(child, level + 1));

    // For SMC with *ToMany cardinality, wrap the whole thing in ArrayContainer
    if (element.isArray) {
      return {
        component: 'ArrayContainer',
        props: {
          idShort: element.idShort,
          path: element.path,
          semanticId: element.semanticId,
          required: element.isRequired,
          description: element.description,
          displayName: element.displayName,
          minItems: element.isRequired ? 1 : 0,
          itemLabel: getDisplayLabel(element),
        },
        children: [
          {
            component,
            props: { ...props, collapsible: true, level: level + 1 },
            children,
          },
        ],
      };
    }

    return {
      component,
      props,
      children,
    };
  }

  return {
    component,
    props,
  };
}

/**
 * Create ArrayContainer wrapper for *ToMany elements
 */
function createArrayWrapper(element: ParsedElement, level: number): UINode {
  const innerNode = createNode({ ...element, isArray: false }, level + 1);

  return {
    component: 'ArrayContainer',
    props: {
      idShort: element.idShort,
      path: element.path,
      semanticId: element.semanticId,
      required: element.isRequired,
      description: element.description,
      displayName: element.displayName,
      minItems: element.isRequired ? 1 : 0,
      itemLabel: getDisplayLabel(element),
    },
    children: [innerNode],
  };
}

/**
 * Build props for a component from ParsedElement
 */
function buildProps(element: ParsedElement, level: number): Record<string, unknown> {
  const baseProps: Record<string, unknown> = {
    idShort: element.idShort,
    path: element.path,
    semanticId: element.semanticId,
    required: element.isRequired,
    description: element.description,
    displayName: element.displayName,
    exampleValue: element.exampleValue,
  };

  // Add type-specific props
  switch (element.inputType) {
    case 'text':
    case 'textarea':
      return {
        ...baseProps,
        multiline: element.inputType === 'textarea',
        minLength: element.constraints?.minLength,
        maxLength: element.constraints?.maxLength,
        pattern: element.constraints?.pattern,
      };

    case 'number':
    case 'integer':
    case 'decimal':
      return {
        ...baseProps,
        valueType: element.inputType === 'integer' ? 'integer' : 'decimal',
        min: element.constraints?.min,
        max: element.constraints?.max,
      };

    case 'date':
      return { ...baseProps, includeTime: false };

    case 'datetime':
      return { ...baseProps, includeTime: true };

    case 'select':
      return {
        ...baseProps,
        options: element.constraints?.allowedValues?.map((v) => ({
          value: v,
          label: v,
        })) || [],
      };

    case 'file':
    case 'blob':
      return {
        ...baseProps,
        contentType: element.constraints?.contentType,
      };

    case 'range':
      return {
        ...baseProps,
        valueType: element.valueType?.includes('integer') ? 'integer' : 'decimal',
      };

    case 'multilanguage':
      return {
        ...baseProps,
        supportedLanguages: ['en', 'de', 'fr', 'es', 'it'],
        primaryLanguage: 'en',
      };

    case 'collection':
    case 'entity':
      return {
        ...baseProps,
        collapsible: true,
        collapsed: level > 1,
        variant: level === 0 ? 'card' : 'section',
        level,
      };

    case 'list':
      return {
        ...baseProps,
        minItems: element.isRequired ? 1 : 0,
        allowReorder: true,
      };

    default:
      return baseProps;
  }
}

/**
 * Check if input type is a container type
 */
function isContainerType(inputType: InputType): boolean {
  return ['collection', 'list', 'entity'].includes(inputType);
}

/**
 * Get display label for element
 */
function getDisplayLabel(element: ParsedElement): string {
  if (element.displayName?.en) return element.displayName.en;
  if (element.displayName?.de) return element.displayName.de;
  return formatIdShort(element.idShort);
}

/**
 * Format idShort for display
 */
function formatIdShort(idShort: string): string {
  return idShort
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Flatten UI tree to array of nodes with paths
 */
export function flattenUITree(tree: UITree): Array<{ path: string[]; node: UINode }> {
  const result: Array<{ path: string[]; node: UINode }> = [];

  function traverse(node: UINode, currentPath: string[]) {
    const nodePath = node.props.path as string[] | undefined;
    const path = nodePath || currentPath;

    result.push({ path, node });

    if (node.children) {
      for (const child of node.children) {
        traverse(child, path);
      }
    }
  }

  traverse(tree.root, []);
  return result;
}

/**
 * Count nodes in UI tree
 */
export function countUINodes(tree: UITree): number {
  let count = 0;

  function traverse(node: UINode) {
    count++;
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(tree.root);
  return count;
}

/**
 * Find node by path in UI tree
 */
export function findUINode(tree: UITree, path: string[]): UINode | undefined {
  const pathString = path.join('.');

  function traverse(node: UINode): UINode | undefined {
    const nodePath = node.props.path as string[] | undefined;
    if (nodePath && nodePath.join('.') === pathString) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = traverse(child);
        if (found) return found;
      }
    }

    return undefined;
  }

  return traverse(tree.root);
}
