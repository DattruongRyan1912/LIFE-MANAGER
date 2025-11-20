<?php

namespace App\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ContextCompressor - Compress large JSON context into compact summaries
 * 
 * Purpose: Reduce context from 2000+ tokens to 200-400 tokens while keeping key info
 * Model: groq/compound-mini (High TPM, optimized for compression)
 * Token cost: ~300-500 tokens per request (but saves 1500-2500 on main call)
 */
class ContextCompressor
{
    private $apiKey;
    private $model;
    
    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->model = config('services.groq.models.compressor');
    }
    
    /**
     * Compress context data into a concise summary
     * 
     * @param array $context Full context array
     * @param string $intent User intent for context-aware compression
     * @return string Compressed context summary
     */
    public function compress(array $context, string $intent = 'general'): string
    {
        $jsonContext = json_encode($context, JSON_PRETTY_PRINT);
        $originalSize = strlen($jsonContext);
        
        // If already small, no need to compress
        if ($originalSize < 800) {
            return $this->formatCompact($context);
        }
        
        $systemPrompt = $this->buildCompressorPrompt($intent);
        
        try {
            $response = Http::timeout(20)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $systemPrompt
                    ],
                    [
                        'role' => 'user',
                        'content' => "Compress this context:\n\n" . $jsonContext
                    ]
                ],
                'temperature' => 0.2,
                'max_tokens' => 400, // Target compressed size
            ]);
            
            if ($response->successful()) {
                $compressed = $response->json()['choices'][0]['message']['content'] ?? '';
                $compressedSize = strlen($compressed);
                
                $compressionRatio = $originalSize > 0 ? 
                    round((1 - $compressedSize / $originalSize) * 100, 1) : 0;
                
                Log::info('Context Compression', [
                    'original_size' => $originalSize,
                    'compressed_size' => $compressedSize,
                    'compression_ratio' => $compressionRatio . '%',
                    'intent' => $intent,
                    'model' => $this->model,
                ]);
                
                return $compressed;
            }
            
        } catch (\Exception $e) {
            Log::warning('Context compression failed: ' . $e->getMessage());
        }
        
        // Fallback to simple formatting
        return $this->formatCompact($context);
    }
    
    /**
     * Build system prompt for context compressor
     */
    private function buildCompressorPrompt(string $intent): string
    {
        $focusAreas = $this->getFocusAreas($intent);
        
        return <<<PROMPT
You are a context compressor. Given a large JSON context, compress it into a concise summary while keeping the most important information.

User Intent: {$intent}
Focus on: {$focusAreas}

Compression rules:
1. Remove unnecessary fields (ids, timestamps, metadata)
2. Aggregate similar items (e.g., "5 tasks: 3 high priority, 2 medium")
3. Keep only actionable data
4. Use compact format (bullet points, abbreviations)
5. Target: 200-400 words maximum

Output format:
- Use markdown bullet points
- Group by category
- Numbers and metrics first
- Keep priority and status info
- Drop verbose descriptions

Example:
Input: {"tasks": [{"id":1,"title":"Write report","priority":"high","status":"in_progress","estimated_minutes":120},...15 more]}
Output: 
• Tasks: 16 total (8 incomplete)
  - High priority: 4 (report, review, planning, meeting)
  - Medium: 6 
  - Low: 6
• Due today: 5 tasks (3 high, 2 medium)
• Estimated time: 8.5 hours total
PROMPT;
    }
    
    /**
     * Get focus areas based on intent
     */
    private function getFocusAreas(string $intent): string
    {
        $areas = [
            'task' => 'Task titles, priorities, statuses, due dates. Aggregate counts.',
            'study' => 'Study goals, progress percentages, modules, completion status.',
            'expense' => 'Total amounts, categories, trends. Top spending categories.',
            'planning' => 'All context - tasks, study, expenses. High-level overview.',
            'memory' => 'Memory categories, key preferences, insights. Recent vs old.',
            'general' => 'High-level summary of all data. Key metrics and status.',
        ];
        
        return $areas[$intent] ?? $areas['general'];
    }
    
    /**
     * Fallback: Format context in compact text (no API call)
     */
    private function formatCompact(array $context): string
    {
        $lines = [];
        
        // Tasks
        if (isset($context['tasks_today']) && !empty($context['tasks_today'])) {
            $tasks = $context['tasks_today'];
            $lines[] = "• Tasks Today: " . count($tasks);
            
            $byPriority = [];
            foreach ($tasks as $task) {
                $priority = $task['priority'] ?? 'medium';
                $byPriority[$priority] = ($byPriority[$priority] ?? 0) + 1;
            }
            
            foreach ($byPriority as $priority => $count) {
                $lines[] = "  - {$priority}: {$count}";
            }
        }
        
        // Expenses
        if (isset($context['expenses_7days'])) {
            $exp = $context['expenses_7days'];
            if (isset($exp['total'])) {
                $lines[] = "• Expenses (7d): " . number_format($exp['total']) . " VND";
            }
            if (isset($exp['by_category']) && is_array($exp['by_category'])) {
                $top = array_slice($exp['by_category'], 0, 3, true);
                foreach ($top as $cat => $amount) {
                    $lines[] = "  - {$cat}: " . number_format($amount);
                }
            }
        }
        
        // Study
        if (isset($context['study_goals']) && !empty($context['study_goals'])) {
            $goals = $context['study_goals'];
            $lines[] = "• Study Goals: " . count($goals);
            foreach (array_slice($goals, 0, 3) as $goal) {
                $name = $goal['name'] ?? 'Unknown';
                $progress = $goal['progress'] ?? 0;
                $lines[] = "  - {$name}: {$progress}%";
            }
        }
        
        // Memories
        if (isset($context['relevant_memories']) && !empty($context['relevant_memories'])) {
            $memories = $context['relevant_memories'];
            $lines[] = "• Relevant Memories: " . count($memories);
        }
        
        return implode("\n", $lines);
    }
    
    /**
     * Estimate token savings
     * 
     * @param array $context
     * @return int Estimated tokens saved
     */
    public function estimateSavings(array $context): int
    {
        $originalTokens = strlen(json_encode($context)) / 4; // Rough estimate
        $compressedTokens = 200; // Target
        
        return max(0, (int)($originalTokens - $compressedTokens));
    }
}
