'use client';

/**
 * ArrayContainer Component
 * Repeatable array container for *ToMany cardinalities
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  InfoIcon,
  PlusIcon,
  TrashIcon,
  GripVerticalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type BaseFormProps,
  getFieldLabel,
  getFieldDescription,
} from './types';

export interface ArrayContainerProps extends BaseFormProps {
  minItems?: number;
  maxItems?: number;
  allowReorder?: boolean;
  itemLabel?: string;
  addLabel?: string;
  items?: React.ReactNode[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function ArrayContainer({
  minItems = 0,
  maxItems,
  allowReorder = true,
  itemLabel,
  addLabel = 'Add Item',
  items = [],
  onAdd,
  onRemove,
  onReorder,
  disabled,
  required,
  ...props
}: ArrayContainerProps) {
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);

  const canAdd = !disabled && (maxItems === undefined || items.length < maxItems);
  const canRemove = (index: number) =>
    !disabled && items.length > minItems;

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onReorder?.(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < items.length - 1) {
      onReorder?.(index, index + 1);
    }
  };

  const getItemLabel = (index: number) => {
    if (itemLabel) {
      return `${itemLabel} ${index + 1}`;
    }
    return `Item ${index + 1}`;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
          <span className="text-sm text-muted-foreground">
            ({items.length}
            {maxItems !== undefined && ` / ${maxItems}`})
          </span>
        </div>
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="border-2 border-dashed rounded-md p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No items yet.{required && ' At least one item is required.'}
          </p>
          {canAdd && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onAdd}
              className="gap-1.5"
            >
              <PlusIcon className="h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-4">
                {/* Item header with controls */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                  {allowReorder && items.length > 1 && (
                    <div className="flex flex-col gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={disabled || index === 0}
                        onClick={() => handleMoveUp(index)}
                      >
                        <ChevronUpIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={disabled || index === items.length - 1}
                        onClick={() => handleMoveDown(index)}
                      >
                        <ChevronDownIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <span className="text-sm font-medium flex-1">
                    {getItemLabel(index)}
                  </span>

                  {canRemove(index) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemove?.(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove item</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Item content */}
                <div className="space-y-4">{item}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Constraints info */}
      {(minItems > 0 || maxItems !== undefined) && (
        <p className="text-xs text-muted-foreground">
          {minItems > 0 && maxItems !== undefined
            ? `Required: ${minItems} - ${maxItems} items`
            : minItems > 0
              ? `Minimum: ${minItems} item${minItems > 1 ? 's' : ''}`
              : `Maximum: ${maxItems} items`}
        </p>
      )}
    </div>
  );
}
