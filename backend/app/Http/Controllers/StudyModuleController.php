<?php

namespace App\Http\Controllers;

use App\Models\StudyGoal;
use App\Models\StudyModule;
use App\Services\StudyModuleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudyModuleController extends Controller
{
    private $moduleService;

    public function __construct(StudyModuleService $moduleService)
    {
        $this->moduleService = $moduleService;
    }

    /**
     * Get all modules for a goal
     * 
     * @param int $goalId
     * @return JsonResponse
     */
    public function index(int $goalId): JsonResponse
    {
        $goal = StudyGoal::findOrFail($goalId);
        
        // TODO: Replace with proper auth when Sanctum is implemented
        $userId = auth()->id() ?? 1 ?? 1;
        
        // Check authorization
        if ($goal->user_id !== $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $modules = $goal->modules()
            ->with(['tasks' => function($query) {
                $query->select('id', 'module_id', 'title', 'completed_at', 'due_date', 'priority', 'estimated_minutes');
            }])
            ->orderBy('order_index')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $modules->map(function($module) {
                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'order_index' => $module->order_index,
                    'progress' => $module->progress,
                    'estimated_hours' => $module->estimated_hours,
                    'tasks_count' => $module->tasks->count(),
                    'completed_tasks' => $module->completedTasksCount(),
                    'pending_tasks' => $module->pendingTasksCount(),
                    'created_at' => $module->created_at->toISOString(),
                ];
            }),
        ]);
    }

    /**
     * Get single module with full details
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $module = $this->moduleService->getModuleWithDetails($id);

        if (!$module) {
            return response()->json(['error' => 'Module not found'], 404);
        }

        // Check authorization
        if ($module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $module->id,
                'goal_id' => $module->goal_id,
                'goal_name' => $module->goal->name,
                'title' => $module->title,
                'description' => $module->description,
                'order_index' => $module->order_index,
                'progress' => $module->progress,
                'estimated_hours' => $module->estimated_hours,
                'tasks' => $module->tasks->map(fn($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'description' => $t->description,
                    'due_date' => $t->due_date->toDateString(),
                    'estimated_minutes' => $t->estimated_minutes,
                    'completed_at' => $t->completed_at->toISOString(),
                    'priority' => $t->priority,
                    'is_completed' => $t->isCompleted(),
                    'is_overdue' => $t->isOverdue(),
                ]),
                'notes_count' => $module->notes->count(),
                'resources_count' => $module->resources->count(),
                'insights_count' => $module->insights->count(),
                'created_at' => $module->created_at->toISOString(),
                'updated_at' => $module->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Create new module manually
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'goal_id' => 'required|exists:study_goals,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'estimated_hours' => 'required|integer|min:1|max:500',
        ]);

        $goal = StudyGoal::findOrFail($validated['goal_id']);

        // Check authorization
        if ($goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get next order index
        $maxOrder = $goal->modules()->max('order_index') ?? -1;

        $module = StudyModule::create([
            'goal_id' => $validated['goal_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'estimated_hours' => $validated['estimated_hours'],
            'order_index' => $maxOrder + 1,
            'progress' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Module created successfully',
            'data' => [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'order_index' => $module->order_index,
                'progress' => $module->progress,
                'estimated_hours' => $module->estimated_hours,
            ],
        ], 201);
    }

    /**
     * Update module
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $module = StudyModule::findOrFail($id);

        // Check authorization
        if ($module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'estimated_hours' => 'sometimes|integer|min:1|max:500',
        ]);

        $updatedModule = $this->moduleService->updateModule($module, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Module updated successfully',
            'data' => [
                'id' => $updatedModule->id,
                'title' => $updatedModule->title,
                'description' => $updatedModule->description,
                'estimated_hours' => $updatedModule->estimated_hours,
                'progress' => $updatedModule->progress,
            ],
        ]);
    }

    /**
     * Delete module
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $module = StudyModule::findOrFail($id);

        // Check authorization
        if ($module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $this->moduleService->deleteModule($module);

        return response()->json([
            'success' => true,
            'message' => 'Module deleted successfully',
        ]);
    }

    /**
     * Generate modules using AI
     * 
     * @param Request $request
     * @param int $goalId
     * @return JsonResponse
     */
    public function generateModules(Request $request, int $goalId): JsonResponse
    {
        $goal = StudyGoal::findOrFail($goalId);

        // Check authorization
        if ($goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if modules already exist
        if ($goal->modules()->exists()) {
            return response()->json([
                'error' => 'Modules already exist for this goal. Delete existing modules first.',
            ], 400);
        }

        try {
            $modulesData = $this->moduleService->generateModulesFromGoal($goal);

            if (empty($modulesData)) {
                return response()->json([
                    'error' => 'Failed to generate modules. Please try again or create manually.',
                ], 500);
            }

            $this->moduleService->createModulesForGoal($goal, $modulesData);

            // Reload modules
            $modules = $goal->modules()->orderBy('order_index')->get();

            return response()->json([
                'success' => true,
                'message' => 'Modules generated successfully',
                'data' => $modules->map(fn($m) => [
                    'id' => $m->id,
                    'title' => $m->title,
                    'description' => $m->description,
                    'order_index' => $m->order_index,
                    'estimated_hours' => $m->estimated_hours,
                ]),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate modules: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reorder modules
     * 
     * @param Request $request
     * @param int $goalId
     * @return JsonResponse
     */
    public function reorder(Request $request, int $goalId): JsonResponse
    {
        $goal = StudyGoal::findOrFail($goalId);

        // Check authorization
        if ($goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'module_ids' => 'required|array',
            'module_ids.*' => 'required|integer|exists:study_modules,id',
        ]);

        try {
            $this->moduleService->reorderModules($goal, $validated['module_ids']);

            return response()->json([
                'success' => true,
                'message' => 'Modules reordered successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to reorder modules: ' . $e->getMessage(),
            ], 500);
        }
    }
}
