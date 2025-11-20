<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * GroqMetricsController - Fetch and display Groq API metrics
 * 
 * Purpose: Provide real-time API usage, limits, and performance metrics
 * from Groq API to display in frontend dashboard
 */
class GroqMetricsController extends Controller
{
    /**
     * Get Groq API metrics
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMetrics(Request $request)
    {
        try {
            $apiKey = config('services.groq.api_key');
            
            if (!$apiKey) {
                return response()->json([
                    'error' => 'Groq API key not configured'
                ], 500);
            }

            // Get time range from request (default last 30 minutes)
            $timeRange = $request->input('time_range', '30m');
            $model = $request->input('model', 'llama-3.3-70b-versatile');

            // Cache key for metrics (cache for 1 minute)
            $cacheKey = "groq_metrics_{$model}_{$timeRange}";
            
            $metrics = Cache::remember($cacheKey, 60, function () use ($apiKey, $model, $timeRange) {
                // Fetch metrics from Groq API
                // Note: Groq doesn't provide public metrics API, so we'll track our own usage
                return $this->getLocalMetrics($model, $timeRange);
            });

            return response()->json([
                'success' => true,
                'model' => $model,
                'time_range' => $timeRange,
                'metrics' => $metrics,
                'timestamp' => now()->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            Log::error('Groq Metrics Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get rate limits for all models
     */
    public function getRateLimits(Request $request)
    {
        $models = [
            'llama-3.3-70b-versatile' => [
                'name' => 'LLaMA 3.3 70B Versatile',
                'rpm' => 30,
                'rpd' => 14400,
                'tpm' => 6000,
                'tpd' => 1000000,
            ],
            'llama-3.1-8b-instant' => [
                'name' => 'LLaMA 3.1 8B Instant',
                'rpm' => 30,
                'rpd' => 14400,
                'tpm' => 250000,
                'tpd' => 25000000,
            ],
            'groq/compound' => [
                'name' => 'Compound (Intent)',
                'rpm' => 30,
                'rpd' => 14400,
                'tpm' => 200000,
                'tpd' => 20000000,
            ],
            'groq/compound-mini' => [
                'name' => 'Compound Mini (Compress)',
                'rpm' => 100,
                'rpd' => 14400,
                'tpm' => 1000000,
                'tpd' => 50000000,
            ],
            'allam-2-7b' => [
                'name' => 'Allam 2 7B',
                'rpm' => 30,
                'rpd' => 14400,
                'tpm' => 100000,
                'tpd' => 10000000,
            ],
        ];

        return response()->json([
            'success' => true,
            'models' => $models,
        ]);
    }

    /**
     * Get local metrics from our tracking
     * In production, you can track requests in database or cache
     */
    private function getLocalMetrics($model, $timeRange)
    {
        // Parse time range
        $minutes = $this->parseTimeRange($timeRange);
        $now = now();
        $start = now()->subMinutes($minutes);

        // Mock data - In production, query from your database logs
        $httpStatusCodes = [
            ['timestamp' => $start->copy()->addMinutes(5)->timestamp, 'status' => 200, 'count' => 5],
            ['timestamp' => $start->copy()->addMinutes(15)->timestamp, 'status' => 200, 'count' => 3],
            ['timestamp' => $start->copy()->addMinutes(25)->timestamp, 'status' => 200, 'count' => 2],
        ];

        $requests = [
            ['timestamp' => $start->copy()->addMinutes(5)->timestamp, 'count' => 5],
            ['timestamp' => $start->copy()->addMinutes(15)->timestamp, 'count' => 35], // Above limit 30!
            ['timestamp' => $start->copy()->addMinutes(25)->timestamp, 'count' => 8],
        ];

        $tokens = [
            ['timestamp' => $start->copy()->addMinutes(5)->timestamp, 'input_tokens' => 3500, 'output_tokens' => 1200],
            ['timestamp' => $start->copy()->addMinutes(15)->timestamp, 'input_tokens' => 4500, 'output_tokens' => 2500], // Above limit! (7000 total)
            ['timestamp' => $start->copy()->addMinutes(25)->timestamp, 'input_tokens' => 1800, 'output_tokens' => 600],
        ];

        // Calculate totals
        $totalRequests = collect($requests)->sum('count');
        $totalInputTokens = collect($tokens)->sum('input_tokens');
        $totalOutputTokens = collect($tokens)->sum('output_tokens');
        $totalTokens = $totalInputTokens + $totalOutputTokens;

        // Get rate limits for this model
        $limits = $this->getModelLimits($model);

        return [
            'http_status_codes' => $httpStatusCodes,
            'requests' => $requests,
            'tokens' => $tokens,
            'summary' => [
                'total_requests' => $totalRequests,
                'total_input_tokens' => $totalInputTokens,
                'total_output_tokens' => $totalOutputTokens,
                'total_tokens' => $totalTokens,
                'success_rate' => 100, // Calculate from http_status_codes
            ],
            'limits' => $limits,
            'usage_percentage' => [
                'rpm' => ($totalRequests / $limits['rpm']) * 100,
                'tpm' => ($totalTokens / $limits['tpm']) * 100,
            ],
        ];
    }

    /**
     * Parse time range string to minutes
     */
    private function parseTimeRange($timeRange)
    {
        if (str_ends_with($timeRange, 'm')) {
            return (int) str_replace('m', '', $timeRange);
        } elseif (str_ends_with($timeRange, 'h')) {
            return (int) str_replace('h', '', $timeRange) * 60;
        } elseif (str_ends_with($timeRange, 'd')) {
            return (int) str_replace('d', '', $timeRange) * 1440;
        }
        
        return 30; // Default 30 minutes
    }

    /**
     * Get rate limits for specific model
     */
    private function getModelLimits($model)
    {
        $limits = [
            'llama-3.3-70b-versatile' => ['rpm' => 30, 'rpd' => 14400, 'tpm' => 6000, 'tpd' => 1000000],
            'llama-3.1-8b-instant' => ['rpm' => 30, 'rpd' => 14400, 'tpm' => 250000, 'tpd' => 25000000],
            'groq/compound' => ['rpm' => 30, 'rpd' => 14400, 'tpm' => 200000, 'tpd' => 20000000],
            'groq/compound-mini' => ['rpm' => 100, 'rpd' => 14400, 'tpm' => 1000000, 'tpd' => 50000000],
            'allam-2-7b' => ['rpm' => 30, 'rpd' => 14400, 'tpm' => 100000, 'tpd' => 10000000],
        ];

        return $limits[$model] ?? ['rpm' => 30, 'rpd' => 14400, 'tpm' => 100000, 'tpd' => 10000000];
    }
}
