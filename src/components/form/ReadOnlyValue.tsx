'use client';

/**
 * ReadOnlyValue Component
 * Displays read-only AAS elements (Operation, Capability, Event, Relationship)
 */

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CopyIcon, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type BaseFormProps,
  type LabeledProps,
  getFieldLabel,
  getFieldDescription,
  getFieldId,
} from './types';

export interface ReadOnlyValueProps extends BaseFormProps, LabeledProps {
  value?: string | number | boolean;
  format?: string;
  copyable?: boolean;
}

export function ReadOnlyValue({
  value,
  format,
  copyable = false,
  showLabel = true,
  labelPosition = 'top',
  disabled,
  required,
  ...props
}: ReadOnlyValueProps) {
  const fieldId = getFieldId(props.path);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);
  const displayValue = value ?? (format ? format.replace('{value}', '') : 'Read-only');

  const handleCopy = async () => {
    if (!copyable || displayValue === undefined) return;
    const text = String(displayValue);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  const renderLabel = () => {
    if (!showLabel || labelPosition === 'hidden') return null;

    return (
      <div className="flex items-center gap-1.5">
        <Label htmlFor={fieldId} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
          {label}
        </Label>
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'space-y-1.5',
        labelPosition === 'left' && 'flex items-center gap-3 space-y-0'
      )}
    >
      {renderLabel()}
      <div className="flex items-center gap-2">
        <div
          id={fieldId}
          className={cn(
            'flex-1 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground',
            disabled && 'opacity-60'
          )}
        >
          {displayValue}
        </div>
        {copyable && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
          >
            <CopyIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
