/**
 * Template Fetcher Service
 * Fetches IDTA Submodel Templates from GitHub or local cache
 */

import type { Environment, Submodel } from '@/types/aas';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/admin-shell-io/submodel-templates/main';
const GITHUB_API_BASE = 'https://api.github.com/repos/admin-shell-io/submodel-templates';

type GitHubTreeItem = {
  path: string;
  type: 'blob' | 'tree';
};

type GitHubTreeResponse = {
  tree: GitHubTreeItem[];
};

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
const templateListCache: {
  value: TemplateCatalogEntry[] | null;
  inflight: Promise<TemplateCatalogEntry[]> | null;
} = {
  value: null,
  inflight: null,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.json$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTemplateIdShort(fileName: string): string {
  const base = fileName.replace(/\.json$/i, '');
  const match = /template[_\s]+(.+)$/i.exec(base);
  if (match?.[1]) {
    return cleanLabel(match[1]);
  }
  return cleanLabel(base);
}

function extractVersionSegments(segments: string[]) {
  const numericSegments: string[] = [];
  let idx = segments.length - 1;
  while (idx >= 0 && /^\d+$/.test(segments[idx])) {
    numericSegments.unshift(segments[idx]);
    idx -= 1;
  }

  return {
    nameSegments: segments.slice(0, idx + 1),
    numericSegments,
  };
}

function buildTemplateEntryFromPath(path: string): TemplateCatalogEntry | null {
  const normalizedPath = path.replace(/\\/g, '/');
  if (!normalizedPath.toLowerCase().endsWith('.json')) return null;
  if (!/template/i.test(normalizedPath)) return null;
  if (
    !(
      normalizedPath.startsWith('published/') ||
      normalizedPath.startsWith('deprecated/')
    )
  ) {
    return null;
  }

  const segments = normalizedPath.split('/');
  if (segments.length < 2) return null;

  const status = segments[0];
  const fileName = segments[segments.length - 1];
  const folderSegments = segments.slice(1, -1);
  const { nameSegments, numericSegments } =
    extractVersionSegments(folderSegments);
  const baseName = nameSegments.length
    ? nameSegments.join(' / ')
    : fileName;
  const name = cleanLabel(baseName) || cleanLabel(fileName);
  const versionLabel = numericSegments.length
    ? numericSegments.join('.')
    : '1';
  const version = versionLabel;
  const revision = numericSegments[1] ?? '0';
  const idShort = extractTemplateIdShort(fileName) || name;
  const category = status === 'deprecated' ? 'Deprecated' : 'Published';

  return {
    id: slugify(normalizedPath),
    idShort,
    name,
    version,
    revision,
    semanticId: '',
    path: normalizedPath,
    description:
      status === 'deprecated'
        ? 'Deprecated IDTA template (no longer maintained).'
        : 'Published IDTA template.',
    category,
  };
}

async function fetchTemplateCatalogFromGitHub(): Promise<TemplateCatalogEntry[]> {
  const response = await fetch(`${GITHUB_API_BASE}/git/trees/main?recursive=1`, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to list templates from GitHub: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as GitHubTreeResponse;
  const entries = data.tree
    .filter((item) => item.type === 'blob')
    .map((item) => buildTemplateEntryFromPath(item.path))
    .filter((item): item is TemplateCatalogEntry => Boolean(item));

  return entries;
}

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
  const templates = await listTemplates();
  const info = templates.find((t) => t.id === id || t.idShort === id);
  if (!info) {
    throw new Error(
      `Unknown template ID: ${id}. Available: ${templates
        .map((t) => t.id)
        .join(', ')}`
    );
  }
  return fetchTemplateFromGitHub(info.path);
}

/**
 * Fetch a template by its semantic ID
 */
export async function fetchTemplateBySemanticId(semanticId: string): Promise<Environment> {
  const templates = await listTemplates();
  const info = templates.find((t) => t.semanticId === semanticId);
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
export async function listTemplates(): Promise<TemplateCatalogEntry[]> {
  if (templateListCache.value) return templateListCache.value;
  if (templateListCache.inflight) return templateListCache.inflight;

  templateListCache.inflight = (async () => {
    try {
      const remoteTemplates = await fetchTemplateCatalogFromGitHub();
      const seenIds = new Set(IDTA_TEMPLATES.map((template) => template.id));
      const seenPaths = new Set(IDTA_TEMPLATES.map((template) => template.path));

      const merged = [...IDTA_TEMPLATES];
      for (const template of remoteTemplates) {
        if (seenIds.has(template.id) || seenPaths.has(template.path)) continue;
        merged.push(template);
      }

      merged.sort((a, b) => a.name.localeCompare(b.name));
      templateListCache.value = merged;
      return merged;
    } catch (error) {
      console.warn('Falling back to built-in templates:', error);
      templateListCache.value = IDTA_TEMPLATES;
      return IDTA_TEMPLATES;
    } finally {
      templateListCache.inflight = null;
    }
  })();

  return templateListCache.inflight;
}

/**
 * Get template info by ID
 */
export async function getTemplateInfo(id: string): Promise<TemplateInfo | undefined> {
  const templates = await listTemplates();
  return templates.find((t) => t.id === id || t.idShort === id);
}

/**
 * Clear the template cache
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  templateListCache.value = null;
  templateListCache.inflight = null;
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
