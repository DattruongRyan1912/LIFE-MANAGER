"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

interface Task {
  id: number;
  title: string;
  status: string;
  priority: "low" | "medium" | "high";
  start_date?: string;
  due_at?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  labels?: Array<{ id: number; name: string; color: string }>;
  dependencies?: Array<{ id: number; blocked_by_task_id: number }>;
}

const PRIORITY_COLORS = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

const STATUS_COLORS = {
  backlog: "bg-gray-500",
  next: "bg-blue-500",
  in_progress: "bg-yellow-500",
  blocked: "bg-red-500",
  done: "bg-green-500",
};

export default function TimelineView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState(new Date());
  const [viewDays, setViewDays] = useState(7); // Default to 7 days view
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set view to start from 3 days ago to show today in the middle
    const start = new Date();
    start.setDate(start.getDate() - 3);
    start.setHours(0, 0, 0, 0);
    setViewStart(start);
    loadTimelineTasks();
  }, []);

  const loadTimelineTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/tasks`);
      const data = await response.json();
      
      // Filter tasks that have start_date or due_at
      const tasksWithDates = data.filter(
        (task: Task) => task.start_date || task.due_at
      );
      
      // Sort by start_date or due_at
      tasksWithDates.sort((a: Task, b: Task) => {
        const dateA = new Date(a.start_date || a.due_at || "").getTime();
        const dateB = new Date(b.start_date || b.due_at || "").getTime();
        return dateA - dateB;
      });
      
      setTasks(tasksWithDates);
    } catch (error) {
      console.error("Failed to load timeline tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const calculateDuration = (task: Task) => {
    if (!task.start_date || !task.due_at) return null;
    const start = new Date(task.start_date).getTime();
    const end = new Date(task.due_at).getTime();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  };

  const getProgressPercentage = (task: Task) => {
    if (task.status === "done") return 100;
    if (!task.estimated_minutes || !task.actual_minutes) return 0;
    return Math.min((task.actual_minutes / task.estimated_minutes) * 100, 100);
  };

  // Check if task is visible in current view range
  const isTaskInView = (task: Task) => {
    let taskStartDate: Date;
    let taskEndDate: Date;
    
    if (task.start_date && task.due_at) {
      taskStartDate = new Date(task.start_date);
      taskEndDate = new Date(task.due_at);
    } else if (task.due_at) {
      taskEndDate = new Date(task.due_at);
      taskStartDate = new Date(taskEndDate);
    } else if (task.start_date) {
      taskStartDate = new Date(task.start_date);
      taskEndDate = new Date(taskStartDate);
    } else {
      return false;
    }
    
    const viewEndDate = new Date(viewStart);
    viewEndDate.setDate(viewEndDate.getDate() + viewDays);
    
    // Check if task overlaps with view range
    // Task is visible if: taskEnd >= viewStart AND taskStart <= viewEnd
    return taskEndDate.getTime() >= viewStart.getTime() && 
           taskStartDate.getTime() <= viewEndDate.getTime();
  };

  // Calculate position of task bar in timeline
  const getTaskPosition = (task: Task) => {
    // Determine start and end dates for the bar
    let startDate: Date;
    let endDate: Date;
    
    if (task.start_date && task.due_at) {
      // Both dates available - full range
      startDate = new Date(task.start_date);
      endDate = new Date(task.due_at);
    } else if (task.due_at) {
      // Only due_at - show bar ON the due date (not before)
      endDate = new Date(task.due_at);
      startDate = new Date(endDate);
      // Start at beginning of the day
      startDate.setHours(0, 0, 0, 0);
      // End at end of the day
      endDate.setHours(23, 59, 59, 999);
    } else if (task.start_date) {
      // Only start_date - show bar ON the start date
      startDate = new Date(task.start_date);
      endDate = new Date(startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Fallback - shouldn't happen
      startDate = new Date();
      endDate = new Date();
      return { left: '0%', width: '0%', minWidth: '0px', visible: false };
    }
    
    const viewEndDate = new Date(viewStart);
    viewEndDate.setDate(viewEndDate.getDate() + viewDays);
    
    const totalMs = viewEndDate.getTime() - viewStart.getTime();
    const startOffset = startDate.getTime() - viewStart.getTime();
    const duration = Math.max(endDate.getTime() - startDate.getTime(), 1000); // Min 1 second
    
    // Calculate position as percentage
    const left = Math.max(0, (startOffset / totalMs) * 100);
    
    // Calculate width
    const calculatedWidth = (duration / totalMs) * 100;
    const minWidthPercent = 1.5; // 1.5% minimum
    const width = Math.max(calculatedWidth, minWidthPercent);
    
    // Ensure bar doesn't overflow
    const maxWidth = 100 - left;
    const finalWidth = Math.min(width, maxWidth);
    
    return { 
      left: `${left}%`, 
      width: `${finalWidth}%`,
      minWidth: '40px', // Pixel minimum for visibility
      visible: true
    };
  };

  const handlePrevious = () => {
    const newStart = new Date(viewStart);
    newStart.setDate(newStart.getDate() - 7);
    setViewStart(newStart);
  };

  const handleNext = () => {
    const newStart = new Date(viewStart);
    newStart.setDate(newStart.getDate() + 7);
    setViewStart(newStart);
  };

  const handleToday = () => {
    const today = new Date();
    // Center today in the view by starting 3 days before
    today.setDate(today.getDate() - 3);
    today.setHours(0, 0, 0, 0);
    setViewStart(today);
  };

  const handleZoomIn = () => {
    // Zoom in: reduce days (min 7 days)
    setViewDays(Math.max(7, viewDays - 7));
  };

  const handleZoomOut = () => {
    // Zoom out: increase days (max 90 days)
    setViewDays(Math.min(90, viewDays + 7));
  };

  // Generate date headers
  const generateDateHeaders = () => {
    const headers = [];
    for (let i = 0; i < viewDays; i++) {
      const date = new Date(viewStart);
      date.setDate(date.getDate() + i);
      headers.push(date);
    }
    return headers;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const dateHeaders = generateDateHeaders();
  
  // Memoize task levels - recalculate when tasks, viewStart, or viewDays change
  const taskLevels = useMemo(() => {
    const levels: Task[][] = [];
    
    // Filter to only tasks visible in current view
    const visibleTasks = tasks.filter(isTaskInView);
    
    visibleTasks.forEach((task) => {
      const taskStart = new Date(task.start_date || task.due_at!).getTime();
      const taskEnd = new Date(task.due_at || task.start_date!).getTime();
      
      let assignedLevel = -1;
      
      // Find the first level where this task doesn't overlap
      for (let i = 0; i < levels.length; i++) {
        const levelTasks = levels[i];
        const hasOverlap = levelTasks.some((t) => {
          const tStart = new Date(t.start_date || t.due_at!).getTime();
          const tEnd = new Date(t.due_at || t.start_date!).getTime();
          return !(taskEnd < tStart || taskStart > tEnd);
        });
        
        if (!hasOverlap) {
          assignedLevel = i;
          break;
        }
      }
      
      // If no level found, create new level
      if (assignedLevel === -1) {
        assignedLevel = levels.length;
        levels.push([]);
      }
      
      levels[assignedLevel].push(task);
    });
    
    return levels;
  }, [tasks, viewStart, viewDays]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Timeline / Gantt View</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tasks • {viewDays} days view
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No tasks with dates found. Add start dates or due dates to see them here.
        </Card>
      ) : (
        <Card className="p-4 overflow-hidden">
          <div className="overflow-x-auto" ref={timelineRef}>
            <div className="min-w-[1000px]">
              {/* Date Headers */}
              <div className="flex border-b border-border mb-4 pb-2">
                <div className="w-[150px] shrink-0 pr-3">
                  <span className="text-sm font-semibold">Task Name</span>
                </div>
                <div className="flex-1 flex">
                  {dateHeaders.map((date, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 text-center text-xs ${
                        isToday(date)
                          ? "font-bold text-primary"
                          : isWeekend(date)
                          ? "text-muted-foreground bg-muted/30"
                          : ""
                      }`}
                    >
                      <div>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                      <div className="text-[10px]">{date.getDate()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Grid */}
              <div className="space-y-2 relative">
                {/* Background grid for all rows */}
                <div className="absolute inset-0 flex pointer-events-none">
                  <div className="w-[150px] shrink-0" />
                  <div className="flex-1 flex">
                    {dateHeaders.map((date, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 border-l border-border/30 ${
                          isToday(date) ? "bg-primary/5" : ""
                        } ${isWeekend(date) ? "bg-muted/20" : ""}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Task rows */}
                {taskLevels.map((level, levelIdx) => (
                  <div key={levelIdx} className="flex h-12 relative z-10">
                    {level.map((task) => {
                      const position = getTaskPosition(task);
                      const progress = getProgressPercentage(task);
                      const statusColor = STATUS_COLORS[task.status as keyof typeof STATUS_COLORS];

                      return (
                        <div
                          key={task.id}
                          className="flex items-center h-full w-full"
                        >
                          {/* Task name */}
                          <div className="w-[150px] shrink-0 pr-3 truncate text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  PRIORITY_COLORS[task.priority]
                                }`}
                              />
                              <span className="truncate">{task.title}</span>
                            </div>
                          </div>

                          {/* Timeline bar container */}
                          <div className="flex-1 relative h-full">
                            <div
                              className={`absolute ${statusColor} rounded-md h-8 cursor-pointer hover:shadow-lg transition-all group border border-white/30`}
                              style={{
                                left: position.left,
                                width: position.width,
                                minWidth: position.minWidth,
                                top: '2px',
                              }}
                              title={`${task.title}\n${formatDate(
                                task.start_date
                              )} → ${formatDate(task.due_at)}`}
                            >
                              {/* Progress overlay */}
                              <div
                                className="absolute inset-0 bg-white/20 rounded-md transition-all"
                                style={{ width: `${progress}%` }}
                              />

                              {/* Task label on bar */}
                              <div className="absolute inset-0 flex items-center px-2">
                                <span className="text-xs text-white font-medium truncate">
                                  {task.title}
                                </span>
                              </div>

                              {/* Hover tooltip */}
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                                <Card className="p-2 text-xs space-y-1 min-w-[200px] shadow-lg">
                                  <div className="font-semibold">{task.title}</div>
                                  <div className="text-muted-foreground">
                                    {formatDate(task.start_date)} →{" "}
                                    {formatDate(task.due_at)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={statusColor} variant="outline">
                                      {task.status.replace("_", " ")}
                                    </Badge>
                                    <Badge variant="outline">{task.priority}</Badge>
                                  </div>
                                  {task.estimated_minutes && (
                                    <div>
                                      Est: {Math.floor(task.estimated_minutes / 60)}h{" "}
                                      {task.estimated_minutes % 60}m
                                    </div>
                                  )}
                                </Card>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Today indicator line */}
              <div className="relative h-0">
                <div className="absolute inset-0 flex">
                  <div className="w-48 shrink-0" />
                  <div className="flex-1 flex">
                    {dateHeaders.map((date, idx) => {
                      if (isToday(date)) {
                        return (
                          <div
                            key={idx}
                            className="flex-1 relative"
                            style={{ marginLeft: `${(idx / dateHeaders.length) * 100}%` }}
                          >
                            <div className="absolute left-0 top-0 w-0.5 h-full bg-primary -translate-y-full" />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div className="font-semibold">Legend:</div>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`h-3 w-6 ${color} rounded`} />
              <span className="capitalize">{status.replace("_", " ")}</span>
            </div>
          ))}
          <div className="h-4 w-px bg-border" />
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-2">
              <div className={`h-2 w-2 ${color} rounded-full`} />
              <span className="capitalize">{priority}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
