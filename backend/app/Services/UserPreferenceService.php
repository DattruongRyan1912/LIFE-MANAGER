<?php

namespace App\Services;

use App\Models\Task;
use App\Models\Expense;
use App\Models\StudyGoal;
use App\Models\LongTermMemory;
use Carbon\Carbon;

class UserPreferenceService
{
    private $vectorMemory;

    public function __construct(VectorMemoryService $vectorMemory)
    {
        $this->vectorMemory = $vectorMemory;
    }

    /**
     * Detect all user preferences and patterns
     * 
     * @return array
     */
    public function detectPreferences(): array
    {
        return [
            'productivity_pattern' => $this->detectProductivityPattern(),
            'spending_habits' => $this->detectSpendingHabits(),
            'study_preferences' => $this->detectStudyPreferences(),
            'task_priorities' => $this->detectTaskPriorities(),
            'work_style' => $this->detectWorkStyle(),
        ];
    }

    /**
     * Detect productivity pattern (morning/evening person)
     * 
     * @return array
     */
    private function detectProductivityPattern(): array
    {
        $tasks = Task::where('done', true)
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        if ($tasks->isEmpty()) {
            return [
                'pattern' => 'unknown',
                'confidence' => 0,
                'peak_hours' => [],
            ];
        }

        $hourlyCompletions = [];
        foreach ($tasks as $task) {
            $hour = $task->updated_at->hour;
            $hourlyCompletions[$hour] = ($hourlyCompletions[$hour] ?? 0) + 1;
        }

        arsort($hourlyCompletions);
        $peakHours = array_slice($hourlyCompletions, 0, 3, true);
        $peakHour = array_key_first($peakHours);

        if ($peakHour >= 6 && $peakHour < 12) {
            $pattern = 'morning_person';
        } elseif ($peakHour >= 12 && $peakHour < 18) {
            $pattern = 'afternoon_person';
        } elseif ($peakHour >= 18 && $peakHour < 24) {
            $pattern = 'evening_person';
        } else {
            $pattern = 'night_owl';
        }

        $confidence = min(1.0, array_sum($peakHours) / $tasks->count());

        // Store preference
        $this->storePreference('productivity_pattern', [
            'pattern' => $pattern,
            'peak_hours' => array_keys($peakHours),
            'confidence' => $confidence,
        ]);

        return [
            'pattern' => $pattern,
            'peak_hours' => array_keys($peakHours),
            'confidence' => $confidence,
            'hourly_distribution' => $hourlyCompletions,
        ];
    }

    /**
     * Detect spending habits
     * 
     * @return array
     */
    private function detectSpendingHabits(): array
    {
        $expenses = Expense::where('spent_at', '>=', now()->subDays(30))->get();

        if ($expenses->isEmpty()) {
            return [
                'average_daily' => 0,
                'top_categories' => [],
                'spending_style' => 'unknown',
            ];
        }

        $totalAmount = $expenses->sum('amount');
        $averageDaily = $totalAmount / 30;

        // Category breakdown
        $categoryTotals = $expenses->groupBy('category')->map(fn($group) => $group->sum('amount'))->sortDesc();
        $topCategories = $categoryTotals->take(3)->toArray();

        // Determine spending style
        $dailyVariance = $this->calculateVariance(
            $expenses->groupBy(fn($e) => $e->spent_at->format('Y-m-d'))
                ->map(fn($group) => $group->sum('amount'))
                ->values()
                ->toArray()
        );

        if ($dailyVariance < $averageDaily * 0.3) {
            $spendingStyle = 'consistent';
        } elseif ($dailyVariance < $averageDaily * 0.7) {
            $spendingStyle = 'moderate';
        } else {
            $spendingStyle = 'variable';
        }

        $habits = [
            'average_daily' => round($averageDaily, 2),
            'top_categories' => $topCategories,
            'spending_style' => $spendingStyle,
            'variance' => round($dailyVariance, 2),
        ];

        $this->storePreference('spending_habits', $habits);

        return $habits;
    }

    /**
     * Detect study preferences
     * 
     * @return array
     */
    private function detectStudyPreferences(): array
    {
        $goals = StudyGoal::all();

        if ($goals->isEmpty()) {
            return [
                'preferred_types' => [],
                'average_progress_rate' => 0,
                'consistency' => 'unknown',
            ];
        }

        // Preferred study types
        $typeCount = $goals->groupBy('study_type')->map(fn($g) => $g->count())->sortDesc();
        
        // Average progress rate
        $avgProgress = $goals->avg('progress');
        
        // Consistency (goals with > 50% progress)
        $consistentGoals = $goals->where('progress', '>=', 50)->count();
        $consistency = $goals->count() > 0 ? ($consistentGoals / $goals->count()) : 0;

        $preferences = [
            'preferred_types' => $typeCount->take(3)->toArray(),
            'average_progress_rate' => round($avgProgress, 1),
            'consistency' => $consistency >= 0.7 ? 'high' : ($consistency >= 0.4 ? 'medium' : 'low'),
            'total_goals' => $goals->count(),
        ];

        $this->storePreference('study_preferences', $preferences);

        return $preferences;
    }

