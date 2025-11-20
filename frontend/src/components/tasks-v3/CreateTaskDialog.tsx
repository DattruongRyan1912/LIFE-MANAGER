"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Repeat, Calendar, Clock } from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: string;
  onTaskCreated?: () => void;
}

const API_BASE_URL = "http://localhost:8000/api";

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultStatus = "backlog",
  onTaskCreated,
}: CreateTaskDialogProps) {
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [status, setStatus] = useState(defaultStatus);
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  
  // Recurring fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: any = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_at: dueDate || null,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        recurrence_type: isRecurring ? recurrenceType : "none",
        recurrence_interval: isRecurring ? parseInt(recurrenceInterval) : 1,
        recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
      };

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus(defaultStatus);
      setDueDate("");
      setEstimatedMinutes("");
      setIsRecurring(false);
      setRecurrenceType("daily");
      setRecurrenceInterval("1");
      setRecurrenceEndDate("");
      
      onOpenChange(false);
      onTaskCreated?.();
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your workflow with optional recurring schedule
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Task description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
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
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="next">Next</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Estimated Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estimated (minutes)
              </Label>
              <Input
                id="estimated"
                type="number"
                min="0"
                placeholder="60"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
              />
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between space-x-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="recurring" className="text-base font-semibold cursor-pointer">
                  Recurring Task
                </Label>
                <p className="text-sm text-muted-foreground">
                  Repeat this task on a schedule
                </p>
              </div>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Recurring Options */}
          {isRecurring && (
            <div className="space-y-4 p-4 border rounded-lg bg-accent/5">
              <h4 className="font-semibold text-sm">Recurrence Settings</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceType">Repeat</Label>
                  <Select
                    value={recurrenceType}
                    onValueChange={(v: any) => setRecurrenceType(v)}
                  >
                    <SelectTrigger id="recurrenceType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Every</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      max="30"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {recurrenceType === "daily" && "day(s)"}
                      {recurrenceType === "weekly" && "week(s)"}
                      {recurrenceType === "monthly" && "month(s)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no end date
                </p>
              </div>

              {/* Recurrence Preview */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded text-sm">
                <p className="font-semibold mb-1">Preview:</p>
                <p className="text-muted-foreground">
                  Repeats every {recurrenceInterval} {recurrenceType === "daily" ? "day" : recurrenceType === "weekly" ? "week" : "month"}
                  {recurrenceEndDate && ` until ${new Date(recurrenceEndDate).toLocaleDateString()}`}
                  {!recurrenceEndDate && " (no end date)"}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
