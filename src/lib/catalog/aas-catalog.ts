/**
 * AAS Form Catalog for json-render
 * Defines all form components for rendering IDTA Submodel Templates
 */

import { createCatalog } from '@json-render/core';
import * as z from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

const langStringSchema = z.object({
  language: z.string().min(2).max(5),
  text: z.string(),
});

const referenceSchema = z.object({
  type: z.enum(['ExternalReference', 'ModelReference']),
  keys: z.array(
    z.object({
      type: z.string(),
      value: z.string(),
    })
  ),
});

// Base props shared by most AAS form components
const basePropsSchema = z.object({
  idShort: z.string(),
  path: z.array(z.string()),
  semanticId: z.string().optional(),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  description: z.record(z.string(), z.string()).optional(),
  displayName: z.record(z.string(), z.string()).optional(),
  exampleValue: z.string().optional(),
});

// Action schema for buttons
const actionSchema = z.object({
  name: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// CATALOG DEFINITION
// =============================================================================

export const aasFormCatalog = createCatalog({
  name: 'AAS Form Components',

  components: {
    // =========================================================================
    // INPUT COMPONENTS
    // =========================================================================

    TextInput: {
      props: basePropsSchema.extend({
        value: z.string().optional(),
        placeholder: z.string().optional(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        pattern: z.string().optional(),
        multiline: z.boolean().default(false),
        rows: z.number().default(3),
      }),
      description: 'Single or multi-line text input for xs:string properties',
    },

    NumberInput: {
      props: basePropsSchema.extend({
        value: z.number().optional(),
        valueType: z.enum(['integer', 'decimal']).default('decimal'),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().optional(),
        unit: z.string().optional(),
      }),
      description: 'Numeric input with optional unit display and min/max constraints',
    },

    URLInput: {
      props: basePropsSchema.extend({
        value: z.string().optional(),
        placeholder: z.string().default('https://...'),
        validateUrl: z.boolean().default(true),
      }),
      description: 'URL input with validation for xs:anyURI properties',
    },

    DateInput: {
      props: basePropsSchema.extend({
        value: z.string().optional(),
        min: z.string().optional(),
        max: z.string().optional(),
        includeTime: z.boolean().default(false),
      }),
      description: 'Date/datetime picker for xs:date and xs:dateTime properties',
    },

    BooleanInput: {
      props: basePropsSchema.extend({
        value: z.boolean().default(false),
        label: z.string().optional(),
        variant: z.enum(['checkbox', 'switch', 'radio']).default('checkbox'),
      }),
      description: 'Boolean toggle for xs:boolean properties',
    },

    SelectInput: {
      props: basePropsSchema.extend({
        value: z.string().optional(),
        options: z.array(
          z.object({
            value: z.string(),
            label: z.string(),
            description: z.string().optional(),
          })
        ),
        searchable: z.boolean().default(false),
        multiple: z.boolean().default(false),
        allowCustom: z.boolean().default(false),
      }),
      description: 'Dropdown select for ECLASS value lists or enumerated values',
    },

    // =========================================================================
    // COMPLEX INPUT COMPONENTS
    // =========================================================================

    MultiLanguageInput: {
      props: basePropsSchema.extend({
        value: z.array(langStringSchema).default([]),
        supportedLanguages: z.array(z.string()).default(['en', 'de']),
        primaryLanguage: z.string().default('en'),
      }),
      description: 'Multi-language text editor with language tabs for MLP elements',
    },

    RangeInput: {
      props: basePropsSchema.extend({
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
        valueType: z.enum(['integer', 'decimal']).default('decimal'),
        unit: z.string().optional(),
        minLabel: z.string().default('Min'),
        maxLabel: z.string().default('Max'),
      }),
      description: 'Dual min/max input for Range elements',
    },

    FileInput: {
      props: basePropsSchema.extend({
        value: z.string().optional(),
        contentType: z.string().optional(),
        accept: z.string().optional(),
        maxSize: z.number().optional(),
        showPreview: z.boolean().default(true),
      }),
      description: 'File upload with type validation and preview for File elements',
    },

    BlobInput: {
      props: basePropsSchema.extend({
        value: z.string().optional(), // Base64 encoded
        contentType: z.string().optional(),
        maxSize: z.number().optional(),
      }),
      description: 'Binary data input for Blob elements',
    },

    ReferenceInput: {
      props: basePropsSchema.extend({
        value: referenceSchema.optional(),
        allowedTypes: z.array(z.string()).optional(),
        searchEndpoint: z.string().optional(),
        placeholder: z.string().default('Select reference...'),
      }),
      description: 'AAS reference selector with search for ReferenceElement',
    },

    // =========================================================================
    // CONTAINER COMPONENTS
    // =========================================================================

    SMCContainer: {
      props: basePropsSchema.extend({
        collapsed: z.boolean().default(false),
        collapsible: z.boolean().default(true),
        variant: z.enum(['card', 'fieldset', 'section']).default('card'),
        level: z.number().default(0),
      }),
      hasChildren: true,
      description: 'Container for SubmodelElementCollection with collapsible header',
    },

    ArrayContainer: {
      props: basePropsSchema.extend({
        minItems: z.number().default(0),
        maxItems: z.number().optional(),
        allowReorder: z.boolean().default(true),
        itemLabel: z.string().optional(),
        addLabel: z.string().default('Add Item'),
      }),
      hasChildren: true,
      description: 'Repeatable array container for *ToMany cardinalities',
    },

    FormSection: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        icon: z.string().optional(),
        collapsed: z.boolean().default(false),
        collapsible: z.boolean().default(true),
      }),
      hasChildren: true,
      description: 'Form section with header for grouping elements',
    },

    FormGrid: {
      props: z.object({
        columns: z.number().default(1),
        gap: z.enum(['sm', 'md', 'lg']).default('md'),
      }),
      hasChildren: true,
      description: 'Responsive grid layout for form elements',
    },

    EntityContainer: {
      props: basePropsSchema.extend({
        entityType: z.enum(['CoManagedEntity', 'SelfManagedEntity']),
        globalAssetId: z.string().optional(),
      }),
      hasChildren: true,
      description: 'Container for Entity elements with asset ID',
    },

    // =========================================================================
    // DISPLAY COMPONENTS
    // =========================================================================

    ReadOnlyValue: {
      props: basePropsSchema.extend({
        value: z.union([z.string(), z.number(), z.boolean()]).optional(),
        format: z.string().optional(),
        copyable: z.boolean().default(false),
      }),
      description: 'Read-only value display with optional copy button',
    },

    SemanticIdBadge: {
      props: z.object({
        semanticId: z.string(),
        showTooltip: z.boolean().default(true),
        variant: z.enum(['badge', 'link', 'text']).default('badge'),
      }),
      description: 'Semantic ID display badge with ECLASS/IEC CDD lookup',
    },

    ValidationMessage: {
      props: z.object({
        type: z.enum(['error', 'warning', 'info', 'success']),
        message: z.string(),
        path: z.array(z.string()).optional(),
      }),
      description: 'Form validation message display',
    },

    EmptyState: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        action: actionSchema.optional(),
      }),
      description: 'Empty state placeholder for arrays or optional sections',
    },

    // =========================================================================
    // ACTION COMPONENTS
    // =========================================================================

    SubmitButton: {
      props: z.object({
        label: z.string().default('Save'),
        loadingLabel: z.string().default('Saving...'),
        variant: z.enum(['primary', 'secondary', 'outline']).default('primary'),
        size: z.enum(['sm', 'md', 'lg']).default('md'),
        fullWidth: z.boolean().default(false),
        disabled: z.boolean().default(false),
      }),
      description: 'Form submit button with loading state',
    },

    ActionButton: {
      props: z.object({
        label: z.string(),
        icon: z.string().optional(),
        variant: z
          .enum(['primary', 'secondary', 'outline', 'ghost', 'destructive'])
          .default('secondary'),
        size: z.enum(['sm', 'md', 'lg']).default('md'),
        action: actionSchema,
        disabled: z.boolean().default(false),
      }),
      description: 'Generic action button for custom actions',
    },

    ExportDropdown: {
      props: z.object({
        formats: z
          .array(z.enum(['json', 'aasx', 'xml']))
          .default(['json', 'aasx']),
        label: z.string().default('Export'),
        disabled: z.boolean().default(false),
      }),
      description: 'Export dropdown with format options',
    },
  },

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  actions: {
    // Form actions
    submit: { description: 'Submit form data to create/update submodel' },
    reset: { description: 'Reset form to initial values' },
    validate: { description: 'Trigger form validation' },

    // Array actions
    addArrayItem: {
      description: 'Add new item to array',
    },
    removeArrayItem: {
      description: 'Remove item from array',
    },
    reorderArrayItem: {
      description: 'Reorder array item (move up/down)',
    },

    // UI actions
    toggleCollapse: { description: 'Toggle section collapse state' },
    expandAll: { description: 'Expand all collapsible sections' },
    collapseAll: { description: 'Collapse all sections' },

    // Export actions
    exportJson: { description: 'Export as AAS JSON file' },
    exportAasx: { description: 'Export as AASX package' },
    exportXml: { description: 'Export as AAS XML file' },

    // Clipboard actions
    copyToClipboard: { description: 'Copy value to clipboard' },
    copyJsonPath: { description: 'Copy JSON path to clipboard' },

    // Server actions
    saveToServer: { description: 'Save submodel to AAS server' },
    loadFromServer: { description: 'Load submodel from AAS server' },

    // File actions
    uploadFile: { description: 'Upload file for File/Blob element' },
    downloadFile: { description: 'Download file from File element' },
  },

  validation: 'strict',
});

// Export types derived from catalog
export type AASFormCatalog = typeof aasFormCatalog;
export type AASComponentName = keyof typeof aasFormCatalog.components;
export type AASActionName = keyof typeof aasFormCatalog.actions;
