'use client';

/**
 * NumberInput Component
 * Renders numeric input with optional unit display and min/max constraints
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

export interface NumberInputProps extends BaseFormProps, LabeledProps {
  value?: number;
  valueType?: 'integer' | 'decimal';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function NumberInput({
  value,
  valueType = 'decimal',
  min,
  max,
  step,
  unit,
  showLabel = true,
  labelPosition = 'top',
  onChange,
  onBlur,
  error,
  disabled,
  required,
  exampleValue,
  ...props
}: NumberInputProps) {
  const fieldId = getFieldId(props.path);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      onChange?.(undefined);
      return;
    }

    const parsed = valueType === 'integer'
      ? parseInt(rawValue, 10)
      : parseFloat(rawValue);

    if (!isNaN(parsed)) {
      onChange?.(parsed);
    }
  };

  const effectiveStep = step ?? (valueType === 'integer' ? 1 : 0.01);

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
        <div className="relative">
          <Input
            id={fieldId}
            type="number"
            value={value ?? ''}
            min={min}
            max={max}
            step={effectiveStep}
            disabled={disabled}
            required={required}
            placeholder={exampleValue}
            onChange={handleChange}
            onBlur={onBlur}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cn(
              error && 'border-destructive focus-visible:ring-destructive',
              unit && 'pr-12'
            )}
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive mt-1">
            {error}
          </p>
        )}
        {(min !== undefined || max !== undefined) && (
          <p className="text-xs text-muted-foreground mt-1">
            {min !== undefined && max !== undefined
              ? `Range: ${min} - ${max}`
              : min !== undefined
                ? `Min: ${min}`
                : `Max: ${max}`}
          </p>
        )}
      </div>
    </div>
  );
}
