<?php

namespace App\AI;

use App\Services\ContextBuilder;
use Illuminate\Support\Facades\Log;

/**
 * SmartAIService - Multi-model pipeline orchestrator
 * 
 * Purpose: Coordinate all 6 layers of FreeTier optimization pipeline
 * Expected outcome: 400-900 tokens per request (vs 3000-6000 before)
 * Cost: $0 (all free tier models)
 */
class SmartAIService
{
    private $intentClassifier;
    private $promptRewriter;
    private $contextCompressor;
    private $memoryRouter;
    private $reasoning70B;
    private $outputFormatter;
    private $contextBuilder;
    
    public function __construct()
    {
        $this->intentClassifier = new IntentClassifier();
        $this->promptRewriter = new PromptRewriter();
        $this->contextCompressor = new ContextCompressor();
        $this->memoryRouter = new MemoryRouter();
        $this->reasoning70B = new Reasoning70B();
        $this->outputFormatter = new OutputFormatter();
        $this->contextBuilder = app(ContextBuilder::class);
    }
    
    /**
     * Main entry point - Process user message through full pipeline
     * 
     * @param int $userId User ID
     * @param string $userMessage Raw user question
     * @param array $history Conversation history
     * @return array [response, metrics]
     */
    public function chat(int $userId, string $userMessage, array $history = []): array
    {
        $startTime = microtime(true);
        $metrics = [
            'pipeline_version' => 'smart_v1',
            'layers' => [],
        ];
        
        Log::info('=== SMART AI PIPELINE START ===', [
            'user_id' => $userId,
            'message' => $userMessage,
            'history_count' => count($history),
        ]);
        
        try {
            // LAYER 1: Intent Classification (100-200 tokens)
            $layerStart = microtime(true);
            $intent = $this->intentClassifier->classify($userMessage);
            $metrics['layers']['intent'] = [
                'result' => $intent,
                'time_ms' => round((microtime(true) - $layerStart) * 1000, 2),
                'estimated_tokens' => 150,
            ];
            
            // LAYER 2: Prompt Rewriting (150-300 tokens)
            $layerStart = microtime(true);
            $rewrittenPrompt = $this->promptRewriter->rewrite($userMessage, $intent);
            $metrics['layers']['rewrite'] = [
                'original' => $userMessage,
                'rewritten' => $rewrittenPrompt,
                'time_ms' => round((microtime(true) - $layerStart) * 1000, 2),
                'estimated_tokens' => 250,
            ];
            
            // LAYER 3: Context Building & Compression (300-500 tokens)
            $layerStart = microtime(true);
            $fullContext = $this->contextBuilder->build($userId);
            $compressedContext = $this->contextCompressor->compress($fullContext, $intent);
            $metrics['layers']['compression'] = [
                'original_size' => strlen(json_encode($fullContext)),
                'compressed_size' => strlen($compressedContext),
                'time_ms' => round((microtime(true) - $layerStart) * 1000, 2),
                'estimated_tokens' => 400,
            ];
            
            // LAYER 4: Memory Routing (reduces from 3 → 2 targeted memories)
            $layerStart = microtime(true);
            $memories = $this->memoryRouter->route($userMessage, $intent, $userId);
            $memoryContext = "\n\nRELEVANT MEMORIES:\n" . json_encode($memories, JSON_PRETTY_PRINT);
            $compressedContext .= $memoryContext;
            $metrics['layers']['memory'] = [
                'memories_count' => count($memories),
                'time_ms' => round((microtime(true) - $layerStart) * 1000, 2),
                'estimated_tokens' => count($memories) * 50,
            ];
            
            // LAYER 5: Reasoning with 70B Model (400-900 tokens total input)
            $layerStart = microtime(true);
            $rawResponse = $this->reasoning70B->ask($rewrittenPrompt, $compressedContext, $history);
            $metrics['layers']['reasoning'] = [
                'response_length' => strlen($rawResponse),
                'time_ms' => round((microtime(true) - $layerStart) * 1000, 2),
                'estimated_input_tokens' => 700,
                'estimated_output_tokens' => strlen($rawResponse) / 4,
            ];
            
            // LAYER 6: Output Formatting (shorten if needed)
            $layerStart = microtime(true);
            $finalResponse = $this->outputFormatter->format($rawResponse, $intent);
            $metrics['layers']['formatting'] = [
                'original_length' => strlen($rawResponse),
                'formatted_length' => strlen($finalResponse),
                'time_ms' => round((microtime(true) - $layerStart) * 1000, 2),
                'estimated_tokens' => 300,
            ];
            
            // Calculate total metrics
            $totalTime = round((microtime(true) - $startTime) * 1000, 2);
            $totalTokens = array_sum(array_column($metrics['layers'], 'estimated_tokens'));
            
            $metrics['total'] = [
                'time_ms' => $totalTime,
                'estimated_tokens' => $totalTokens,
                'token_savings' => max(0, 3500 - $totalTokens), // vs old approach
                'cost_usd' => 0, // Free tier
            ];
            
            Log::info('=== SMART AI PIPELINE SUCCESS ===', $metrics);
            
            return [
                'response' => $finalResponse,
                'metrics' => $metrics,
                'intent' => $intent,
            ];
            
        } catch (\Exception $e) {
            Log::error('Smart AI Pipeline Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Fallback to direct call
            return $this->fallbackDirectCall($userId, $userMessage, $history);
        }
    }
    
    /**
     * Fallback: Direct call to 70B without pipeline (old approach)
     */
    private function fallbackDirectCall(int $userId, string $userMessage, array $history): array
    {
        Log::warning('Using fallback direct call');
        
        try {
            $context = $this->contextBuilder->build($userId);
            $systemPrompt = $this->buildFallbackPrompt($context);
            
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ...array_slice($history, -3),
                ['role' => 'user', 'content' => $userMessage]
            ];
            
            $response = $this->reasoning70B->ask($userMessage, json_encode($context), $history);
            
            return [
                'response' => $response,
                'metrics' => ['fallback' => true],
                'intent' => 'general',
            ];
            
        } catch (\Exception $e) {
            Log::error('Fallback also failed: ' . $e->getMessage());
            
            return [
                'response' => 'Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.',
                'metrics' => ['error' => true],
                'intent' => 'error',
            ];
        }
    }
    
    /**
     * Build simple system prompt for fallback
     */
    private function buildFallbackPrompt(array $context): string
    {
        $contextJson = json_encode($context, JSON_PRETTY_PRINT);
        
        return <<<PROMPT
You are a personal AI assistant for a life management system.

CONTEXT:
{$contextJson}

Answer the user's question based on this context.
PROMPT;
    }
    
    /**
     * Get pipeline statistics
     */
    public function getStats(): array
    {
        return [
            'pipeline' => 'FreeTier Multi-Model',
            'layers' => 6,
            'models' => [
                'groq/compound' => 'Intent classification',
                'llama-3.1-8b-instant' => 'Prompt rewriting',
                'groq/compound-mini' => 'Context compression',
                'llama-3.3-70b-versatile' => 'Main reasoning',
                'allam-2-7b' => 'Output formatting',
            ],
            'expected_tokens_per_request' => '400-900',
            'token_savings' => '70-85%',
            'cost' => '$0 (free tier)',
        ];
    }
}
