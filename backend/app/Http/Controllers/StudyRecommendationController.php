<?php

namespace App\Http\Controllers;

use App\Models\StudyGoal;
use App\Models\StudyModule;
use App\Services\RecommendationEngine;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudyRecommendationController extends Controller
{
    private $recommendationEngine;

    public function __construct(RecommendationEngine $recommendationEngine)
    {
        $this->recommendationEngine = $recommendationEngine;
    }

    /**
     * Get current user ID (default to 1 if not authenticated)
     */
    private function getCurrentUserId(): int
    {
        return auth()->id() ?? 1 ?? 1;
    }

    /**
     * Get daily study plan
     * 
     * @return JsonResponse
     */
    public function getDailyPlan(): JsonResponse
    {
        $userId = $this->getCurrentUserId();
        $plan = $this->recommendationEngine->getDailyStudyPlan($userId);

        return response()->json([
            'success' => true,
            'data' => $plan,
        ]);
    }

    /**
     * Get resource suggestions for module
     * 
     * @param int $moduleId
     * @return JsonResponse
     */
    public function getResourceSuggestions(int $moduleId): JsonResponse
    {
        $module = StudyModule::with('goal')->findOrFail($moduleId);

        // Check authorization (TEMPORARY: Disabled for development)
        // if ($module->goal->user_id !== $this->getCurrentUserId()) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        try {
            $resources = $this->recommendationEngine->suggestResources($module);

            return response()->json([
                'success' => true,
                'data' => $resources,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate resource suggestions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Detect weak areas in goal
     * 
     * @param int $goalId
     * @return JsonResponse
     */
    public function getWeaknesses(int $goalId): JsonResponse
    {
        $goal = StudyGoal::with('modules.tasks')->findOrFail($goalId);

        // Check authorization (TEMPORARY: Disabled for development)
        // if ($goal->user_id !== $this->getCurrentUserId()) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        $weaknesses = $this->recommendationEngine->detectWeaknesses($goal);

        return response()->json([
            'success' => true,
            'data' => [
                'goal_id' => $goal->id,
                'goal_name' => $goal->name,
                'overall_progress' => $goal->progress,
                'weaknesses' => $weaknesses,
                'total_weak_modules' => count($weaknesses),
            ],
        ]);
    }

    /**
     * Get all active goals overview with progress
     * 
     * @return JsonResponse
     */
    public function getGoalsOverview(): JsonResponse
    {
        $userId = $this->getCurrentUserId();

        $goals = StudyGoal::where('user_id', $userId)
            ->whereIn('status', ['in_progress', 'not_started'])
            ->with(['modules'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $goals->map(function($goal) {
                $totalModules = $goal->modules->count();
                $completedModules = $goal->modules->where('progress', '>=', 100)->count();
                $totalTasks = $goal->modules->sum(fn($m) => $m->tasks->count());
                $completedTasks = $goal->modules->sum(fn($m) => $m->completedTasksCount());

                return [
                    'id' => $goal->id,
                    'name' => $goal->name,
                    'study_type' => $goal->study_type,
                    'progress' => $goal->progress,
                    'status' => $goal->status,
                    'deadline' => $goal->deadline->toDateString(),
                    'days_remaining' => $goal->deadline ? $goal->deadline->diffInDays(now()) : null,
                    'modules_stats' => [
                        'total' => $totalModules,
                        'completed' => $completedModules,
                        'in_progress' => $totalModules - $completedModules,
                    ],
                    'tasks_stats' => [
                        'total' => $totalTasks,
                        'completed' => $completedTasks,
                        'pending' => $totalTasks - $completedTasks,
                    ],
                ];
            }),
        ]);
    }

    /**
     * Get study statistics summary
     * 
     * @return JsonResponse
     */
    public function getStatistics(): JsonResponse
    {
        $userId = $this->getCurrentUserId();

        $goals = StudyGoal::where('user_id', $userId)->with('modules.tasks')->get();

        $stats = [
            'total_goals' => $goals->count(),
            'active_goals' => $goals->whereIn('status', ['in_progress', 'not_started'])->count(),
            'completed_goals' => $goals->where('status', 'completed')->count(),
            'total_modules' => $goals->sum(fn($g) => $g->modules->count()),
            'completed_modules' => $goals->sum(fn($g) => $g->modules->where('progress', '>=', 100)->count()),
            'total_tasks' => $goals->sum(fn($g) => $g->modules->sum(fn($m) => $m->tasks->count())),
            'completed_tasks' => $goals->sum(fn($g) => $g->modules->sum(fn($m) => $m->completedTasksCount())),
            'total_study_hours' => $goals->sum(fn($g) => $g->modules->sum('estimated_hours')),
            'average_progress' => $goals->avg('progress') ?? 0,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
