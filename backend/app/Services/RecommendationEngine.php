<?php

namespace App\Services;

use App\Models\StudyGoal;
use App\Models\StudyModule;
use App\Models\StudyTask;
use App\Models\StudyResource;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecommendationEngine
{
    private $groqApiKey;
    private $groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    private $vectorMemory;
    private $userPreference;

    public function __construct(VectorMemoryService $vectorMemory, UserPreferenceService $userPreference)
    {
        $this->groqApiKey = config('services.groq.api_key');
        $this->vectorMemory = $vectorMemory;
        $this->userPreference = $userPreference;
    }

    /**
     * Get daily study plan for user
     * 
     * @param int $userId
     * @return array
     */
    public function getDailyStudyPlan(int $userId): array
    {
        // Get all active goals
        $activeGoals = StudyGoal::where('user_id', $userId)
            ->whereIn('status', ['in_progress', 'not_started'])
            ->with(['modules.tasks'])
            ->get();

        if ($activeGoals->isEmpty()) {
            return [
                'message' => 'No active study goals. Create a new goal to get started!',
                'tasks' => [],
                'suggestions' => [],
            ];
        }

        // Get user preferences
        $preferences = $this->userPreference->getPreferences($userId);
        $productivityStyle = $preferences['productivity_patterns']['peak_hours'] ?? 'morning';

        // Analyze current progress and select tasks
        $priorityTasks = $this->selectDailyTasks($activeGoals, $productivityStyle);
        
        // Generate AI motivational message
        $motivation = $this->generateMotivationalMessage($activeGoals, $priorityTasks);

        // Suggest study techniques
        $techniques = $this->suggestStudyTechniques($priorityTasks);

        return [
            'date' => Carbon::today()->toDateString(),
            'motivation' => $motivation,
            'priority_tasks' => $priorityTasks,
            'study_techniques' => $techniques,
            'estimated_time' => array_sum(array_column($priorityTasks, 'estimated_minutes')),
            'productivity_tip' => $this->getProductivityTip($productivityStyle),
        ];
    }

    /**
     * Select daily tasks based on priority and deadlines
     * 
     * @param \Illuminate\Database\Eloquent\Collection $goals
     * @param string $productivityStyle
     * @return array
     */
    private function selectDailyTasks($goals, string $productivityStyle): array
    {
        $tasks = [];

        foreach ($goals as $goal) {
            foreach ($goal->modules as $module) {
                // Get overdue tasks first
                $overdueTasks = $module->tasks()
                    ->pending()
                    ->overdue()
                    ->orderBy('due_date', 'asc')
                    ->limit(2)
                    ->get();

                foreach ($overdueTasks as $task) {
                    $tasks[] = $this->formatTaskForPlan($task, 'overdue');
                }

                // Get high priority tasks due soon
                $urgentTasks = $module->tasks()
                    ->pending()
                    ->byPriority('high')
                    ->where('due_date', '<=', Carbon::now()->addDays(3))
                    ->orderBy('due_date', 'asc')
                    ->limit(2)
                    ->get();

                foreach ($urgentTasks as $task) {
                    if (!in_array($task->id, array_column($tasks, 'id'))) {
                        $tasks[] = $this->formatTaskForPlan($task, 'urgent');
                    }
                }

                // Fill with regular tasks
                if (count($tasks) < 5) {
                    $regularTasks = $module->tasks()
                        ->pending()
                        ->orderBy('due_date', 'asc')
                        ->limit(5 - count($tasks))
                        ->get();

                    foreach ($regularTasks as $task) {
                        if (!in_array($task->id, array_column($tasks, 'id'))) {
                            $tasks[] = $this->formatTaskForPlan($task, 'regular');
                        }
                    }
                }
            }
        }

        // Limit to 5 tasks per day
        return array_slice($tasks, 0, 5);
    }

    /**
     * Format task for daily plan
     * 
     * @param StudyTask $task
     * @param string $urgency
     * @return array
     */
    private function formatTaskForPlan(StudyTask $task, string $urgency): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'module' => $task->module->title,
            'goal' => $task->module->goal->name,
            'estimated_minutes' => $task->estimated_minutes,
            'due_date' => $task->due_date->toDateString(),
            'priority' => $task->priority,
            'urgency' => $urgency,
        ];
    }

    /**
     * Generate motivational message
     * 
     * @param \Illuminate\Database\Eloquent\Collection $goals
     * @param array $tasks
     * @return string
     */
    private function generateMotivationalMessage($goals, array $tasks): string
    {
        $totalProgress = $goals->avg('progress');
        $overdueCount = count(array_filter($tasks, fn($t) => $t['urgency'] === 'overdue'));

        $messages = [
            'high_progress' => [
                "You're crushing it! {$totalProgress}% complete. Keep the momentum!",
                "Amazing progress at {$totalProgress}%! You're unstoppable!",
                "Outstanding work! {$totalProgress}% done. The finish line is in sight!",
            ],
            'medium_progress' => [
                "Great work! You're {$totalProgress}% there. Stay focused!",
                "Solid progress at {$totalProgress}%! Every step counts!",
                "You're making real progress! {$totalProgress}% and climbing!",
            ],
            'low_progress' => [
                "Every expert was once a beginner. Let's build momentum today!",
                "Starting is the hardest part - you've got this!",
                "One task at a time. You're building something great!",
            ],
            'overdue' => [
                "Let's tackle those overdue tasks first. You can catch up!",
                "{$overdueCount} tasks need attention. But you've got this!",
                "Time to reset! Focus on the overdue tasks, one by one.",
            ],
        ];

        if ($overdueCount > 0) {
            return $messages['overdue'][array_rand($messages['overdue'])];
        } elseif ($totalProgress >= 70) {
            return $messages['high_progress'][array_rand($messages['high_progress'])];
        } elseif ($totalProgress >= 30) {
            return $messages['medium_progress'][array_rand($messages['medium_progress'])];
        } else {
            return $messages['low_progress'][array_rand($messages['low_progress'])];
        }
    }

    /**
     * Suggest study techniques for tasks
     * 
     * @param array $tasks
     * @return array
     */
    private function suggestStudyTechniques(array $tasks): array
    {
        $totalMinutes = array_sum(array_column($tasks, 'estimated_minutes'));

        $techniques = [];

        if ($totalMinutes > 120) {
            $techniques[] = [
                'name' => 'Pomodoro Technique',
                'description' => 'Break study into 25-min focused sessions with 5-min breaks',
                'reason' => 'Long study session ahead - maintain focus with regular breaks',
            ];
        }

        if (count($tasks) >= 3) {
            $techniques[] = [
                'name' => 'Interleaving',
                'description' => 'Mix different topics/modules to improve retention',
                'reason' => 'Multiple topics today - switching helps memory formation',
            ];
        }

        $hasReading = count(array_filter($tasks, fn($t) => str_contains(strtolower($t['title']), 'read'))) > 0;
        if ($hasReading) {
            $techniques[] = [
                'name' => 'SQ3R Method',
                'description' => 'Survey, Question, Read, Recite, Review',
                'reason' => 'Reading tasks benefit from structured approach',
            ];
        }

        return $techniques;
    }

    /**
     * Get productivity tip based on style
     * 
     * @param string $style
     * @return string
     */
    private function getProductivityTip(string $style): string
    {
        $tips = [
            'morning' => 'You work best in the morning! Schedule difficult tasks before noon.',
            'afternoon' => 'Afternoon is your peak time. Save challenging topics for 2-5 PM.',
            'evening' => 'Evening learner? Use night hours for deep focus sessions.',
            'default' => 'Find your peak productivity hours and protect them for study.',
        ];

        return $tips[$style] ?? $tips['default'];
    }

    /**
     * Suggest resources for module using AI
     * 
     * @param StudyModule $module
     * @return array
     */
    public function suggestResources(StudyModule $module): array
    {
        // Check if resources already exist
        $existing = StudyResource::forModule($module->id)->get();
        
        if ($existing->isNotEmpty()) {
            return $existing->map(fn($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'url' => $r->url,
                'reason' => $r->reason,
                'created_at' => $r->created_at->toISOString(),
            ])->toArray();
        }

        // Generate new resources using AI
        $prompt = $this->buildResourcePrompt($module);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->groqApiUrl, [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an educational resource curator. Suggest high-quality learning resources.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'temperature' => 0.7,
                'max_tokens' => 800,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'];
                $resources = $this->parseResourcesFromAI($content);
                
                // Store resources
                return $this->storeResources($module, $resources);
            }

            Log::warning('Resource suggestion failed, using fallback');
            return $this->generateFallbackResources($module);
        } catch (\Exception $e) {
            Log::error('Resource suggestion error: ' . $e->getMessage());
            return $this->generateFallbackResources($module);
        }
    }

    /**
     * Build resource suggestion prompt
     * 
     * @param StudyModule $module
     * @return string
     */
    private function buildResourcePrompt(StudyModule $module): string
    {
        $goal = $module->goal;

        return <<<PROMPT
Suggest 3-5 high-quality learning resources for this module:

GOAL: {$goal->name}
STUDY TYPE: {$goal->study_type}
MODULE: {$module->title}
DESCRIPTION: {$module->description}

For each resource, provide:
1. title (specific name)
2. url (real, working URL - YouTube, Coursera, MDN, documentation, etc.)
3. reason (why this resource is valuable for this module - 1 sentence)

Output as JSON array:
[
  {
    "title": "Resource Title",
    "url": "https://example.com",
    "reason": "Why this helps"
  }
]

Prioritize free, high-quality resources.
PROMPT;
    }

    /**
     * Parse resources from AI response
     * 
     * @param string $content
     * @return array
     */
    private function parseResourcesFromAI(string $content): array
    {
        if (preg_match('/\[[\s\S]*\]/', $content, $matches)) {
            $json = json_decode($matches[0], true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
                return $json;
            }
        }

        return [];
    }

    /**
     * Store resources in database
     * 
     * @param StudyModule $module
     * @param array $resourcesData
     * @return array
     */
    private function storeResources(StudyModule $module, array $resourcesData): array
    {
        $stored = [];

        foreach ($resourcesData as $data) {
            $resource = StudyResource::create([
                'goal_id' => $module->goal_id,
                'module_id' => $module->id,
                'title' => $data['title'],
                'url' => $data['url'],
                'reason' => $data['reason'],
            ]);

            $stored[] = [
                'id' => $resource->id,
                'title' => $resource->title,
                'url' => $resource->url,
                'reason' => $resource->reason,
                'created_at' => $resource->created_at->toISOString(),
            ];
        }

        return $stored;
    }

    /**
     * Generate fallback resources
     * 
     * @param StudyModule $module
     * @return array
     */
    private function generateFallbackResources(StudyModule $module): array
    {
        $goal = $module->goal;
        $searchQuery = urlencode($module->title);

        $resources = [
            [
                'title' => "YouTube Tutorial: {$module->title}",
                'url' => "https://www.youtube.com/results?search_query={$searchQuery}",
                'reason' => 'Video tutorials for visual learning',
            ],
            [
                'title' => "Google Search: {$module->title}",
                'url' => "https://www.google.com/search?q={$searchQuery}",
                'reason' => 'Comprehensive search results and articles',
            ],
            [
                'title' => "{$goal->study_type} Learning Path",
                'url' => "https://www.coursera.org/search?query={$searchQuery}",
                'reason' => 'Structured online courses',
            ],
        ];

        return $this->storeResources($module, $resources);
    }

    /**
     * Detect weak areas in goal
     * 
     * @param StudyGoal $goal
     * @return array
     */
    public function detectWeaknesses(StudyGoal $goal): array
    {
        $weaknesses = [];

        foreach ($goal->modules as $module) {
            $stats = [
                'module_id' => $module->id,
                'module_name' => $module->title,
                'progress' => $module->progress,
                'total_tasks' => $module->tasks->count(),
                'completed_tasks' => $module->completedTasksCount(),
                'overdue_tasks' => $module->tasks()->overdue()->count(),
            ];

            // Identify issues
            $issues = [];

            if ($module->progress < 20 && $module->created_at->diffInDays(now()) > 7) {
                $issues[] = 'Low progress after 1+ weeks';
            }

            if ($stats['overdue_tasks'] > 0) {
                $issues[] = "{$stats['overdue_tasks']} overdue task(s)";
            }

            if ($module->progress > 0 && $module->progress < 50) {
                $daysSinceUpdate = $module->updated_at->diffInDays(now());
                if ($daysSinceUpdate > 3) {
                    $issues[] = "No progress in {$daysSinceUpdate} days";
                }
            }

            if (!empty($issues)) {
                $weaknesses[] = array_merge($stats, [
                    'issues' => $issues,
                    'recommendation' => $this->getWeaknessRecommendation($issues),
                ]);
            }
        }

        return $weaknesses;
    }

    /**
     * Get recommendation for weakness
     * 
     * @param array $issues
     * @return string
     */
    private function getWeaknessRecommendation(array $issues): string
    {
        if (in_array('overdue', implode(' ', $issues))) {
            return 'Prioritize overdue tasks first. Break them into smaller chunks if needed.';
        }

        if (str_contains(implode(' ', $issues), 'No progress')) {
            return 'Schedule dedicated time for this module. Start with just 20 minutes.';
        }

        if (str_contains(implode(' ', $issues), 'Low progress')) {
            return 'Review module difficulty. Consider breaking into smaller tasks or seeking help.';
        }

        return 'Allocate more time to this module and track daily progress.';
    }
}
