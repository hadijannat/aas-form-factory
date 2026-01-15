/**
 * AASX Exporter
 * Creates AASX packages (OPC-based ZIP format) for AAS interchange
 */

import JSZip from 'jszip';
import type { Submodel, Environment, SubmodelElement } from '@/types/aas';

// =============================================================================
// AASX CONSTANTS
// =============================================================================

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="pdf" ContentType="application/pdf"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://www.admin-shell.io/aasx/relationships/aas-spec" Target="/aasx/aas.json"/>
</Relationships>`;

const AASX_ORIGIN = `<?xml version="1.0" encoding="UTF-8"?>
<aasorigin xmlns="http://www.admin-shell.io/aasx/1/0">
  <created>${new Date().toISOString()}</created>
  <generator>IDTA Form Studio</generator>
</aasorigin>`;

// =============================================================================
// EXPORT OPTIONS
// =============================================================================

export interface AASXExportOptions {
  /** Filename for the export (without .aasx extension) */
  filename?: string;
  /** Include thumbnail image */
  thumbnail?: Blob;
  /** Additional files to include in the package */
  supplementaryFiles?: Array<{
    path: string;
    content: Blob | string;
    contentType: string;
  }>;
  /** Pretty print JSON */
  prettyPrint?: boolean;
}

export interface AASXExportResult {
  blob: Blob;
  filename: string;
}

// =============================================================================
// MAIN EXPORTER
// =============================================================================

/**
 * Export submodel(s) to AASX package
 */
export async function exportToAASX(
  submodels: Submodel | Submodel[],
  options: AASXExportOptions = {}
): Promise<AASXExportResult> {
  const zip = new JSZip();

  // Normalize to array
  const submodelArray = Array.isArray(submodels) ? submodels : [submodels];

  // Create AAS Environment containing all submodels
  const environment: Environment = {
    assetAdministrationShells: [],
    submodels: submodelArray,
    conceptDescriptions: [],
  };

  // Add content types
  zip.file('[Content_Types].xml', CONTENT_TYPES_XML);

  // Add root relationships
  zip.file('_rels/.rels', ROOT_RELS);

  // Add AASX origin marker
  zip.file('aasx/aasx-origin', AASX_ORIGIN);

  // Add main AAS JSON file
  const jsonContent = options.prettyPrint
    ? JSON.stringify(environment, null, 2)
    : JSON.stringify(environment);
  zip.file('aasx/aas.json', jsonContent);

  // Add thumbnail if provided
  if (options.thumbnail) {
    zip.file('aasx/thumbnail.png', options.thumbnail);
  }

  // Add supplementary files
  if (options.supplementaryFiles) {
    for (const file of options.supplementaryFiles) {
      zip.file(`aasx/${file.path}`, file.content);
    }
  }

  // Generate ZIP blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // Generate filename
  const filename = options.filename
    ? `${options.filename}.aasx`
    : `${generateFilename(submodelArray)}.aasx`;

  return { blob, filename };
}

/**
 * Export environment to AASX package
 */
export async function exportEnvironmentToAASX(
  environment: Environment,
  options: AASXExportOptions = {}
): Promise<AASXExportResult> {
  const zip = new JSZip();

  // Add content types
  zip.file('[Content_Types].xml', CONTENT_TYPES_XML);

  // Add root relationships
  zip.file('_rels/.rels', ROOT_RELS);

  // Add AASX origin marker
  zip.file('aasx/aasx-origin', AASX_ORIGIN);

  // Add main AAS JSON file
  const jsonContent = options.prettyPrint
    ? JSON.stringify(environment, null, 2)
    : JSON.stringify(environment);
  zip.file('aasx/aas.json', jsonContent);

  // Add supplementary files
  if (options.supplementaryFiles) {
    for (const file of options.supplementaryFiles) {
      zip.file(`aasx/${file.path}`, file.content);
    }
  }

  // Generate ZIP blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // Generate filename
  const filename = options.filename
    ? `${options.filename}.aasx`
    : 'aas-export.aasx';

  return { blob, filename };
}

// =============================================================================
// XML EXPORT
// =============================================================================

/**
 * Export submodel to AAS XML format
 * Note: This is a simplified XML serialization. Full compliance requires
 * more sophisticated XML generation based on the official AAS schema.
 */
export function exportToXML(submodel: Submodel, prettyPrint = true): string {
  const indent = prettyPrint ? '  ' : '';
  const newline = prettyPrint ? '\n' : '';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>${newline}`;
  xml += `<environment xmlns="https://admin-shell.io/aas/3/0">${newline}`;
  xml += `${indent}<submodels>${newline}`;
  xml += serializeSubmodelToXML(submodel, prettyPrint, 2);
  xml += `${indent}</submodels>${newline}`;
  xml += `</environment>`;

  return xml;
}

