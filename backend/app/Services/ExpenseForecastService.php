<?php

namespace App\Services;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpenseForecastService
{
    /**
     * Get expense forecast for next period using AI + historical data
     */
    public function getForecast(int $daysAhead = 7): array
    {
        $historicalData = $this->getHistoricalData(30); // Last 30 days
        
        if (count($historicalData['daily']) < 7) {
            return [
                'forecast' => [],
                'confidence' => 'low',
                'message' => 'Not enough data for accurate forecast. Need at least 7 days of expense history.',
            ];
        }

        $statistics = $this->calculateStatistics($historicalData);
        $aiPrediction = $this->getAIPrediction($historicalData, $statistics, $daysAhead);
        
        return [
            'forecast' => $aiPrediction['predictions'],
            'confidence' => $aiPrediction['confidence'],
            'statistics' => $statistics,
            'recommendations' => $aiPrediction['recommendations'],
            'trend' => $this->detectTrend($historicalData),
        ];
    }

    /**
     * Get detailed category insights
     */
    public function getCategoryInsights(): array
    {
        $last30Days = Expense::where('spent_at', '>=', now()->subDays(30))->get();
        $last60Days = Expense::where('spent_at', '>=', now()->subDays(60))
            ->where('spent_at', '<', now()->subDays(30))
            ->get();

        $currentCategories = $this->groupByCategory($last30Days);
        $previousCategories = $this->groupByCategory($last60Days);

        $insights = [];
        foreach ($currentCategories as $category => $data) {
            $previous = $previousCategories[$category] ?? ['total' => 0, 'count' => 0];
            
            $change = $previous['total'] > 0 
                ? (($data['total'] - $previous['total']) / $previous['total']) * 100 
                : 100;

            $insights[] = [
                'category' => $category,
                'total' => $data['total'],
                'count' => $data['count'],
                'average' => $data['average'],
                'percentage' => $data['percentage'],
                'change' => round($change, 2),
                'trend' => $change > 10 ? 'increasing' : ($change < -10 ? 'decreasing' : 'stable'),
                'largest_expense' => $data['max'],
                'smallest_expense' => $data['min'],
            ];
        }

        // Sort by total amount descending
        usort($insights, function($a, $b) {
            return $b['total'] <=> $a['total'];
        });

        return [
            'insights' => $insights,
            'top_category' => $insights[0] ?? null,
            'total_categories' => count($insights),
            'period' => 'last_30_days',
        ];
    }

    /**
     * Get historical expense data
     */
    private function getHistoricalData(int $days): array
    {
        $expenses = Expense::where('spent_at', '>=', now()->subDays($days))
            ->orderBy('spent_at', 'asc')
            ->get();

        $dailyTotals = [];
        $categoryTotals = [];

        foreach ($expenses as $expense) {
            $date = Carbon::parse($expense->spent_at)->format('Y-m-d');
            $category = $expense->category;

            // Daily totals
            if (!isset($dailyTotals[$date])) {
                $dailyTotals[$date] = 0;
            }
            $dailyTotals[$date] += $expense->amount;

            // Category totals
            if (!isset($categoryTotals[$category])) {
                $categoryTotals[$category] = 0;
            }
            $categoryTotals[$category] += $expense->amount;
        }

        return [
            'daily' => $dailyTotals,
            'categories' => $categoryTotals,
            'total' => $expenses->sum('amount'),
            'count' => $expenses->count(),
            'average_daily' => count($dailyTotals) > 0 ? $expenses->sum('amount') / count($dailyTotals) : 0,
        ];
    }

    /**
     * Calculate statistical metrics
     */
    private function calculateStatistics(array $historicalData): array
    {
        $dailyAmounts = array_values($historicalData['daily']);
        
        if (empty($dailyAmounts)) {
            return [
                'mean' => 0,
                'median' => 0,
                'std_dev' => 0,
                'min' => 0,
                'max' => 0,
            ];
        }

        sort($dailyAmounts);
        $count = count($dailyAmounts);
        
        $mean = array_sum($dailyAmounts) / $count;
        $median = $count % 2 === 0 
            ? ($dailyAmounts[$count / 2 - 1] + $dailyAmounts[$count / 2]) / 2 
            : $dailyAmounts[floor($count / 2)];
        
        // Standard deviation
        $variance = 0;
        foreach ($dailyAmounts as $amount) {
            $variance += pow($amount - $mean, 2);
        }
        $stdDev = sqrt($variance / $count);

        return [
            'mean' => round($mean, 2),
            'median' => round($median, 2),
            'std_dev' => round($stdDev, 2),
            'min' => min($dailyAmounts),
            'max' => max($dailyAmounts),
        ];
    }

