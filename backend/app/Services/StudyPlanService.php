<?php

namespace App\Services;

use App\Models\StudyGoal;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StudyPlanService
{
    private $groqApiKey;
    private $groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    public function __construct()
    {
        $this->groqApiKey = env('GROQ_API_KEY');
    }

    /**
     * Generate AI-powered weekly study plan
     * 
     * @param StudyGoal $goal
     * @return array
     */
    public function generateWeeklyPlan(StudyGoal $goal): array
    {
        $daysUntilDeadline = Carbon::now()->diffInDays($goal->deadline, false);
        $weeksAvailable = max(1, (int) ceil($daysUntilDeadline / 7));
        
        // Calculate statistics
        $completedChapters = $goal->completedChaptersCount();
        $remainingChapters = max(0, ($goal->total_chapters ?? 0) - $completedChapters);
        $chaptersPerWeek = $remainingChapters > 0 ? ceil($remainingChapters / $weeksAvailable) : 0;

        // Get AI recommendation
        $aiPlan = $this->getAIPlan($goal, $weeksAvailable, $chaptersPerWeek, $remainingChapters);

        // Generate weekly breakdown
        $weeklyPlan = [];
        if ($aiPlan && isset($aiPlan['weeks'])) {
            $weeklyPlan = $aiPlan['weeks'];
        } else {
            // Fallback: Generate simple weekly plan
            $weeklyPlan = $this->generateSimplePlan($goal, $weeksAvailable, $chaptersPerWeek);
        }

        return [
            'weekly_plan' => $weeklyPlan,
            'statistics' => [
                'weeks_available' => $weeksAvailable,
                'chapters_per_week' => $chaptersPerWeek,
                'completed_chapters' => $completedChapters,
                'remaining_chapters' => $remainingChapters,
                'days_until_deadline' => $daysUntilDeadline,
            ],
            'ai_recommendations' => $aiPlan['recommendations'] ?? [],
            'difficulty_level' => $this->assessDifficulty($chaptersPerWeek, $daysUntilDeadline),
        ];
    }

    /**
     * Get AI-generated study plan from Groq
     */
    private function getAIPlan(StudyGoal $goal, int $weeks, int $chaptersPerWeek, int $remaining): ?array
    {
        if (!$this->groqApiKey) {
            return null;
        }

        $prompt = $this->buildStudyPlanPrompt($goal, $weeks, $chaptersPerWeek, $remaining);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->groqApiUrl, [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a study planning expert. Generate realistic, actionable weekly study plans. Always respond with valid JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.4,
                'max_tokens' => 2000,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'] ?? '';
                return $this->parseAIResponse($content);
            }
        } catch (\Exception $e) {
            Log::error('Study Plan AI Error: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Build prompt for AI study plan generation
     */
    private function buildStudyPlanPrompt(StudyGoal $goal, int $weeks, int $chaptersPerWeek, int $remaining): string
    {
        $chapters = $goal->chapters ? collect($goal->chapters)->where('completed', false)->pluck('title')->take(10)->implode(', ') : 'Not specified';
        
        return <<<PROMPT
Generate a {$weeks}-week study plan for: "{$goal->name}"

Study Information:
- Type: {$goal->study_type}
- Current Progress: {$goal->progress}%
- Deadline: {$goal->deadline->format('Y-m-d')} ({$weeks} weeks)
- Remaining Chapters: {$remaining}
- Suggested Pace: {$chaptersPerWeek} chapters per week
- Upcoming Chapters: {$chapters}

Create a realistic weekly breakdown with:
1. Daily study tasks (30-90 minutes per day)
2. Specific chapter/topic focus for each week
3. Practice exercises and review sessions
4. Practical recommendations

Respond with JSON only:
{
  "weeks": [
    {
      "week": 1,
      "focus": "Chapter focus description",
      "daily_tasks": ["Monday: ...", "Tuesday: ...", "Wednesday: ...", "Thursday: ...", "Friday: ...", "Weekend: Review"],
      "estimated_hours": 6
    }
  ],
  "recommendations": [
    "Study tip 1",
    "Study tip 2",
    "Study tip 3"
  ]
}
PROMPT;
    }

    /**
     * Parse AI response and extract JSON
     */
    private function parseAIResponse(string $content): ?array
    {
        // Remove markdown code blocks if present
        $content = preg_replace('/```json\s*|\s*```/', '', $content);
        $content = trim($content);

        try {
            $data = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $data;
            }
        } catch (\Exception $e) {
            Log::error('Failed to parse AI study plan: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Generate simple fallback plan without AI
     */
    private function generateSimplePlan(StudyGoal $goal, int $weeks, int $chaptersPerWeek): array
    {
        $plan = [];
        $remainingChapters = collect($goal->chapters)->where('completed', false)->values();
        
        for ($week = 1; $week <= min($weeks, 8); $week++) {
            $startIdx = ($week - 1) * $chaptersPerWeek;
            $weekChapters = $remainingChapters->slice($startIdx, $chaptersPerWeek);
            
            if ($weekChapters->isEmpty()) break;

            $plan[] = [
                'week' => $week,
                'focus' => 'Week ' . $week . ': ' . $weekChapters->pluck('title')->implode(', '),
                'daily_tasks' => [
                    'Monday: Study first half',
                    'Tuesday: Study second half',
                    'Wednesday: Practice exercises',
                    'Thursday: Deep dive and notes',
                    'Friday: Quiz yourself',
                    'Weekend: Review and summarize'
                ],
                'estimated_hours' => 6
            ];
        }

        return $plan;
    }

    /**
     * Assess difficulty level based on workload
     */
    private function assessDifficulty(int $chaptersPerWeek, int $daysLeft): string
    {
        if ($daysLeft < 7) return 'CRITICAL';
        if ($chaptersPerWeek > 5) return 'INTENSE';
        if ($chaptersPerWeek > 3) return 'MODERATE';
        return 'COMFORTABLE';
    }

    /**
     * Evaluate current progress and provide feedback
     */
    public function evaluateProgress(StudyGoal $goal): array
    {
        $daysUntilDeadline = Carbon::now()->diffInDays($goal->deadline, false);
        $daysElapsed = Carbon::now()->diffInDays($goal->created_at);
        $totalDays = $daysElapsed + max(0, $daysUntilDeadline);
        
        $expectedProgress = $totalDays > 0 ? (int) (($daysElapsed / $totalDays) * 100) : 0;
        $actualProgress = $goal->progress;
        $progressDiff = $actualProgress - $expectedProgress;

        // Determine status
        if ($progressDiff >= 10) {
            $status = 'AHEAD';
            $message = '🎉 Great job! You are ahead of schedule.';
        } elseif ($progressDiff >= -10) {
            $status = 'ON_TRACK';
            $message = '✅ You are on track with your study plan.';
        } else {
            $status = 'BEHIND';
            $message = '⚠️ You are falling behind. Consider adjusting your schedule.';
        }

        // Get AI evaluation
        $aiEvaluation = $this->getAIEvaluation($goal, $status, $progressDiff, $daysUntilDeadline);

        return [
            'status' => $status,
            'message' => $message,
            'progress' => [
                'actual' => $actualProgress,
                'expected' => $expectedProgress,
                'difference' => $progressDiff,
            ],
            'timeline' => [
                'days_elapsed' => $daysElapsed,
                'days_remaining' => max(0, $daysUntilDeadline),
                'total_days' => $totalDays,
            ],
            'ai_feedback' => $aiEvaluation,
            'suggestions' => $this->generateSuggestions($status, $daysUntilDeadline, $goal),
        ];
    }

    /**
     * Get AI evaluation of progress
     */
    private function getAIEvaluation(StudyGoal $goal, string $status, int $diff, int $daysLeft): ?string
    {
        if (!$this->groqApiKey) {
            return null;
        }

        $prompt = <<<PROMPT
Evaluate study progress for: "{$goal->name}"

Current Status:
- Progress: {$goal->progress}%
- Status: {$status}
- Progress Difference: {$diff}%
- Days Until Deadline: {$daysLeft}
- Study Type: {$goal->study_type}

Provide a brief, encouraging evaluation (2-3 sentences) with:
1. Assessment of current pace
2. Specific actionable advice
3. Motivational message

Keep it concise and practical.
PROMPT;

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(20)->post($this->groqApiUrl, [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a supportive study coach. Provide brief, actionable feedback.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.7,
                'max_tokens' => 200,
            ]);

            if ($response->successful()) {
                return $response->json()['choices'][0]['message']['content'] ?? null;
            }
        } catch (\Exception $e) {
            Log::error('AI Evaluation Error: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Generate practical suggestions based on status
     */
    private function generateSuggestions(string $status, int $daysLeft, StudyGoal $goal): array
    {
        $suggestions = [];

        if ($status === 'BEHIND') {
            $suggestions[] = 'Increase daily study time by 30 minutes';
            $suggestions[] = 'Focus on high-priority chapters first';
            if ($daysLeft > 7) {
                $suggestions[] = 'Consider weekend intensive study sessions';
            } else {
                $suggestions[] = 'Prioritize understanding over completion';
            }
        } elseif ($status === 'ON_TRACK') {
            $suggestions[] = 'Maintain current pace';
            $suggestions[] = 'Add practice exercises to solidify knowledge';
            $suggestions[] = 'Schedule regular review sessions';
        } else { // AHEAD
            $suggestions[] = 'Great progress! Consider diving deeper into complex topics';
            $suggestions[] = 'Use extra time for practice projects';
            $suggestions[] = 'Help others to reinforce your learning';
        }

        if ($daysLeft < 7) {
            $suggestions[] = '🚨 Final week: Focus on review and practice tests';
        }

        return $suggestions;
    }

    /**
     * Suggest daily study tasks based on current progress
     */
    public function suggestDailyStudy(StudyGoal $goal): array
    {
        $nextChapter = collect($goal->chapters)->firstWhere('completed', false);
        $daysLeft = Carbon::now()->diffInDays($goal->deadline, false);

        $recommendedMinutes = $this->calculateDailyMinutes($goal, $daysLeft);

        return [
            'recommended_minutes' => $recommendedMinutes,
            'next_chapter' => $nextChapter,
            'tasks' => [
                'Read/watch main material (' . (int)($recommendedMinutes * 0.5) . ' min)',
                'Take notes and highlight key points (' . (int)($recommendedMinutes * 0.3) . ' min)',
                'Practice exercises or quiz (' . (int)($recommendedMinutes * 0.2) . ' min)',
            ],
            'urgency' => $daysLeft < 7 ? 'HIGH' : ($daysLeft < 14 ? 'MEDIUM' : 'LOW'),
        ];
    }

    /**
     * Calculate recommended daily study minutes
     */
    private function calculateDailyMinutes(StudyGoal $goal, int $daysLeft): int
    {
        $remainingProgress = 100 - $goal->progress;
        
        if ($daysLeft <= 0) return 120; // 2 hours if overdue
        if ($remainingProgress <= 10) return 30;
        
        // Estimate total hours needed (1% progress = 1 hour of study)
        $hoursNeeded = $remainingProgress;
        $minutesPerDay = (int) (($hoursNeeded * 60) / max(1, $daysLeft));
        
        // Cap between 30-180 minutes
        return max(30, min(180, $minutesPerDay));
    }
}
