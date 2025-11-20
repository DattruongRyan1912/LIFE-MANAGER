<?php

namespace App\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * IntentClassifier - Detect user intent using groq/compound
 * 
 * Purpose: Classify user message into intent categories to route context properly
 * Model: groq/compound (200K TPM - ultra fast)
 * Token cost: ~100-200 tokens per request
 */
class IntentClassifier
{
    private $apiKey;
    private $model;
    
    const INTENTS = [
        'task' => 'Questions about tasks, todos, planning, scheduling',
        'study' => 'Questions about study goals, learning, courses, progress',
        'expense' => 'Questions about spending, budget, money, finance',
        'planning' => 'General life planning, daily/weekly plans, priorities',
        'memory' => 'Questions about past conversations, preferences, insights',
        'general' => 'General questions, greetings, casual chat',
    ];
    
    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->model = config('services.groq.models.intent');
    }
    
    /**
     * Classify user message into intent
     * 
     * @param string $message User message
     * @return string Intent type (task|study|expense|planning|memory|general)
     */
    public function classify(string $message): string
    {
        $systemPrompt = $this->buildClassifierPrompt();
        
        try {
            $response = Http::timeout(10)->withHeaders([
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
                'temperature' => 0.1, // Low temp for consistent classification
                'max_tokens' => 50,   // Very short response
            ]);
            
            if ($response->successful()) {
                $result = $response->json()['choices'][0]['message']['content'] ?? 'general';
                $intent = strtolower(trim($result));
                
                // Validate intent
                if (!in_array($intent, array_keys(self::INTENTS))) {
                    $intent = 'general';
                }
                
                Log::info('Intent Classification', [
                    'message' => substr($message, 0, 100),
                    'detected_intent' => $intent,
                    'model' => $this->model,
                ]);
                
                return $intent;
            }
            
        } catch (\Exception $e) {
            Log::warning('Intent classification failed: ' . $e->getMessage());
        }
        
        // Fallback to keyword-based classification
        return $this->fallbackClassify($message);
    }
    
    /**
     * Build system prompt for intent classifier
     */
    private function buildClassifierPrompt(): string
    {
        $intentList = implode("\n", array_map(
            fn($key, $desc) => "- {$key}: {$desc}",
            array_keys(self::INTENTS),
            array_values(self::INTENTS)
        ));
        
        return <<<PROMPT
You are an intent classifier. Given a user message, classify it into ONE of these intents:

{$intentList}

Respond with ONLY the intent keyword (task, study, expense, planning, memory, or general). No explanation.

Examples:
User: "Tôi có task gì hôm nay?"
Response: task

User: "Chi tiêu của tôi tháng này bao nhiêu?"
Response: expense

User: "Tiến độ học của tôi thế nào?"
Response: study

User: "Tôi nên làm gì hôm nay?"
Response: planning
PROMPT;
    }
    
    /**
     * Fallback keyword-based classification (no API call)
     */
    private function fallbackClassify(string $message): string
    {
        $message = strtolower($message);
        
        $keywords = [
            'task' => ['task', 'todo', 'nhiệm vụ', 'deadline', 'công việc', 'hoàn thành'],
            'study' => ['học', 'study', 'course', 'tiến độ', 'bài tập', 'kiến thức'],
            'expense' => ['chi tiêu', 'tiền', 'expense', 'budget', 'ngân sách', 'đồng'],
            'planning' => ['kế hoạch', 'plan', 'lên kế hoạch', 'ưu tiên', 'schedule'],
            'memory' => ['nhớ', 'memory', 'preference', 'sở thích', 'insight', 'trước đây'],
        ];
        
        foreach ($keywords as $intent => $words) {
            foreach ($words as $word) {
                if (str_contains($message, $word)) {
                    return $intent;
                }
            }
        }
        
        return 'general';
    }
    
    /**
     * Get multiple possible intents (for complex queries)
     * 
     * @param string $message
     * @return array Array of intents in priority order
     */
    public function classifyMultiple(string $message): array
    {
        $primary = $this->classify($message);
        $fallback = $this->fallbackClassify($message);
        
        $intents = array_unique([$primary, $fallback, 'general']);
        
        return $intents;
    }
}
