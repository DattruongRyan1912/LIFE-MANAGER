'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Plus, Target } from 'lucide-react';

interface StudyGoal {
  id: number;
  name: string;
  progress: number;
  deadline: string;
}

export default function StudyGoalsPage() {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    progress: 0,
    deadline: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/study-goals');
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId
      ? `http://localhost:8000/api/study-goals/${editingId}`
      : 'http://localhost:8000/api/study-goals';

    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        loadGoals();
        setFormData({ name: '', progress: 0, deadline: '' });
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleEdit = (goal: StudyGoal) => {
    setFormData({
      name: goal.name,
      progress: goal.progress,
      deadline: goal.deadline.split('T')[0], // Format date for input
    });
    setEditingId(goal.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this goal?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/study-goals/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadGoals();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading study goals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Goals</h1>
        <p className="text-muted-foreground mt-2">
          Track your learning progress
        </p>
      </div>

      {/* Add/Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {editingId ? 'Edit Goal' : 'Add New Goal'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Goal Name *
                </label>
                <Input
                  placeholder="e.g., Learn React"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Progress (%) *
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progress: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Deadline *
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? 'Update Goal' : 'Add Goal'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', progress: 0, deadline: '' });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Goals List */}
      <div className="grid gap-4">
        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No study goals yet</p>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{goal.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()} (
                        {getDaysUntilDeadline(goal.deadline)})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className={`${getProgressColor(
                          goal.progress
                        )} h-3 rounded-full transition-all duration-300`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
