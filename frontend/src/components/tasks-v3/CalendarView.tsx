"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskDetailDrawer from "./TaskDetailDrawer";

const API_BASE_URL = "http://localhost:8000/api";

interface Task {
  id: number;
  title: string;
  status: "backlog" | "next" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high";
  task_type?: "single" | "recurring" | "milestone";
  due_at?: string;
  start_date?: string;
  description?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  parent_task_id?: number;
  labels?: Array<{ id: number; name: string; color: string }>;
  subtasks?: Task[];
  dependencies?: Array<{ id: number; blocked_by_task_id: number; task: Task }>;
  blocking?: Array<{ id: number; task_id: number; task: Task }>;
  logs?: Array<{
    id: number;
    event_type: string;
    changes: any;
    comment?: string;
    created_at: string;
  }>;
}

const PRIORITY_COLORS = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Task Detail Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Modal states for showing all tasks of a day
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadCalendarTasks();
  }, [currentDate]);

  const loadCalendarTasks = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const response = await fetch(
        `${API_BASE_URL}/tasks/calendar?start_date=${startOfMonth.toISOString()}&end_date=${endOfMonth.toISOString()}`
      );
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to load calendar tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getTasksForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => {
      if (!task.due_at) return false;
      const taskDate = new Date(task.due_at).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
    setIsTasksModalOpen(false); // Close modal if open
  };

  const handleShowAllTasks = (date: Date, dayTasks: Task[]) => {
    setSelectedDate(date);
    setSelectedDayTasks(dayTasks);
    setIsTasksModalOpen(true);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days = getDaysInMonth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tasks Modal */}
      <Dialog open={isTasksModalOpen} onOpenChange={setIsTasksModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && (
                <>Tasks for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}</>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {selectedDayTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tasks for this day</p>
            ) : (
              selectedDayTasks.map((task) => (
                <Card 
                  key={task.id} 
                  onClick={() => handleTaskClick(task)}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={`h-2 w-2 rounded-full ${PRIORITY_COLORS[task.priority]}`}
                        />
                        <Badge variant="outline" className="text-xs">
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.estimated_minutes && (
                        <span className="flex items-center gap-1">
                          ⏱️ {task.estimated_minutes}m
                        </span>
                      )}
                      {task.due_at && (
                        <span>
                          🕐 {new Date(task.due_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                      <Badge 
                        className={`text-xs ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    {task.labels && task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.labels.map((label) => (
                          <Badge 
                            key={label.id} 
                            style={{ backgroundColor: label.color }}
                            className="text-xs"
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsTasksModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{monthYear}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold text-sm py-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((date, index) => {
          const dayTasks = date ? getTasksForDate(date) : [];
          const isToday =
            date && date.toDateString() === new Date().toDateString();

          return (
            <Card
              key={index}
              className={`p-2 min-h-[120px] ${
                !date ? "bg-muted/50" : ""
              } ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              {date && (
                <>
                  <div className="text-sm font-medium mb-2">
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer truncate"
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              PRIORITY_COLORS[task.priority]
                            }`}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <button 
                        onClick={() => handleShowAllTasks(date, dayTasks)}
                        className="w-full text-xs text-primary hover:text-primary/80 text-center py-1 hover:bg-primary/10 rounded transition-colors"
                      >
                        +{dayTasks.length - 3} more tasks
                      </button>
                    )}
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={loadCalendarTasks}
      />
    </div>
  );
}
