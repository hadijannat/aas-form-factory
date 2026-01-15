'use client';

/**
 * TextInput Component
 * Renders single or multi-line text input for xs:string properties
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

export interface TextInputProps extends BaseFormProps, LabeledProps {
  value?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  multiline?: boolean;
  rows?: number;
}

export function TextInput({
  value = '',
  placeholder,
  minLength,
  maxLength,
  pattern,
  multiline = false,
  rows = 3,
  showLabel = true,
  labelPosition = 'top',
  onChange,
  onBlur,
  error,
  disabled,
  required,
  exampleValue,
  ...props
}: TextInputProps) {
  const fieldId = getFieldId(props.path);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);
  const effectivePlaceholder = placeholder || exampleValue || undefined;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange?.(e.target.value);
  };

  const inputProps = {
    id: fieldId,
    value,
    placeholder: effectivePlaceholder,
    minLength,
    maxLength,
    pattern,
    disabled,
    required,
    onChange: handleChange,
    onBlur,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${fieldId}-error` : undefined,
    className: cn(error && 'border-destructive focus-visible:ring-destructive'),
  };

  const renderInput = () => {
    if (multiline) {
      return <Textarea {...inputProps} rows={rows} />;
    }
    return <Input {...inputProps} type="text" />;
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
        {renderInput()}
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive mt-1">
            {error}
          </p>
        )}
        {maxLength && (
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
