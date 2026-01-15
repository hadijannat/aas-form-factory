'use client';

/**
 * DateInput Component
 * Date/datetime picker for xs:date and xs:dateTime properties
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type BaseFormProps,
  type LabeledProps,
  getFieldLabel,
  getFieldDescription,
  getFieldId,
} from './types';

export interface DateInputProps extends BaseFormProps, LabeledProps {
  value?: string;
  min?: string;
  max?: string;
  includeTime?: boolean;
}

export function DateInput({
  value = '',
  min,
  max,
  includeTime = false,
  showLabel = true,
  labelPosition = 'top',
  onChange,
  onBlur,
  error,
  disabled,
  required,
  exampleValue,
  ...props
}: DateInputProps) {
  const fieldId = getFieldId(props.path);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  // Convert ISO string to input format if needed
  const formatValue = (val: string): string => {
    if (!val) return '';
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;

      if (includeTime) {
        // Format as datetime-local: YYYY-MM-DDTHH:MM
        return date.toISOString().slice(0, 16);
      } else {
        // Format as date: YYYY-MM-DD
        return date.toISOString().slice(0, 10);
      }
    } catch {
      return val;
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
      <div className="flex-1">
        <Input
          id={fieldId}
          type={includeTime ? 'datetime-local' : 'date'}
          value={formatValue(value)}
          min={min ? formatValue(min) : undefined}
          max={max ? formatValue(max) : undefined}
          disabled={disabled}
          required={required}
          placeholder={exampleValue}
          onChange={handleChange}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
