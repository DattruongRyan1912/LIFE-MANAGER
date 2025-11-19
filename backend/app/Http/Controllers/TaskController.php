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
     * Create a new task
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'priority' => 'in:low,medium,high',
            'due_at' => 'required|date',
            'estimated_minutes' => 'nullable|integer|min:0',
            'recurrence_type' => 'in:none,daily,weekly,monthly',
            'recurrence_interval' => 'nullable|integer|min:1',
            'recurrence_end_date' => 'nullable|date|after:due_at',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        
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
            'due_at' => 'date',
            'estimated_minutes' => 'nullable|integer|min:0',
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

        $task->update(['done' => !$task->done]);
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
     */
    public function kanban()
    {
        $tasks = Task::where('user_id', $this->getUserId())
            ->with(['labels', 'childTasks'])
            ->orderBy('timeline_order')
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
