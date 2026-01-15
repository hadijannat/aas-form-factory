/**
 * BaSyx AAS API Client
 * Communicates with BaSyx AAS Environment REST API
 */

import type {
  Submodel,
  Environment,
  AssetAdministrationShell,
  ConceptDescription,
} from '@/types/aas';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface BaSyxConfig {
  /** Base URL for AAS Environment (default: http://localhost:4001) */
  environmentUrl?: string;
  /** Base URL for AAS Registry (default: http://localhost:4000) */
  registryUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

const DEFAULT_CONFIG: Required<BaSyxConfig> = {
  environmentUrl: 'http://localhost:4001',
  registryUrl: 'http://localhost:4000',
  timeout: 30000,
};

// =============================================================================
// CLIENT CLASS
// =============================================================================

export class BaSyxClient {
  private config: Required<BaSyxConfig>;

  constructor(config: BaSyxConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // SUBMODEL OPERATIONS
  // ===========================================================================

  /**
   * List all submodels
   */
  async listSubmodels(): Promise<Submodel[]> {
    const response = await this.fetch('/submodels');
    const data = await this.parseJson<unknown>(response);
    // BaSyx returns paginated result
    if (!data) {
      return [];
    }
    return (data as { result?: Submodel[] }).result || (data as Submodel[]);
  }

  /**
   * Get a submodel by ID (base64 encoded)
   */
  async getSubmodel(id: string): Promise<Submodel> {
    const encodedId = base64UrlEncode(id);
    const response = await this.fetch(`/submodels/${encodedId}`);
    const data = await this.parseJson<Submodel>(response);
    if (!data) {
      throw new Error('Empty response when fetching submodel');
    }
    return data;
  }

  /**
   * Get a submodel by semantic ID
   */
  async getSubmodelBySemanticId(semanticId: string): Promise<Submodel | null> {
    const submodels = await this.listSubmodels();
    return submodels.find((sm) => {
      const smSemanticId = sm.semanticId?.keys?.[0]?.value;
      return smSemanticId === semanticId;
    }) || null;
  }

  /**
   * Create a new submodel
   */
  async createSubmodel(submodel: Submodel): Promise<Submodel> {
    const response = await this.fetch('/submodels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submodel),
    });
    const data = await this.parseJson<Submodel>(response);
    if (data) {
      return data;
    }
    return this.getSubmodel(submodel.id);
  }

  /**
   * Update an existing submodel
   */
  async updateSubmodel(submodel: Submodel): Promise<Submodel> {
    const encodedId = base64UrlEncode(submodel.id);
    const response = await this.fetch(`/submodels/${encodedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submodel),
    });
    const data = await this.parseJson<Submodel>(response);
    if (data) {
      return data;
    }
    return this.getSubmodel(submodel.id);
  }

  /**
   * Delete a submodel
   */
  async deleteSubmodel(id: string): Promise<void> {
    const encodedId = base64UrlEncode(id);
    await this.fetch(`/submodels/${encodedId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Create or update a submodel (upsert)
   */
  async saveSubmodel(submodel: Submodel): Promise<Submodel> {
    try {
      // Try to get existing
      await this.getSubmodel(submodel.id);
      // If exists, update
      return await this.updateSubmodel(submodel);
    } catch (error) {
      // If not found, create
      if (error instanceof BaSyxError && error.status === 404) {
        return await this.createSubmodel(submodel);
      }
      throw error;
    }
  }

  // ===========================================================================
  // AAS SHELL OPERATIONS
  // ===========================================================================

  /**
   * List all AAS shells
   */
  async listShells(): Promise<AssetAdministrationShell[]> {
    const response = await this.fetch('/shells');
    const data = await this.parseJson<unknown>(response);
    if (!data) {
      return [];
    }
    return (data as { result?: AssetAdministrationShell[] }).result || (data as AssetAdministrationShell[]);
  }

  /**
   * Get an AAS shell by ID
   */
  async getShell(id: string): Promise<AssetAdministrationShell> {
    const encodedId = base64UrlEncode(id);
    const response = await this.fetch(`/shells/${encodedId}`);
    const data = await this.parseJson<AssetAdministrationShell>(response);
    if (!data) {
      throw new Error('Empty response when fetching shell');
    }
    return data;
  }

  /**
   * Create a new AAS shell
   */
  async createShell(shell: AssetAdministrationShell): Promise<AssetAdministrationShell> {
    const response = await this.fetch('/shells', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shell),
    });
    const data = await this.parseJson<AssetAdministrationShell>(response);
    if (data) {
      return data;
    }
    return this.getShell(shell.id);
  }

  // ===========================================================================
  // CONCEPT DESCRIPTION OPERATIONS
  // ===========================================================================

  /**
   * List all concept descriptions
   */
  async listConceptDescriptions(): Promise<ConceptDescription[]> {
    const response = await this.fetch('/concept-descriptions');
    const data = await this.parseJson<unknown>(response);
    if (!data) {
      return [];
    }
    return (data as { result?: ConceptDescription[] }).result || (data as ConceptDescription[]);
  }

  /**
   * Get a concept description by ID
   */
  async getConceptDescription(id: string): Promise<ConceptDescription> {
    const encodedId = base64UrlEncode(id);
    const response = await this.fetch(`/concept-descriptions/${encodedId}`);
    const data = await this.parseJson<ConceptDescription>(response);
    if (!data) {
      throw new Error('Empty response when fetching concept description');
    }
    return data;
  }

  // ===========================================================================
  // ENVIRONMENT OPERATIONS
  // ===========================================================================

  /**
   * Get the full AAS environment
   */
  async getEnvironment(): Promise<Environment> {
    const [shells, submodels, conceptDescriptions] = await Promise.all([
      this.listShells(),
      this.listSubmodels(),
      this.listConceptDescriptions(),
    ]);

    return {
      assetAdministrationShells: shells,
      submodels,
      conceptDescriptions,
    };
  }

  /**
   * Upload a complete environment
   */
  async uploadEnvironment(environment: Environment): Promise<void> {
    const response = await this.fetch('/serialization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(environment),
    });

    if (!response.ok) {
      throw new BaSyxError('Failed to upload environment', response.status);
    }
  }

  // ===========================================================================
  // REGISTRY OPERATIONS
  // ===========================================================================

  /**
   * List all registered AAS descriptors from registry
   */
  async listRegisteredShells(): Promise<unknown[]> {
    const response = await this.fetchRegistry('/shell-descriptors');
    const data = await this.parseJson<unknown>(response);
    if (!data) {
      return [];
    }
    return (data as { result?: unknown[] }).result || (data as unknown[]);
  }

  /**
   * Check if registry is healthy
   */
  async checkRegistryHealth(): Promise<boolean> {
    try {
      const response = await this.fetchRegistry('/shell-descriptors', {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // HEALTH CHECK
  // ===========================================================================

  /**
   * Check if BaSyx environment is healthy
   */
  async checkHealth(): Promise<{
    environment: boolean;
    registry: boolean;
  }> {
    const [envHealth, regHealth] = await Promise.all([
      this.checkEnvironmentHealth(),
      this.checkRegistryHealth(),
    ]);

    return {
      environment: envHealth,
      registry: regHealth,
    };
  }

  /**
   * Check if environment API is healthy
   */
  async checkEnvironmentHealth(): Promise<boolean> {
    try {
      const response = await this.fetch('/submodels', { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // INTERNAL HELPERS
  // ===========================================================================

  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.environmentUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new BaSyxError(
          `BaSyx API error: ${response.statusText} - ${errorText}`,
          response.status
        );
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchRegistry(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.registryUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseJson<T>(response: Response): Promise<T | undefined> {
    const text = await response.text();
    if (!text.trim()) {
      return undefined;
    }
    return JSON.parse(text) as T;
  }
}

// =============================================================================
// ERROR CLASS
// =============================================================================

export class BaSyxError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'BaSyxError';
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Base64 URL encode a string (for AAS IDs in URLs)
 */
export function base64UrlEncode(str: string): string {
  if (typeof window !== 'undefined') {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64 URL decode a string
 */
export function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);

  if (typeof window !== 'undefined') {
    return atob(base64 + padding);
  }
  return Buffer.from(base64 + padding, 'base64').toString();
}

// =============================================================================
// DEFAULT INSTANCE
// =============================================================================

/** Default BaSyx client instance */
export const basyxClient = new BaSyxClient();
