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
}: TaskDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newNote, setNewNote] = useState("");

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
        setIsEditing(false);
        onUpdate?.();
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
        setNewSubtaskTitle("");
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to add subtask:", error);
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    try {
      await fetch(`${API_BASE_URL}/tasks/${subtask.id}/toggle`, {
        method: "PATCH",
      });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between pr-8">
            <span>Task Details</span>
            <div className="flex items-center gap-2">
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
              <h3 className="text-lg font-semibold">{task.title}</h3>
            )}
          </div>

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
                {task.subtasks?.filter((s) => s.status === "done").length || 0} /{" "}
                {task.subtasks?.length || 0}
              </Badge>
            </div>

            <div className="space-y-2">
              {task.subtasks && task.subtasks.length > 0 ? (
                task.subtasks.map((subtask) => (
                  <Card key={subtask.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleSubtask(subtask)}
                        className="shrink-0"
                      >
                        {subtask.status === "done" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-muted-foreground rounded" />
                        )}
                      </button>
                      <span
                        className={`text-sm ${
                          subtask.status === "done"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {subtask.title}
                      </span>
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