    /**
     * Detect task priority preferences
     * 
     * @return array
     */
    private function detectTaskPriorities(): array
    {
        $completedTasks = Task::where('done', true)
            ->where('updated_at', '>=', now()->subDays(30))
            ->get();

        if ($completedTasks->isEmpty()) {
            return [
                'preferred_priority' => 'medium',
                'completion_rate_by_priority' => [],
            ];
        }

        $priorityCompletions = $completedTasks->groupBy('priority')->map(fn($g) => $g->count());
        $preferredPriority = $priorityCompletions->sortDesc()->keys()->first() ?? 'medium';

        // Calculate completion rates
        $allTasks = Task::where('created_at', '>=', now()->subDays(30))->get();
        $completionRates = [];
        
        foreach (['low', 'medium', 'high'] as $priority) {
            $total = $allTasks->where('priority', $priority)->count();
            $completed = $completedTasks->where('priority', $priority)->count();
            $completionRates[$priority] = $total > 0 ? round(($completed / $total) * 100, 1) : 0;
        }

        $priorities = [
            'preferred_priority' => $preferredPriority,
            'completion_rate_by_priority' => $completionRates,
            'total_completed' => $completedTasks->count(),
        ];

        $this->storePreference('task_priorities', $priorities);

        return $priorities;
    }

    /**
     * Detect work style
     * 
     * @return array
     */
    private function detectWorkStyle(): array
    {
        $recentTasks = Task::where('created_at', '>=', now()->subDays(30))->get();

        if ($recentTasks->isEmpty()) {
            return ['style' => 'unknown'];
        }

        $withEstimates = $recentTasks->whereNotNull('estimated_minutes')->count();
        $shortTasks = $recentTasks->where('estimated_minutes', '<=', 60)->count();
        $longTasks = $recentTasks->where('estimated_minutes', '>', 60)->count();

        // Determine work style
        if ($shortTasks > $longTasks * 2) {
            $style = 'quick_wins'; // Prefers many small tasks
        } elseif ($longTasks > $shortTasks) {
            $style = 'deep_work'; // Prefers fewer, longer tasks
        } else {
            $style = 'balanced';
        }

        $workStyle = [
            'style' => $style,
            'planning_tendency' => $withEstimates / max(1, $recentTasks->count()),
            'average_task_duration' => round($recentTasks->whereNotNull('estimated_minutes')->avg('estimated_minutes'), 0),
        ];

        $this->storePreference('work_style', $workStyle);

        return $workStyle;
    }

    /**
     * Store preference in vector memory
     * 
     * @param string $key
     * @param array $data
     * @return void
     */
    private function storePreference(string $key, array $data): void
    {
        $content = "{$key}: " . json_encode($data);
        
        $this->vectorMemory->store(
            "preference_{$key}",
            $data,
            'preferences',
            $content,
            ['detected_at' => now()->toISOString()]
        );
    }

    /**
     * Calculate variance
     * 
     * @param array $values
     * @return float
     */
    private function calculateVariance(array $values): float
    {
        if (empty($values)) return 0;

        $mean = array_sum($values) / count($values);
        $squaredDiffs = array_map(fn($val) => pow($val - $mean, 2), $values);
        
        return sqrt(array_sum($squaredDiffs) / count($values));
    }

    /**
     * Get user insights summary
     * 
     * @return array
     */
    public function getInsightsSummary(): array
    {
        $preferences = $this->detectPreferences();

        $insights = [];

        // Productivity insight
        if ($preferences['productivity_pattern']['confidence'] > 0.6) {
            $pattern = $preferences['productivity_pattern']['pattern'];
            $insights[] = "You are most productive during {$pattern} hours.";
        }

        // Spending insight
        if (!empty($preferences['spending_habits']['top_categories'])) {
            $topCategory = array_key_first($preferences['spending_habits']['top_categories']);
            $insights[] = "Your highest spending category is {$topCategory}.";
        }

        // Study insight
        if ($preferences['study_preferences']['consistency'] === 'high') {
            $insights[] = "You maintain high consistency in your study goals.";
        }

        // Task insight
        $preferredPriority = $preferences['task_priorities']['preferred_priority'];
        $insights[] = "You tend to focus on {$preferredPriority} priority tasks.";

        // Work style insight
        $workStyle = $preferences['work_style']['style'];
        $styleDescriptions = [
            'quick_wins' => 'You prefer completing many small tasks',
            'deep_work' => 'You prefer focused, deep work sessions',
            'balanced' => 'You balance between quick tasks and deep work',
        ];
        $insights[] = $styleDescriptions[$workStyle] ?? 'Your work style is developing';

        return [
            'preferences' => $preferences,
            'insights' => $insights,
            'last_updated' => now()->toISOString(),
        ];
    }
}
