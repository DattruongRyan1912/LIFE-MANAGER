'use client';

import { useEffect, useState } from 'react';
import { Plus, Filter, SortAsc, CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
} from '@/lib/api';

interface Task {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_at: string;
  estimated_minutes?: number;
  done: boolean;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  pomodoro_estimate?: number;
  pomodoro_completed?: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState('1');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [pomodoroSuggestion, setPomodoroSuggestion] = useState<number | null>(null);

  // Filter states
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: any = {
      title,
      priority,
      due_at: `${dueDate} ${dueTime}`,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      recurrence_type: recurrenceType,
      recurrence_interval: recurrenceType !== 'none' ? parseInt(recurrenceInterval) : undefined,
      recurrence_end_date: recurrenceType !== 'none' && recurrenceEndDate ? recurrenceEndDate : undefined,
    };

    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(taskData);
      }
      
      resetForm();
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setPriority(task.priority);
    
    const date = new Date(task.due_at);
    setDueDate(date.toISOString().split('T')[0]);
    setDueTime(date.toTimeString().slice(0, 5));
    setEstimatedMinutes(task.estimated_minutes?.toString() || '');
    setRecurrenceType(task.recurrence_type || 'none');
    setRecurrenceInterval(task.recurrence_interval?.toString() || '1');
    setRecurrenceEndDate(task.recurrence_end_date || '');
    setShowForm(true);
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${id}/toggle`, {
        method: 'PATCH',
      });
      
      if (res.ok) {
        // Optimistic UI update
        setTasks(tasks.map(task => 
          task.id === id ? { ...task, done: !task.done } : task
        ));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa task này?')) {
      await deleteTask(id);
      loadTasks();
    }
  };

  const getPomodoroSuggestion = async () => {
    if (!estimatedMinutes || parseInt(estimatedMinutes) <= 0) {
      alert('Please enter estimated minutes first');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/tasks/pomodoro/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimated_minutes: parseInt(estimatedMinutes),
          priority: priority,
        }),
      });

      const data = await res.json();
      setPomodoroSuggestion(data.suggested_pomodoros);
    } catch (error) {
      console.error('Error getting Pomodoro suggestion:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPriority('medium');
    setDueDate('');
    setDueTime('12:00');
    setEstimatedMinutes('');
    setRecurrenceType('none');
    setRecurrenceInterval('1');
    setRecurrenceEndDate('');
    setPomodoroSuggestion(null);
    setEditingTask(null);
    setShowForm(false);
  };

  // Filter tasks
  const filteredTasks = tasks
    .filter((task) => {
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterStatus === 'completed' && !task.done) return false;
      if (filterStatus === 'pending' && task.done) return false;
      return true;
    })
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.done).length,
    pending: tasks.filter((t) => !t.done).length,
    high: tasks.filter((t) => t.priority === 'high' && !t.done).length,
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'badge-priority-high',
      medium: 'badge-priority-medium',
      low: 'badge-priority-low',
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Quản lý công việc hàng ngày của bạn</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="default">
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Đóng' : 'Thêm Task'}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Tổng số</div>
            <div className="text-3xl font-bold mt-2">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Hoàn thành</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Chưa xong</div>
            <div className="text-3xl font-bold mt-2 text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Ưu tiên cao</div>
            <div className="text-3xl font-bold mt-2 text-red-600">{stats.high}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTask ? 'Chỉnh sửa Task' : 'Thêm Task Mới'}</CardTitle>
            <CardDescription>
              {editingTask ? 'Cập nhật thông tin task' : 'Tạo một công việc mới'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên công việc..."
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Độ ưu tiên</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày hết hạn</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Giờ</label>
                  <Input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Thời gian ước tính (phút)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="30"
                    min="1"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getPomodoroSuggestion}
                    disabled={!estimatedMinutes}
                  >
                    🍅 Suggest
                  </Button>
                </div>
                {pomodoroSuggestion && (
                  <p className="text-xs text-muted-foreground">
                    AI suggests: {pomodoroSuggestion} Pomodoro sessions (~{pomodoroSuggestion * 25} min)
                  </p>
                )}
              </div>

              {/* Recurring Task Section */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  🔁 Recurring Task (Optional)
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recurrence Type</label>
                  <select
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="none">No Recurrence</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {recurrenceType !== 'none' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Repeat every {recurrenceInterval} {recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : 'month(s)'}
                      </label>
                      <Input
                        type="number"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value)}
                        min="1"
                        max="30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date (Optional)</label>
                      <Input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        min={dueDate}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for indefinite recurrence
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingTask ? 'Cập nhật' : 'Tạo Task'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chưa xong</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Không có task nào</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(task.id)}
                    className="shrink-0"
                  >
                    {task.done ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{new Date(task.due_at).toLocaleString('vi-VN')}</span>
                      {task.estimated_minutes && (
                        <span>• {task.estimated_minutes} phút</span>
                      )}
                      {task.recurrence_type && task.recurrence_type !== 'none' && (
                        <span className="text-primary">
                          • 🔁 {task.recurrence_type}
                        </span>
                      )}
                      {task.pomodoro_estimate && (
                        <span>
                          • 🍅 {task.pomodoro_completed || 0}/{task.pomodoro_estimate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <span className={getPriorityBadge(task.priority)}>
                    {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'TB' : 'Thấp'}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(task)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
