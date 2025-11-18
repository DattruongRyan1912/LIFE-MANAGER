<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Expense;
use App\Models\DailyLog;
use App\Models\LongTermMemory;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get comprehensive dashboard summary
     */
    public function getSummary(): JsonResponse
    {
        $today = Carbon::today();
        $sevenDaysAgo = $today->copy()->subDays(6);

        // Task statistics
        $totalTasks = Task::count();
        $completedTasks = Task::where('done', true)->count();
        $todayTasks = Task::whereDate('due_at', $today)->get();
        $pendingTasks = Task::where('done', false)
            ->whereDate('due_at', '<=', $today)
            ->orderBy('priority', 'desc')
            ->orderBy('due_at', 'asc')
            ->limit(5)
            ->get();

        // Expense statistics
        $last7DaysExpenses = Expense::whereBetween('spent_at', [$sevenDaysAgo, $today])
            ->orderBy('spent_at', 'desc')
            ->get();
        
        $totalExpenses = $last7DaysExpenses->sum('amount');
        $expensesByCategory = $last7DaysExpenses->groupBy('category')
            ->map(function ($items) {
                return $items->sum('amount');
            });

        // Memory insights
        $recentLogs = DailyLog::orderBy('date', 'desc')
            ->limit(3)
            ->get();
        
        $userPreferences = LongTermMemory::where('key', 'user_preferences')->first();
        $habitPatterns = LongTermMemory::where('key', 'habit_patterns')->first();

        return response()->json([
            'tasks' => [
                'total' => $totalTasks,
                'completed' => $completedTasks,
                'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
                'today' => $todayTasks,
                'pending' => $pendingTasks,
            ],
            'expenses' => [
                'total_7_days' => $totalExpenses,
                'by_category' => $expensesByCategory,
                'items' => $last7DaysExpenses,
            ],
            'memory' => [
                'recent_logs' => $recentLogs,
                'preferences' => $userPreferences ? $userPreferences->value : null,
                'habits' => $habitPatterns ? $habitPatterns->value : null,
            ],
        ]);
    }
}
