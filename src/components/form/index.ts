/**
 * AAS Form Components
 * Complete component library for rendering IDTA Submodel Template forms
 */

// Shared types
export * from './types';

// Input components
export { TextInput, type TextInputProps } from './TextInput';
export { NumberInput, type NumberInputProps } from './NumberInput';
export { URLInput, type URLInputProps } from './URLInput';
export { DateInput, type DateInputProps } from './DateInput';
export { BooleanInput, type BooleanInputProps } from './BooleanInput';
export { SelectInput, type SelectInputProps, type SelectOption } from './SelectInput';

// Complex input components
export { MultiLanguageInput, type MultiLanguageInputProps, type LangString } from './MultiLanguageInput';
export { RangeInput, type RangeInputProps, type RangeValue } from './RangeInput';
export { FileInput, type FileInputProps, type FileValue } from './FileInput';

// Container components
export { SMCContainer, type SMCContainerProps } from './SMCContainer';
export { ArrayContainer, type ArrayContainerProps } from './ArrayContainer';

// Registry
export {
  componentRegistry,
  getComponent,
  getComponentForInputType,
  type ComponentName,
} from './registry';
