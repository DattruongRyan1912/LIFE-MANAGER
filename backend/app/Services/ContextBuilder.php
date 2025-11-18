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
    const MAX_CONTEXT_SIZE = 8000; // ~2000 tokens
    const MAX_MEMORY_SIZE = 3000;
    
    public function __construct(VectorMemoryService $vectorMemory, UserPreferenceService $userPreference)
    {
        $this->vectorMemory = $vectorMemory;
        $this->userPreference = $userPreference;
    }

    /**
     * Build complete context for AI with vector memory
     * 
     * @param string|null $query Optional query to search relevant memories
     * @return array
     */
    public function build(?string $query = null)
    {
        $context = [
            'today' => Carbon::now()->format('Y-m-d'),
            'tasks_today' => $this->getTodayTasks(),
            'expenses_7days' => $this->getLast7DaysExpenses(),
            'study_goals' => $this->getStudyGoals(),
        ];
        
        // Add vector memory if query provided
        if ($query) {
            $context['relevant_memories'] = $this->getRelevantMemories($query);
        } else {
            $context['long_term_memory'] = $this->getLongTermMemory();
        }
        
        // Add user preferences
        $context['user_preferences'] = $this->getUserPreferences();
        
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
     * Get today's tasks
     */
    private function getTodayTasks()
    {
        return Task::whereDate('due_at', today())
            ->orderBy('priority', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get completed tasks today
     */
    private function getCompletedTasksToday()
    {
        return Task::whereDate('due_at', today())
            ->where('done', true)
            ->get()
            ->toArray();
    }

    /**
     * Get last 7 days expenses
     */
    private function getLast7DaysExpenses()
    {
        return Expense::whereBetween('spent_at', [
            Carbon::now()->subDays(7),
            Carbon::now()
        ])
        ->orderBy('spent_at', 'desc')
        ->get()
        ->toArray();
    }

    /**
     * Get today's expenses
     */
    private function getTodayExpenses()
    {
        return Expense::whereDate('spent_at', today())
            ->get()
            ->toArray();
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
     * Get study goals
     */
    private function getStudyGoals()
    {
        return StudyGoal::orderBy('deadline', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get long-term memory (legacy method for backward compatibility)
     */
    private function getLongTermMemory()
    {
        $memories = LongTermMemory::whereNull('category')
            ->orWhere('category', 'general')
            ->take(20)
            ->get();
            
        $result = [];
        
        foreach ($memories as $memory) {
            $result[$memory->key] = $memory->value;
        }
        
        return $result;
    }
    
    /**
     * Get relevant memories using vector search
     * 
     * @param string $query
     * @return array
     */
    private function getRelevantMemories(string $query): array
    {
        // Vector search for most relevant memories
        $memories = $this->vectorMemory->search($query, 10);
        
        // Filter by recency (prioritize last 30 days)
        $recentCutoff = Carbon::now()->subDays(30);
        
        $relevantMemories = [];
        foreach ($memories as $memory) {
            $isRecent = Carbon::parse($memory['last_accessed_at'] ?? $memory['updated_at'])->gte($recentCutoff);
            
            $relevantMemories[] = [
                'key' => $memory['key'],
                'content' => $memory['content'] ?? $memory['value'],
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
        
        return array_slice($relevantMemories, 0, 5);
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
     * Limit context size to prevent token overflow
     * 
     * @param array $context
     * @return array
     */
    private function limitContextSize(array $context): array
    {
        $json = json_encode($context);
        $currentSize = strlen($json);
        
        if ($currentSize <= self::MAX_CONTEXT_SIZE) {
            return $context;
        }
        
        // Reduce memory size if needed
        if (isset($context['relevant_memories'])) {
            $memorySize = strlen(json_encode($context['relevant_memories']));
            
            if ($memorySize > self::MAX_MEMORY_SIZE) {
                $context['relevant_memories'] = array_slice($context['relevant_memories'], 0, 3);
            }
        }
        
        // Reduce tasks if still too large
        $json = json_encode($context);
        if (strlen($json) > self::MAX_CONTEXT_SIZE && isset($context['tasks_today'])) {
            $context['tasks_today'] = array_slice($context['tasks_today'], 0, 10);
        }
        
        // Reduce expenses if still too large
        $json = json_encode($context);
        if (strlen($json) > self::MAX_CONTEXT_SIZE && isset($context['expenses_7days'])) {
            $context['expenses_7days'] = array_slice($context['expenses_7days'], 0, 20);
        }
        
        return $context;
    }
}
