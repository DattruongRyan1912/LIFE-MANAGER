'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, Circle, Clock, AlertCircle, Calendar,
  Edit2, Trash2, Plus, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

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
  created_at: string;
}

interface TaskListProps {
  moduleId: number;
  tasks: Task[];
  statistics?: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    by_priority: {
      high: number;
      medium: number;
      low: number;
    };
    total_estimated_minutes: number;
    completed_minutes: number;
  };
  onToggleTask: (taskId: number) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onGenerateTasks: () => void;
  loading?: boolean;
}

export function TaskList({
  moduleId,
  tasks,
  statistics,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onGenerateTasks,
  loading
}: TaskListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDueDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Circle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          Generate actionable tasks with AI or create them manually
        </p>
        <Button onClick={onGenerateTasks} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Tasks with AI
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{statistics.total}</div>
              <div className="text-xs text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-green-500">{statistics.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-yellow-500">{statistics.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-red-500">{statistics.overdue}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className={task.is_completed ? 'opacity-60' : ''}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={() => onToggleTask(task.id)}
                  className="mt-1"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className={`font-semibold ${task.is_completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h4>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTask(task)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTask(task.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {getPriorityLabel(task.priority)}
                    </Badge>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDueDate(task.due_date)}</span>
                      {task.is_overdue && !task.is_completed && (
                        <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatEstimatedTime(task.estimated_minutes)}</span>
                    </div>

                    {task.is_completed && task.completed_at && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
