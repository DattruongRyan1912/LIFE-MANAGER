<?php

namespace App\Services;

use App\Models\StudyModule;
use App\Models\StudyTask;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StudyTaskService
{
    private $groqApiKey;
    private $groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    public function __construct()
    {
        $this->groqApiKey = config('services.groq.api_key');
    }

    /**
     * Generate tasks for module using AI
     * 
     * @param StudyModule $module
     * @return array
     */
    public function generateTasksForModule(StudyModule $module): array
    {
        $prompt = $this->buildTaskGenerationPrompt($module);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->groqApiUrl, [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert learning task designer. Create actionable, specific study tasks with realistic time estimates.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'temperature' => 0.7,
                'max_tokens' => 2000,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'];
                return $this->parseTasksFromAI($content);
            }

            Log::warning('Groq API failed for task generation', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->generateFallbackTasks($module);
        } catch (\Exception $e) {
            Log::error('Task generation error: ' . $e->getMessage());
            return $this->generateFallbackTasks($module);
        }
    }

    /**
     * Build prompt for AI task generation
     * 
     * @param StudyModule $module
     * @return string
     */
    private function buildTaskGenerationPrompt(StudyModule $module): string
    {
        $goal = $module->goal;
        $deadline = $goal->deadline->format('Y-m-d');
        $estimatedHours = $module->estimated_hours ?? 10;

        return <<<PROMPT
Generate 5-10 specific, actionable study tasks for this module:

MODULE: {$module->title}
DESCRIPTION: {$module->description}
ESTIMATED HOURS: {$estimatedHours}
GOAL DEADLINE: {$deadline}

For each task, provide:
1. Title (specific action, e.g., "Read Chapter 3: Variables")
2. Description (what to do and expected outcome)
3. Estimated minutes (realistic time needed)
4. Priority (low, medium, high)
5. Task type (read, practice, watch, quiz, project)

Format as JSON array:
[
  {
    "title": "Task title",
    "description": "What to do",
    "estimated_minutes": 45,
    "priority": "medium",
    "type": "read"
  }
]

Make tasks specific, measurable, and progressively building on each other.
PROMPT;
    }

    /**
     * Parse AI response into tasks array
     * 
     * @param string $content
     * @return array
     */
    private function parseTasksFromAI(string $content): array
    {
        if (preg_match('/\[[\s\S]*\]/', $content, $matches)) {
            $json = $matches[0];
            $tasks = json_decode($json, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($tasks)) {
                return $tasks;
            }
        }

        return [];
    }

    /**
     * Generate fallback tasks when AI fails
     * 
     * @param StudyModule $module
     * @return array
     */
    private function generateFallbackTasks(StudyModule $module): array
    {
        $estimatedHours = $module->estimated_hours ?? 10;
        $taskCount = max(5, min(10, (int)($estimatedHours / 2)));

        $tasks = [];
        for ($i = 1; $i <= $taskCount; $i++) {
            $tasks[] = [
                'title' => "Task {$i}: Study {$module->title}",
                'description' => "Complete part {$i} of {$module->title}",
                'estimated_minutes' => (int)($estimatedHours * 60 / $taskCount),
                'priority' => $i <= 3 ? 'high' : 'medium',
            ];
        }

        return $tasks;
    }

    /**
     * Create tasks for module
     * 
     * @param StudyModule $module
     * @param array $tasksData
     * @param Carbon|null $startDate
     * @return void
     */
    public function createTasksForModule(StudyModule $module, array $tasksData, ?Carbon $startDate = null): void
    {
        $currentDate = $startDate ?? now();
        $goal = $module->goal;
        $daysUntilDeadline = now()->diffInDays($goal->deadline);
        $daysPerTask = max(1, (int)($daysUntilDeadline / count($tasksData)));

        foreach ($tasksData as $index => $taskData) {
            $dueDate = $currentDate->copy()->addDays($index * $daysPerTask);
            
            // Don't set due date beyond goal deadline
            if ($dueDate->gt($goal->deadline)) {
                $dueDate = $goal->deadline;
            }

            StudyTask::create([
                'module_id' => $module->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'] ?? null,
                'estimated_minutes' => $taskData['estimated_minutes'] ?? 60,
                'priority' => $taskData['priority'] ?? 'medium',
                'due_date' => $dueDate,
            ]);
        }
    }

    /**
     * Toggle task completion
     * 
     * @param StudyTask $task
     * @return StudyTask
     */
    public function toggleCompletion(StudyTask $task): StudyTask
    {
        if ($task->isCompleted()) {
            $task->markAsIncomplete();
        } else {
            $task->markAsCompleted();
        }

        return $task->fresh();
    }

    /**
     * Update task
     * 
     * @param StudyTask $task
     * @param array $data
     * @return StudyTask
     */
    public function updateTask(StudyTask $task, array $data): StudyTask
    {
        $task->update($data);
        return $task->fresh();
    }

    /**
     * Delete task
     * 
     * @param StudyTask $task
     * @return void
     */
    public function deleteTask(StudyTask $task): void
    {
        $module = $task->module;
        $task->delete();
        
        // Update module progress
        $module->updateProgress();
    }

    /**
     * Get pending tasks for module
     * 
     * @param StudyModule $module
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPendingTasks(StudyModule $module)
    {
        return $module->tasks()->pending()->orderBy('due_date')->get();
    }

    /**
     * Get overdue tasks for module
     * 
     * @param StudyModule $module
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getOverdueTasks(StudyModule $module)
    {
        return $module->tasks()->overdue()->orderBy('due_date')->get();
    }

    /**
     * Get tasks by priority
     * 
     * @param StudyModule $module
     * @param string $priority
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTasksByPriority(StudyModule $module, string $priority)
    {
        return $module->tasks()->byPriority($priority)->get();
    }

    /**
     * Bulk update task priorities
     * 
     * @param array $taskIds
     * @param string $priority
     * @return int
     */
    public function bulkUpdatePriority(array $taskIds, string $priority): int
    {
        return StudyTask::whereIn('id', $taskIds)->update(['priority' => $priority]);
    }

    /**
     * Reschedule task
     * 
     * @param StudyTask $task
     * @param Carbon $newDueDate
     * @return StudyTask
     */
    public function rescheduleTask(StudyTask $task, Carbon $newDueDate): StudyTask
    {
        $task->due_date = $newDueDate;
        $task->save();

        return $task->fresh();
    }

    /**
     * Get task statistics for module
     * 
     * @param StudyModule $module
     * @return array
     */
    public function getModuleTaskStatistics(StudyModule $module): array
    {
        $tasks = $module->tasks;

        return [
            'total' => $tasks->count(),
            'completed' => $tasks->where('completed_at', '!=', null)->count(),
            'pending' => $tasks->where('completed_at', null)->count(),
            'overdue' => $tasks->filter(fn($task) => $task->isOverdue())->count(),
            'by_priority' => [
                'high' => $tasks->where('priority', 'high')->count(),
                'medium' => $tasks->where('priority', 'medium')->count(),
                'low' => $tasks->where('priority', 'low')->count(),
            ],
            'total_estimated_minutes' => $tasks->sum('estimated_minutes'),
            'completed_minutes' => $tasks->whereNotNull('completed_at')->sum('estimated_minutes'),
        ];
    }
}
