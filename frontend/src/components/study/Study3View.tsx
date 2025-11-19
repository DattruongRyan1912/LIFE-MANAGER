'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleList } from '@/components/study/ModuleList';
import { TaskList } from '@/components/study/TaskList';
import { moduleAPI, taskAPI } from '@/lib/api/study3';
import { 
  BookOpen, Sparkles, ArrowLeft, Plus, Target,
  TrendingUp, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface StudyGoal {
  id: number;
  name: string;
  progress: number;
  deadline: string;
  study_type?: string;
  status?: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  order_index: number;
  progress: number;
  estimated_hours: number;
  tasks_count: number;
  completed_tasks: number;
  pending_tasks: number;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  estimated_minutes: number;
  completed_at: string | null;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  is_overdue: boolean;
  created_at: string;
}

interface Study3ViewProps {
  goals: StudyGoal[];
  onBack: () => void;
}

export function Study3View({ goals, onBack }: Study3ViewProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(
    goals[0]?.id || null
  );
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatistics, setTaskStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generatingModules, setGeneratingModules] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [view, setView] = useState<'modules' | 'tasks'>('modules');

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  useEffect(() => {
    if (selectedGoalId) {
      loadModules(selectedGoalId);
    }
  }, [selectedGoalId]);

  useEffect(() => {
    if (selectedModule) {
      loadTasks(selectedModule.id);
    }
  }, [selectedModule]);

  const loadModules = async (goalId: number) => {
    setLoading(true);
    try {
      const response = await moduleAPI.getModules(goalId);
      setModules(response.data || []);
    } catch (error) {
      console.error('Failed to load modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (moduleId: number) => {
    setLoading(true);
    try {
      const response = await taskAPI.getTasks(moduleId);
      setTasks(response.data || []);
      setTaskStatistics(response.statistics);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateModules = async () => {
    if (!selectedGoalId) return;

    setGeneratingModules(true);
    try {
      await moduleAPI.generateModules(selectedGoalId);
      toast.success('Modules generated successfully with AI!');
      loadModules(selectedGoalId);
    } catch (error) {
      console.error('Failed to generate modules:', error);
      toast.error('Failed to generate modules. Try again or create manually.');
    } finally {
      setGeneratingModules(false);
    }
  };

  const handleModuleClick = (module: Module) => {
    setSelectedModule(module);
    setView('tasks');
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Delete this module? All tasks will be deleted too.')) return;

    try {
      await moduleAPI.deleteModule(moduleId);
      toast.success('Module deleted successfully');
      if (selectedGoalId) {
        loadModules(selectedGoalId);
      }
      if (selectedModule?.id === moduleId) {
        setSelectedModule(null);
        setView('modules');
      }
    } catch (error) {
      console.error('Failed to delete module:', error);
      toast.error('Failed to delete module');
    }
  };

  const handleGenerateTasks = async () => {
    if (!selectedModule) return;

    setGeneratingTasks(true);
    try {
      await taskAPI.generateTasks(selectedModule.id);
      toast.success('Tasks generated successfully with AI!');
      loadTasks(selectedModule.id);
      if (selectedGoalId) {
        loadModules(selectedGoalId);
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      toast.error('Failed to generate tasks. Try again or create manually.');
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      await taskAPI.toggleTask(taskId);
      toast.success('Task updated successfully');
      if (selectedModule) {
        loadTasks(selectedModule.id);
      }
      if (selectedGoalId) {
        loadModules(selectedGoalId);
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;

    try {
      await taskAPI.deleteTask(taskId);
      toast.success('Task deleted successfully');
      if (selectedModule) {
        loadTasks(selectedModule.id);
      }
      if (selectedGoalId) {
        loadModules(selectedGoalId);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getGoalStats = () => {
    const totalModules = modules.length;
    const completedModules = modules.filter(m => m.progress >= 100).length;
    const totalTasks = modules.reduce((sum, m) => sum + m.tasks_count, 0);
    const completedTasks = modules.reduce((sum, m) => sum + m.completed_tasks, 0);
    const overdueTasks = taskStatistics?.overdue || 0;

    return { totalModules, completedModules, totalTasks, completedTasks, overdueTasks };
  };

  const stats = getGoalStats();

  if (!selectedGoalId || goals.length === 0) {
    return (
      <div className="space-y-6">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Study 2.0
        </Button>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Study Goals</h3>
              <p className="text-muted-foreground mb-4">
                Create a study goal first to use Study 3.0 features
              </p>
              <Button onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Study 3.0</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered module & task management
            </p>
          </div>
        </div>
      </div>

      {/* Goal Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Study Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedGoalId?.toString()}
            onValueChange={(value) => {
              setSelectedGoalId(parseInt(value));
              setSelectedModule(null);
              setView('modules');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id.toString()}>
                  {goal.name} ({Math.round(goal.progress)}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {selectedGoal && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Progress</span>
              </div>
              <div className="text-2xl font-bold">{Math.round(selectedGoal.progress)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Modules</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.completedModules}/{stats.totalModules}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Tasks</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.completedTasks}/{stats.totalTasks}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalTasks - stats.completedTasks}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Overdue</span>
              </div>
              <div className="text-2xl font-bold text-red-500">
                {stats.overdueTasks}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {view === 'modules' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Learning Modules</h2>
            {modules.length > 0 && (
              <Button
                onClick={handleGenerateModules}
                disabled={generatingModules}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generatingModules ? 'Generating...' : 'Regenerate with AI'}
              </Button>
            )}
          </div>

          <ModuleList
            goalId={selectedGoalId}
            modules={modules}
            onModuleClick={handleModuleClick}
            onGenerateModules={handleGenerateModules}
            onDeleteModule={handleDeleteModule}
            loading={loading}
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setView('modules');
                  setSelectedModule(null);
                }}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Modules
              </Button>
              <div>
                <h2 className="text-xl font-semibold">{selectedModule?.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedModule?.description}
                </p>
              </div>
            </div>
            
            {tasks.length > 0 && (
              <Button
                onClick={handleGenerateTasks}
                disabled={generatingTasks}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generatingTasks ? 'Generating...' : 'Regenerate Tasks'}
              </Button>
            )}
          </div>

          {selectedModule && (
            <TaskList
              moduleId={selectedModule.id}
              tasks={tasks}
              statistics={taskStatistics}
              onToggleTask={handleToggleTask}
              onEditTask={(task) => {
                // TODO: Open edit dialog
                console.log('Edit task:', task);
              }}
              onDeleteTask={handleDeleteTask}
              onGenerateTasks={handleGenerateTasks}
              loading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
