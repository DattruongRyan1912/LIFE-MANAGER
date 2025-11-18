<?php

namespace App\Http\Controllers;

use App\Models\Task;
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
        $tasks = Task::whereDate('due_at', today())
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
        $tasks = Task::orderBy('due_at', 'asc')->get();
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

        $task = Task::create($data);

        return response()->json($task, 201);
    }

    /**
     * Update a task
     */
    public function update(Request $request, Task $task)
    {
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
        $task->delete();
        return response()->json(['message' => 'Task deleted successfully']);
    }

    /**
     * Toggle task completion status
     */
    public function toggle(Task $task)
    {
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
            Carbon::parse($endDate)
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
        $recurringService->updateTimelineOrder($request->input('task_orders'));

        return response()->json(['message' => 'Timeline order updated successfully']);
    }

    /**
     * Complete a Pomodoro session
     */
    public function completePomodoroSession(Task $task)
    {
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
}
