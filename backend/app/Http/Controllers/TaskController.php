<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskLog;
use App\Services\RecurringTaskService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * Get today's tasks
     */
    public function today()
    {
        $tasks = Task::where('user_id', $this->getUserId())
            ->whereDate('due_at', today())
            ->orderBy('priority', 'desc')
            ->orderBy('due_at', 'asc')
            ->get();

        return response()->json($tasks);
    }

    /**
     * Get all tasks
     */
    public function index()
    {
        $tasks = Task::where('user_id', $this->getUserId())
            ->orderBy('due_at', 'asc')
            ->get();
        return response()->json($tasks);
    }

    /**
     * Get a single task
     */
    public function show(Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($task);
    }

    /**
     * Create a new task
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'priority' => 'in:low,medium,high',
            'due_at' => 'nullable|date',
            'start_date' => 'nullable|date',
            'estimated_minutes' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'status' => 'in:backlog,next,in_progress,blocked,done',
            'task_type' => 'nullable|string|max:50',
            'recurrence_type' => 'in:none,daily,weekly,monthly',
            'recurrence_interval' => 'nullable|integer|min:1',
            'recurrence_end_date' => 'nullable|date|after:due_at',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        
        // Auto-set start_date to now if not provided (when creating task with due_at)
        if (!isset($data['start_date']) && isset($data['due_at'])) {
            $data['start_date'] = Carbon::now()->startOfDay()->toDateTimeString();
        }
        
        // Auto-suggest Pomodoro count if estimated_minutes is provided
        if (isset($data['estimated_minutes']) && $data['estimated_minutes'] > 0) {
            $recurringService = new RecurringTaskService();
            $data['pomodoro_estimate'] = $recurringService->suggestPomodoroCount(
                $data['estimated_minutes'],
                $data['priority'] ?? 'medium'
            );
        }

        $data['user_id'] = $this->getUserId();
        $task = Task::create($data);

        return response()->json($task, 201);
    }

    /**
     * Update a task
     */
    public function update(Request $request, Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'priority' => 'in:low,medium,high',
            'due_at' => 'nullable|date',
            'start_date' => 'nullable|date',
            'estimated_minutes' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'status' => 'in:backlog,next,in_progress,blocked,done',
            'task_type' => 'nullable|string|max:50',
            'done' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $task->update($validator->validated());

        return response()->json($task);
    }

    /**
     * Delete a task
     */
    public function destroy(Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        $task->delete();
        return response()->json(['message' => 'Task deleted successfully']);
    }

    /**
     * Toggle task completion status
     */
    public function toggle(Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Toggle logic:
        // - If task is 'done', revert to task's saved previous_status (or 'in_progress' if not saved)
        // - If task is NOT 'done', save current status to previous_status, then mark as 'done'
        if ($task->status === 'done') {
            // Reverting from done → previous status
            $newStatus = $task->previous_status ?: 'in_progress';
            $newPreviousStatus = null; // Clear previous_status when undoing
        } else {
            // Marking as done → save current status
            $newStatus = 'done';
            $newPreviousStatus = $task->status; // Save current status before changing
        }
        
        $task->update([
            'status' => $newStatus,
            'previous_status' => $newPreviousStatus,
            'done' => $newStatus === 'done', // Keep old field in sync
        ]);
        
        // Refresh to get the updated data
        $task->refresh();
        
        return response()->json($task);
    }

    /**
     * Get timeline view of tasks
     */
    public function timeline(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfWeek());
        $endDate = $request->input('end_date', now()->endOfWeek()->addWeeks(2));

        $recurringService = new RecurringTaskService();
        $timelineData = $recurringService->getTimelineData(
            Carbon::parse($startDate),
            Carbon::parse($endDate),
            $this->getUserId()
        );

        return response()->json($timelineData);
    }

    /**
     * Update timeline order for tasks (drag & drop)
     */
    public function updateTimelineOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'task_orders' => 'required|array',
            'task_orders.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $recurringService = new RecurringTaskService();
        $recurringService->updateTimelineOrder(
            $request->input('task_orders'),
            $this->getUserId()
        );

        return response()->json(['message' => 'Timeline order updated successfully']);
    }

    /**
     * Complete a Pomodoro session
     */
    public function completePomodoroSession(Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $recurringService = new RecurringTaskService();
        $updatedTask = $recurringService->completePomodoroSession($task);

        return response()->json($updatedTask);
    }

    /**
     * Get Pomodoro suggestion for a task
     */
    public function suggestPomodoro(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'estimated_minutes' => 'required|integer|min:1',
            'priority' => 'in:low,medium,high',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $recurringService = new RecurringTaskService();
        $suggestion = $recurringService->suggestPomodoroCount(
            $request->input('estimated_minutes'),
            $request->input('priority', 'medium')
        );

        return response()->json([
            'estimated_minutes' => $request->input('estimated_minutes'),
            'priority' => $request->input('priority', 'medium'),
            'suggested_pomodoros' => $suggestion,
            'estimated_total_time' => $suggestion * 25, // Including breaks
        ]);
    }

    // ==================== TASK V3 ENDPOINTS ====================

    /**
     * Get Kanban board data (grouped by status)
     * GET /api/tasks/kanban
     * 
     * Sorting logic:
     * 1. Priority DESC (high -> medium -> low)
     * 2. Due Date ASC (nearest deadline first, nulls last)
     * 3. Created Date DESC (newest first)
     */
    public function kanban()
    {
        $tasks = Task::where('user_id', $this->getUserId())
            ->with(['labels', 'childTasks'])
            ->orderByRaw("CASE 
                WHEN priority = 'high' THEN 1 
                WHEN priority = 'medium' THEN 2 
                WHEN priority = 'low' THEN 3 
                ELSE 4 
            END")
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        $kanban = [
            'backlog' => $tasks->where('status', 'backlog')->values(),
            'next' => $tasks->where('status', 'next')->values(),
            'in_progress' => $tasks->where('status', 'in_progress')->values(),
            'blocked' => $tasks->where('status', 'blocked')->values(),
            'done' => $tasks->where('status', 'done')->values(),
        ];

        return response()->json($kanban);
    }

    /**
     * Update task status (for Kanban)
     * PATCH /api/tasks/{task}/status
     */
    public function updateStatus(Request $request, Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:backlog,next,in_progress,blocked,done',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $oldStatus = $task->status;
        $task->update(['status' => $request->status]);

        // Log status change
        TaskLog::create([
            'task_id' => $task->id,
            'user_id' => $this->getUserId(),
            'event_type' => 'status_changed',
            'changes' => [
                'old_value' => $oldStatus,
                'new_value' => $request->status,
            ],
            'created_at' => now(),
        ]);

        return response()->json($task->fresh(['labels', 'childTasks']));
    }

    /**
     * Get Calendar view data
     * GET /api/tasks/calendar
     */
    public function calendar(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $tasks = Task::where('user_id', $this->getUserId())
            ->whereBetween('due_at', [Carbon::parse($startDate), Carbon::parse($endDate)])
            ->with(['labels'])
            ->orderBy('due_at')
            ->get();

        return response()->json($tasks);
    }

    /**
     * Move task to different date (Calendar drag & drop)
     * PATCH /api/tasks/{task}/calendar-move
     */
    public function calendarMove(Request $request, Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'due_at' => 'required|date',
            'start_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $task->update($validator->validated());

        return response()->json($task);
    }

    /**
     * Get subtasks for a task
     * GET /api/tasks/{task}/subtasks
     */
    public function getSubtasks(Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $subtasks = Task::where('parent_task_id', $task->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($subtasks);
    }

    /**
     * Create subtask
     * POST /api/tasks/{task}/subtasks
     */
    public function createSubtask(Request $request, Task $task)
    {
        if ($task->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'priority' => 'in:low,medium,high',
            'due_at' => 'nullable|date',
            'estimated_minutes' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $this->getUserId();
        $data['parent_task_id'] = $task->id;
        $data['status'] = 'backlog';
        $data['task_type'] = $task->task_type;

        $subtask = Task::create($data);

        return response()->json($subtask, 201);
    }

    /**
     * Get current user ID for multi-tenancy
     */
    private function getUserId(): int
    {
        return auth()->id() ?? 1;
    }
}
