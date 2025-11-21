"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TaskDetailDrawer from "./TaskDetailDrawer";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:8000/api";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "backlog" | "next" | "in_progress" | "blocked" | "done";
  previous_status?: "backlog" | "next" | "in_progress" | "blocked" | "done" | null;
  priority: "low" | "medium" | "high";
  task_type?: string;
  start_date?: string;
  due_at?: string;
  estimated_minutes?: number;
  parent_task_id?: number;
  labels?: Array<{ id: number; name: string; color: string }>;
  subtasks?: Task[];
  created_at?: string;
}

interface KanbanData {
  backlog: Task[];
  next: Task[];
  in_progress: Task[];
  blocked: Task[];
  done: Task[];
}

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100 dark:bg-gray-800" },
  { id: "next", title: "Next", color: "bg-blue-100 dark:bg-blue-950 hover:bg-blue-700" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-100 dark:bg-yellow-950 hover:bg-yellow-700" },
  { id: "blocked", title: "Blocked", color: "bg-red-100 dark:bg-red-950 hover:bg-red-700" },
  { id: "done", title: "Done", color: "bg-green-100 dark:bg-green-950 hover:bg-green-700" },
];

const PRIORITY_COLORS = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

// Helper function to calculate deadline status
const getDeadlineStatus = (task: Task): "overdue" | "warning" | "normal" => {
  if (!task.due_at) return "normal";
  
  const now = new Date();
  const dueDate = new Date(task.due_at);
  
  // Overdue - past due date
  if (now > dueDate) return "overdue";
  
  // Calculate percentage of time elapsed
  const startDate = task.start_date ? new Date(task.start_date) : new Date(task.created_at || now);
  const totalDuration = dueDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const percentElapsed = (elapsed / totalDuration) * 100;
  
  // Warning - over 90% of time elapsed
  if (percentElapsed >= 90) return "warning";
  
  return "normal";
};

// Background colors based on deadline status
const getDeadlineBackgroundColor = (status: "overdue" | "warning" | "normal"): string => {
  switch (status) {
    case "overdue":
      return "bg-red-900/15"; // Đỏ mờ khi quá hạn
    case "warning":
      return "bg-yellow-900/15"; // Vàng mờ khi gần hết hạn (>90%)
    default:
      return "bg-gray-800/50"; // Màu mặc định
  }
};

// Sort tasks by Priority -> Due Date -> Created Date (matching backend logic)
const sortTasks = (tasks: Task[]): Task[] => {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  
  return [...tasks].sort((a, b) => {
    // 1. Sort by priority (high > medium > low)
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // 2. Sort by due_at (nulls last, earlier dates first)
    if (a.due_at === null && b.due_at === null) {
      // Both null, continue to next criteria
    } else if (a.due_at === null) {
      return 1; // a goes after b
    } else if (b.due_at === null) {
      return -1; // a goes before b
    } else {
      const dateDiff = new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime();
      if (dateDiff !== 0) return dateDiff;
    }
    
    // 3. Sort by created_at (newest first)
    const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return createdB - createdA;
  });
};

