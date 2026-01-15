'use client';

/**
 * MultiLanguageInput Component
 * Multi-language text editor with language tabs for MLP elements
 */

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon, PlusIcon, XIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  type BaseFormProps,
  type LabeledProps,
  getFieldLabel,
  getFieldDescription,
  getFieldId,
} from './types';

export interface LangString {
  language: string;
  text: string;
}

export interface MultiLanguageInputProps extends BaseFormProps, LabeledProps {
  value?: LangString[];
  supportedLanguages?: string[];
  primaryLanguage?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  cs: 'Czech',
  hu: 'Hungarian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
};

export function MultiLanguageInput({
  value = [],
  supportedLanguages = ['en', 'de'],
  primaryLanguage = 'en',
  showLabel = true,
  labelPosition = 'top',
  onChange,
  onBlur,
  error,
  disabled,
  required,
  ...props
}: MultiLanguageInputProps) {
  const fieldId = getFieldId(props.path);
  const label = getFieldLabel(props);
  const description = getFieldDescription(props);

  // Get active languages from value
  const activeLanguages = value.map((v) => v.language);
  const availableToAdd = supportedLanguages.filter(
    (lang) => !activeLanguages.includes(lang)
  );

  // Current tab defaults to primary language or first available
  const [activeTab, setActiveTab] = React.useState(
    activeLanguages.includes(primaryLanguage)
      ? primaryLanguage
      : activeLanguages[0] || primaryLanguage
  );

  const handleTextChange = (language: string, text: string) => {
    const newValue = value.map((v) =>
      v.language === language ? { ...v, text } : v
    );
    onChange?.(newValue);
  };

  const handleAddLanguage = (language: string) => {
    const newValue = [...value, { language, text: '' }];
    onChange?.(newValue);
    setActiveTab(language);
  };

  const handleRemoveLanguage = (language: string) => {
    const newValue = value.filter((v) => v.language !== language);
    onChange?.(newValue);
    if (activeTab === language) {
      setActiveTab(newValue[0]?.language || primaryLanguage);
    }
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

  // If no languages active yet, show add language button
  if (value.length === 0) {
    return (
      <div className="space-y-1.5">
        {renderLabel()}
        <div className="border rounded-md p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">
            No translations added yet. Add a language to begin.
          </p>
          <div className="flex items-center gap-2">
            <Select onValueChange={handleAddLanguage} disabled={disabled}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Add language..." />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_NAMES[lang] || lang.toUpperCase()} ({lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {renderLabel()}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <TabsList>
            {value.map((v) => (
              <TabsTrigger key={v.language} value={v.language} className="gap-1.5">
                {LANGUAGE_NAMES[v.language] || v.language.toUpperCase()}
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLanguage(v.language);
                    }}
                    className="ml-1 h-4 w-4 rounded-full hover:bg-destructive/20 inline-flex items-center justify-center"
                    disabled={disabled}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {availableToAdd.length > 0 && (
            <Select onValueChange={handleAddLanguage} disabled={disabled}>
              <SelectTrigger className="w-auto h-8 px-2 gap-1">
                <PlusIcon className="h-4 w-4" />
                <span className="text-sm">Add</span>
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {value.map((v) => (
          <TabsContent key={v.language} value={v.language}>
            <Textarea
              id={`${fieldId}-${v.language}`}
              value={v.text}
              onChange={(e) => handleTextChange(v.language, e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              placeholder={`Enter text in ${LANGUAGE_NAMES[v.language] || v.language}...`}
              rows={3}
              className={cn(
                error && 'border-destructive focus-visible:ring-destructive'
              )}
            />
          </TabsContent>
        ))}
      </Tabs>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
