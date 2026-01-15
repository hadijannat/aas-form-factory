/**
 * Template Browser
 * Searchable list of IDTA Submodel Templates
 */

'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { TemplateCatalogEntry } from '@/lib/parser/template-fetcher';

// =============================================================================
// TYPES
// =============================================================================

export interface TemplateBrowserProps {
  /** Available templates */
  templates: TemplateCatalogEntry[];
  /** Currently selected template ID */
  selectedId?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Template selection handler */
  onSelect?: (template: TemplateCatalogEntry) => void;
}

// =============================================================================
// ICONS
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// =============================================================================
// TEMPLATE CATEGORY
// =============================================================================

function getCategoryColor(category?: string): string {
  switch (category?.toLowerCase()) {
    case 'published':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
    case 'deprecated':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'identification':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'documentation':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'technical':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'sustainability':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'lifecycle':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TemplateBrowser({
  templates,
  selectedId,
  isLoading = false,
  onSelect,
}: TemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter templates by search query
  const filteredTemplates = React.useMemo(() => {
    if (!searchQuery.trim()) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.idShort.toLowerCase().includes(query) ||
        t.id?.toLowerCase().includes(query) ||
        t.version?.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Group templates by category
  const groupedTemplates = React.useMemo(() => {
    const groups: Record<string, TemplateCatalogEntry[]> = {};
    for (const template of filteredTemplates) {
      const category = template.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(template);
    }
    return groups;
  }, [filteredTemplates]);

  const categoryOrder = [
    'Published',
    'Deprecated',
    'Identification',
    'Documentation',
    'Technical',
    'Sustainability',
    'Lifecycle',
    'Other',
  ];

  const sortedCategories = Object.keys(groupedTemplates).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    const normalizedA = aIndex === -1 ? categoryOrder.length : aIndex;
    const normalizedB = bIndex === -1 ? categoryOrder.length : bIndex;
    if (normalizedA !== normalizedB) {
      return normalizedA - normalizedB;
    }
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="template-search"
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {filteredTemplates.length} of {templates.length} templates
        </p>
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <SpinnerIcon className="h-8 w-8 animate-spin" />
            <p className="mt-2 text-sm">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <DocumentIcon className="h-8 w-8" />
            <p className="mt-2 text-sm">No templates found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((category) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {groupedTemplates[category].map((template) => (
                    <TemplateCard
                      key={template.id || template.idShort}
                      template={template}
                      isSelected={selectedId === template.id}
                      onClick={() => onSelect?.(template)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TEMPLATE CARD
// =============================================================================

interface TemplateCardProps {
  template: TemplateCatalogEntry;
  isSelected?: boolean;
  onClick?: () => void;
}

function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <Card
      className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
        isSelected ? 'border-primary bg-accent' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{template.name}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {template.idShort}
          </p>
        </div>
        {template.version && (
          <Badge variant="outline" className="text-xs shrink-0">
            v{template.version}
          </Badge>
        )}
      </div>
      {template.category && (
        <Badge
          className={`mt-2 text-xs ${getCategoryColor(template.category)}`}
          variant="secondary"
        >
          {template.category}
        </Badge>
      )}
    </Card>
  );
}

export default TemplateBrowser;
