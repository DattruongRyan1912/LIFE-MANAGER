'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, ChevronRight, Plus, Sparkles, CheckCircle2, 
  Circle, Clock, BookOpen, Trash2, Edit2
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  estimated_minutes: number;
  completed_at: string | null;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  is_overdue: boolean;
}

interface Module {
  id: number;
  title: string;
  description: string;
  order_index: number;
  progress: number;
  estimated_hours: number;
  tasks_count: number;
  completed_tasks: number;
  pending_tasks: number;
  created_at: string;
}

interface ModuleListProps {
  goalId: number;
  modules: Module[];
  onModuleClick: (module: Module) => void;
  onGenerateModules: () => void;
  onDeleteModule: (moduleId: number) => void;
  loading?: boolean;
}

export function ModuleList({ 
  goalId, 
  modules, 
  onModuleClick, 
  onGenerateModules,
  onDeleteModule,
  loading 
}: ModuleListProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading modules...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Generate a structured learning path with AI or create modules manually
            </p>
            <Button onClick={onGenerateModules} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Modules with AI
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module, index) => {
        const isExpanded = expandedModules.has(module.id);
        
        return (
          <Card key={module.id} className="overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleModule(module.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModule(module.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Module {index + 1}
                      </span>
                      {module.progress >= 100 && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{module.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {module.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {module.completed_tasks} / {module.tasks_count} tasks completed
                        </span>
                        <span className="font-semibold">{Math.round(module.progress)}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{module.estimated_hours}h estimated</span>
                      </div>
                      {module.pending_tasks > 0 && (
                        <div className="flex items-center gap-1">
                          <Circle className="h-3 w-3" />
                          <span>{module.pending_tasks} pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onModuleClick(module);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteModule(module.id);
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded Content - Tasks will be loaded here */}
            {isExpanded && (
              <div className="border-t bg-accent/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Tasks</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onModuleClick(module)}
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    View All Tasks
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground text-center py-4">
                  Click "View All Tasks" to manage tasks for this module
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
