/**
 * Application Header
 * Industrial-grade header with branding, actions, and connection status
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// =============================================================================
// TYPES
// =============================================================================

export interface HeaderProps {
  /** Current BaSyx connection status */
  connectionStatus?: 'connected' | 'disconnected' | 'checking';
  /** Currently loaded template name */
  templateName?: string;
  /** Show export actions */
  showExportActions?: boolean;
  /** Export to JSON handler */
  onExportJSON?: () => void;
  /** Export to AASX handler */
  onExportAASX?: () => void;
  /** Save to BaSyx handler */
  onSaveToBaSyx?: () => void;
}

// =============================================================================
// ICONS
// =============================================================================

function ServerIcon({ className }: { className?: string }) {
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
        d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function CloudUploadIcon({ className }: { className?: string }) {
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
        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
      />
    </svg>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Header({
  connectionStatus = 'disconnected',
  templateName,
  showExportActions = false,
  onExportJSON,
  onExportAASX,
  onSaveToBaSyx,
}: HeaderProps) {
  const statusColors = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    checking: 'bg-yellow-500 animate-pulse',
  };

  const statusLabels = {
    connected: 'BaSyx Connected',
    disconnected: 'BaSyx Disconnected',
    checking: 'Checking Connection...',
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">ID</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">IDTA Form Studio</span>
            {templateName && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {templateName}
              </span>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Connection Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 mr-4">
                <ServerIcon className="h-4 w-4 text-muted-foreground" />
                <div
                  className={`h-2 w-2 rounded-full ${statusColors[connectionStatus]}`}
                />
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {statusLabels[connectionStatus]}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{statusLabels[connectionStatus]}</p>
              {connectionStatus === 'connected' && (
                <p className="text-xs text-muted-foreground">
                  Ready to save submodels
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Export Actions */}
        {showExportActions && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportJSON}
              className="hidden sm:flex"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportAASX}
              className="hidden sm:flex"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              AASX
            </Button>
            <Button
              size="sm"
              onClick={onSaveToBaSyx}
              disabled={connectionStatus !== 'connected'}
            >
              <CloudUploadIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Save to BaSyx</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