function serializeSubmodelToXML(
  submodel: Submodel,
  prettyPrint: boolean,
  depth: number
): string {
  const indent = prettyPrint ? '  '.repeat(depth) : '';
  const newline = prettyPrint ? '\n' : '';

  let xml = `${indent}<submodel>${newline}`;
  xml += `${indent}  <id>${escapeXML(submodel.id)}</id>${newline}`;
  xml += `${indent}  <idShort>${escapeXML(submodel.idShort || '')}</idShort>${newline}`;

  if (submodel.semanticId) {
    xml += `${indent}  <semanticId>${newline}`;
    xml += `${indent}    <type>${submodel.semanticId.type}</type>${newline}`;
    xml += `${indent}    <keys>${newline}`;
    for (const key of submodel.semanticId.keys) {
      xml += `${indent}      <key>${newline}`;
      xml += `${indent}        <type>${key.type}</type>${newline}`;
      xml += `${indent}        <value>${escapeXML(key.value)}</value>${newline}`;
      xml += `${indent}      </key>${newline}`;
    }
    xml += `${indent}    </keys>${newline}`;
    xml += `${indent}  </semanticId>${newline}`;
  }

  if (submodel.submodelElements && submodel.submodelElements.length > 0) {
    xml += `${indent}  <submodelElements>${newline}`;
    for (const element of submodel.submodelElements) {
      xml += serializeElementToXML(element, prettyPrint, depth + 2);
    }
    xml += `${indent}  </submodelElements>${newline}`;
  }

  xml += `${indent}</submodel>${newline}`;
  return xml;
}

function serializeElementToXML(
  element: SubmodelElement,
  prettyPrint: boolean,
  depth: number
): string {
  const indent = prettyPrint ? '  '.repeat(depth) : '';
  const newline = prettyPrint ? '\n' : '';

  const tagName = element.modelType.charAt(0).toLowerCase() + element.modelType.slice(1);

  let xml = `${indent}<${tagName}>${newline}`;
  xml += `${indent}  <idShort>${escapeXML(element.idShort || '')}</idShort>${newline}`;

  if (element.modelType === 'Property') {
    xml += `${indent}  <valueType>${element.valueType}</valueType>${newline}`;
    if (element.value !== undefined) {
      xml += `${indent}  <value>${escapeXML(String(element.value))}</value>${newline}`;
    }
  }

  if (element.modelType === 'MultiLanguageProperty' && element.value) {
    xml += `${indent}  <value>${newline}`;
    for (const ls of element.value) {
      xml += `${indent}    <langStringTextType>${newline}`;
      xml += `${indent}      <language>${ls.language}</language>${newline}`;
      xml += `${indent}      <text>${escapeXML(ls.text)}</text>${newline}`;
      xml += `${indent}    </langStringTextType>${newline}`;
    }
    xml += `${indent}  </value>${newline}`;
  }

  if (element.modelType === 'SubmodelElementCollection' && element.value && Array.isArray(element.value)) {
    xml += `${indent}  <value>${newline}`;
    for (const child of element.value) {
      xml += serializeElementToXML(child, prettyPrint, depth + 2);
    }
    xml += `${indent}  </value>${newline}`;
  }

  xml += `${indent}</${tagName}>${newline}`;
  return xml;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateFilename(submodels: Submodel[]): string {
  if (submodels.length === 1) {
    const idShort = submodels[0].idShort || 'submodel';
    return sanitizeFilename(idShort);
  }
  return `aas-export-${Date.now()}`;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

// =============================================================================
// DOWNLOAD HELPERS
// =============================================================================

/**
 * Trigger browser download of AASX file
 */
export function downloadAASX(result: AASXExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser download of JSON file
 */
export function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser download of XML file
 */
export function downloadXML(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xml') ? filename : `${filename}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
