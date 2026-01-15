'use client';

/**
 * FileInput Component
 * File upload with type validation and preview for File elements
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon, UploadIcon, XIcon, FileIcon, ImageIcon, FileTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type BaseFormProps,
  type LabeledProps,
  getFieldLabel,
  getFieldDescription,
  getFieldId,
} from './types';

export interface FileValue {
  path: string;
  contentType?: string;
  name?: string;
  size?: number;
}

export interface FileInputProps extends BaseFormProps, LabeledProps {
  value?: FileValue;
  contentType?: string;
  accept?: string;
  maxSize?: number;
  showPreview?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileInput({
  value,
  contentType,
  accept,
  maxSize,
  showPreview = true,
  showLabel = true,
  labelPosition = 'top',
  onChange,
  onBlur,
  error,
  disabled,
  required,
  ...props
}: FileInputProps) {
  const fieldId = getFieldId(props.path);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = React.useState<string>();
  const [previewUrl, setPreviewUrl] = React.useState<string>();

  // Derive accept string from contentType if not provided
  const effectiveAccept = accept || contentType || undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (maxSize && file.size > maxSize) {
      setLocalError(`File too large. Maximum size is ${formatFileSize(maxSize)}`);
      return;
    }

    // Validate type
    if (contentType && !file.type.match(contentType.replace('*', '.*'))) {
      setLocalError(`Invalid file type. Expected ${contentType}`);
      return;
    }

    setLocalError(undefined);

    // Create preview URL for images
    if (showPreview && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(undefined);
    }

    // Create file value (in real app, this would upload and return server path)
    const fileValue: FileValue = {
      path: file.name, // In real implementation, this would be server URL
      contentType: file.type,
      name: file.name,
      size: file.size,
    };

    onChange?.(fileValue);
  };

  const handleRemove = () => {
    onChange?.(undefined);
    setPreviewUrl(undefined);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayError = error || localError;
  const renderFileIcon = () => {
    if (!value?.contentType) return <FileIcon className="h-8 w-8 text-muted-foreground" />;
    if (value.contentType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
    }
    if (value.contentType.startsWith('text/') || value.contentType.includes('pdf')) {
      return <FileTextIcon className="h-8 w-8 text-muted-foreground" />;
    }
    return <FileIcon className="h-8 w-8 text-muted-foreground" />;
  };

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

      {/* Hidden file input */}
      <Input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept={effectiveAccept}
        disabled={disabled}
        onChange={handleFileChange}
        onBlur={onBlur}
        className="hidden"
      />

      {/* File display or upload area */}
      {value ? (
        <div className="border rounded-md p-3 bg-muted/30">
          <div className="flex items-start gap-3">
            {/* Preview or icon */}
            {showPreview && previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-16 w-16 object-cover rounded border"
              />
            ) : (
              <div className="h-16 w-16 bg-muted rounded border flex items-center justify-center">
                {renderFileIcon()}
              </div>
            )}

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{value.name || value.path}</p>
              <p className="text-sm text-muted-foreground">
                {value.contentType}
                {value.size && ` • ${formatFileSize(value.size)}`}
              </p>
            </div>

            {/* Remove button */}
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            'w-full border-2 border-dashed rounded-md p-6 text-center',
            'hover:border-primary/50 hover:bg-muted/30 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            disabled && 'opacity-50 cursor-not-allowed',
            displayError && 'border-destructive'
          )}
        >
          <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">
            {effectiveAccept && `Accepts: ${effectiveAccept}`}
            {maxSize && ` • Max: ${formatFileSize(maxSize)}`}
          </p>
        </button>
      )}

      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
    </div>
  );
}
