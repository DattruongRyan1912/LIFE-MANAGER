"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TaskLabel {
  id: number;
  name: string;
  color: string;
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

interface LabelManagerProps {
  onLabelUpdate?: () => void;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
];

export default function LabelManager({ onLabelUpdate }: LabelManagerProps) {
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingLabel, setEditingLabel] = useState<TaskLabel | null>(null);
  const [deleteLabel, setDeleteLabel] = useState<TaskLabel | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    color: PRESET_COLORS[0],
  });

  useEffect(() => {
    if (isOpen) {
      fetchLabels();
    }
  }, [isOpen]);

  const fetchLabels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/labels?user_id=1");
      if (response.ok) {
        const data = await response.json();
        setLabels(data);
      }
    } catch (error) {
      console.error("Failed to fetch labels:", error);
      toast.error("Failed to load labels");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Label name is required");
      return;
    }

    setIsLoading(true);
    try {
      const url = editingLabel
        ? `http://localhost:8000/api/labels/${editingLabel.id}?user_id=1`
        : "http://localhost:8000/api/labels?user_id=1";
      
      const method = editingLabel ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          color: formData.color,
        }),
      });

      if (response.ok) {
        toast.success(editingLabel
          ? "Label updated successfully"
          : "Label created successfully"
        );
        
        resetForm();
        fetchLabels();
        onLabelUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save label");
      }
    } catch (error) {
      console.error("Failed to save label:", error);
      toast.error("Failed to save label");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteLabel) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/labels/${deleteLabel.id}?user_id=1`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Label deleted successfully");
        
        setDeleteLabel(null);
        fetchLabels();
        onLabelUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete label");
      }
    } catch (error) {
      console.error("Failed to delete label:", error);
      toast.error("Failed to delete label");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (label: TaskLabel) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color,
    });
  };

  const resetForm = () => {
    setEditingLabel(null);
    setFormData({
      name: "",
      color: PRESET_COLORS[0],
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Manage Labels
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Labels</DialogTitle>
            <DialogDescription>
              Create and manage labels to organize your tasks
            </DialogDescription>
          </DialogHeader>

          {/* Create/Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Label Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Urgent, Bug, Feature"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-md transition-all ${
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingLabel ? "Update Label" : "Create Label"}
              </Button>
              {editingLabel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Labels List */}
          <div className="space-y-2">
            <Label>Existing Labels ({labels.length})</Label>
            {isLoading && labels.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : labels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No labels yet. Create your first label above.
              </p>
            ) : (
              <div className="grid gap-2">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="font-medium">{label.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(label)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteLabel(label)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLabel} onOpenChange={() => setDeleteLabel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteLabel?.name}"? This will
              remove the label from all tasks, but the tasks themselves won't be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
