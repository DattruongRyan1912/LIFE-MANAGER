'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ContextSelectorProps {
  value: string[];
  onChange: (types: string[]) => void;
  autoMode: boolean;
  onAutoToggle: (auto: boolean) => void;
  className?: string;
}

const CONTEXT_TYPES = [
  { id: 'tasks', label: 'Tasks', estimatedTokens: 300, icon: '✓', description: 'Your tasks, deadlines, priorities' },
  { id: 'expenses', label: 'Expenses', estimatedTokens: 250, icon: '💰', description: 'Financial records, budgets' },
  { id: 'study', label: 'Study', estimatedTokens: 200, icon: '📚', description: 'Learning materials, progress' },
  { id: 'memories', label: 'Memories', estimatedTokens: 150, icon: '🧠', description: 'AI memory, preferences, insights' },
];

export function ContextSelector({ 
  value, 
  onChange, 
  autoMode, 
  onAutoToggle,
  className 
}: ContextSelectorProps) {
  const [totalTokens, setTotalTokens] = useState(0);

  // Load saved preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_context_prefs');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.contextTypes) onChange(prefs.contextTypes);
        if (prefs.autoMode !== undefined) onAutoToggle(prefs.autoMode);
      } catch (error) {
        console.error('Failed to load context preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('ai_context_prefs', JSON.stringify({
      contextTypes: value,
      autoMode,
    }));
  }, [value, autoMode]);

  // Calculate total estimated tokens
  useEffect(() => {
    const baseTokens = 100; // System prompt + message overhead
    const contextTokens = CONTEXT_TYPES
      .filter(type => value.includes(type.id))
      .reduce((sum, type) => sum + type.estimatedTokens, 0);
    setTotalTokens(baseTokens + contextTokens);
  }, [value]);

  const handleTypeToggle = (typeId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, typeId]);
    } else {
      onChange(value.filter(t => t !== typeId));
    }
  };

  const getTokenBadgeColor = (tokens: number) => {
    if (tokens < 500) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (tokens < 1000) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  return (
    <Card className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Context Selection</h3>
          <p className="text-xs text-muted-foreground">Choose what data to send to AI</p>
        </div>
        <Badge 
          variant="outline" 
          className={cn('font-mono text-xs', getTokenBadgeColor(totalTokens))}
        >
          ~{totalTokens} tokens
        </Badge>
      </div>

      {/* Auto-Detection Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-mode" className="text-sm font-medium cursor-pointer">
            Auto-Detection Mode
          </Label>
          {autoMode && (
            <Badge variant="secondary" className="text-xs">
              Auto
            </Badge>
          )}
        </div>
        <Switch
          id="auto-mode"
          checked={autoMode}
          onCheckedChange={onAutoToggle}
        />
      </div>

      {/* Manual Context Selection */}
      {!autoMode && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Select which data types to include:
          </p>
          {CONTEXT_TYPES.map((type) => (
            <div
              key={type.id}
              className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/30 transition-colors"
            >
              <Checkbox
                id={type.id}
                checked={value.includes(type.id)}
                onCheckedChange={(checked) => handleTypeToggle(type.id, checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor={type.id}
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    ~{type.estimatedTokens}
                  </Badge>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {type.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto Mode Explanation */}
      {autoMode && (
        <div className="text-xs text-muted-foreground p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
          <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">
            🤖 Auto-Detection Active
          </p>
          <p>
            The system will automatically detect which context types are needed based on your message. 
            This optimizes token usage while maintaining AI quality.
          </p>
        </div>
      )}

      {/* Warning if no types selected */}
      {!autoMode && value.length === 0 && (
        <div className="text-xs text-amber-600 dark:text-amber-400 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          ⚠️ No context selected. AI responses may be generic. Enable Auto Mode or select at least one type.
        </div>
      )}
    </Card>
  );
}
