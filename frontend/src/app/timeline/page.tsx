'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_at: string;
  done: boolean;
  estimated_minutes?: number;
  pomodoro_estimate?: number;
  pomodoro_completed?: number;
  recurrence_type?: string;
}

interface TimelineData {
  [date: string]: Task[];
}

// Sortable Task Item Component
function SortableTaskItem({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    high: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
    medium: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
    low: 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 border-l-4 rounded-md mb-2 cursor-grab active:cursor-grabbing ${
        priorityColors[task.priority]
      } ${task.done ? 'opacity-50 line-through' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {task.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimated_minutes}m
              </span>
            )}
            {task.pomodoro_estimate && (
              <span className="flex items-center gap-1">
                🍅 {task.pomodoro_completed || 0}/{task.pomodoro_estimate}
              </span>
            )}
            {task.recurrence_type && task.recurrence_type !== 'none' && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                🔁 {task.recurrence_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const [timelineData, setTimelineData] = useState<TimelineData>({});
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    new Date(new Date().setDate(new Date().getDate() - new Date().getDay()))
  );

  useEffect(() => {
    loadTimeline();
  }, [currentWeekStart]);

  const loadTimeline = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 20); // Show 3 weeks

      const params = new URLSearchParams({
        start_date: currentWeekStart.toISOString().split('T')[0],
        end_date: weekEnd.toISOString().split('T')[0],
      });

      const res = await fetch(`http://localhost:8000/api/tasks/timeline?${params}`);
      const data = await res.json();
      setTimelineData(data);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    // Update local state optimistically
    // In production, you'd want to update the backend here
    console.log('Dragged', active.id, 'over', over.id);
    
    // TODO: Call backend to update timeline_order
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(
      new Date(new Date().setDate(new Date().getDate() - new Date().getDay()))
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getDayOfWeek = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', { weekday: 'long' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading timeline...</div>
      </div>
    );
  }

  const sortedDates = Object.keys(timelineData).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
            <p className="text-muted-foreground">
              Drag & drop to organize your tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="grid gap-4">
        {sortedDates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tasks in this period</p>
            </CardContent>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const tasks = timelineData[date];
            const taskIds = tasks.map((t) => t.id);

            return (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>
                      {getDayOfWeek(date)} - {formatDate(date)}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks</p>
                  ) : (
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={taskIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {tasks.map((task) => (
                          <SortableTaskItem key={task.id} task={task} />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
