/**
 * Template Catalog Page
 * Full list of IDTA submodel templates
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { TemplateBrowser } from '@/components/layout/TemplateBrowser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTemplateCatalog } from '@/hooks/use-template-catalog';

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, isLoading, error } = useTemplateCatalog();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              All Templates
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Browse published and deprecated IDTA submodel templates.
            </p>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>

        <Card className="p-0 h-[calc(100vh-16rem)]">
          <TemplateBrowser
            templates={templates}
            isLoading={isLoading}
            onSelect={(template) =>
              router.push(`/templates/${template.id || template.idShort}`)
            }
          />
        </Card>

        {error && (
          <p className="mt-3 text-xs text-muted-foreground">
            Using the built-in template list because the remote catalog could
            not be loaded.
          </p>
        )}
      </main>
    </div>
  );
}
