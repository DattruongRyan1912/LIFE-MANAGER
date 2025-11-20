<?php

namespace App\Http\Controllers;

use App\AI\SmartAIService;
use App\Services\ContextBuilder;
use App\Services\MemoryUpdater;
use App\Services\VectorMemoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AssistantController extends Controller
{
    protected $contextBuilder;
    protected $memoryUpdater;
    protected $vectorMemory;
    protected $smartAI;

    public function __construct(
        ContextBuilder $contextBuilder, 
        MemoryUpdater $memoryUpdater,
        VectorMemoryService $vectorMemory
    ) {
        $this->contextBuilder = $contextBuilder;
        $this->memoryUpdater = $memoryUpdater;
        $this->vectorMemory = $vectorMemory;
        $this->smartAI = new SmartAIService();
    }

    /**
     * Chat with AI Assistant with vector memory integration (optimized)
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'sometimes|array|max:4', // Limit history to 4 messages
            'contextTypes' => 'nullable|array', // e.g. ['tasks', 'expenses', 'study', 'memories'] - can be null
            'autoDetect' => 'sometimes|boolean', // Auto-detect context types
            'smartMode' => 'sometimes|boolean', // Use Smart AI Pipeline (default: true)
            'smart_mode' => 'sometimes|boolean', // Support snake_case
            'user_id' => 'sometimes|integer', // Optional user_id (for testing without auth)
        ]);

        $userMessage = $request->input('message');
        $history = $request->input('history', []);
        // Support both camelCase and snake_case
        $smartMode = $request->input('smartMode') ?? $request->input('smart_mode', true);
        
        // SMART MODE: Use FreeTier Multi-Model Pipeline
        if ($smartMode) {
            try {
                $result = $this->smartAI->chat(
                    auth()->id() ?? 1,
                    $userMessage,
                    $history
                );
                
                // Update memory
                $this->memoryUpdater->updateFromConversation($userMessage, $result['response']);
                $this->storeConversation($userMessage, $result['response']);
                
                return response()->json([
                    'message' => $result['response'],
                    'mode' => 'smart',
                    'intent' => $result['intent'],
                    'metrics' => $result['metrics'],
                ]);
                
            } catch (\Exception $e) {
                Log::error('Smart AI failed, falling back to direct mode: ' . $e->getMessage());
                // Fall through to direct mode
            }
        }
        
        // DIRECT MODE: Traditional approach (fallback)
        return $this->chatDirect($request);
    }
    
    /**
     * Direct chat mode (without Smart AI Pipeline)
     */
    private function chatDirect(Request $request)
    {
        $userMessage = $request->input('message');
        $history = $request->input('history', []);
        $autoDetect = $request->input('autoDetect', true);
        $contextTypes = $request->input('contextTypes', null);
        
        // Auto-detect context types if enabled and not explicitly provided
        if ($autoDetect && !$contextTypes) {
            $contextTypes = \App\Services\ContextRouter::detectContextTypes($userMessage);
            Log::info('Auto-detected context types', ['types' => $contextTypes, 'message' => $userMessage]);
        }
        
        // Default to all types if neither auto-detect nor explicit types provided
        if (!$contextTypes) {
            $contextTypes = ['tasks', 'expenses', 'study', 'memories'];
        }
        
        // Build context with selected types
        $context = $this->contextBuilder->build($userMessage, $contextTypes);
        
        // Log context size for monitoring
        $contextSize = strlen(json_encode($context));
        $systemPrompt = $this->getSystemPrompt($context);
        $systemPromptSize = strlen($systemPrompt);

        // Prepare messages for Groq (with limited history)
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ]
        ];
        
        // Add limited conversation history (max 4 messages = 2 turns)
        foreach (array_slice($history, 0, 4) as $msg) {
            if (isset($msg['role']) && isset($msg['content'])) {
                $messages[] = [
                    'role' => $msg['role'],
                    'content' => $msg['content']
                ];
            }
        }
        
        // Add current user message
        $messages[] = [
            'role' => 'user',
            'content' => $userMessage
        ];

        // Log full request payload for debugging
        Log::info('===== AI REQUEST PAYLOAD =====');
        Log::info('Messages sent to Groq:', [
            'message_count' => count($messages),
            'context_types_used' => $contextTypes,
            'auto_detect' => $autoDetect,
            'full_messages' => $messages,
            'context_data' => $context,
            'estimated_tokens' => ($contextSize + $systemPromptSize + strlen($userMessage)) / 4
        ]);
        Log::info('===== END REQUEST PAYLOAD =====');

        // Call Groq API
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.groq.api_key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => config('services.groq.model', 'llama3-70b-8192'),
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 1024,
            ]);

            if ($response->successful()) {
                $aiResponse = $response->json()['choices'][0]['message']['content'];
                
                // Log successful interaction with size metrics
                Log::info('AI Chat Success', [
                    'user_message_length' => strlen($userMessage),
                    'ai_response_length' => strlen($aiResponse),
                    'context_size' => $contextSize,
                    'system_prompt_size' => $systemPromptSize,
                    'history_count' => count($history),
                    'model' => config('services.groq.model', 'llama3-70b-8192'),
                    'memories_used' => count($context['relevant_memories'] ?? []),
                    'tasks_included' => count($context['tasks_today'] ?? []),
                ]);
                
                // Update memory and store conversation
                $this->memoryUpdater->updateFromConversation($userMessage, $aiResponse);
                
                // Store conversation in vector memory
                $this->storeConversation($userMessage, $aiResponse);

                return response()->json([
                    'message' => $aiResponse,
                    'mode' => 'direct',
                ]);
            } else {
                Log::error('Groq API Error: ' . $response->body());
                return response()->json([
                    'error' => 'Failed to get AI response'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('AI Chat Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An error occurred while processing your request'
            ], 500);
        }
    }

    /**
     * Generate daily plan
     */
    public function dailyPlan()
    {
        $context = $this->contextBuilder->build();

        $prompt = "Dựa trên thông tin hiện tại, hãy tạo một kế hoạch chi tiết cho ngày hôm nay. Bao gồm timeline cụ thể cho từng task.";

        $messages = [
            [
                'role' => 'system',
                'content' => $this->getSystemPrompt($context)
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.groq.api_key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => config('services.groq.model', 'llama3-70b-8192'),
                'messages' => $messages,
                'temperature' => 0.5,
            ]);

            if ($response->successful()) {
                $plan = $response->json()['choices'][0]['message']['content'];
                
                return response()->json([
                    'plan' => $plan
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Daily Plan Error: ' . $e->getMessage());
        }

        return response()->json(['error' => 'Failed to generate daily plan'], 500);
    }

    /**
     * Generate daily summary
     */
    public function dailySummary()
    {
        $context = $this->contextBuilder->buildDailySummary();

        $prompt = "Hãy tạo một bản tóm tắt về ngày hôm nay, bao gồm những gì đã hoàn thành, chi tiêu, và đánh giá tổng quan.";

        $messages = [
            [
                'role' => 'system',
                'content' => $this->getSystemPrompt($context)
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.groq.api_key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => config('services.groq.model', 'llama3-70b-8192'),
                'messages' => $messages,
                'temperature' => 0.5,
            ]);

            if ($response->successful()) {
                $summary = $response->json()['choices'][0]['message']['content'];
                
                // Save to daily logs
                $this->memoryUpdater->saveDailySummary($summary);
                
                return response()->json([
                    'summary' => $summary
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Daily Summary Error: ' . $e->getMessage());
        }

        return response()->json(['error' => 'Failed to generate daily summary'], 500);
    }

    /**
     * Get system prompt with context
     */
    private function getSystemPrompt($context)
    {
        return "Bạn là Life Manager AI - trợ lý cá nhân thông minh giúp quản lý cuộc sống.

CONTEXT HIỆN TẠI:
" . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "

NHIỆM VỤ:
- Giúp lập kế hoạch ngày hiệu quả
- Theo dõi và phân tích chi tiêu
- Hỗ trợ học tập và phát triển
- Đưa ra lời khuyên dựa trên dữ liệu

HÃY TRẢ LỜI BẰNG TIẾNG VIỆT, NGẮN GỌN VÀ CỤ THỂ.";
    }
    
    /**
     * Store conversation in vector memory
     * 
     * @param string $userMessage
     * @param string $aiResponse
     * @return void
     */
    private function storeConversation(string $userMessage, string $aiResponse): void
    {
        try {
            $conversationText = "User: {$userMessage}\nAssistant: {$aiResponse}";
            
            $this->vectorMemory->store(
                'conversation_' . now()->timestamp,
                [
                    'user_message' => $userMessage,
                    'ai_response' => $aiResponse,
                    'timestamp' => now()->toISOString(),
                ],
                'conversations',
                $conversationText,
                [
                    'user_message_length' => strlen($userMessage),
                    'ai_response_length' => strlen($aiResponse),
                ]
            );
        } catch (\Exception $e) {
            Log::warning('Failed to store conversation in vector memory: ' . $e->getMessage());
        }
    }
}
