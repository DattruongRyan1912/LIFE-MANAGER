<?php

namespace App\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * OutputFormatter - Shorten and format AI responses
 * 
 * Purpose: Compress verbose 70B output (600-800 tokens) → concise response (200-300 tokens)
 * Model: allam-2-7b (Good at summarization, decent TPM)
 * Token cost: ~300-400 tokens per request (but saves 300-500 on response)
 */
class OutputFormatter
{
    private $apiKey;
    private $model;
    
    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->model = config('services.groq.models.formatter');
    }
    
    /**
     * Format and potentially shorten AI response
     * 
     * @param string $rawOutput Raw response from 70B model
     * @param string $intent User intent for context-aware formatting
     * @return string Formatted response
     */
    public function format(string $rawOutput, string $intent = 'general'): string
    {
        $originalLength = strlen($rawOutput);
        
        // If already concise (< 500 chars), skip API call
        if ($originalLength < 500) {
            return $this->quickFormat($rawOutput);
        }
        
        $systemPrompt = $this->buildFormatterPrompt($intent);
        
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
                        'content' => "Format this response:\n\n" . $rawOutput
                    ]
                ],
                'temperature' => 0.3,
                'max_tokens' => 1024, // Increased to allow full response (was 300, too limiting)
            ]);
            
            if ($response->successful()) {
                $formatted = $response->json()['choices'][0]['message']['content'] ?? '';
                $formattedLength = strlen($formatted);
                
                $reductionRatio = $originalLength > 0 ? 
                    round((1 - $formattedLength / $originalLength) * 100, 1) : 0;
                
                Log::info('Output Formatting', [
                    'original_length' => $originalLength,
                    'formatted_length' => $formattedLength,
                    'reduction_ratio' => $reductionRatio . '%',
                    'intent' => $intent,
                    'model' => $this->model,
                ]);
                
                return $formatted;
            }
            
        } catch (\Exception $e) {
            Log::warning('Output formatting failed: ' . $e->getMessage());
        }
        
        // Fallback to quick formatting
        return $this->quickFormat($rawOutput);
    }
    
    /**
     * Build system prompt for output formatter
     */
    private function buildFormatterPrompt(string $intent): string
    {
        $style = $this->getStyleForIntent($intent);
        
        return <<<PROMPT
You are an output formatter. Take a verbose AI response and make it concise while keeping all important information.

User Intent: {$intent}
Output Style: {$style}

Formatting rules:
1. Remove redundant phrases ("as you can see", "based on the data")
2. Use bullet points for lists
3. Numbers and key facts must stay
4. Keep action items
5. Target: 150-300 words maximum

Quality requirements:
- Keep the tone friendly and helpful
- Preserve Vietnamese text if present
- Maintain accuracy - don't change facts
- Use markdown formatting (**, -, •)

Example:
Input: "Based on the data provided in your context, I can see that you have 16 tasks today. Looking at the priorities, there are 4 high-priority tasks which include writing a report, reviewing documents, planning next week, and attending a meeting..."

Output:
**Tasks Today:** 16 total
• High priority: 4 (report, review, planning, meeting)
• Medium: 6
• Low: 6

**Due now:** 5 tasks (3 high, 2 medium)
**Est. time:** 8.5 hours
PROMPT;
    }
    
    /**
     * Get output style based on intent
     */
    private function getStyleForIntent(string $intent): string
    {
        $styles = [
            'task' => 'Bullet list with numbers. Action-oriented.',
            'study' => 'Progress-focused. Show percentages and metrics.',
            'expense' => 'Numbers first. Show totals and categories.',
            'planning' => 'Timeline format. Step-by-step.',
            'memory' => 'Story format. Conversational.',
            'general' => 'Direct answer. Supporting facts. Next steps.',
        ];
        
        return $styles[$intent] ?? $styles['general'];
    }
    
    /**
     * Quick format without API call (fallback)
     */
    private function quickFormat(string $output): string
    {
        // Basic cleanup
        $formatted = $output;
        
        // Remove common filler phrases
        $fillers = [
            '/Based on (the|your) (data|context|information)[^,.]+(, |. )/i' => '',
            '/As (you can see|mentioned)[^,.]+(, |. )/i' => '',
            '/Looking at (the|your)[^,.]+(, |. )/i' => '',
            '/I can see that /i' => '',
        ];
        
        foreach ($fillers as $pattern => $replacement) {
            $formatted = preg_replace($pattern, $replacement, $formatted);
        }
        
        // Trim whitespace
        $formatted = trim($formatted);
        
        return $formatted;
    }
    
    /**
     * Estimate token savings
     */
    public function estimateSavings(string $rawOutput): int
    {
        $originalTokens = strlen($rawOutput) / 4;
        $targetTokens = 200;
        
        return max(0, (int)($originalTokens - $targetTokens));
    }
}
