<?php

namespace App\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reasoning70B - Wrapper for llama-3.3-70b-versatile
 * 
 * Purpose: Main reasoning with compressed context
 * Model: llama-3.3-70b-versatile (6K TPM - precious resource!)
 * Token cost: 400-900 tokens per request (vs 3000-6000 before compression)
 */
class Reasoning70B
{
    private $apiKey;
    private $model;
    
    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->model = config('services.groq.models.reasoning');
    }
    
    /**
     * Ask the 70B model with compressed context
     * 
     * @param string $rewrittenPrompt Clear, structured question
     * @param string $compressedContext Compressed context summary
     * @param array $history Conversation history (optional)
     * @return string AI response
     */
    public function ask(
        string $rewrittenPrompt, 
        string $compressedContext, 
        array $history = []
    ): string {
        $systemPrompt = $this->buildSystemPrompt($compressedContext);
        
        // Build messages array
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ]
        ];
        
        // Add conversation history (limit to last 3 turns to save tokens)
        $recentHistory = array_slice($history, -3);
        foreach ($recentHistory as $turn) {
            $messages[] = [
                'role' => $turn['role'] ?? 'user',
                'content' => $turn['content'] ?? ''
            ];
        }
        
        // Add current question
        $messages[] = [
            'role' => 'user',
            'content' => $rewrittenPrompt
        ];
        
        // Estimate tokens before sending
        $estimatedTokens = $this->estimateTokens($messages);
        
        Log::info('=== REASONING 70B REQUEST ===', [
            'rewritten_prompt' => $rewrittenPrompt,
            'compressed_context_size' => strlen($compressedContext),
            'system_prompt_size' => strlen($systemPrompt),
            'history_turns' => count($recentHistory),
            'estimated_tokens' => $estimatedTokens,
            'model' => $this->model,
        ]);
        
        try {
            $response = Http::timeout(45)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => $this->model,
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 1536, // Increased to allow detailed responses (was 800)
            ]);
            
            if ($response->successful()) {
                $answer = $response->json()['choices'][0]['message']['content'] ?? '';
                $usage = $response->json()['usage'] ?? [];
                
                Log::info('Reasoning 70B Success', [
                    'response_length' => strlen($answer),
                    'actual_tokens' => $usage,
                    'estimated_tokens' => $estimatedTokens,
                ]);
                
                return $answer;
            } else {
                Log::error('Reasoning 70B API Error', [
                    'status' => $response->status(),
                    'error' => $response->body(),
                ]);
                
                throw new \Exception('70B model request failed: ' . $response->status());
            }
            
        } catch (\Exception $e) {
            Log::error('Reasoning 70B Exception: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Build system prompt with compressed context
     */
    private function buildSystemPrompt(string $compressedContext): string
    {
        return <<<PROMPT
You are a personal AI assistant for a life management system.

COMPRESSED CONTEXT:
{$compressedContext}

Your role:
- Answer questions based on the context above
- Be helpful, concise, and actionable
- Suggest next steps when appropriate
- Use Vietnamese if user asks in Vietnamese
- Cite specific data from context

Response format:
- Direct answer first
- Supporting details second
- Action items last (if applicable)

Keep responses focused and under 300 words unless detail is needed.
PROMPT;
    }
    
    /**
     * Estimate tokens for messages
     */
    private function estimateTokens(array $messages): int
    {
        $totalChars = 0;
        foreach ($messages as $msg) {
            $totalChars += strlen($msg['content'] ?? '');
        }
        
        // Rough estimate: 1 token ≈ 4 characters
        return (int)($totalChars / 4);
    }
    
    /**
     * Check if we're within token budget
     */
    public function isWithinBudget(string $rewrittenPrompt, string $compressedContext): bool
    {
        $messages = [
            ['role' => 'system', 'content' => $this->buildSystemPrompt($compressedContext)],
            ['role' => 'user', 'content' => $rewrittenPrompt]
        ];
        
        $tokens = $this->estimateTokens($messages);
        
        // Budget: 900 tokens max (leaving room for response)
        return $tokens <= 900;
    }
}
