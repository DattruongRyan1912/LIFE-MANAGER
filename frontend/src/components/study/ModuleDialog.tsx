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
import { toast } from 'sonner';
import { moduleAPI } from '@/lib/api/study3';

interface Module {
  id: number;
  title: string;
  description: string;
  estimated_hours: number;
}

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: number;
  module?: Module | null;
  onSuccess: () => void;
}

export function ModuleDialog({
  open,
  onOpenChange,
  goalId,
  module,
  onSuccess,
}: ModuleDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('10');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description);
      setEstimatedHours(module.estimated_hours.toString());
    } else {
      resetForm();
    }
  }, [module, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEstimatedHours('10');
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
    const hours = parseInt(estimatedHours);
    if (isNaN(hours) || hours < 1 || hours > 500) {
      toast.error('Estimated hours must be between 1 and 500');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (module) {
        // Edit module
        await moduleAPI.updateModule(module.id, {
          title,
          description,
          estimated_hours: parseInt(estimatedHours),
        });
        toast.success('Module updated successfully');
      } else {
        // Create new module
        await moduleAPI.createModule(goalId, {
          title,
          description,
          estimated_hours: parseInt(estimatedHours),
        });
        toast.success('Module created successfully');
      }

      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(module ? 'Failed to update module' : 'Failed to create module');
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
            {module ? 'Edit Module' : 'Create New Module'}
          </DialogTitle>
          <DialogDescription>
            {module
              ? 'Update the module details below'
              : 'Create a new module for this goal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter module title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Enter module description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Estimated Hours <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              max="500"
              placeholder="10"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">1-500 hours</p>
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
              {loading ? 'Saving...' : module ? 'Update Module' : 'Create Module'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
