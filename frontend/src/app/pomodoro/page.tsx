'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2 } from 'lucide-react';
import PomodoroTimer from '@/components/PomodoroTimer';

interface Task {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  done: boolean;
  estimated_minutes?: number;
  pomodoro_estimate?: number;
  pomodoro_completed?: number;
}

export default function PomodoroPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/tasks');
      const data = await res.json();
      // Filter incomplete tasks (show all, prioritize those with Pomodoro estimates)
      const incompleteTasks = data
        .filter((t: Task) => !t.done)
        .sort((a: Task, b: Task) => {
          // Sort: tasks with pomodoro_estimate first
          if (a.pomodoro_estimate && !b.pomodoro_estimate) return -1;
          if (!a.pomodoro_estimate && b.pomodoro_estimate) return 1;
          // Then by priority
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      setTasks(incompleteTasks);
      
      // Auto-select first task
      if (incompleteTasks.length > 0 && !selectedTask) {
        setSelectedTask(incompleteTasks[0]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePomodoroComplete = () => {
    // Reload tasks to get updated Pomodoro counts
    loadTasks();
  };

  const priorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
      low: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pomodoro Focus</h1>
          <p className="text-muted-foreground">
            25-minute focused work sessions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Tasks</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {tasks.length} tasks
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No incomplete tasks. <br />
                  Create some tasks to get started!
                </p>
              ) : (
                tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTask?.id === task.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          {task.pomodoro_estimate ? (
                            <span className="text-xs text-muted-foreground">
                              🍅 {task.pomodoro_completed || 0}/
                              {task.pomodoro_estimate}
                            </span>
                          ) : task.estimated_minutes ? (
                            <span className="text-xs text-muted-foreground">
                              ⏱️ {task.estimated_minutes}m
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              No estimate
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedTask?.id === task.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">
                      {tasks.reduce((sum, t) => sum + (t.pomodoro_completed || 0), 0)} 🍅
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${
                          tasks.length > 0
                            ? (tasks.reduce((sum, t) => sum + (t.pomodoro_completed || 0), 0) /
                                tasks.reduce((sum, t) => sum + (t.pomodoro_estimate || 0), 0)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Focus time: </span>
                  <span className="font-medium">
                    {tasks.reduce((sum, t) => sum + (t.pomodoro_completed || 0), 0) * 25} min
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pomodoro Timer */}
        <div className="lg:col-span-2">
          {selectedTask ? (
            <PomodoroTimer
              taskId={selectedTask.id}
              taskTitle={selectedTask.title}
              estimatedPomodoros={selectedTask.pomodoro_estimate}
              completedPomodoros={selectedTask.pomodoro_completed}
              onPomodoroComplete={handlePomodoroComplete}
            />
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a task to begin</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a task from the list to start your Pomodoro session
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
