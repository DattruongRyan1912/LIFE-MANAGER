<?php

namespace App\Services;

use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RecurringTaskService
{
    /**
     * Generate recurring task instances for a given date range
     */
    public function generateRecurringInstances(Task $task, Carbon $startDate, Carbon $endDate): Collection
    {
        if (!$task->isRecurring()) {
            return collect();
        }

        $instances = collect();
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            // Check if we've passed the recurrence end date
            if ($task->recurrence_end_date && $currentDate->gt($task->recurrence_end_date)) {
                break;
            }

            // Create instance for this date
            $instance = $this->createInstance($task, $currentDate);
            $instances->push($instance);

            // Move to next occurrence
            $currentDate = $this->getNextOccurrence($currentDate, $task->recurrence_type, $task->recurrence_interval);
        }

        return $instances;
    }

    /**
     * Create a single task instance
     */
    private function createInstance(Task $parentTask, Carbon $dueDate): Task
    {
        // Check if instance already exists
        $existing = Task::where('parent_task_id', $parentTask->id)
            ->whereDate('due_at', $dueDate->toDateString())
            ->first();

        if ($existing) {
            return $existing;
        }

        // Create new instance
        return Task::create([
            'title' => $parentTask->title,
            'priority' => $parentTask->priority,
            'due_at' => $dueDate,
            'estimated_minutes' => $parentTask->estimated_minutes,
            'done' => false,
            'parent_task_id' => $parentTask->id,
            'recurrence_type' => 'none', // Instances are not recurring themselves
            'pomodoro_estimate' => $parentTask->pomodoro_estimate,
            'pomodoro_completed' => 0,
        ]);
    }

    /**
     * Calculate next occurrence date
     */
    private function getNextOccurrence(Carbon $currentDate, string $recurrenceType, int $interval): Carbon
    {
        $nextDate = $currentDate->copy();

        switch ($recurrenceType) {
            case 'daily':
                $nextDate->addDays($interval);
                break;
            case 'weekly':
                $nextDate->addWeeks($interval);
                break;
            case 'monthly':
                $nextDate->addMonths($interval);
                break;
        }

        return $nextDate;
    }

    /**
     * Get AI-suggested Pomodoro count based on estimated minutes
     */
    public function suggestPomodoroCount(int $estimatedMinutes, string $priority = 'medium'): int
    {
        // Base calculation: 1 Pomodoro = 25 minutes of focused work
        $basePomodoros = ceil($estimatedMinutes / 25);

        // Adjust based on priority complexity
        $multiplier = 1.0;
        switch ($priority) {
            case 'high':
                $multiplier = 1.2; // High priority tasks often more complex
                break;
            case 'low':
                $multiplier = 0.8;
                break;
            default:
                $multiplier = 1.0;
                break;
        }

        $suggested = ceil($basePomodoros * $multiplier);

        // Add breaks consideration (short break every 4 pomodoros)
        if ($suggested > 4) {
            $breakSets = floor($suggested / 4);
            $suggested += $breakSets; // Add long breaks
        }

        return max(1, $suggested); // At least 1 Pomodoro
    }

    /**
     * Complete a Pomodoro session for a task
     */
    public function completePomodoroSession(Task $task): Task
    {
        $task->increment('pomodoro_completed');
        
        // Auto-complete task if all Pomodoros done
        if ($task->pomodoro_estimate && $task->pomodoro_completed >= $task->pomodoro_estimate) {
            $task->done = true;
            $task->save();
        }

        return $task->fresh();
    }

    /**
     * Get timeline data for tasks
     */
    public function getTimelineData(Carbon $startDate, Carbon $endDate, int $userId = null): array
    {
        $query = Task::whereBetween('due_at', [$startDate, $endDate]);
        
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        $tasks = $query->orderBy('timeline_order')
            ->orderBy('due_at')
            ->get();

        $recurringQuery = Task::where('recurrence_type', '!=', 'none')
            ->where(function ($q) use ($endDate) {
                $q->whereNull('recurrence_end_date')
                    ->orWhere('recurrence_end_date', '>=', $endDate);
            });
            
        if ($userId) {
            $recurringQuery->where('user_id', $userId);
        }
        
        $recurringTasks = $recurringQuery->get();

        // Generate instances for recurring tasks
        $allTasks = $tasks;
        foreach ($recurringTasks as $recurringTask) {
            $instances = $this->generateRecurringInstances($recurringTask, $startDate, $endDate);
            $allTasks = $allTasks->merge($instances);
        }

        // Group by date
        return $allTasks->groupBy(function ($task) {
            return $task->due_at->format('Y-m-d');
        })->map(function ($dayTasks) {
            return $dayTasks->sortBy('timeline_order')->values();
        })->toArray();
    }

    /**
     * Update timeline order for tasks
     */
    public function updateTimelineOrder(array $taskOrders, int $userId = null): void
    {
        foreach ($taskOrders as $taskId => $order) {
            $query = Task::where('id', $taskId);
            
            if ($userId) {
                $query->where('user_id', $userId);
            }
            
            $query->update(['timeline_order' => $order]);
        }
    }
}
