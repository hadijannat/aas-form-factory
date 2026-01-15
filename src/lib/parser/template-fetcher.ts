/**
 * Template Fetcher Service
 * Fetches IDTA Submodel Templates from GitHub or local cache
 */

import type { Environment, Submodel } from '@/types/aas';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/admin-shell-io/submodel-templates/main';

/**
 * Template metadata for known IDTA templates
 */
export interface TemplateInfo {
  id: string;
  name: string;
  version: string;
  revision: string;
  semanticId: string;
  path: string;
  description: string;
  category?: string;
}

/**
 * Extended template info for UI components (template catalog entries)
 */
export interface TemplateCatalogEntry extends TemplateInfo {
  idShort: string;
}

// Alias for backwards compatibility
export type { TemplateCatalogEntry as TemplateListItem };

/**
 * Known IDTA Submodel Templates with their GitHub paths
 */
export const IDTA_TEMPLATES: TemplateCatalogEntry[] = [
  {
    id: 'digital-nameplate',
    idShort: 'Nameplate',
    name: 'Digital Nameplate',
    version: '2',
    revision: '0',
    semanticId: 'https://admin-shell.io/idta/nameplate/2/0/Nameplate',
    path: 'deprecated/Digital nameplate/2/0/IDTA 02006-2-0_Template_Digital Nameplate.json',
    description: 'Provides basic product identification information (manufacturer, serial number, etc.)',
    category: 'Identification',
  },
  {
    id: 'contact-information',
    idShort: 'ContactInformation',
    name: 'Contact Information',
    version: '1',
    revision: '0',
    semanticId: 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformation',
    path: 'published/Contact Information/1/0/IDTA 02002-1-0_Template_ContactInformation.json',
    description: 'Contact details for manufacturer or service provider',
    category: 'Identification',
  },
  {
    id: 'technical-data',
    idShort: 'TechnicalData',
    name: 'Technical Data',
    version: '1',
    revision: '2',
    semanticId: 'https://admin-shell.io/ZVEI/TechnicalData/1/2',
    path: 'published/Technical_Data/1/2/IDTA_02003-1-2_Template_TechnicalData.json',
    description: 'Technical specifications and characteristics of an asset',
    category: 'Technical',
  },
  {
    id: 'handover-documentation',
    idShort: 'HandoverDocumentation',
    name: 'Handover Documentation',
    version: '1',
    revision: '2',
    semanticId: 'https://admin-shell.io/VDMA/HandoverDocumentation/1/2',
    path: 'deprecated/Handover Documentation/1/2/IDTA 02004-1-2_Template_Handover Documentation.json',
    description: 'Documentation package for asset handover',
    category: 'Documentation',
  },
  {
    id: 'carbon-footprint',
    idShort: 'CarbonFootprint',
    name: 'Carbon Footprint',
    version: '1',
    revision: '0',
    semanticId: 'https://admin-shell.io/idta/CarbonFootprint/1/0',
    path: 'published/Carbon Footprint/1/0/IDTA 02023 _Template_CarbonFootprint.json',
    description: 'Product carbon footprint information for sustainability reporting',
    category: 'Sustainability',
  },
  {
    id: 'bill-of-material',
    idShort: 'BillOfMaterial',
    name: 'Bill of Material',
    version: '1',
    revision: '0',
    semanticId: 'https://admin-shell.io/idta/BillOfMaterial/1/0',
    path: 'published/Bill of Material/1/0/IDTA 02028-1-0_Template_BillOfMaterial.json',
    description: 'Hierarchical bill of material structure',
    category: 'Technical',
  },
];

/**
 * In-memory cache for fetched templates
 */
const templateCache = new Map<string, Environment>();

/**
 * Fetch a template from GitHub by its file path
 */
export async function fetchTemplateFromGitHub(templatePath: string): Promise<Environment> {
  // Check cache first
  if (templateCache.has(templatePath)) {
    return templateCache.get(templatePath)!;
  }

  const url = `${GITHUB_RAW_BASE}/${encodeURIComponent(templatePath).replace(/%2F/g, '/')}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'force-cache', // Use browser/server cache when possible
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch template from GitHub: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Environment;

  // Cache the result
  templateCache.set(templatePath, data);

  return data;
}

/**
 * Fetch a template by its ID
 */
export async function fetchTemplateById(id: string): Promise<Environment> {
  const info = IDTA_TEMPLATES.find((t) => t.id === id);
  if (!info) {
    throw new Error(`Unknown template ID: ${id}. Available: ${IDTA_TEMPLATES.map((t) => t.id).join(', ')}`);
  }
  return fetchTemplateFromGitHub(info.path);
}

/**
 * Fetch a template by its semantic ID
 */
export async function fetchTemplateBySemanticId(semanticId: string): Promise<Environment> {
  const info = IDTA_TEMPLATES.find((t) => t.semanticId === semanticId);
  if (!info) {
    throw new Error(`Unknown template semantic ID: ${semanticId}`);
  }
  return fetchTemplateFromGitHub(info.path);
}

/**
 * Extract the primary submodel from an environment
 */
export function extractSubmodel(env: Environment): Submodel {
  const submodel = env.submodels?.[0];
  if (!submodel) {
    throw new Error('No submodel found in environment');
  }
  return submodel;
}

/**
 * List all available template metadata
 */
export function listTemplates(): TemplateCatalogEntry[] {
  return IDTA_TEMPLATES;
}

/**
 * Get template info by ID
 */
export function getTemplateInfo(id: string): TemplateInfo | undefined {
  return IDTA_TEMPLATES.find((t) => t.id === id);
}

/**
 * Clear the template cache
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

/**
 * Load a template from a local JSON file (for custom templates)
 */
export async function loadTemplateFromFile(file: globalThis.File): Promise<Environment> {
  const text = await file.text();
  try {
    return JSON.parse(text) as Environment;
  } catch {
    throw new Error('Invalid JSON file: unable to parse template');
  }
}

/**
 * Validate that a JSON object is a valid AAS Environment
 */
export function validateEnvironment(data: unknown): data is Environment {
  if (!data || typeof data !== 'object') return false;

  const env = data as Record<string, unknown>;

  // Must have at least one of these arrays
  const hasShells = Array.isArray(env.assetAdministrationShells);
  const hasSubmodels = Array.isArray(env.submodels);
  const hasConcepts = Array.isArray(env.conceptDescriptions);

  return hasShells || hasSubmodels || hasConcepts;
}
