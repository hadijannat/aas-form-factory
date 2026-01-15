'use client';

/**
 * SMCContainer Component
 * Container for SubmodelElementCollection with collapsible header
 */

import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDownIcon, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type BaseFormProps,
  getFieldLabel,
  getFieldDescription,
} from './types';

export interface SMCContainerProps extends BaseFormProps {
  collapsed?: boolean;
  collapsible?: boolean;
  variant?: 'card' | 'fieldset' | 'section';
  level?: number;
  children?: React.ReactNode;
  onToggle?: (collapsed: boolean) => void;
}

export function SMCContainer({
  collapsed: initialCollapsed = false,
  collapsible = true,
  variant = 'card',
  level = 0,
  children,
  onToggle,
  required,
  semanticId,
  ...props
}: SMCContainerProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(initialCollapsed);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);

  const handleToggle = () => {
    if (!collapsible) return;
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onToggle?.(newState);
  };

  // Different rendering based on variant
  if (variant === 'fieldset') {
    return (
      <fieldset
        className={cn(
          'border rounded-md p-4',
          level > 0 && 'bg-muted/20'
        )}
      >
        <legend className="px-2 font-medium flex items-center gap-2">
          {label}
          {required && <span className="text-destructive">*</span>}
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
        </legend>
        <div className="space-y-4 pt-2">{children}</div>
      </fieldset>
    );
  }

  if (variant === 'section') {
    return (
      <Collapsible open={!isCollapsed} onOpenChange={() => handleToggle()}>
        <div className={cn('space-y-3', level > 0 && 'pl-4 border-l-2')}>
          <CollapsibleTrigger
            className={cn(
              'flex items-center gap-2 w-full text-left',
              collapsible && 'cursor-pointer hover:text-primary'
            )}
            disabled={!collapsible}
          >
            {collapsible && (
              <ChevronDownIcon
                className={cn(
                  'h-4 w-4 transition-transform',
                  isCollapsed && '-rotate-90'
                )}
              />
            )}
            <span className="font-medium">{label}</span>
            {required && <span className="text-destructive">*</span>}
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            {children}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  // Default: card variant
  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => handleToggle()}>
      <Card className={cn(level > 0 && 'bg-muted/20 shadow-none')}>
        <CardHeader className="py-3">
          <CollapsibleTrigger
            className={cn(
              'flex items-center justify-between w-full text-left',
              collapsible && 'cursor-pointer'
            )}
            disabled={!collapsible}
          >
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium">{label}</CardTitle>
              {required && <span className="text-destructive">*</span>}
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {semanticId && (
                <Badge variant="outline" className="text-xs font-normal">
                  {semanticId.split('/').pop()}
                </Badge>
              )}
            </div>
            {collapsible && (
              <ChevronDownIcon
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform',
                  isCollapsed && '-rotate-90'
                )}
              />
            )}
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
