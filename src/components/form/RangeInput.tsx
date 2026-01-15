'use client';

/**
 * RangeInput Component
 * Dual min/max input for Range elements
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

export interface RangeValue {
  min?: number;
  max?: number;
}

export interface RangeInputProps extends BaseFormProps, LabeledProps {
  value?: RangeValue;
  valueType?: 'integer' | 'decimal';
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
}

export function RangeInput({
  value = {},
  valueType = 'decimal',
  unit,
  minLabel = 'Min',
  maxLabel = 'Max',
  showLabel = true,
  labelPosition = 'top',
  onChange,
  onBlur,
  error,
  disabled,
  required,
  ...props
}: RangeInputProps) {
  const fieldId = getFieldId(props.path);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);

  const parseValue = (raw: string): number | undefined => {
    if (raw === '') return undefined;
    const parsed = valueType === 'integer'
      ? parseInt(raw, 10)
      : parseFloat(raw);
    return isNaN(parsed) ? undefined : parsed;
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseValue(e.target.value);
    onChange?.({ ...value, min: newMin });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseValue(e.target.value);
    onChange?.({ ...value, max: newMax });
  };

  const step = valueType === 'integer' ? 1 : 0.01;

  const renderLabel = () => {
    if (!showLabel || labelPosition === 'hidden') return null;

    return (
      <div className="flex items-center gap-1.5 mb-1.5">
        <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
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
    <div className="space-y-1.5">
      {renderLabel()}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label htmlFor={`${fieldId}-min`} className="text-xs text-muted-foreground mb-1 block">
            {minLabel}
          </Label>
          <div className="relative">
            <Input
              id={`${fieldId}-min`}
              type="number"
              value={value.min ?? ''}
              step={step}
              disabled={disabled}
              onChange={handleMinChange}
              onBlur={onBlur}
              aria-invalid={!!error}
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
        </div>

        <div className="flex items-end pb-1.5">
          <span className="text-muted-foreground">—</span>
        </div>

        <div className="flex-1">
          <Label htmlFor={`${fieldId}-max`} className="text-xs text-muted-foreground mb-1 block">
            {maxLabel}
          </Label>
          <div className="relative">
            <Input
              id={`${fieldId}-max`}
              type="number"
              value={value.max ?? ''}
              step={step}
              disabled={disabled}
              onChange={handleMaxChange}
              onBlur={onBlur}
              aria-invalid={!!error}
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
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Validation hint when min > max */}
      {value.min !== undefined && value.max !== undefined && value.min > value.max && (
        <p className="text-sm text-amber-600">
          Warning: Minimum value is greater than maximum value
        </p>
      )}
    </div>
  );
}
