'use client';

import { useEffect, useState } from 'react';
import KpiCard from '@/components/KpiCard';
import TaskCard from '@/components/TaskCard';
import ExpenseItem from '@/components/ExpenseItem';
import StudyProgress from '@/components/StudyProgress';
import { 
  getTodayTasks, 
  getLast7DaysExpenses, 
  getStudyGoals,
  updateTask,
  deleteTask,
  deleteExpense,
  updateStudyGoal
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatter';
import Link from 'next/link';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [studyGoals, setStudyGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, expensesData, goalsData] = await Promise.all([
        getTodayTasks(),
        getLast7DaysExpenses(),
        getStudyGoals(),
      ]);
      setTasks(tasksData);
      setExpenses(expensesData);
      setStudyGoals(goalsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      await updateTask(id, { done: !task.done });
      loadData();
    }
  };

  const handleDeleteTask = async (id: number) => {
    await deleteTask(id);
    loadData();
  };

  const handleDeleteExpense = async (id: number) => {
    await deleteExpense(id);
    loadData();
  };

  const handleUpdateStudyProgress = async (id: number, progress: number) => {
    await updateStudyGoal(id, { progress });
    loadData();
  };

  const completedTasks = tasks.filter((t) => t.done).length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgProgress = studyGoals.length > 0
    ? Math.round(studyGoals.reduce((sum, g) => sum + g.progress, 0) / studyGoals.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">📊 Dashboard - Life Manager AI</h1>
          <nav className="flex gap-4">
            <Link href="/tasks" className="text-blue-600 hover:underline">Tasks</Link>
            <Link href="/expenses" className="text-blue-600 hover:underline">Expenses</Link>
            <Link href="/study" className="text-blue-600 hover:underline">Study</Link>
            <Link href="/assistant" className="text-blue-600 hover:underline">AI Chat</Link>
          </nav>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Tasks hôm nay"
            value={`${completedTasks}/${tasks.length}`}
            icon={<span className="text-2xl">✅</span>}
          />
          <KpiCard
            title="Chi tiêu 7 ngày"
            value={formatCurrency(totalExpenses)}
            icon={<span className="text-2xl">💰</span>}
          />
          <KpiCard
            title="Học tập"
            value={`${avgProgress}%`}
            icon={<span className="text-2xl">📚</span>}
          />
          <KpiCard
            title="Năng suất"
            value={tasks.length > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '0%'}
            icon={<span className="text-2xl">🎯</span>}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tasks Today */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">✅ Tasks hôm nay</h2>
              <Link
                href="/tasks"
                className="text-sm text-blue-600 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Không có task nào</p>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">💰 Chi tiêu 7 ngày</h2>
              <Link
                href="/expenses"
                className="text-sm text-blue-600 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-2">
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Chưa có chi tiêu</p>
              ) : (
                expenses.slice(0, 5).map((expense) => (
                  <ExpenseItem
                    key={expense.id}
                    expense={expense}
                    onDelete={handleDeleteExpense}
                  />
                ))
              )}
            </div>
          </div>

          {/* Study Goals */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📚 Mục tiêu học tập</h2>
              <Link
                href="/study"
                className="text-sm text-blue-600 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-2">
              {studyGoals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Chưa có mục tiêu</p>
              ) : (
                studyGoals.map((goal) => (
                  <StudyProgress
                    key={goal.id}
                    goal={goal}
                    onUpdate={handleUpdateStudyProgress}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
