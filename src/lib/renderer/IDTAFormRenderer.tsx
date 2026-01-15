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
import {
  addArrayItem as addArrayItemState,
  deriveArrayItems,
  ensureMinArrayItems,
  removeArrayItem as removeArrayItemState,
  removeArrayValues,
  reorderArrayItems,
  type ArrayItemsMap,
} from './array-state';
import {
  hasValueWithPrefix,
  isEmptyValue,
  stripNumericSegments,
  stripNumericSegmentsFromKey,
  validateValue,
} from './validation';

// =============================================================================
// FORM STATE TYPES
// =============================================================================

export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  arrayItems: ArrayItemsMap;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}

export interface FormActions {
  setValue: (path: string[], value: unknown) => void;
  setError: (path: string[], error: string | undefined) => void;
  setTouched: (path: string[]) => void;
  addArrayItem: (path: string[]) => void;
  removeArrayItem: (path: string[], position: number) => void;
  reorderArrayItem: (path: string[], fromPosition: number, toPosition: number) => void;
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
    arrayItems: {},
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
  /** Called with form actions for external triggers (export/validation) */
  onActionsReady?: (actions: FormActions) => void;
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
  onActionsReady,
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
    arrayItems: deriveArrayItems(initialValues),
  }));

  // Ensure required arrays have minimum items
  React.useEffect(() => {
    setState((prev) => {
      const minByPath: Record<string, number> = {};
      for (const element of template.flatElements.values()) {
        if (!element.isArray) continue;
        minByPath[element.pathString] = element.isRequired ? 1 : 0;
      }

      const nextArrayItems = ensureMinArrayItems(prev.arrayItems, minByPath);
      if (nextArrayItems === prev.arrayItems) return prev;

      return {
        ...prev,
        arrayItems: nextArrayItems,
      };
    });
  }, [template]);

  // Actions
  const actions = React.useMemo<FormActions>(() => ({
    setValue: (path, value) => {
      setState((prev) => {
        const key = pathToKey(path);
        const newValues = { ...prev.values, [key]: value };
        const basePath = stripNumericSegments(path);
        const element = template.flatElements.get(pathToKey(basePath));
        const fieldError = element ? validateValue(element, value) : undefined;
        const newErrors = { ...prev.errors };
        if (fieldError) {
          newErrors[key] = fieldError;
        } else {
          delete newErrors[key];
        }
        onChange?.(newValues);
        return {
          ...prev,
          values: newValues,
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0,
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

    addArrayItem: (path) => {
      const pathKey = pathToKey(path);
      setState((prev) => {
        return {
          ...prev,
          arrayItems: addArrayItemState(prev.arrayItems, pathKey),
          isDirty: true,
        };
      });
    },

    removeArrayItem: (path, position) => {
      const pathKey = pathToKey(path);
      setState((prev) => {
        const result = removeArrayItemState(prev.arrayItems, pathKey, position);
        if (result.removedIndex === null) return prev;
        const cleaned = removeArrayValues(
          prev.values,
          prev.errors,
          prev.touched,
          pathKey,
          result.removedIndex
        );

        return {
          ...prev,
          values: cleaned.values,
          errors: cleaned.errors,
          touched: cleaned.touched,
          arrayItems: result.arrayItems,
          isDirty: true,
        };
      });
    },

    reorderArrayItem: (path, fromPosition, toPosition) => {
      const pathKey = pathToKey(path);
      setState((prev) => {
        return {
          ...prev,
          arrayItems: reorderArrayItems(prev.arrayItems, pathKey, fromPosition, toPosition),
          isDirty: true,
        };
      });
    },

    reset: () => {
      setState({
        ...createInitialState(),
        values: initialValues,
        arrayItems: deriveArrayItems(initialValues),
      });
    },

    validate: () => {
      const errors: Record<string, string> = {};

      // Validate existing values
      for (const [key, value] of Object.entries(state.values)) {
        const baseKey = stripNumericSegmentsFromKey(key);
        const element = template.flatElements.get(baseKey);
        if (!element) continue;
        const error = validateValue(element, value);
        if (error) {
          errors[key] = error;
        }
      }

      // Required checks
      for (const element of template.flatElements.values()) {
        if (!element.isRequired) continue;
        const pathKey = element.pathString;

        if (element.inputType === 'list' || element.isArray) {
          const count = state.arrayItems[pathKey]?.length ?? 0;
          if (count === 0) {
            errors[pathKey] = 'At least one item is required';
          }
          continue;
        }

        if (['collection', 'entity'].includes(element.inputType)) {
          if (!hasValueWithPrefix(state.values, pathKey)) {
            errors[pathKey] = 'This section is required';
          }
          continue;
        }

        const value = state.values[pathKey];
        if (isEmptyValue(value)) {
          errors[pathKey] = 'This field is required';
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
  }), [initialValues, onChange, onSubmit, state.arrayItems, state.values, template.flatElements]);

  React.useEffect(() => {
    onActionsReady?.(actions);
  }, [actions, onActionsReady]);

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

function applyArrayIndex(
  node: UINode,
  arrayPath: string[],
  index: number
): UINode {
  const nodePath = node.props.path as string[] | undefined;
  let nextPath = nodePath;

  if (nodePath && nodePath.length >= arrayPath.length) {
    const prefix = nodePath.slice(0, arrayPath.length).join('.');
    const arrayKey = arrayPath.join('.');
    if (prefix === arrayKey) {
      nextPath = [...arrayPath, String(index), ...nodePath.slice(arrayPath.length)];
    }
  }

  return {
    ...node,
    props: { ...node.props, path: nextPath },
    children: node.children?.map((child) => applyArrayIndex(child, arrayPath, index)),
  };
}

function renderNode(node: UINode, context: RenderContext): React.ReactNode {
  // Dynamic component lookup - props are shaped per component registry entry
  const Component = getComponent(node.component) as unknown as React.ComponentType<Record<string, unknown>>;
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

  // Special handling for ArrayContainer
  if (node.component === 'ArrayContainer') {
    const indices = context.state.arrayItems[pathKey] ?? [];
    const arrayPath = path;
    const templateNode = node.children?.[0];
    const items = templateNode
      ? indices.map((index) => {
          const indexedNode = applyArrayIndex(templateNode, arrayPath, index);
          return renderNode(indexedNode, context);
        })
      : [];

    return (
      <Component
        {...componentProps}
        items={items}
        onAdd={() => context.actions.addArrayItem(arrayPath)}
        onRemove={(position: number) => context.actions.removeArrayItem(arrayPath, position)}
        onReorder={(from: number, to: number) =>
          context.actions.reorderArrayItem(arrayPath, from, to)
        }
      />
    );
  }

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
