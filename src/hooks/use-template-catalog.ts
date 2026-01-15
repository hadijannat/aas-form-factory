/**
 * Template catalog hook
 * Centralized loader for IDTA template metadata
 */

'use client';

import * as React from 'react';
import {
  listTemplates,
  type TemplateCatalogEntry,
} from '@/lib/parser/template-fetcher';

export function useTemplateCatalog() {
  const [templates, setTemplates] = React.useState<TemplateCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const templateList = await listTemplates();
        if (isMounted) {
          setTemplates(templateList);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to load templates')
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { templates, isLoading, error };
}
