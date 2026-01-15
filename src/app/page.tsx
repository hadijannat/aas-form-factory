/**
 * Home Page
 * Template selector and dashboard
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listTemplates, type TemplateCatalogEntry } from '@/lib/parser/template-fetcher';

// =============================================================================
// ICONS
// =============================================================================

function DocumentPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

// =============================================================================
// FEATURED TEMPLATES
// =============================================================================

const FEATURED_TEMPLATES = [
  {
    id: 'digital-nameplate',
    name: 'Digital Nameplate',
    description: 'Standardized product identification according to IEC 61406',
    category: 'Identification',
  },
  {
    id: 'contact-information',
    name: 'Contact Information',
    description: 'Manufacturer and supplier contact details',
    category: 'Identification',
  },
  {
    id: 'technical-data',
    name: 'Technical Data',
    description: 'Product technical specifications and characteristics',
    category: 'Technical',
  },
  {
    id: 'carbon-footprint',
    name: 'Carbon Footprint',
    description: 'Product carbon footprint according to ISO 14067',
    category: 'Sustainability',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function HomePage() {
  const router = useRouter();
  const [templates, setTemplates] = React.useState<TemplateCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Load templates
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = listTemplates();
        setTemplates(templateList);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, []);

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

  const handleTemplateSelect = (template: TemplateCatalogEntry) => {
    router.push(`/templates/${template.id || template.idShort}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header connectionStatus={connectionStatus} />

      {/* Sidebar */}
      <Sidebar
        templates={templates}
        isLoading={isLoading}
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              IDTA Form Studio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create, edit, and export AAS V3.0 compliant submodels using
              standardized IDTA templates.
            </p>
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DocumentPlusIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{templates.length}</p>
                  <p className="text-sm text-muted-foreground">Templates Available</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <ServerIcon className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold capitalize">{connectionStatus}</p>
                  <p className="text-sm text-muted-foreground">BaSyx Status</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">V3.0</p>
                  <p className="text-sm text-muted-foreground">AAS Specification</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Featured Templates */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Featured Templates</h2>
              <Button
                variant="ghost"
                onClick={() => setSidebarCollapsed(false)}
              >
                Browse All
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURED_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="p-6 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => router.push(`/templates/${template.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-medium">{template.name}</h3>
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  <Button variant="outline" size="sm">
                    Open Template
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </Card>
              ))}
            </div>
          </section>

          {/* Getting Started */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Getting Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">1</div>
                <h3 className="font-medium mb-2">Select a Template</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from 40+ standardized IDTA submodel templates for your
                  use case.
                </p>
              </Card>

              <Card className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">2</div>
                <h3 className="font-medium mb-2">Fill the Form</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your asset data using the auto-generated form with
                  validation.
                </p>
              </Card>

              <Card className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">3</div>
                <h3 className="font-medium mb-2">Export or Save</h3>
                <p className="text-sm text-muted-foreground">
                  Export to JSON/AASX or save directly to your BaSyx AAS server.
                </p>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
