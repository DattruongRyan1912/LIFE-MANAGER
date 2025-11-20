"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  task_type: string;
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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskEstimatedMinutes, setNewTaskEstimatedMinutes] = useState("");
  
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

    const optimisticData = {
      ...kanbanData,
      [oldStatus]: kanbanData[oldStatus as keyof KanbanData].filter(t => t.id !== taskId),
      [newStatus]: [...kanbanData[newStatus as keyof KanbanData], { ...taskToMove, status: newStatus as Task['status'] }]
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

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    // 🎯 Create temporary task with negative ID (will be replaced by real ID)
    const tempTask: Task = {
      id: Date.now() * -1, // Negative ID to indicate temporary
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority,
      status: selectedStatus as Task['status'],
      task_type: "work",
      due_at: newTaskDueDate || undefined,
      estimated_minutes: newTaskEstimatedMinutes ? parseInt(newTaskEstimatedMinutes) : undefined,
    };

    // Reset form and close dialog immediately
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskDueDate("");
    setNewTaskEstimatedMinutes("");
    setIsCreateDialogOpen(false);

    // 🎯 OPTIMISTIC UPDATE: Add task to UI immediately
    setKanbanData(prev => ({
      ...prev,
      [selectedStatus]: [...prev[selectedStatus as keyof KanbanData], tempTask]
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tempTask.title,
          description: tempTask.description || null,
          priority: tempTask.priority,
          status: tempTask.status,
          due_at: tempTask.due_at || null,
          estimated_minutes: tempTask.estimated_minutes || null,
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        // Replace temp task with real task from server
        setKanbanData(prev => ({
          ...prev,
          [selectedStatus]: prev[selectedStatus as keyof KanbanData].map(t => 
            t.id === tempTask.id ? newTask : t
          )
        }));
      } else {
        // ❌ Remove temp task if failed
        setKanbanData(prev => ({
          ...prev,
          [selectedStatus]: prev[selectedStatus as keyof KanbanData].filter(t => t.id !== tempTask.id)
        }));
        console.error("Failed to create task");
      }
    } catch (error) {
      // ❌ Remove temp task if failed
      setKanbanData(prev => ({
        ...prev,
        [selectedStatus]: prev[selectedStatus as keyof KanbanData].filter(t => t.id !== tempTask.id)
      }));
      console.error("Failed to create task:", error);
    }
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
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task in the {selectedStatus.replace("_", " ")} column
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Task description..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTaskPriority} onValueChange={(value: any) => setNewTaskPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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
                  value={newTaskEstimatedMinutes}
                  onChange={(e) => setNewTaskEstimatedMinutes(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            {/* Column Header */}
            <div className={`${column.color} rounded-lg p-3 flex items-center justify-between`}>
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
              {kanbanData[column.id as keyof KanbanData].map((task) => (
                <Card
                  key={task.id}
                  draggable={task.id > 0} // Only allow dragging real tasks (not temp)
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => task.id > 0 && handleTaskClick(task)}
                  className={`p-3 transition-all bg-gray-800/50 hover:bg-gray-800/70 border-gray-700 ${
                    task.id < 0 
                      ? 'opacity-60 animate-pulse cursor-wait' // Temp task loading state
                      : draggedTaskId === task.id 
                        ? 'opacity-50 scale-95 cursor-move' 
                        : 'opacity-100 cursor-pointer hover:shadow-md hover:shadow-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight flex-1 min-w-0">
                          {task.title}
                          {task.id < 0 && <span className="text-muted-foreground ml-1">(creating...)</span>}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
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
                    </div>
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
        onUpdate={loadKanbanData}
      />
    </>
  );
}
