'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getTodayTasks } from '@/lib/api';

interface Task {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_at: string;
  done: boolean;
}

export default function DashboardPage() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayTasks();
  }, []);

  const loadTodayTasks = async () => {
    try {
      const data = await getTodayTasks();
      setTodayTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalToday: todayTasks.length,
    completed: todayTasks.filter((t) => t.done).length,
    pending: todayTasks.filter((t) => !t.done).length,
    highPriority: todayTasks.filter((t) => t.priority === 'high' && !t.done).length,
  };

  const completionRate = stats.totalToday > 0 
    ? Math.round((stats.completed / stats.totalToday) * 100) 
    : 0;

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks hôm nay</p>
                <p className="text-3xl font-bold mt-2">{stats.totalToday}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chưa xong</p>
                <p className="text-3xl font-bold mt-2 text-orange-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold mt-2 text-primary">{completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks hôm nay</CardTitle>
              <CardDescription>Công việc cần hoàn thành trong ngày</CardDescription>
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="sm">
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Không có task nào hôm nay</p>
              <Link href="/tasks">
                <Button variant="outline" className="mt-4">
                  Thêm task mới
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className={`h-2 w-2 rounded-full ${task.done ? 'bg-green-600' : 'bg-orange-600'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(task.due_at).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  <span className={getPriorityBadge(task.priority)}>
                    {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'TB' : 'Thấp'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/tasks">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Quản lý Tasks</CardTitle>
              <CardDescription>Tạo và theo dõi công việc</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/expenses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Theo dõi Chi tiêu</CardTitle>
              <CardDescription>Quản lý tài chính cá nhân</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/assistant">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <CardDescription>Trợ lý AI cá nhân</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
