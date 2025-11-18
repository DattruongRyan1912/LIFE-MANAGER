<?php

namespace App\Services;

use App\Models\DailyLog;
use App\Models\LongTermMemory;
use Carbon\Carbon;

class MemoryUpdater
{
    /**
     * Update memory from conversation
     */
    public function updateFromConversation($userMessage, $aiResponse)
    {
        // Extract insights from conversation
        // This is a simple implementation - can be enhanced with NLP
        
        $keywords = [
            'prefer', 'like', 'dislike', 'habit', 'goal', 
            'thích', 'không thích', 'thói quen', 'mục tiêu'
        ];
        
        foreach ($keywords as $keyword) {
            if (stripos($userMessage, $keyword) !== false) {
                $this->saveInsight('user_preferences', [
                    'message' => $userMessage,
                    'timestamp' => now()->toDateTimeString(),
                ]);
                break;
            }
        }
    }

    /**
     * Save daily summary to daily logs
     */
    public function saveDailySummary($summary)
    {
        DailyLog::updateOrCreate(
            ['date' => today()],
            [
                'summary' => $summary,
                'ai_feedback' => $summary,
            ]
        );
    }

    /**
     * Save insight to long-term memory
     */
    public function saveInsight($key, $value)
    {
        $memory = LongTermMemory::firstOrNew(['key' => $key]);
        
        if ($memory->exists) {
            // Append to existing insights
            $existingValue = $memory->value;
            if (!is_array($existingValue)) {
                $existingValue = [];
            }
            $existingValue[] = $value;
            $memory->value = $existingValue;
        } else {
            $memory->value = [$value];
        }
        
        $memory->save();
    }

    /**
     * Update habit patterns
     */
    public function updateHabitPatterns()
    {
        // Analyze patterns in tasks and expenses
        // This can be run periodically (e.g., daily cron job)
        
        // Example: Track most common expense categories
        $topCategories = \DB::table('expenses')
            ->select('category', \DB::raw('COUNT(*) as count'))
            ->where('spent_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();
        
        $this->saveInsight('top_expense_categories', [
            'data' => $topCategories,
            'period' => '30_days',
            'updated_at' => now()->toDateTimeString(),
        ]);
    }
}
