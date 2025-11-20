<?php

namespace App\Services;

use App\Models\Task;
use App\Models\Expense;
use App\Models\StudyGoal;
use App\Models\LongTermMemory;
use Carbon\Carbon;

class ContextBuilder
{
    private $vectorMemory;
    private $userPreference;
    
    // Context size limits (in characters)
    const MAX_CONTEXT_SIZE = 6000; // ~1500 tokens (reduced from 8000)
    const MAX_MEMORY_SIZE = 2000;  // ~500 tokens (reduced from 3000)
    const MAX_TASKS = 5;           // Top 5 priority tasks only
    const MAX_EXPENSES_DETAIL = 5; // Last 5 expenses in detail
    const MAX_MEMORIES = 3;        // Top 3 most relevant memories
    
    public function __construct(VectorMemoryService $vectorMemory, UserPreferenceService $userPreference)
    {
        $this->vectorMemory = $vectorMemory;
        $this->userPreference = $userPreference;
    }

    /**
     * Build complete context for AI with vector memory
     * 
     * @param string|null $query Optional query to search relevant memories
     * @param array $contextTypes Which types to include: ['tasks', 'expenses', 'study', 'memories']
     * @return array
     */
    public function build(?string $query = null, array $contextTypes = ['tasks', 'expenses', 'study', 'memories'])
    {
        $context = [
            'today' => Carbon::now()->format('Y-m-d'),
        ];
        
        // Conditionally add each context type
        if (in_array('tasks', $contextTypes)) {
            $context['tasks_today'] = $this->getTodayTasks();
        }
        
        if (in_array('expenses', $contextTypes)) {
            $context['expenses_7days'] = $this->getLast7DaysExpenses();
        }
        
        if (in_array('study', $contextTypes)) {
            $context['study_goals'] = $this->getStudyGoals();
        }
        
        if (in_array('memories', $contextTypes)) {
            // Add vector memory if query provided
            if ($query) {
                $context['relevant_memories'] = $this->getRelevantMemories($query);
            } else {
                $context['long_term_memory'] = $this->getLongTermMemory();
            }
            
            // Add user preferences
            $context['user_preferences'] = $this->getUserPreferences();
        }
        
        // Apply context size limits
        return $this->limitContextSize($context);
    }

    /**
     * Build context for daily summary
     */
    public function buildDailySummary()
    {
        return [
            'date' => Carbon::now()->format('Y-m-d'),
            'completed_tasks' => $this->getCompletedTasksToday(),
            'total_expenses' => $this->getTotalExpensesToday(),
            'expenses_today' => $this->getTodayExpenses(),
        ];
    }

    /**
     * Get today's tasks (optimized - only essential fields)
     */
    private function getTodayTasks()
    {
        $tasks = Task::whereDate('due_at', today())
            ->orderByRaw("CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END")
            ->orderBy('done', 'asc') // Undone tasks first
            ->limit(self::MAX_TASKS)
            ->get(['id', 'title', 'priority', 'status', 'done', 'estimated_minutes']);
            
        // Compact format
        return $tasks->map(function($task) {
            return [
                'title' => $task->title,
                'priority' => $task->priority,
                'status' => $task->status ?? ($task->done ? 'done' : 'in_progress'),
                'time' => $task->estimated_minutes ? round($task->estimated_minutes / 60, 1) . 'h' : null,
            ];
        })->toArray();
    }

    /**
     * Get completed tasks today (optimized)
     */
    private function getCompletedTasksToday()
    {
        $tasks = Task::whereDate('due_at', today())
            ->where('done', true)
            ->get(['title', 'estimated_minutes', 'actual_minutes']);
            
        return $tasks->map(function($task) {
            return [
                'title' => $task->title,
                'time_spent' => $task->actual_minutes ? round($task->actual_minutes / 60, 1) . 'h' : null,
            ];
        })->toArray();
    }