export default function KanbanView() {
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    backlog: [],
    next: [],
    in_progress: [],
    blocked: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  
  // Create Dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("backlog");
  
  // Task Detail Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Create Form states
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    loadKanbanData();
  }, []);

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/tasks/kanban`);
      const data = await response.json();
      setKanbanData(data);
    } catch (error) {
      console.error("Failed to load kanban data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string, oldStatus: string) => {
    // 🎯 OPTIMISTIC UPDATE: Update UI immediately
    const taskToMove = kanbanData[oldStatus as keyof KanbanData].find(t => t.id === taskId);
    if (!taskToMove) return;

    const updatedTask = { ...taskToMove, status: newStatus as Task['status'] };
    
    const optimisticData = {
      ...kanbanData,
      [oldStatus]: kanbanData[oldStatus as keyof KanbanData].filter(t => t.id !== taskId),
      [newStatus]: sortTasks([...kanbanData[newStatus as keyof KanbanData], updatedTask])
    };
    
    setKanbanData(optimisticData);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // ❌ If failed, rollback to original state
        setKanbanData(kanbanData);
        console.error("Failed to update task status");
      }
    } catch (error) {
      // ❌ If failed, rollback to original state
      setKanbanData(kanbanData);
      console.error("Failed to update task status:", error);
    }
  };

  // Handle optimistic task update from drawer (e.g., toggle, edit)
  const handleTaskUpdated = (updatedTask: Task) => {
    // Find which column the task is currently in
    let currentColumn: string | null = null;
    for (const [status, tasks] of Object.entries(kanbanData)) {
      if (tasks.some((t: Task) => t.id === updatedTask.id)) {
        currentColumn = status;
        break;
      }
    }

    if (!currentColumn) return;

    const newStatus = updatedTask.status;
    
    // If status changed, move to new column (with animation!)
    if (currentColumn !== newStatus) {
      updateTaskStatus(updatedTask.id, newStatus, currentColumn);
    } else {
      // Just update the task in place, then re-sort (in case priority/due_at changed)
      const updatedTasks = kanbanData[currentColumn as keyof KanbanData].map(t =>
        t.id === updatedTask.id ? updatedTask : t
      );
      
      setKanbanData({
        ...kanbanData,
        [currentColumn]: sortTasks(updatedTasks),
      });
    }

    // Update selectedTask if it's the same task being edited
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleToggleTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening drawer when clicking toggle button
    e.preventDefault(); // Prevent any default behavior
    
    // Find current column to determine optimistic status
    let currentColumn: string | null = null;
    for (const [status, tasks] of Object.entries(kanbanData)) {
      if (tasks.some((t: Task) => t.id === task.id)) {
        currentColumn = status;
        break;
      }
    }
    
    if (!currentColumn) return;
    
    // Determine optimistic new status
    // If task is 'done', backend will restore from previous_status
    // If task is NOT 'done', mark as 'done'
    const optimisticStatus: Task["status"] = task.status === "done" 
      ? (task.previous_status || "in_progress") // Use saved previous_status or default
      : "done";
    const optimisticDone = optimisticStatus === "done";
    const optimisticTask = { 
      ...task, 
      status: optimisticStatus,
      done: optimisticDone 
    };
    
    // Optimistic UI update - move task to new column
    const updatedData = {
      ...kanbanData,
      [currentColumn]: kanbanData[currentColumn as keyof KanbanData].filter(t => t.id !== task.id),
      [optimisticStatus]: sortTasks([...kanbanData[optimisticStatus as keyof KanbanData], optimisticTask])
    };
    setKanbanData(updatedData);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        // Revert on error - move task back to original column
        const revertData = {
          ...kanbanData,
          [currentColumn]: sortTasks([...kanbanData[currentColumn as keyof KanbanData], task])
        };
        setKanbanData(revertData);
        console.error("Failed to toggle task");
      } else {
        // Sync with actual server response (may have different previous_status)
        const serverTask = await response.json();
        const finalData = {
          ...updatedData,
          [serverTask.status]: updatedData[serverTask.status as keyof KanbanData].map(t =>
            t.id === serverTask.id ? serverTask : t
          )
        };
        setKanbanData(finalData);
        
        // Update drawer if this task is selected
        if (selectedTask && selectedTask.id === serverTask.id) {
          setSelectedTask(serverTask);
        }
      }
    } catch (error) {
      // Revert on error
      const revertData = {
        ...kanbanData,
        [currentColumn]: sortTasks([...kanbanData[currentColumn as keyof KanbanData], task])
      };
      setKanbanData(revertData);
      console.error("Failed to toggle task:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id.toString());
    e.dataTransfer.setData("fromStatus", task.status);
    setDraggedTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const fromStatus = e.dataTransfer.getData("fromStatus");

    setDraggedTaskId(null);

    if (fromStatus !== toStatus) {
      updateTaskStatus(taskId, toStatus, fromStatus);
    }
  };

  // Handle task creation from dialog
  const handleTaskCreated = () => {
    setIsCreateDialogOpen(false);
    loadKanbanData(); // Reload data to show new task
  };

  const openCreateDialog = (status: string) => {
    setSelectedStatus(status);
    setIsCreateDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Kanban board...</div>
      </div>
    );
  }

  return (
    <>
      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        defaultStatus={selectedStatus}
        onTaskCreated={loadKanbanData}
      />

      {/* Kanban Board */}
      <div className="space-y-4">
        {/* Quick Add Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Kanban Board</h2>
          <Button onClick={() => openCreateDialog("backlog")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className={`flex flex-col space-y-3 rounded-lg transition-all ${
              draggedTaskId ? 'ring-2 ring-transparent hover:ring-primary/50' : ''
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header - Sticky */}
            <div className={`${column.color} rounded-lg p-3 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-opacity-95 shadow-md`}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">
                  {kanbanData[column.id as keyof KanbanData].length}
                </Badge>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0"
                onClick={() => openCreateDialog(column.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Tasks */}
            <div className="space-y-2 min-h-[200px]">
              <AnimatePresence mode="popLayout">
                {kanbanData[column.id as keyof KanbanData].map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.95 }}
                    transition={{
                      layout: { duration: 0.3, type: "spring", stiffness: 300, damping: 25 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 },
                    }}
                  >
                    <Card
                      draggable={task.id > 0} // Only allow dragging real tasks (not temp)
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => task.id > 0 && handleTaskClick(task)}
                      className={`p-3 transition-all border-gray-700 ${
                        task.id < 0 
                          ? 'opacity-60 animate-pulse cursor-wait bg-gray-800/50' // Temp task loading state
                          : draggedTaskId === task.id 
                            ? 'opacity-50 scale-95 cursor-move bg-gray-800/50' 
                            : `opacity-100 cursor-pointer hover:shadow-md hover:shadow-primary/40 ${getDeadlineBackgroundColor(getDeadlineStatus(task))}`
                      }`}
                    >
                  <div className="flex items-start gap-2">
                    {/* Toggle Checkbox Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleTask(task, e)}
                      className={`mt-0.5 shrink-0 transition-all hover:scale-110 ${
                        task.status === "done" 
                          ? "text-green-500 hover:text-green-400" 
                          : "text-gray-500 hover:text-gray-400"
                      }`}
                      title={task.status === "done" ? "Mark as in progress" : "Mark as done"}
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight flex-1 min-w-0 line-clamp-2">
                          {task.title}
                          {task.id < 0 && <span className="text-muted-foreground ml-1">(creating...)</span>}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Subtask count indicator */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span className="text-xs text-muted-foreground bg-gray-700 px-1.5 py-0.5 rounded" title={`${task.subtasks.length} subtasks`}>
                              {task.subtasks.length}
                            </span>
                          )}
                          <div
                            className={`h-2 w-2 rounded-full ${
                              PRIORITY_COLORS[task.priority]
                            }`}
                            title={`${task.priority} priority`}
                          />
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.map((label) => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="text-xs"
                              style={{
                                backgroundColor: `${label.color}20`,
                                borderColor: label.color,
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {task.estimated_minutes && (
                        <div className="text-xs text-muted-foreground">
                          ⏱️ {Math.round(task.estimated_minutes / 60)}h{" "}
                          {task.estimated_minutes % 60}m
                        </div>
                      )}

                      {/* Due date badge with warning colors */}
                      {task.due_at && (
                        <div className="flex items-center gap-1">
                          {(() => {
                            const deadlineStatus = getDeadlineStatus(task);
                            const dueDate = new Date(task.due_at);
                            const now = new Date();
                            const isToday = dueDate.toDateString() === now.toDateString();
                            const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === dueDate.toDateString();
                            
                            let badgeColor = "text-gray-400";
                            let icon = "📅";
                            
                            if (deadlineStatus === "overdue") {
                              badgeColor = "text-red-400";
                              icon = "🔴";
                            } else if (deadlineStatus === "warning") {
                              badgeColor = "text-yellow-400";
                              icon = "⚠️";
                            } else if (isToday) {
                              badgeColor = "text-blue-400";
                              icon = "📌";
                            } else if (isTomorrow) {
                              badgeColor = "text-orange-400";
                              icon = "⏰";
                            }
                            
                            return (
                              <span className={`text-xs ${badgeColor} flex items-center gap-1`}>
                                <span>{icon}</span>
                                <span>
                                  {deadlineStatus === "overdue" ? "Overdue" : 
                                   isToday ? "Today" : 
                                   isTomorrow ? "Tomorrow" : 
                                   dueDate.toLocaleDateString()}
                                </span>
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
    </div>
      
      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={loadKanbanData}
        onSelectTask={(task) => {
          setSelectedTask(task);
          // Drawer stays open to show the new task
        }}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  );
}
