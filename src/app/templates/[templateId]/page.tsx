/**
 * Template Form Page
 * Dynamic form rendering for IDTA templates
 */

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IDTAFormRenderer } from '@/lib/renderer';
import { exportToSubmodel } from '@/lib/exporters/aas-exporter';
import { exportToAASX } from '@/lib/exporters/aasx-exporter';
import { parseSubmodelTemplate } from '@/lib/parser/template-parser';
import {
  listTemplates,
  fetchTemplateById,
  extractSubmodel,
  type TemplateCatalogEntry,
} from '@/lib/parser/template-fetcher';
import type { Submodel } from '@/types/aas';

// =============================================================================
// ICONS
// =============================================================================

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  // State
  const [templates, setTemplates] = React.useState<TemplateCatalogEntry[]>([]);
  const [submodel, setSubmodel] = React.useState<Submodel | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [isSaving, setIsSaving] = React.useState(false);

  // Load all templates for sidebar
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = listTemplates();
        setTemplates(templateList);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    loadTemplates();
  }, []);

  // Load the selected template
  React.useEffect(() => {
    const loadTemplate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const environment = await fetchTemplateById(templateId);
        const sm = extractSubmodel(environment);
        setSubmodel(sm);
      } catch (err) {
        console.error('Failed to load template:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  // Check BaSyx connection
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/submodels');
        setConnectionStatus(response.ok ? 'connected' : 'disconnected');
      } catch {
        setConnectionStatus('disconnected');
      }
    };
    checkConnection();
  }, []);

  // Handle form value changes
  const handleFormChange = React.useCallback((values: Record<string, unknown>) => {
    setFormValues(values);
  }, []);

  // Export to JSON
  const handleExportJSON = React.useCallback(() => {
    if (!submodel) return;

    try {
      const template = parseSubmodelTemplate(submodel);
      const result = exportToSubmodel(template, formValues, {
        prettyPrint: true,
        generateIds: true,
      });

      // Download the JSON
      const blob = new Blob([result.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${submodel.idShort || 'submodel'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [submodel, formValues]);

  // Export to AASX
  const handleExportAASX = React.useCallback(async () => {
    if (!submodel) return;

    try {
      const template = parseSubmodelTemplate(submodel);
      const { submodel: exportedSubmodel } = exportToSubmodel(template, formValues, {
        generateIds: true,
      });

      const result = await exportToAASX(exportedSubmodel, {
        filename: `${submodel.idShort || 'submodel'}.aasx`,
      });

      // Download the AASX
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('AASX export failed:', err);
      alert('Failed to export AASX: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [submodel, formValues]);

  // Save to BaSyx
  const handleSaveToBaSyx = React.useCallback(async () => {
    if (!submodel || connectionStatus !== 'connected') return;

    setIsSaving(true);
    try {
      const template = parseSubmodelTemplate(submodel);
      const { submodel: exportedSubmodel } = exportToSubmodel(template, formValues, {
        generateIds: true,
      });

      const response = await fetch('/api/submodels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submodel: exportedSubmodel }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      alert('Submodel saved successfully!');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }, [submodel, formValues, connectionStatus]);

  // Handle template selection from sidebar
  const handleTemplateSelect = (template: TemplateCatalogEntry) => {
    router.push(`/templates/${template.id || template.idShort}`);
  };

  // Template info
  const templateInfo = templates.find(
    (t) => t.id === templateId || t.idShort === templateId
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        connectionStatus={connectionStatus}
        templateName={submodel?.idShort}
        showExportActions={!!submodel && !isLoading}
        onExportJSON={handleExportJSON}
        onExportAASX={handleExportAASX}
        onSaveToBaSyx={handleSaveToBaSyx}
      />

      {/* Sidebar */}
      <Sidebar
        templates={templates}
        selectedTemplateId={templateId}
        onTemplateSelect={handleTemplateSelect}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-0' : 'ml-72'
        }`}
      >
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            {templateInfo && (
              <>
                <span className="text-muted-foreground">/</span>
                <Badge variant="outline">{templateInfo.category || 'Template'}</Badge>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm font-medium">{templateInfo.name}</span>
              </>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <SpinnerIcon className="h-8 w-8 animate-spin" />
                <p className="mt-4">Loading template...</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="p-12 border-destructive">
              <div className="flex flex-col items-center justify-center text-destructive">
                <AlertIcon className="h-8 w-8" />
                <p className="mt-4 font-medium">Failed to load template</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/')}
                >
                  Return Home
                </Button>
              </div>
            </Card>
          )}

          {/* Form */}
          {submodel && !isLoading && !error && (
            <Card className="p-6">
              <IDTAFormRenderer
                submodel={submodel}
                onChange={handleFormChange}
                onSubmit={async (values) => {
                  console.log('Form submitted:', values);
                  await handleSaveToBaSyx();
                }}
              />
            </Card>
          )}

          {/* Saving Overlay */}
          {isSaving && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Card className="p-8">
                <div className="flex flex-col items-center">
                  <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 font-medium">Saving to BaSyx...</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