    /**
     * Get last 7 days expenses (optimized - summarized + recent details)
     */
    private function getLast7DaysExpenses()
    {
        $expenses = Expense::whereBetween('spent_at', [
            Carbon::now()->subDays(7),
            Carbon::now()
        ])
        ->orderBy('spent_at', 'desc')
        ->get(['amount', 'category', 'note', 'spent_at']);
        
        // Summary by category
        $summary = $expenses->groupBy('category')->map(function($group, $category) {
            return [
                'category' => $category,
                'total' => $group->sum('amount'),
                'count' => $group->count(),
            ];
        })->values()->toArray();
        
        // Recent details (last 5 only)
        $recent = $expenses->take(self::MAX_EXPENSES_DETAIL)->map(function($exp) {
            return [
                'amount' => $exp->amount,
                'category' => $exp->category,
                'note' => strlen($exp->note ?? '') > 30 ? substr($exp->note, 0, 30) . '...' : $exp->note,
                'date' => Carbon::parse($exp->spent_at)->format('m-d'),
            ];
        })->toArray();
        
        return [
            'total_7days' => $expenses->sum('amount'),
            'summary_by_category' => $summary,
            'recent_expenses' => $recent,
        ];
    }

    /**
     * Get today's expenses (optimized)
     */
    private function getTodayExpenses()
    {
        $expenses = Expense::whereDate('spent_at', today())
            ->get(['amount', 'category', 'note']);
            
        return $expenses->map(function($exp) {
            return [
                'amount' => $exp->amount,
                'category' => $exp->category,
                'note' => strlen($exp->note ?? '') > 20 ? substr($exp->note, 0, 20) . '...' : $exp->note,
            ];
        })->toArray();
    }

    /**
     * Get total expenses today
     */
    private function getTotalExpensesToday()
    {
        return Expense::whereDate('spent_at', today())
            ->sum('amount');
    }

    /**
     * Get study goals (optimized - only active goals with essential fields)
     */
    private function getStudyGoals()
    {
        $goals = StudyGoal::where('progress', '<', 100)
            ->orderBy('deadline', 'asc')
            ->limit(3) // Max 3 active goals
            ->get(['name', 'progress', 'deadline']);
            
        return $goals->map(function($goal) {
            return [
                'name' => strlen($goal->name) > 40 ? substr($goal->name, 0, 40) . '...' : $goal->name,
                'progress' => $goal->progress . '%',
                'deadline' => Carbon::parse($goal->deadline)->format('m-d'),
            ];
        })->toArray();
    }

    /**
     * Get long-term memory (legacy method - optimized)
     */
    private function getLongTermMemory()
    {
        $memories = LongTermMemory::whereNull('category')
            ->orWhere('category', 'general')
            ->orderBy('last_accessed_at', 'desc')
            ->take(5) // Reduced from 20 to 5
            ->get();
            
        $result = [];
        
        foreach ($memories as $memory) {
            $value = $memory->value;
            
            // Truncate long values
            if (is_string($value) && strlen($value) > 150) {
                $value = substr($value, 0, 150) . '...';
            }
            
            $result[$memory->key] = $value;
        }
        
        return $result;
    }
    
