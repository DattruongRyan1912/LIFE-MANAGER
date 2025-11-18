<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $task = Task::create($validator->validated());

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
}
