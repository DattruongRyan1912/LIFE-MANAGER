<?php

namespace App\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PromptRewriter - Rewrite vague questions into structured prompts
 * 
 * Purpose: Transform unclear questions into clear, actionable prompts
 * Model: Configurable via GROQ_REWRITER_MODEL (default: llama-3.1-8b-instant)
 * Token cost: ~150-300 tokens per request
 */
class PromptRewriter
{
    private $apiKey;
    private $model;
    
    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->model = config('services.groq.rewriter_model', 'llama-3.1-8b-instant');
    }
    
    /**
     * Rewrite vague question into structured prompt
     * 
     * @param string $message Original user question
     * @param string $intent Detected intent
     * @return string Rewritten prompt
     */
    public function rewrite(string $message, string $intent): string
    {
        // If message is already clear and structured, skip API call
        if (strlen($message) > 50 && $this->isAlreadyClear($message)) {
            return $message;
        }
        
        $systemPrompt = $this->buildRewriterPrompt($intent);
        
        try {
            $response = Http::timeout(15)->withHeaders([
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
                        'content' => $message
                    ]
                ],
                'temperature' => 0.3,
                'max_tokens' => 200,
            ]);
            
            if ($response->successful()) {
                $rewritten = $response->json()['choices'][0]['message']['content'] ?? '';
                
                Log::info('Prompt Rewriting', [
                    'original' => $message,
                    'rewritten' => $rewritten,
                    'intent' => $intent,
                    'model' => $this->model,
                ]);
                
                return $rewritten ?: $message;
            }
            
        } catch (\Exception $e) {
            Log::warning('Prompt rewriting failed: ' . $e->getMessage());
        }
        
        // Fallback to template-based rewriting
        return $this->quickRewrite($message, $intent);
    }
    
    /**
     * Check if message is already clear
     */
    private function isAlreadyClear(string $message): bool
    {
        $clearIndicators = [
            'show', 'list', 'display', 'get', 'find',
            'what are', 'how many', 'when is', 'where is',
            'hiển thị', 'liệt kê', 'cho tôi', 'tìm',
        ];
        
        $messageLower = strtolower($message);
        foreach ($clearIndicators as $indicator) {
            if (strpos($messageLower, $indicator) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Build system prompt for rewriter
     */
    private function buildRewriterPrompt(string $intent): string
    {
        $guidance = $this->getIntentGuidance($intent);
        
        return <<<PROMPT
You are a prompt rewriter. Transform vague questions into clear, structured prompts.

User Intent: {$intent}
Guidance: {$guidance}

Rewriting rules:
1. Be specific and actionable
2. Include relevant filters (today, this week, high priority, etc.)
3. Specify desired output format
4. Keep the original language (Vietnamese or English)
5. Maximum 2 sentences

Examples:

Vague: "Task gì?"
Clear: "List all tasks due today, ordered by priority, showing title and status."

Vague: "Tiền tháng này?"
Clear: "Show total expenses for this month, grouped by category with percentages."

Vague: "Học được gì?"
Clear: "Display study progress for all active goals with completion percentages."

Now rewrite the user's question below.
PROMPT;
    }
    
    /**
     * Get intent-specific guidance
     */
    private function getIntentGuidance(string $intent): string
    {
        $guides = [
            'task' => 'Ask for tasks with filters: today/week, priority, status. Request sorting and time estimates.',
            'study' => 'Ask for study goals with progress %, modules, completion status.',
            'expense' => 'Ask for expenses with totals, categories, time periods (today/week/month).',
            'planning' => 'Ask for overview of tasks, goals, and schedule. Include time blocks.',
            'memory' => 'Ask to recall specific information or preferences from past interactions.',
            'general' => 'Make the question specific and measurable.',
        ];
        
        return $guides[$intent] ?? $guides['general'];
    }
    
    /**
     * Quick template-based rewriting (fallback, no API call)
     */
    public function quickRewrite(string $message, string $intent): string
    {
        $templates = [
            'task' => 'Show tasks for today with priority and status',
            'study' => 'Display study progress for all active goals',
            'expense' => 'Show expense summary for the last 7 days by category',
            'planning' => 'Provide an overview of tasks, study goals, and expenses',
            'memory' => 'Recall relevant information about: ' . $message,
            'general' => $message,
        ];
        
        // If message is very short (< 10 chars), use template
        if (strlen($message) < 10) {
            return $templates[$intent] ?? $message;
        }
        
        // Otherwise, just clean up the message
        return trim($message);
    }
}