    /**
     * Get relevant memories using vector search (optimized)
     * 
     * @param string $query
     * @return array
     */
    private function getRelevantMemories(string $query): array
    {
        // Vector search for most relevant memories (reduced to 5)
        $memories = $this->vectorMemory->search($query, 5);
        
        // Filter by recency (prioritize last 30 days)
        $recentCutoff = Carbon::now()->subDays(30);
        
        $relevantMemories = [];
        foreach ($memories as $memory) {
            $isRecent = Carbon::parse($memory['last_accessed_at'] ?? $memory['updated_at'])->gte($recentCutoff);
            
            $content = $memory['content'] ?? $memory['value'];
            
            // Truncate long content
            if (is_string($content) && strlen($content) > 200) {
                $content = substr($content, 0, 200) . '...';
            }
            
            $relevantMemories[] = [
                'key' => $memory['key'],
                'content' => $content,
                'category' => $memory['category'] ?? 'general',
                'relevance_score' => $memory['final_score'] ?? $memory['relevance_score'] ?? 0,
                'is_recent' => $isRecent,
            ];
        }
        
        // Sort by score and recency
        usort($relevantMemories, function($a, $b) {
            if ($a['is_recent'] != $b['is_recent']) {
                return $b['is_recent'] - $a['is_recent'];
            }
            return $b['relevance_score'] <=> $a['relevance_score'];
        });
        
        // Return only top 3 most relevant
        return array_slice($relevantMemories, 0, self::MAX_MEMORIES);
    }
    
    /**
     * Get user preferences summary
     * 
     * @return array
     */
    private function getUserPreferences(): array
    {
        try {
            // Get cached preferences from vector memory
            $cachedPrefs = LongTermMemory::where('category', 'preferences')
                ->where('last_accessed_at', '>=', Carbon::now()->subHours(6))
                ->first();
            
            if ($cachedPrefs) {
                $cachedPrefs->markAsAccessed();
                return $cachedPrefs->value;
            }
            
            // Detect fresh preferences
            $preferences = $this->userPreference->detectPreferences();
            
            return [
                'productivity_pattern' => $preferences['productivity_pattern']['pattern'] ?? 'unknown',
                'work_style' => $preferences['work_style']['style'] ?? 'balanced',
                'spending_style' => $preferences['spending_habits']['spending_style'] ?? 'moderate',
            ];
        } catch (\Exception $e) {
            return [];
        }
    }
    
    /**
     * Limit context size to prevent token overflow (improved)
     * 
     * @param array $context
     * @return array
     */
    private function limitContextSize(array $context): array
    {
        $json = json_encode($context);
        $currentSize = strlen($json);
        
        // Early return if within limits
        if ($currentSize <= self::MAX_CONTEXT_SIZE) {
            return $context;
        }
        
        // Progressive reduction strategy
        
        // Step 1: Reduce memory size if needed
        if (isset($context['relevant_memories'])) {
            $memorySize = strlen(json_encode($context['relevant_memories']));
            
            if ($memorySize > self::MAX_MEMORY_SIZE) {
                $context['relevant_memories'] = array_slice($context['relevant_memories'], 0, 2);
            }
        }
        
        // Step 2: Reduce tasks if still too large
        $json = json_encode($context);
        if (strlen($json) > self::MAX_CONTEXT_SIZE && isset($context['tasks_today'])) {
            $context['tasks_today'] = array_slice($context['tasks_today'], 0, 3);
        }
        
        // Step 3: Simplify expenses to summary only if still too large
        $json = json_encode($context);
        if (strlen($json) > self::MAX_CONTEXT_SIZE && isset($context['expenses_7days'])) {
            // Keep only summary, remove details
            if (is_array($context['expenses_7days']) && isset($context['expenses_7days']['summary_by_category'])) {
                $context['expenses_7days'] = [
                    'total_7days' => $context['expenses_7days']['total_7days'] ?? 0,
                    'summary_by_category' => array_slice($context['expenses_7days']['summary_by_category'] ?? [], 0, 3),
                ];
            }
        }
        
        // Step 4: Reduce study goals if still too large
        $json = json_encode($context);
        if (strlen($json) > self::MAX_CONTEXT_SIZE && isset($context['study_goals'])) {
            $context['study_goals'] = array_slice($context['study_goals'], 0, 2);
        }
        
        // Step 5: Remove user preferences as last resort
        $json = json_encode($context);
        if (strlen($json) > self::MAX_CONTEXT_SIZE && isset($context['user_preferences'])) {
            unset($context['user_preferences']);
        }
        
        return $context;
    }
}
