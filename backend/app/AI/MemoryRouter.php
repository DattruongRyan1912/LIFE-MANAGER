<?php

namespace App\AI;

use App\Services\VectorMemoryService;
use Illuminate\Support\Facades\Log;

/**
 * MemoryRouter - Route and fetch only relevant memories based on intent
 * 
 * Purpose: Instead of fetching all 3-5 memories, fetch only those relevant to intent
 * This reduces irrelevant data and improves context quality
 * 
 * No API calls - uses existing VectorMemoryService with category filtering
 */
class MemoryRouter
{
    private $vectorMemory;
    
    public function __construct()
    {
        $this->vectorMemory = app(VectorMemoryService::class);
    }
    
    /**
     * Route and fetch memories based on intent and query
     * 
     * @param string $query User's question
     * @param string $intent Detected intent
     * @param int $userId User ID
     * @return array Relevant memories
     */
    public function route(string $query, string $intent, int $userId): array
    {
        $categories = $this->getCategoriesForIntent($intent);
        $limit = $this->getLimitForIntent($intent);
        
        Log::info('Memory Routing', [
            'intent' => $intent,
            'categories' => $categories,
            'limit' => $limit,
        ]);
        
        // Use vector search with category filtering
        $memories = $this->vectorMemory->search(
            $query,
            $limit,
            $categories,
            $userId
        );
        
        // Format for compact context
        return $this->formatMemories($memories);
    }
    
    /**
     * Get relevant memory categories for each intent
     */
    private function getCategoriesForIntent(string $intent): array
    {
        $mapping = [
            'task' => ['preference', 'task_pattern', 'productivity'],
            'study' => ['study', 'preference', 'learning_pattern'],
            'expense' => ['expense', 'budget', 'finance'],
            'planning' => ['preference', 'goal', 'productivity'],
            'memory' => [], // All categories
            'general' => ['preference', 'insight'],
        ];
        
        return $mapping[$intent] ?? [];
    }
    
    /**
     * Get memory limit for each intent
     */
    private function getLimitForIntent(string $intent): int
    {
        $limits = [
            'task' => 2,      // Only 2 task-related memories
            'study' => 2,     // Only 2 study-related memories
            'expense' => 2,   // Only 2 expense-related memories
            'planning' => 3,  // Planning needs more context
            'memory' => 5,    // Memory queries need more examples
            'general' => 2,   // General questions need less
        ];
        
        return $limits[$intent] ?? 2;
    }
    
    /**
     * Format memories into compact context
     */
    private function formatMemories(array $memories): array
    {
        return array_map(function($memory) {
            return [
                'content' => $memory['content'] ?? '',
                'category' => $memory['category'] ?? 'general',
                'relevance' => round($memory['relevance_score'] ?? 0, 2),
            ];
        }, $memories);
    }
    
    /**
     * Quick check: Does intent need memories at all?
     */
    public function needsMemories(string $intent): bool
    {
        $noMemoryIntents = []; // All intents can benefit from memories
        
        return !in_array($intent, $noMemoryIntents);
    }
    
    /**
     * Get memory statistics for intent
     */
    public function getMemoryStats(int $userId, string $intent): array
    {
        $categories = $this->getCategoriesForIntent($intent);
        
        $stats = [
            'total_relevant_categories' => count($categories),
            'categories' => $categories,
            'estimated_memory_tokens' => count($categories) * 50, // Rough estimate
        ];
        
        return $stats;
    }
}
