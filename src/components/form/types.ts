/**
 * Shared types for AAS Form Components
 */

import type { LangStringSet } from '@/types/aas';

/**
 * Base props shared by all AAS form components
 */
export interface BaseFormProps {
  idShort: string;
  path: string[];
  semanticId?: string;
  required?: boolean;
  disabled?: boolean;
  description?: Record<string, string>;
  displayName?: Record<string, string>;
  exampleValue?: string;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
}

/**
 * Props for components that can render labels
 */
export interface LabeledProps {
  showLabel?: boolean;
  labelPosition?: 'top' | 'left' | 'hidden';
}

/**
 * Get display label for a form field
 */
export function getFieldLabel(
  props: BaseFormProps,
  preferredLanguage = 'en'
): string {
  // Try displayName first
  if (props.displayName) {
    return (
      props.displayName[preferredLanguage] ||
      props.displayName['en'] ||
      Object.values(props.displayName)[0] ||
      props.idShort
    );
  }
  // Fallback to idShort with formatting
  return formatIdShort(props.idShort);
}

/**
 * Get description for a form field
 */
export function getFieldDescription(
  props: BaseFormProps,
  preferredLanguage = 'en'
): string | undefined {
  if (!props.description) return undefined;
  return (
    props.description[preferredLanguage] ||
    props.description['en'] ||
    Object.values(props.description)[0]
  );
}

/**
 * Format idShort for display (split camelCase, handle underscores)
 */
export function formatIdShort(idShort: string): string {
  return idShort
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Trim and capitalize first letter
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Generate unique field ID from path
 */
export function getFieldId(path: string[]): string {
  return `aas-field-${path.join('-')}`;
}

/**
 * Convert LangStringSet array to Record
 */
export function langStringsToRecord(strings?: LangStringSet[]): Record<string, string> {
  if (!strings) return {};
  const result: Record<string, string> = {};
  for (const { language, text } of strings) {
    result[language] = text;
  }
  return result;
}
