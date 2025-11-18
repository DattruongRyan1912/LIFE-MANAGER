'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Trash2, Edit2, Plus, Target, Sparkles, TrendingUp, TrendingDown, 
  Minus, CheckCircle2, Circle, AlertCircle, Clock, BookOpen, Brain
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudyGoal {
  id: number;
  name: string;
  progress: number;
  deadline: string;
  chapters?: Chapter[];
  weekly_plan?: WeeklyPlan[];
  ai_feedback?: string;
  total_chapters?: number;
  study_type?: string;
}

interface Chapter {
  title: string;
  completed: boolean;
  week?: number;
}

interface WeeklyPlan {
  week: number;
  focus: string;
  daily_tasks: string[];
  estimated_hours: number;
}

interface ProgressEvaluation {
  status: string;
  message: string;
  progress: {
    actual: number;
    expected: number;
    difference: number;
  };
  timeline: {
    days_elapsed: number;
    days_remaining: number;
    total_days: number;
  };
  ai_feedback?: string;
  suggestions: string[];
}

export default function StudyGoalsPage() {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<StudyGoal | null>(null);
  const [evaluation, setEvaluation] = useState<ProgressEvaluation | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    progress: 0,
    deadline: '',
    total_chapters: 0,
    study_type: 'general',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [chaptersInput, setChaptersInput] = useState('');

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

    // Parse chapters from comma-separated input
    const chapters = chaptersInput
      .split(',')
      .map(title => title.trim())
      .filter(title => title.length > 0)
      .map(title => ({ title, completed: false }));

    const payload = {
      ...formData,
      chapters: chapters.length > 0 ? chapters : null,
      total_chapters: formData.total_chapters || chapters.length,
    };

    const url = editingId
      ? `http://localhost:8000/api/study-goals/${editingId}`
      : 'http://localhost:8000/api/study-goals';

    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        loadGoals();
        setFormData({ name: '', progress: 0, deadline: '', total_chapters: 0, study_type: 'general' });
        setChaptersInput('');
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
      deadline: goal.deadline.split('T')[0],
      total_chapters: goal.total_chapters || 0,
      study_type: goal.study_type || 'general',
    });
    setChaptersInput(goal.chapters?.map(c => c.title).join(', ') || '');
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
        if (selectedGoal?.id === id) {
          setSelectedGoal(null);
          setEvaluation(null);
        }
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const generateAIPlan = async (goalId: number) => {
    setGeneratingPlan(true);
    try {
      const res = await fetch(`http://localhost:8000/api/study-goals/${goalId}/generate-plan`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        loadGoals();
        alert('AI Study Plan generated successfully!');
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Failed to generate plan');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const evaluateProgress = async (goalId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/study-goals/${goalId}/evaluate`);
      const data = await res.json();
      setEvaluation(data);
    } catch (error) {
      console.error('Error evaluating progress:', error);
    }
  };

  const toggleChapter = async (goalId: number, chapterIndex: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:8000/api/study-goals/${goalId}/update-chapter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_index: chapterIndex,
          completed: !currentStatus,
        }),
      });

      if (res.ok) {
        loadGoals();
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AHEAD':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'BEHIND':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />;
    }
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Goals 2.0</h1>
          <p className="text-muted-foreground">AI-powered study planning and progress tracking</p>
        </div>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Goal Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Learn React Advanced Patterns"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="study_type">Study Type</Label>
                <Select
                  value={formData.study_type}
                  onValueChange={(value: string) => setFormData({ ...formData, study_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="language">Language Learning</SelectItem>
                    <SelectItem value="technical">Technical/Programming</SelectItem>
                    <SelectItem value="certification">Certification Prep</SelectItem>
                    <SelectItem value="academic">Academic Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="progress">Current Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="total_chapters">Total Chapters/Modules</Label>
                <Input
                  id="total_chapters"
                  type="number"
                  min="0"
                  placeholder="e.g., 12"
                  value={formData.total_chapters}
                  onChange={(e) => setFormData({ ...formData, total_chapters: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="chapters">Chapter Names (comma-separated)</Label>
                <Input
                  id="chapters"
                  placeholder="e.g., Intro, Hooks, Context, Performance"
                  value={chaptersInput}
                  onChange={(e) => setChaptersInput(e.target.value)}
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
                    setFormData({ name: '', progress: 0, deadline: '', total_chapters: 0, study_type: 'general' });
                    setChaptersInput('');
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
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No study goals yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{goal.name}</h3>
                        {goal.study_type && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {goal.study_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()} (
                        {getDaysUntilDeadline(goal.deadline)})
                      </p>
                      {goal.total_chapters && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📚 {goal.chapters?.filter(c => c.completed).length || 0} / {goal.total_chapters} chapters completed
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedGoal(goal);
                          evaluateProgress(goal.id);
                        }}
                        title="View Details"
                      >
                        <Brain className="w-4 h-4" />
                      </Button>
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
                        className={`${getProgressColor(goal.progress)} h-3 rounded-full transition-all duration-300`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Plan Button */}
                  {goal.total_chapters && goal.total_chapters > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateAIPlan(goal.id)}
                        disabled={generatingPlan}
                        className="flex-1"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {generatingPlan ? 'Generating...' : goal.weekly_plan ? 'Regenerate AI Plan' : 'Generate AI Study Plan'}
                      </Button>
                    </div>
                  )}

                  {/* Chapters Checklist */}
                  {goal.chapters && goal.chapters.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Chapters</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {goal.chapters.map((chapter, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleChapter(goal.id, idx, chapter.completed)}
                            className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent transition-colors text-left"
                          >
                            {chapter.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={chapter.completed ? 'line-through text-muted-foreground' : ''}>
                              {chapter.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Panel */}
      {selectedGoal && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Study Plan & Progress: {selectedGoal.name}
              </span>
              <Button variant="ghost" size="sm" onClick={() => {
                setSelectedGoal(null);
                setEvaluation(null);
              }}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Evaluation */}
            {evaluation && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {getStatusIcon(evaluation.status)}
                  Progress Evaluation
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <Card className="bg-accent/50">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{evaluation.progress.actual}%</div>
                      <div className="text-xs text-muted-foreground">Actual Progress</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-accent/50">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{evaluation.progress.expected}%</div>
                      <div className="text-xs text-muted-foreground">Expected Progress</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-accent/50">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold flex items-center gap-1">
                        {evaluation.progress.difference > 0 ? '+' : ''}{evaluation.progress.difference}%
                        {evaluation.status === 'AHEAD' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {evaluation.status === 'BEHIND' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground">Difference</div>
                    </CardContent>
                  </Card>
                </div>

                <div className={`p-4 rounded-lg border-l-4 ${
                  evaluation.status === 'AHEAD' ? 'bg-green-50 border-green-500' :
                  evaluation.status === 'BEHIND' ? 'bg-red-50 border-red-500' :
                  'bg-yellow-50 border-yellow-500'
                }`}>
                  <p className="font-medium mb-2">{evaluation.message}</p>
                  {evaluation.ai_feedback && (
                    <p className="text-sm text-muted-foreground">{evaluation.ai_feedback}</p>
                  )}
                </div>

                {evaluation.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Weekly Plan */}
            {selectedGoal.weekly_plan && selectedGoal.weekly_plan.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Weekly Study Plan
                </h3>
                <div className="space-y-4">
                  {selectedGoal.weekly_plan.map((week, idx) => (
                    <Card key={idx} className="bg-accent/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">Week {week.week}</h4>
                          <span className="text-xs text-muted-foreground">{week.estimated_hours}h estimated</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{week.focus}</p>
                        <div className="space-y-1">
                          {week.daily_tasks.map((task, taskIdx) => (
                            <div key={taskIdx} className="text-xs flex items-start gap-2">
                              <span className="text-primary">✓</span>
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
