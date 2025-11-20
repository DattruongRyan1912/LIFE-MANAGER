"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TaskDetailDrawer from "./TaskDetailDrawer";

const API_BASE_URL = "http://localhost:8000/api";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "backlog" | "next" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high";
  due_at?: string;
  estimated_minutes?: number;
  labels?: Array<{ id: number; name: string; color: string }>;
}

interface KanbanData {
  backlog: Task[];
  next: Task[];
  in_progress: Task[];
  blocked: Task[];
  done: Task[];
}

const COLUMN_NAMES = {
  backlog: "Backlog",
  next: "Next",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

const PRIORITY_COLORS = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

export default function TodayTasksView() {
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    backlog: [],
    next: [],
    in_progress: [],
    blocked: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  // Create Task Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState("");

  // Task Detail Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    loadTodayTasks();
  }, []);

  const loadTodayTasks = async () => {
    try {
      setLoading(true);
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const response = await fetch(`${API_BASE_URL}/tasks`);
      const allTasks: Task[] = await response.json();
      
      // Filter tasks with due_at matching today
      const todayTasks = allTasks.filter(task => {
        if (!task.due_at) return false;
        const dueDate = new Date(task.due_at);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.toISOString().split('T')[0] === todayStr;
      });

      // Group tasks by status
      const grouped: KanbanData = {
        backlog: todayTasks.filter((t) => t.status === "backlog"),
        next: todayTasks.filter((t) => t.status === "next"),
        in_progress: todayTasks.filter((t) => t.status === "in_progress"),
        blocked: todayTasks.filter((t) => t.status === "blocked"),
        done: todayTasks.filter((t) => t.status === "done"),
      };

      setKanbanData(grouped);
    } catch (error) {
      console.error("Failed to load today's tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (
    taskId: number,
    newStatus: string,
    oldStatus: string
  ) => {
    const taskToMove = kanbanData[oldStatus as keyof KanbanData].find(
      (t) => t.id === taskId
    );
    if (!taskToMove) return;

    // Optimistic update
    const optimisticData = {
      ...kanbanData,
      [oldStatus]: kanbanData[oldStatus as keyof KanbanData].filter(
        (t) => t.id !== taskId
      ),
      [newStatus]: [
        ...kanbanData[newStatus as keyof KanbanData],
        { ...taskToMove, status: newStatus as Task["status"] },
      ],
    };

    setKanbanData(optimisticData);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Rollback on error
        setKanbanData(kanbanData);
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      setKanbanData(kanbanData);
    }
  };

  const handleDragStart = (taskId: number) => {
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDrop = (newStatus: string) => {
    if (!draggedTaskId) return;

    const oldStatus = (Object.keys(kanbanData) as Array<keyof KanbanData>).find(
      (status) => kanbanData[status].some((t) => t.id === draggedTaskId)
    );

    if (oldStatus && oldStatus !== newStatus) {
      updateTaskStatus(draggedTaskId, newStatus, oldStatus);
    }

    setDraggedTaskId(null);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;

    // Set due_at to today at current time
    const today = new Date();
    const dueAtValue = newDueDate || today.toISOString();

    const tempTask: Task = {
      id: Date.now() * -1,
      title: newTitle + " (creating...)",
      description: newDescription || undefined,
      status: "next",
      priority: newPriority,
      due_at: dueAtValue,
      estimated_minutes: newEstimatedMinutes ? parseInt(newEstimatedMinutes) : undefined,
    };

    setKanbanData((prev) => ({
      ...prev,
      next: [...prev.next, tempTask],
    }));

    setIsCreateDialogOpen(false);
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setNewDueDate("");
    setNewEstimatedMinutes("");

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || undefined,
          priority: newPriority,
          status: "next",
          due_at: dueAtValue,
          estimated_minutes: newEstimatedMinutes ? parseInt(newEstimatedMinutes) : undefined,
          user_id: 1,
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setKanbanData((prev) => ({
          ...prev,
          next: prev.next.map((t) => (t.id === tempTask.id ? newTask : t)),
        }));
      } else {
        setKanbanData((prev) => ({
          ...prev,
          next: prev.next.filter((t) => t.id !== tempTask.id),
        }));
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      setKanbanData((prev) => ({
        ...prev,
        next: prev.next.filter((t) => t.id !== tempTask.id),
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading today's tasks...</div>
      </div>
    );
  }

  const todayDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const totalTasks = Object.values(kanbanData).reduce((sum, tasks) => sum + tasks.length, 0);

  return (
    <>
      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task for Today</DialogTitle>
            <DialogDescription>
              Add a new task to your today's schedule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Task title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Task description..."
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newPriority}
                  onValueChange={(v) => setNewPriority(v as any)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated">Estimated (minutes)</Label>
                <Input
                  id="estimated"
                  type="number"
                  placeholder="60"
                  value={newEstimatedMinutes}
                  onChange={(e) => setNewEstimatedMinutes(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Time (optional)</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTitle.trim()}>
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Today's Tasks</h1>
              <p className="text-muted-foreground">{todayDate}</p>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Stats */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks Today</p>
              <p className="text-3xl font-bold">{totalTasks}</p>
            </div>
            <div className="flex gap-4">
              {Object.entries(kanbanData).map(([status, tasks]) => (
                <div key={status} className="text-center">
                  <p className="text-xs text-muted-foreground">{COLUMN_NAMES[status as keyof typeof COLUMN_NAMES]}</p>
                  <p className="text-lg font-semibold">{tasks.length}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Kanban Board */}
        <div className="grid grid-cols-5 gap-4">
          {(Object.keys(kanbanData) as Array<keyof KanbanData>).map((status) => (
            <div
              key={status}
              className="flex flex-col gap-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-sm">
                  {COLUMN_NAMES[status]}
                </h3>
                <Badge variant="secondary">{kanbanData[status].length}</Badge>
              </div>

              {/* Tasks */}
              <div className="space-y-2 min-h-[200px]">
                {kanbanData[status].map((task) => (
                  <Card
                    key={task.id}
                    draggable={task.id > 0}
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => task.id > 0 && handleTaskClick(task)}
                    className={`p-3 transition-all ${
                      task.id < 0
                        ? "opacity-60 animate-pulse cursor-wait"
                        : draggedTaskId === task.id
                        ? "opacity-50 scale-95 cursor-move"
                        : "opacity-100 cursor-pointer hover:shadow-md"
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Task Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h4 className="font-medium text-sm truncate">
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              PRIORITY_COLORS[task.priority]
                            }`}
                          />
                        </div>
                      </div>

                      {/* Task Meta */}
                      {task.estimated_minutes && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>⏱️ {task.estimated_minutes}m</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
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
        onUpdate={loadTodayTasks}
      />
    </>
  );
}
