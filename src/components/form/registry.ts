/**
 * AAS Form Component Registry
 * Maps component names to React components for json-render
 */

import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { URLInput } from './URLInput';
import { DateInput } from './DateInput';
import { BooleanInput } from './BooleanInput';
import { SelectInput } from './SelectInput';
import { MultiLanguageInput } from './MultiLanguageInput';
import { RangeInput } from './RangeInput';
import { FileInput } from './FileInput';
import { SMCContainer } from './SMCContainer';
import { ArrayContainer } from './ArrayContainer';
import { FormSection } from './FormSection';
import { ReadOnlyValue } from './ReadOnlyValue';

/**
 * Component registry mapping catalog names to React components
 */
export const componentRegistry = {
  // Input components
  TextInput,
  NumberInput,
  URLInput,
  DateInput,
  BooleanInput,
  SelectInput,

  // Complex input components
  MultiLanguageInput,
  RangeInput,
  FileInput,

  // Container components
  SMCContainer,
  ArrayContainer,

  // Layout components
  FormSection,

  // Display components
  ReadOnlyValue,

  // Aliases for input type mapping
  text: TextInput,
  textarea: TextInput,
  number: NumberInput,
  integer: NumberInput,
  decimal: NumberInput,
  url: URLInput,
  date: DateInput,
  datetime: DateInput,
  boolean: BooleanInput,
  select: SelectInput,
  multilanguage: MultiLanguageInput,
  range: RangeInput,
  file: FileInput,
  collection: SMCContainer,
  list: ArrayContainer,
  readonly: ReadOnlyValue,
} as const;

export type ComponentName = keyof typeof componentRegistry;

/**
 * Get component by name from registry
 */
export function getComponent(name: string) {
  return componentRegistry[name as ComponentName] || TextInput;
}

/**
 * Map ParsedElement inputType to component
 */
export function getComponentForInputType(inputType: string) {
  const mapping: Record<string, keyof typeof componentRegistry> = {
    text: 'TextInput',
    textarea: 'TextInput',
    number: 'NumberInput',
    integer: 'NumberInput',
    decimal: 'NumberInput',
    url: 'URLInput',
    email: 'TextInput', // Use text with pattern validation
    date: 'DateInput',
    datetime: 'DateInput',
    time: 'DateInput',
    boolean: 'BooleanInput',
    file: 'FileInput',
    blob: 'FileInput',
    select: 'SelectInput',
    multilanguage: 'MultiLanguageInput',
    range: 'RangeInput',
    reference: 'TextInput', // TODO: Implement ReferenceInput
    collection: 'SMCContainer',
    list: 'ArrayContainer',
    entity: 'SMCContainer',
    readonly: 'ReadOnlyValue',
  };

  return componentRegistry[mapping[inputType] || 'TextInput'];
}