    /**
     * Detect spending trend
     */
    private function detectTrend(array $historicalData): string
    {
        $dailyAmounts = array_values($historicalData['daily']);
        
        if (count($dailyAmounts) < 2) {
            return 'stable';
        }

        // Simple linear regression
        $n = count($dailyAmounts);
        $x = range(1, $n);
        $y = $dailyAmounts;

        $sumX = array_sum($x);
        $sumY = array_sum($y);
        $sumXY = 0;
        $sumX2 = 0;

        for ($i = 0; $i < $n; $i++) {
            $sumXY += $x[$i] * $y[$i];
            $sumX2 += $x[$i] * $x[$i];
        }

        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);

        if ($slope > 5) {
            return 'increasing';
        } elseif ($slope < -5) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    /**
     * Get AI prediction using Groq
     */
    private function getAIPrediction(array $historicalData, array $statistics, int $daysAhead): array
    {
        $prompt = $this->buildForecastPrompt($historicalData, $statistics, $daysAhead);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.groq.api_key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => config('services.groq.model'),
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a financial analyst AI. Analyze spending patterns and provide accurate forecasts in JSON format only. Be concise and data-driven.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'temperature' => 0.3,
                'max_tokens' => 1000,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'] ?? '';
                return $this->parseAIResponse($content, $statistics, $daysAhead);
            }
        } catch (\Exception $e) {
            Log::error('Expense forecast AI error: ' . $e->getMessage());
        }

        // Fallback to simple prediction
        return $this->simpleForecast($statistics, $daysAhead);
    }

    /**
     * Build forecast prompt for AI
     */
    private function buildForecastPrompt(array $historicalData, array $statistics, int $daysAhead): string
    {
        $dailyData = json_encode($historicalData['daily']);
        $categories = json_encode($historicalData['categories']);

        return "Analyze this spending data and forecast next {$daysAhead} days:

Historical Daily Spending: {$dailyData}
Categories: {$categories}
Statistics: Mean={$statistics['mean']}, Median={$statistics['median']}, StdDev={$statistics['std_dev']}

Provide forecast in JSON format:
{
  \"predictions\": [{\"date\": \"YYYY-MM-DD\", \"amount\": 100, \"confidence\": \"high|medium|low\"}],
  \"confidence\": \"high|medium|low\",
  \"recommendations\": [\"tip1\", \"tip2\"]
}";
    }

    /**
     * Parse AI response
     */
    private function parseAIResponse(string $content, array $statistics, int $daysAhead): array
    {
        // Try to extract JSON from response
        if (preg_match('/\{[\s\S]*\}/', $content, $matches)) {
            $json = json_decode($matches[0], true);
            if ($json && isset($json['predictions'])) {
                return $json;
            }
        }

        // Fallback
        return $this->simpleForecast($statistics, $daysAhead);
    }

    /**
     * Simple forecast fallback
     */
    private function simpleForecast(array $statistics, int $daysAhead): array
    {
        $predictions = [];
        $baseAmount = $statistics['mean'];

        for ($i = 1; $i <= $daysAhead; $i++) {
            $predictions[] = [
                'date' => now()->addDays($i)->format('Y-m-d'),
                'amount' => round($baseAmount + ($statistics['std_dev'] * (rand(-50, 50) / 100)), 2),
                'confidence' => 'medium',
            ];
        }

        return [
            'predictions' => $predictions,
            'confidence' => 'medium',
            'recommendations' => [
                'Based on your average daily spending, try to keep expenses under ' . round($baseAmount * 1.2, 2) . ' per day.',
                'Consider reducing spending in your top category to improve savings.',
            ],
        ];
    }

    /**
     * Group expenses by category
     */
    private function groupByCategory($expenses): array
    {
        $total = $expenses->sum('amount');
        $grouped = $expenses->groupBy('category');
        $result = [];

        foreach ($grouped as $category => $items) {
            $amounts = $items->pluck('amount')->toArray();
            $categoryTotal = array_sum($amounts);

            $result[$category] = [
                'total' => $categoryTotal,
                'count' => count($amounts),
                'average' => round($categoryTotal / count($amounts), 2),
                'percentage' => $total > 0 ? round(($categoryTotal / $total) * 100, 2) : 0,
                'max' => max($amounts),
                'min' => min($amounts),
            ];
        }

        return $result;
    }
}
