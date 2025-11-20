<?php

namespace App\Http\Controllers;

use App\Models\StudyModule;
use App\Models\StudyTask;
use App\Services\StudyTaskService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class StudyTaskController extends Controller
{
    private $taskService;

    public function __construct(StudyTaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    /**
     * Get all tasks for a module
     * 
     * @param int $moduleId
     * @return JsonResponse
     */
    public function index(int $moduleId): JsonResponse
    {
        $module = StudyModule::findOrFail($moduleId);

        // Check authorization
        if ($module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tasks = $module->tasks()
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tasks->map(function($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'due_date' => $task->due_date->toDateString(),
                    'estimated_minutes' => $task->estimated_minutes,
                    'completed_at' => $task->completed_at ? $task->completed_at->toISOString() : null,
                    'priority' => $task->priority,
                    'is_completed' => $task->isCompleted(),
                    'is_overdue' => $task->isOverdue(),
                    'created_at' => $task->created_at->toISOString(),
                ];
            }),
            'statistics' => $this->taskService->getModuleTaskStatistics($module),
        ]);
    }

    /**
     * Get single task
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $task = StudyTask::with(['module.goal', 'notes'])->findOrFail($id);

        // Check authorization
        if ($task->module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $task->id,
                'module_id' => $task->module_id,
                'module_name' => $task->module->title,
                'goal_name' => $task->module->goal->name,
                'title' => $task->title,
                'description' => $task->description,
                'due_date' => $task->due_date->toDateString(),
                'estimated_minutes' => $task->estimated_minutes,
                'completed_at' => $task->completed_at->toISOString(),
                'priority' => $task->priority,
                'is_completed' => $task->isCompleted(),
                'is_overdue' => $task->isOverdue(),
                'notes_count' => $task->notes->count(),
                'created_at' => $task->created_at->toISOString(),
                'updated_at' => $task->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Create new task manually
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:study_modules,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date|after_or_equal:today',
            'estimated_minutes' => 'required|integer|min:5|max:480',
            'priority' => 'required|in:low,medium,high',
        ]);

        $module = StudyModule::findOrFail($validated['module_id']);

        // Check authorization
        if ($module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $task = StudyTask::create([
            'module_id' => $validated['module_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'due_date' => Carbon::parse($validated['due_date']),
            'estimated_minutes' => $validated['estimated_minutes'],
            'priority' => $validated['priority'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'due_date' => $task->due_date->toDateString(),
                'estimated_minutes' => $task->estimated_minutes,
                'priority' => $task->priority,
            ],
        ], 201);
    }

    /**
     * Update task
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $task = StudyTask::findOrFail($id);

        // Check authorization
        if ($task->module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'sometimes|date',
            'estimated_minutes' => 'sometimes|integer|min:5|max:480',
            'priority' => 'sometimes|in:low,medium,high',
        ]);

        if (isset($validated['due_date'])) {
            $validated['due_date'] = Carbon::parse($validated['due_date']);
        }

        $updatedTask = $this->taskService->updateTask($task, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => [
                'id' => $updatedTask->id,
                'title' => $updatedTask->title,
                'description' => $updatedTask->description,
                'due_date' => $updatedTask->due_date->toDateString(),
                'estimated_minutes' => $updatedTask->estimated_minutes,
                'priority' => $updatedTask->priority,
            ],
        ]);
    }

    /**
     * Delete task
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $task = StudyTask::findOrFail($id);

        // Check authorization
        if ($task->module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $this->taskService->deleteTask($task);

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Generate tasks using AI
     * 
     * @param Request $request
     * @param int $moduleId
     * @return JsonResponse
     */
    public function generateTasks(Request $request, int $moduleId): JsonResponse
    {
        $module = StudyModule::with('goal')->findOrFail($moduleId);

        // Check authorization
        if ($module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'start_date' => 'nullable|date|after_or_equal:today',
        ]);

        $startDate = isset($validated['start_date']) 
            ? Carbon::parse($validated['start_date'])
            : Carbon::now();

        try {
            $tasksData = $this->taskService->generateTasksForModule($module);

            if (empty($tasksData)) {
                return response()->json([
                    'error' => 'Failed to generate tasks. Please try again or create manually.',
                ], 500);
            }

            $this->taskService->createTasksForModule($module, $tasksData, $startDate);

            // Reload tasks
            $tasks = $module->tasks()->orderBy('due_date')->get();

            return response()->json([
                'success' => true,
                'message' => 'Tasks generated successfully',
                'data' => $tasks->map(fn($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'description' => $t->description,
                    'due_date' => $t->due_date->toDateString(),
                    'estimated_minutes' => $t->estimated_minutes,
                    'priority' => $t->priority,
                ]),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate tasks: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle task completion
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function toggleCompletion(int $id): JsonResponse
    {
        $task = StudyTask::findOrFail($id);

        // Check authorization
        if ($task->module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $updatedTask = $this->taskService->toggleCompletion($task);

        return response()->json([
            'success' => true,
            'message' => $updatedTask->isCompleted() 
                ? 'Task marked as completed' 
                : 'Task marked as incomplete',
            'data' => [
                'id' => $updatedTask->id,
                'is_completed' => $updatedTask->isCompleted(),
                'completed_at' => $updatedTask->completed_at ? $updatedTask->completed_at->toISOString() : null,
                'module_progress' => $updatedTask->module->progress,
            ],
        ]);
    }

    /**
     * Bulk update task priorities
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkUpdatePriority(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'task_ids' => 'required|array',
            'task_ids.*' => 'required|integer|exists:study_tasks,id',
            'priority' => 'required|in:low,medium,high',
        ]);

        // Verify all tasks belong to user
        $tasks = StudyTask::with('module.goal')
            ->whereIn('id', $validated['task_ids'])
            ->get();

        foreach ($tasks as $task) {
            if ($task->module->goal->user_id !== auth()->id() ?? 1) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        $updated = $this->taskService->bulkUpdatePriority(
            $validated['task_ids'],
            $validated['priority']
        );

        return response()->json([
            'success' => true,
            'message' => "{$updated} tasks updated successfully",
            'data' => [
                'updated_count' => $updated,
                'priority' => $validated['priority'],
            ],
        ]);
    }

    /**
     * Reschedule task
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function reschedule(Request $request, int $id): JsonResponse
    {
        $task = StudyTask::findOrFail($id);

        // Check authorization
        if ($task->module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'new_due_date' => 'required|date|after_or_equal:today',
        ]);

        $newDueDate = Carbon::parse($validated['new_due_date']);
        $updatedTask = $this->taskService->rescheduleTask($task, $newDueDate);

        return response()->json([
            'success' => true,
            'message' => 'Task rescheduled successfully',
            'data' => [
                'id' => $updatedTask->id,
                'due_date' => $updatedTask->due_date->toDateString(),
                'is_overdue' => $updatedTask->isOverdue(),
            ],
        ]);
    }

    /**
     * Get pending tasks for module
     * 
     * @param int $moduleId
     * @return JsonResponse
     */
    public function getPending(int $moduleId): JsonResponse
    {
        $module = StudyModule::findOrFail($moduleId);

        // Check authorization
        if ($module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tasks = $this->taskService->getPendingTasks($module);

        return response()->json([
            'success' => true,
            'data' => $tasks->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'due_date' => $t->due_date->toDateString(),
                'estimated_minutes' => $t->estimated_minutes,
                'priority' => $t->priority,
                'is_overdue' => $t->isOverdue(),
            ]),
        ]);
    }

    /**
     * Get overdue tasks for module
     * 
     * @param int $moduleId
     * @return JsonResponse
     */
    public function getOverdue(int $moduleId): JsonResponse
    {
        $module = StudyModule::findOrFail($moduleId);

        // Check authorization
        if ($module->goal->user_id !== auth()->id() ?? 1) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tasks = $this->taskService->getOverdueTasks($module);

        return response()->json([
            'success' => true,
            'data' => $tasks->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'due_date' => $t->due_date->toDateString(),
                'estimated_minutes' => $t->estimated_minutes,
                'priority' => $t->priority,
                'days_overdue' => $t->due_date->diffInDays(now()),
            ]),
        ]);
    }
}
