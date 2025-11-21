"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Edit,
  Save,
  Trash2,
  Copy,
  Plus,
  Check,
  Clock,
  Calendar,
  Tag,
  Link as LinkIcon,
  MessageSquare,
  CheckCircle2,
  Circle,
  History,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "backlog" | "next" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high";
  start_date?: string;
  due_at?: string;
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

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onSelectTask?: (task: Task) => void; // Navigate to another task
  onTaskUpdated?: (updatedTask: Task) => void; // Optimistic update single task
}

const PRIORITY_COLORS = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "next", label: "Next" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export default function TaskDetailDrawer({
  task,
  isOpen,
  onClose,
  onUpdate,
  onSelectTask,
  onTaskUpdated,
}: TaskDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);

  // Fetch parent task if this is a subtask
  useEffect(() => {
    const fetchParentTask = async () => {
      if (task?.parent_task_id) {
        try {
          const response = await fetch(`${API_BASE_URL}/tasks/${task.parent_task_id}`);
          if (response.ok) {
            const data = await response.json();
            setParentTask(data);
          }
        } catch (error) {
          console.error("Failed to fetch parent task:", error);
        }
      } else {
        setParentTask(null);
      }
    };

    fetchParentTask();
  }, [task?.parent_task_id]);

  // Fetch subtasks if this is a parent task
  useEffect(() => {
    const fetchSubtasks = async () => {
      if (task?.id) {
        try {
          const response = await fetch(`${API_BASE_URL}/tasks/${task.id}/subtasks`);
          if (response.ok) {
            const data = await response.json();
            setSubtasks(data);
          }
        } catch (error) {
          console.error("Failed to fetch subtasks:", error);
          setSubtasks([]);
        }
      }
    };

    fetchSubtasks();
  }, [task?.id]);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setIsEditing(false);
    }
  }, [task]);

  if (!task || !editedTask) return null;

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTask.title,
          description: editedTask.description,
          status: editedTask.status,
          priority: editedTask.priority,
          start_date: editedTask.start_date,
          due_at: editedTask.due_at,
          estimated_minutes: editedTask.estimated_minutes,
          user_id: 1,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setIsEditing(false);
        
        // Use optimistic update if available, otherwise fallback to full reload
        if (onTaskUpdated) {
          onTaskUpdated(updatedTask);
        } else {
          onUpdate?.();
        }
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onClose();
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${task.title} (Copy)`,
          description: task.description,
          status: task.status,
          priority: task.priority,
          start_date: task.start_date,
          due_at: task.due_at,
          estimated_minutes: task.estimated_minutes,
          user_id: 1,
        }),
      });

      if (response.ok) {
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to duplicate task:", error);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubtaskTitle,
          user_id: 1,
        }),
      });

      if (response.ok) {
        const newSubtask = await response.json();
        setSubtasks([...subtasks, newSubtask]); // Add to local state immediately
        setNewSubtaskTitle("");
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to add subtask:", error);
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    // Optimistic update - update UI immediately for better UX
    const optimisticStatus = subtask.status === "done" ? "in_progress" : "done";
    const optimisticTask = { ...subtask, status: optimisticStatus } as Task;
    
    setSubtasks(subtasks.map(st => 
      st.id === subtask.id ? optimisticTask : st
    ));

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${subtask.id}/toggle`, {
        method: "PATCH",
      });
      
      if (!response.ok) {
        // Revert optimistic update on error
        setSubtasks(subtasks.map(st => 
          st.id === subtask.id ? subtask : st
        ));
        console.error("Failed to toggle subtask");
      } else {
        // Notify parent component to update this task optimistically (no re-fetch)
        // Use our optimistic task, not server response (to avoid double update)
        if (onTaskUpdated) {
          onTaskUpdated(optimisticTask);
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setSubtasks(subtasks.map(st => 
        st.id === subtask.id ? subtask : st
      ));
      console.error("Failed to toggle subtask:", error);
    }
  };

  const handleToggleCurrentTask = async () => {
    if (!task) return;
    
    // Optimistic update - determine new status
    const optimisticStatus: Task["status"] = task.status === "done" ? "in_progress" : "done";
    const optimisticTask = { ...task, status: optimisticStatus };
    
    // Notify parent to update UI immediately
    if (onTaskUpdated) {
      onTaskUpdated(optimisticTask);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}/toggle`, {
        method: "PATCH",
      });
      
      if (!response.ok) {
        // Revert on error
        if (onTaskUpdated) {
          onTaskUpdated(task);
        }
        console.error("Failed to toggle task");
      }
      // Don't update again - optimistic update is enough
    } catch (error) {
      // Revert on error
      if (onTaskUpdated) {
        onTaskUpdated(task);
      }
      console.error("Failed to toggle task:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between pr-8">
            <span>Task Details</span>
            <div className="flex items-center gap-2">
              {/* Toggle Done Button */}
              <Button 
                size="sm" 
                variant={task.status === "done" ? "default" : "outline"}
                onClick={handleToggleCurrentTask}
                className="gap-2"
              >
                {task.status === "done" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as In Progress
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4" />
                    Mark as Done
                  </>
                )}
              </Button>
              
              {isEditing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDuplicate}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            {isEditing ? (
              <Input
                id="task-title"
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
              />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <span className="text-xs text-gray-500">#{task.id}</span>
              </div>
            )}
          </div>

          {/* Parent Task Info (if this is a subtask) */}
          {task.parent_task_id && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer"
              onClick={() => {
                if (parentTask && onSelectTask) {
                  onSelectTask(parentTask);
                }
              }}
            >
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-blue-400 font-medium">Subtask of:</span>
                {parentTask ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-200 font-medium hover:text-white transition-colors">{parentTask.title}</span>
                    <span className="text-xs text-gray-400">#{parentTask.id}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Loading parent task...</span>
                )}
              </div>
            </div>
          )}

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              {isEditing ? (
                <Select
                  value={editedTask.status}
                  onValueChange={(value) =>
                    setEditedTask({
                      ...editedTask,
                      status: value as Task["status"],
                    })
                  }
                >
                  <SelectTrigger id="task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">
                  {task.status.replace("_", " ")}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              {isEditing ? (
                <Select
                  value={editedTask.priority}
                  onValueChange={(value) =>
                    setEditedTask({
                      ...editedTask,
                      priority: value as Task["priority"],
                    })
                  }
                >
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={PRIORITY_COLORS[task.priority]}>
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              {isEditing ? (
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={
                    editedTask.start_date
                      ? new Date(editedTask.start_date).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, start_date: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm">
                  {task.start_date
                    ? new Date(task.start_date).toLocaleString()
                    : "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              {isEditing ? (
                <Input
                  id="due-date"
                  type="datetime-local"
                  value={
                    editedTask.due_at
                      ? new Date(editedTask.due_at).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, due_at: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm">
                  {task.due_at
                    ? new Date(task.due_at).toLocaleString()
                    : "Not set"}
                </p>
              )}
            </div>
          </div>

          {/* Time Estimate */}
          <div className="space-y-2">
            <Label htmlFor="estimated-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estimated Time (minutes)
            </Label>
            {isEditing ? (
              <Input
                id="estimated-time"
                type="number"
                value={editedTask.estimated_minutes || ""}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    estimated_minutes: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />
            ) : (
              <p className="text-sm">
                {task.estimated_minutes
                  ? `${Math.floor(task.estimated_minutes / 60)}h ${
                      task.estimated_minutes % 60
                    }m`
                  : "Not set"}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            {isEditing ? (
              <Textarea
                id="task-description"
                rows={4}
                value={editedTask.description || ""}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, description: e.target.value })
                }
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {task.description || "No description"}
              </p>
            )}
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Subtasks</Label>
              <Badge variant="secondary">
                {subtasks.filter((s) => s.status === "done").length} /{" "}
                {subtasks.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {subtasks.length > 0 ? (
                subtasks.map((subtask) => (
                  <Card 
                    key={subtask.id} 
                    className="p-3 ml-4 border-l-2 border-l-blue-500/50 bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
                    onClick={(e) => {
                      // Don't navigate if clicking the checkbox
                      if ((e.target as HTMLElement).closest('button')) {
                        return;
                      }
                      if (onSelectTask) {
                        onSelectTask(subtask);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-3 h-3 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleToggleSubtask(subtask);
                        }}
                        className="shrink-0 hover:scale-110 active:scale-95 transition-transform duration-150"
                        title={subtask.status === "done" ? "Mark as not done" : "Mark as done"}
                      >
                        {subtask.status === "done" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-muted-foreground rounded hover:border-green-600 transition-colors" />
                        )}
                      </button>
                      <span
                        className={`text-sm flex-1 ${
                          subtask.status === "done"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {subtask.title}
                      </span>
                      <span className="text-xs text-gray-500">#{subtask.id}</span>
                      {subtask.priority && (
                        <div
                          className={`h-2 w-2 rounded-full ${
                            subtask.priority === "high"
                              ? "bg-red-500"
                              : subtask.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                          title={`${subtask.priority} priority`}
                        />
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No subtasks yet</p>
              )}

              {/* Add Subtask */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSubtask();
                  }}
                />
                <Button size="sm" onClick={handleAddSubtask}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Labels
              </Label>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((label) => (
                  <Badge
                    key={label.id}
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {((task.dependencies && task.dependencies.length > 0) ||
            (task.blocking && task.blocking.length > 0)) && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Dependencies
              </Label>

              {task.dependencies && task.dependencies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Blocked by:</p>
                  {task.dependencies.map((dep) => (
                    <Card key={dep.id} className="p-2">
                      <span className="text-sm">{dep.task?.title}</span>
                    </Card>
                  ))}
                </div>
              )}

              {task.blocking && task.blocking.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Blocking:</p>
                  {task.blocking.map((block) => (
                    <Card key={block.id} className="p-2">
                      <span className="text-sm">{block.task?.title}</span>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity History */}
          {task.logs && task.logs.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Activity History
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {task.logs.map((log) => (
                  <Card key={log.id} className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {log.event_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      {log.comment && (
                        <p className="text-sm">{log.comment}</p>
                      )}
                      {log.changes && (
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
