<?php

namespace App\Http\Controllers;

use App\Services\ContextBuilder;
use App\Services\MemoryUpdater;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AssistantController extends Controller
{
    protected $contextBuilder;
    protected $memoryUpdater;

    public function __construct(ContextBuilder $contextBuilder, MemoryUpdater $memoryUpdater)
    {
        $this->contextBuilder = $contextBuilder;
        $this->memoryUpdater = $memoryUpdater;
    }

    /**
     * Chat with AI Assistant
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $userMessage = $request->input('message');
        
        // Build context from current data
        $context = $this->contextBuilder->build();

        // Prepare messages for Groq
        $messages = [
            [
                'role' => 'system',
                'content' => $this->getSystemPrompt($context)
            ],
            [
                'role' => 'user',
                'content' => $userMessage
            ]
        ];

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
                
                // Update memory if needed
                $this->memoryUpdater->updateFromConversation($userMessage, $aiResponse);

                return response()->json([
                    'message' => $aiResponse
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
}
