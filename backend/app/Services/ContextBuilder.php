<?php

namespace App\Services;

use App\Models\Task;
use App\Models\Expense;
use App\Models\StudyGoal;
use App\Models\LongTermMemory;
use Carbon\Carbon;

class ContextBuilder
{
    /**
     * Build complete context for AI
     */
    public function build()
    {
        return [
            'today' => Carbon::now()->format('Y-m-d'),
            'tasks_today' => $this->getTodayTasks(),
            'expenses_7days' => $this->getLast7DaysExpenses(),
            'study_goals' => $this->getStudyGoals(),
            'long_term_memory' => $this->getLongTermMemory(),
        ];
    }

    /**
     * Build context for daily summary
     */
    public function buildDailySummary()
    {
        return [
            'date' => Carbon::now()->format('Y-m-d'),
            'completed_tasks' => $this->getCompletedTasksToday(),
            'total_expenses' => $this->getTotalExpensesToday(),
            'expenses_today' => $this->getTodayExpenses(),
        ];
    }

    /**
     * Get today's tasks
     */
    private function getTodayTasks()
    {
        return Task::whereDate('due_at', today())
            ->orderBy('priority', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get completed tasks today
     */
    private function getCompletedTasksToday()
    {
        return Task::whereDate('due_at', today())
            ->where('done', true)
            ->get()
            ->toArray();
    }

    /**
     * Get last 7 days expenses
     */
    private function getLast7DaysExpenses()
    {
        return Expense::whereBetween('spent_at', [
            Carbon::now()->subDays(7),
            Carbon::now()
        ])
        ->orderBy('spent_at', 'desc')
        ->get()
        ->toArray();
    }

    /**
     * Get today's expenses
     */
    private function getTodayExpenses()
    {
        return Expense::whereDate('spent_at', today())
            ->get()
            ->toArray();
    }

    /**
     * Get total expenses today
     */
    private function getTotalExpensesToday()
    {
        return Expense::whereDate('spent_at', today())
            ->sum('amount');
    }

    /**
     * Get study goals
     */
    private function getStudyGoals()
    {
        return StudyGoal::orderBy('deadline', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get long-term memory
     */
    private function getLongTermMemory()
    {
        $memories = LongTermMemory::all();
        $result = [];
        
        foreach ($memories as $memory) {
            $result[$memory->key] = $memory->value;
        }
        
        return $result;
    }
}
