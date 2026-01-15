'use client';

/**
 * FormSection Component
 * Top-level section wrapper for a form with optional collapsible header
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormSectionProps {
  title: string;
  subtitle?: string;
  icon?: string;
  collapsed?: boolean;
  collapsible?: boolean;
  children?: React.ReactNode;
}

export function FormSection({
  title,
  subtitle,
  collapsed = false,
  collapsible = true,
  children,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

  const handleToggle = () => {
    if (!collapsible) return;
    setIsCollapsed((prev) => !prev);
  };

  if (!collapsible) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={!isCollapsed} onOpenChange={handleToggle}>
      <Card>
        <CardHeader className="py-3">
          <CollapsibleTrigger
            className={cn(
              'flex items-start justify-between w-full text-left',
              collapsible && 'cursor-pointer'
            )}
            disabled={!collapsible}
          >
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
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
          <CardContent className="pt-0 space-y-4">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
