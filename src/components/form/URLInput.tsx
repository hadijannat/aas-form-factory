'use client';

/**
 * URLInput Component
 * URL input with validation for xs:anyURI properties
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon, ExternalLinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type BaseFormProps,
  type LabeledProps,
  getFieldLabel,
  getFieldDescription,
  getFieldId,
} from './types';

export interface URLInputProps extends BaseFormProps, LabeledProps {
  value?: string;
  placeholder?: string;
  validateUrl?: boolean;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export function URLInput({
  value = '',
  placeholder = 'https://...',
  validateUrl = true,
  showLabel = true,
  labelPosition = 'top',
  onChange,
  onBlur,
  error,
  disabled,
  required,
  exampleValue,
  ...props
}: URLInputProps) {
  const fieldId = getFieldId(props.path);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);
  const [localError, setLocalError] = React.useState<string | undefined>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);

    // Validate on change if enabled
    if (validateUrl && newValue && !isValidUrl(newValue)) {
      setLocalError('Please enter a valid URL');
    } else {
      setLocalError(undefined);
    }
  };

  const handleBlur = () => {
    onBlur?.();
    if (validateUrl && value && !isValidUrl(value)) {
      setLocalError('Please enter a valid URL');
    }
  };

  const displayError = error || localError;
  const canOpenLink = value && isValidUrl(value);

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
      <div className="flex-1">
        <div className="flex gap-2">
          <Input
            id={fieldId}
            type="url"
            value={value}
            placeholder={placeholder || exampleValue}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!displayError}
            aria-describedby={displayError ? `${fieldId}-error` : undefined}
            className={cn(
              displayError && 'border-destructive focus-visible:ring-destructive',
              'flex-1'
            )}
          />
          {canOpenLink && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(value, '_blank', 'noopener,noreferrer')}
                    disabled={disabled}
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {displayError && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive mt-1">
            {displayError}
          </p>
        )}
      </div>
    </div>
  );
}
