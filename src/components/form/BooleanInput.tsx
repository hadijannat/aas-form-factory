'use client';

/**
 * BooleanInput Component
 * Boolean toggle for xs:boolean properties with multiple variants
 */

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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

export interface BooleanInputProps extends BaseFormProps, LabeledProps {
  value?: boolean;
  label?: string;
  variant?: 'checkbox' | 'switch' | 'radio';
}

export function BooleanInput({
  value = false,
  label: customLabel,
  variant = 'checkbox',
  showLabel = true,
  labelPosition = 'top',
  onChange,
  onBlur,
  error,
  disabled,
  required,
  ...props
}: BooleanInputProps) {
  const fieldId = getFieldId(props.path);
  const label = customLabel || getFieldLabel(props);
  const description = getFieldDescription(props);

  const handleChange = (checked: boolean) => {
    onChange?.(checked);
  };

  const renderDescription = () => {
    if (!description) return null;
    return (
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
    );
  };

  // For checkbox and switch, label is inline
  if (variant === 'checkbox') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id={fieldId}
            checked={value}
            onCheckedChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
          {showLabel && (
            <Label
              htmlFor={fieldId}
              className={cn(
                'text-sm font-normal cursor-pointer',
                required && "after:content-['*'] after:ml-0.5 after:text-destructive"
              )}
            >
              {label}
            </Label>
          )}
          {renderDescription()}
        </div>
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'switch') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {showLabel && (
              <Label
                htmlFor={fieldId}
                className={cn(
                  'text-sm cursor-pointer',
                  required && "after:content-['*'] after:ml-0.5 after:text-destructive"
                )}
              >
                {label}
              </Label>
            )}
            {renderDescription()}
          </div>
          <Switch
            id={fieldId}
            checked={value}
            onCheckedChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
        </div>
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Radio variant renders yes/no options
  return (
    <div className="space-y-2">
      {showLabel && labelPosition !== 'hidden' && (
        <div className="flex items-center gap-1.5">
          <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </Label>
          {renderDescription()}
        </div>
      )}
      <div className="flex items-center gap-4" role="radiogroup" aria-labelledby={fieldId}>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id={`${fieldId}-yes`}
            name={fieldId}
            checked={value === true}
            onChange={() => handleChange(true)}
            onBlur={onBlur}
            disabled={disabled}
            className="h-4 w-4 text-primary"
          />
          <Label htmlFor={`${fieldId}-yes`} className="text-sm font-normal cursor-pointer">
            Yes
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id={`${fieldId}-no`}
            name={fieldId}
            checked={value === false}
            onChange={() => handleChange(false)}
            onBlur={onBlur}
            disabled={disabled}
            className="h-4 w-4 text-primary"
          />
          <Label htmlFor={`${fieldId}-no`} className="text-sm font-normal cursor-pointer">
            No
          </Label>
        </div>
      </div>
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
