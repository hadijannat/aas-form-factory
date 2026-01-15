/**
 * Application Sidebar
 * Collapsible sidebar with template browser
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { TemplateBrowser } from './TemplateBrowser';
import type { TemplateCatalogEntry } from '@/lib/parser/template-fetcher';

// =============================================================================
// TYPES
// =============================================================================

export interface SidebarProps {
  /** Available templates */
  templates: TemplateCatalogEntry[];
  /** Currently selected template ID */
  selectedTemplateId?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Template selection handler */
  onTemplateSelect?: (template: TemplateCatalogEntry) => void;
  /** Whether sidebar is collapsed */
  isCollapsed?: boolean;
  /** Toggle collapse state */
  onToggleCollapse?: () => void;
}

// =============================================================================
// ICONS
// =============================================================================

function ChevronLeftIcon({ className }: { className?: string }) {
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
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
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
        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Sidebar({
  templates,
  selectedTemplateId,
  isLoading = false,
  onTemplateSelect,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300 ${
          isCollapsed ? 'w-0 overflow-hidden' : 'w-72'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-sm font-semibold">Templates</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8"
              aria-label="Collapse template sidebar"
              title="Collapse template sidebar"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Template Browser */}
          <TemplateBrowser
            templates={templates}
            selectedId={selectedTemplateId}
            isLoading={isLoading}
            onSelect={onTemplateSelect}
          />
        </div>
      </aside>

      {/* Toggle Button (when collapsed) */}
      {isCollapsed && (
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleCollapse}
          className="fixed left-4 top-20 z-50 h-10 w-10 rounded-full shadow-md"
          aria-label="Open template sidebar"
          title="Open template sidebar"
        >
          <ListIcon className="h-4 w-4" />
        </Button>
      )}

      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onToggleCollapse}
        />
      )}
    </>
  );
}

export default Sidebar;
