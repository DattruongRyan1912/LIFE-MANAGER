<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskDependency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TaskDependencyController extends Controller
{
    /**
     * Get user_id from authenticated user or request
     */
    private function getUserId(Request $request)
    {
        return Auth::id() ?? $request->input('user_id', 1);
    }

    /**
     * Add a dependency (task is blocked by another task)
     */
    public function store(Request $request, $taskId)
    {
        $userId = $this->getUserId($request);

        // Verify task ownership
        $task = Task::where('user_id', $userId)->find($taskId);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'blocked_by_task_id' => 'required|integer|exists:tasks,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $blockedByTaskId = $request->blocked_by_task_id;

        // Verify blocked_by task ownership
        $blockedByTask = Task::where('user_id', $userId)->find($blockedByTaskId);
        if (!$blockedByTask) {
            return response()->json([
                'message' => 'Blocked by task not found or does not belong to you'
            ], 404);
        }

        // Prevent self-dependency
        if ($taskId == $blockedByTaskId) {
            return response()->json([
                'message' => 'A task cannot depend on itself'
            ], 422);
        }

        // Check if dependency already exists
        $exists = TaskDependency::where('task_id', $taskId)
            ->where('blocked_by_task_id', $blockedByTaskId)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Dependency already exists'
            ], 409);
        }

        // Check for circular dependency
        if ($this->wouldCreateCircularDependency($taskId, $blockedByTaskId)) {
            return response()->json([
                'message' => 'This would create a circular dependency',
                'details' => 'Task #' . $blockedByTaskId . ' already depends on task #' . $taskId . ' (directly or indirectly)'
            ], 422);
        }

        // Create dependency
        $dependency = TaskDependency::create([
            'task_id' => $taskId,
            'blocked_by_task_id' => $blockedByTaskId,
        ]);

        // Load relationships for response
        $task->load(['dependencies.blockedByTask', 'blockedBy.task']);

        return response()->json([
            'message' => 'Dependency added successfully',
            'dependency' => $dependency,
            'task' => $task
        ], 201);
    }

    /**
     * Remove a dependency
     */
    public function destroy(Request $request, $taskId, $dependencyId)
    {
        $userId = $this->getUserId($request);

        // Verify task ownership
        $task = Task::where('user_id', $userId)->find($taskId);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        // Find and delete dependency
        $dependency = TaskDependency::where('task_id', $taskId)
            ->where('id', $dependencyId)
            ->first();

        if (!$dependency) {
            return response()->json(['message' => 'Dependency not found'], 404);
        }

        $dependency->delete();

        // Reload relationships
        $task->load(['dependencies.blockedByTask', 'blockedBy.task']);

        return response()->json([
            'message' => 'Dependency removed successfully',
            'task' => $task
        ]);
    }

    /**
     * Get all dependencies for a task
     */
    public function index(Request $request, $taskId)
    {
        $userId = $this->getUserId($request);

        $task = Task::where('user_id', $userId)->find($taskId);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $task->load([
            'dependencies.blockedByTask',
            'blockedBy.task'
        ]);

        return response()->json([
            'blocked_by' => $task->dependencies->map(fn($dep) => $dep->blockedByTask),
            'blocking' => $task->blockedBy->map(fn($dep) => $dep->task),
        ]);
    }

    /**
     * Check if adding a dependency would create a circular dependency
     * 
     * @param int $taskId The task that would depend on another
     * @param int $blockedByTaskId The task that would block
     * @return bool True if circular dependency would be created
     */
    private function wouldCreateCircularDependency($taskId, $blockedByTaskId)
    {
        // Check if blockedByTask already depends on taskId (directly or indirectly)
        return $this->dependsOn($blockedByTaskId, $taskId);
    }

    /**
     * Recursively check if taskA depends on taskB
     * 
     * @param int $taskAId
     * @param int $taskBId
     * @param array $visited Track visited tasks to prevent infinite loops
     * @return bool
     */
    private function dependsOn($taskAId, $taskBId, $visited = [])
    {
        // Prevent infinite loops
        if (in_array($taskAId, $visited)) {
            return false;
        }
        $visited[] = $taskAId;

        // Get all tasks that taskA is blocked by
        $dependencies = TaskDependency::where('task_id', $taskAId)
            ->pluck('blocked_by_task_id')
            ->toArray();

        // Direct dependency found
        if (in_array($taskBId, $dependencies)) {
            return true;
        }

        // Check indirect dependencies (recursively)
        foreach ($dependencies as $dependencyId) {
            if ($this->dependsOn($dependencyId, $taskBId, $visited)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get dependency graph for visualization
     * Returns all tasks with their dependencies
     */
    public function getGraph(Request $request)
    {
        $userId = $this->getUserId($request);

        $tasks = Task::where('user_id', $userId)
            ->with(['dependencies.blockedByTask', 'blockedBy.task'])
            ->get();

        // Format for graph visualization
        $nodes = $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'label' => $task->title,
                'status' => $task->status,
                'priority' => $task->priority,
            ];
        });

        $edges = [];
        foreach ($tasks as $task) {
            foreach ($task->dependencies as $dep) {
                $edges[] = [
                    'from' => $dep->blocked_by_task_id,
                    'to' => $task->id,
                    'label' => 'blocks',
                ];
            }
        }

        // Detect circular dependencies
        $circularDependencies = $this->detectCircularDependencies($tasks);

        return response()->json([
            'nodes' => $nodes,
            'edges' => $edges,
            'circular_dependencies' => $circularDependencies,
        ]);
    }

    /**
     * Detect all circular dependencies in the graph
     */
    private function detectCircularDependencies($tasks)
    {
        $circular = [];

        foreach ($tasks as $task) {
            foreach ($task->dependencies as $dep) {
                if ($this->dependsOn($dep->blocked_by_task_id, $task->id)) {
                    $circular[] = [
                        'task_id' => $task->id,
                        'blocked_by_task_id' => $dep->blocked_by_task_id,
                        'message' => "Task #{$task->id} and Task #{$dep->blocked_by_task_id} have circular dependency"
                    ];
                }
            }
        }

        return $circular;
    }
}
