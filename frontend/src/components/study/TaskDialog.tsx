'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { taskAPI } from '@/lib/api/study3';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  estimated_minutes: number;
  priority: 'low' | 'medium' | 'high';
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: number;
  task?: Task | null;
  onSuccess: () => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  moduleId,
  task,
  onSuccess,
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.due_date);
      setEstimatedMinutes(task.estimated_minutes.toString());
      setPriority(task.priority);
    } else {
      resetForm();
    }
  }, [task, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setEstimatedMinutes('30');
    setPriority('medium');
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (title.trim().length < 3) {
      toast.error('Title must be at least 3 characters');
      return false;
    }
    if (!dueDate) {
      toast.error('Due date is required');
      return false;
    }
    const minutes = parseInt(estimatedMinutes);
    if (isNaN(minutes) || minutes < 5 || minutes > 480) {
      toast.error('Estimated minutes must be between 5 and 480');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (task) {
        // Edit task
        await taskAPI.updateTask(task.id, {
          title,
          description,
          due_date: dueDate,
          estimated_minutes: parseInt(estimatedMinutes),
          priority,
        });
        toast.success('Task updated successfully');
      } else {
        // Create new task
        await taskAPI.createTask(moduleId, {
          title,
          description,
          due_date: dueDate,
          estimated_minutes: parseInt(estimatedMinutes),
          priority,
        });
        toast.success('Task created successfully');
      }

      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(task ? 'Failed to update task' : 'Failed to create task');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {task
              ? 'Update the task details below'
              : 'Create a new task for this module'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Enter task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Due Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Estimated Minutes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Estimated Minutes <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="5"
                max="480"
                placeholder="30"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">5-480 minutes</p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
