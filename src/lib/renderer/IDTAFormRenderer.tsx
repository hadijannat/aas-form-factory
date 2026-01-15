'use client';

/**
 * IDTAFormRenderer
 * Main form renderer for IDTA Submodel Templates
 * Converts templates to dynamic forms using json-render patterns
 */

import * as React from 'react';
import { parseSubmodelTemplate, type ParsedTemplate } from '../parser/template-parser';
import { generateUITree, type UITree, type UINode } from './tree-generator';
import { componentRegistry, getComponent } from '@/components/form/registry';
import type { Submodel } from '@/types/aas';

// =============================================================================
// FORM STATE TYPES
// =============================================================================

export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}

export interface FormActions {
  setValue: (path: string[], value: unknown) => void;
  setError: (path: string[], error: string | undefined) => void;
  setTouched: (path: string[]) => void;
  reset: () => void;
  validate: () => boolean;
  submit: () => Promise<void>;
}

// =============================================================================
// FORM CONTEXT
// =============================================================================

interface FormContextValue {
  state: FormState;
  actions: FormActions;
  template: ParsedTemplate | null;
}

const FormContext = React.createContext<FormContextValue | null>(null);

export function useFormContext() {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within IDTAFormRenderer');
  }
  return context;
}

// =============================================================================
// FORM STATE MANAGEMENT
// =============================================================================

function createInitialState(): FormState {
  return {
    values: {},
    errors: {},
    touched: {},
    isDirty: false,
    isValid: true,
    isSubmitting: false,
  };
}

function pathToKey(path: string[]): string {
  return path.join('.');
}

// =============================================================================
// RENDERER PROPS
// =============================================================================

export interface IDTAFormRendererProps {
  /** Submodel template to render */
  submodel: Submodel;
  /** Initial values for the form */
  initialValues?: Record<string, unknown>;
  /** Called when form is submitted */
  onSubmit?: (values: Record<string, unknown>) => Promise<void>;
  /** Called when a value changes */
  onChange?: (values: Record<string, unknown>) => void;
  /** Render prop for custom form wrapper */
  renderWrapper?: (props: { children: React.ReactNode; state: FormState }) => React.ReactNode;
  /** Disable all form inputs */
  disabled?: boolean;
  /** Language for display text */
  language?: string;
}

// =============================================================================
// MAIN RENDERER
// =============================================================================

export function IDTAFormRenderer({
  submodel,
  initialValues = {},
  onSubmit,
  onChange,
  renderWrapper,
  disabled = false,
  language = 'en',
}: IDTAFormRendererProps) {
  // Parse template and generate UI tree
  const template = React.useMemo(
    () => parseSubmodelTemplate(submodel),
    [submodel]
  );

  const uiTree = React.useMemo(
    () => generateUITree(template),
    [template]
  );

  // Form state
  const [state, setState] = React.useState<FormState>(() => ({
    ...createInitialState(),
    values: initialValues,
  }));

  // Actions
  const actions = React.useMemo<FormActions>(() => ({
    setValue: (path, value) => {
      setState((prev) => {
        const key = pathToKey(path);
        const newValues = { ...prev.values, [key]: value };
        onChange?.(newValues);
        return {
          ...prev,
          values: newValues,
          isDirty: true,
        };
      });
    },

    setError: (path, error) => {
      setState((prev) => {
        const key = pathToKey(path);
        const newErrors = { ...prev.errors };
        if (error) {
          newErrors[key] = error;
        } else {
          delete newErrors[key];
        }
        return {
          ...prev,
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0,
        };
      });
    },

    setTouched: (path) => {
      setState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [pathToKey(path)]: true },
      }));
    },

    reset: () => {
      setState({
        ...createInitialState(),
        values: initialValues,
      });
    },

    validate: () => {
      // Basic validation - check required fields
      const errors: Record<string, string> = {};

      for (const [pathString, element] of template.flatElements) {
        if (element.isRequired) {
          const value = state.values[pathString];
          if (value === undefined || value === null || value === '') {
            errors[pathString] = 'This field is required';
          }
        }
      }

      setState((prev) => ({
        ...prev,
        errors,
        isValid: Object.keys(errors).length === 0,
      }));

      return Object.keys(errors).length === 0;
    },

    submit: async () => {
      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const isValid = actions.validate();
        if (!isValid) {
          return;
        }

        await onSubmit?.(state.values);
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
  }), [initialValues, onChange, onSubmit, state.values, template.flatElements]);

  // Context value
  const contextValue = React.useMemo<FormContextValue>(() => ({
    state,
    actions,
    template,
  }), [state, actions, template]);

  // Render UI tree
  const formContent = (
    <div className="space-y-6">
      {renderNode(uiTree.root, { state, actions, disabled, language })}
    </div>
  );

  return (
    <FormContext.Provider value={contextValue}>
      {renderWrapper ? renderWrapper({ children: formContent, state }) : formContent}
    </FormContext.Provider>
  );
}

// =============================================================================
// NODE RENDERER
// =============================================================================

interface RenderContext {
  state: FormState;
  actions: FormActions;
  disabled: boolean;
  language: string;
}

function renderNode(node: UINode, context: RenderContext): React.ReactNode {
  // Get component - using any to handle dynamic component lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = getComponent(node.component) as React.ComponentType<any>;
  const path = (node.props.path as string[]) || [];
  const pathKey = pathToKey(path);

  // Build component props - spread node.props which includes idShort, path, etc.
  const componentProps = {
    ...node.props,
    value: context.state.values[pathKey],
    error: context.state.errors[pathKey],
    disabled: context.disabled || (node.props.disabled as boolean),
    onChange: (value: unknown) => context.actions.setValue(path, value),
    onBlur: () => context.actions.setTouched(path),
  };

  // Render children for container components
  if (node.children && node.children.length > 0) {
    const children = node.children.map((child, index) => (
      <React.Fragment key={child.props.idShort as string || index}>
        {renderNode(child, context)}
      </React.Fragment>
    ));

    return <Component {...componentProps}>{children}</Component>;
  }

  return <Component {...componentProps} />;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get a specific field's value and handlers
 */
export function useField(path: string[]) {
  const { state, actions } = useFormContext();
  const pathKey = pathToKey(path);

  return {
    value: state.values[pathKey],
    error: state.errors[pathKey],
    touched: state.touched[pathKey],
    setValue: (value: unknown) => actions.setValue(path, value),
    setError: (error: string | undefined) => actions.setError(path, error),
    setTouched: () => actions.setTouched(path),
  };
}

/**
 * Hook to get form submission state
 */
export function useFormSubmit() {
  const { state, actions } = useFormContext();

  return {
    isSubmitting: state.isSubmitting,
    isDirty: state.isDirty,
    isValid: state.isValid,
    submit: actions.submit,
    reset: actions.reset,
    validate: actions.validate,
  };
}
