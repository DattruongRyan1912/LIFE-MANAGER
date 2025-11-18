'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Wallet, 
  Brain,
  Plus,
  MessageSquare,
  TrendingUp,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { ExpenseBarChart, ExpensePieChart } from '@/components/ExpenseChart';

interface DashboardData {
  tasks: {
    total: number;
    completed: number;
    completion_rate: number;
    today: Task[];
    pending: Task[];
  };
  expenses: {
    total_7_days: number;
    by_category: Record<string, number>;
    items: Expense[];
  };
  memory: {
    recent_logs: DailyLog[];
    preferences: any[];
    habits: any[];
  };
}

interface Task {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_at: string;
  done: boolean;
}

interface Expense {
  id: number;
  amount: number;
  category: string;
  note: string;
  spent_at: string;
}

interface DailyLog {
  id: number;
  date: string;
  summary: string;
  ai_feedback: string | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/dashboard/summary');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return styles[priority as keyof typeof styles] || styles.low;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Your productivity overview
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/tasks">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </Link>
        <Link href="/expenses">
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </Link>
        <Link href="/assistant">
          <Button size="sm" variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Chat
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.tasks.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.tasks.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.tasks.completion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.tasks.total - data.tasks.completed} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses (7d)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.expenses.total_7_days / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Logs</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.memory.recent_logs.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent summaries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {data.tasks.pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending tasks</p>
            ) : (
              <div className="space-y-3">
                {data.tasks.pending.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(task.due_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/tasks">
              <Button variant="ghost" className="w-full mt-4" size="sm">
                View all tasks →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Expense by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.expenses.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses in last 7 days</p>
            ) : (
              <ExpensePieChart expenses={data.expenses.items} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Trends (7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.expenses.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expense data</p>
          ) : (
            <ExpenseBarChart expenses={data.expenses.items} />
          )}
        </CardContent>
      </Card>

      {/* Memory Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Daily Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.memory.recent_logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent logs</p>
          ) : (
            <div className="space-y-4">
              {data.memory.recent_logs.map((log) => (
                <div key={log.id} className="border-l-2 border-primary pl-4 pb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {new Date(log.date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-sm mb-2">{log.summary}</div>
                  {log.ai_feedback && (
                    <div className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded">
                      💡 {log.ai_feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
