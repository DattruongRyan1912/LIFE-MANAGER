<?php

namespace App\Services;

class ContextRouter
{
    /**
     * Auto-detect which context types are needed based on message content
     * 
     * @param string $message
     * @return array Array of context types: ['tasks', 'expenses', 'study', 'memories']
     */
    public static function detectContextTypes(string $message): array
    {
        $text = mb_strtolower($message);
        $contextTypes = [];
        
        // Task-related keywords
        $taskKeywords = ['task', 'công việc', 'deadline', 'việc', 'làm', 'hoàn thành', 'todo', 'dự án', 'project'];
        if (self::containsAny($text, $taskKeywords)) {
            $contextTypes[] = 'tasks';
        }
        
        // Expense-related keywords
        $expenseKeywords = ['chi tiêu', 'tiền', 'expense', 'budget', 'mua', 'shopping', 'giá', 'tổng chi', 'forecast'];
        if (self::containsAny($text, $expenseKeywords)) {
            $contextTypes[] = 'expenses';
        }
        
        // Study-related keywords
        $studyKeywords = ['học', 'study', 'tiến độ học', 'chapter', 'chương', 'module', 'khóa học', 'bài học', 'ôn tập'];
        if (self::containsAny($text, $studyKeywords)) {
            $contextTypes[] = 'study';
        }
        
        // Memory/preference keywords
        $memoryKeywords = ['nhớ', 'thói quen', 'habit', 'sở thích', 'preference', 'pattern', 'thường', 'insight'];
        if (self::containsAny($text, $memoryKeywords)) {
            $contextTypes[] = 'memories';
        }
        
        // Default: If no specific match, include lightweight context
        if (empty($contextTypes)) {
            $contextTypes = ['tasks', 'memories']; // Minimal default
        }
        
        return $contextTypes;
    }
    
    /**
     * Check if text contains any of the keywords
     */
    private static function containsAny(string $text, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get recommended context types with confidence scores
     * 
     * @param string $message
     * @return array ['type' => 'tasks', 'confidence' => 0.9]
     */
    public static function analyzeWithConfidence(string $message): array
    {
        $text = mb_strtolower($message);
        $analysis = [];
        
        $categories = [
            'tasks' => ['task', 'công việc', 'deadline', 'việc', 'làm', 'hoàn thành', 'todo'],
            'expenses' => ['chi tiêu', 'tiền', 'expense', 'budget', 'mua', 'shopping'],
            'study' => ['học', 'study', 'tiến độ', 'chapter', 'module'],
            'memories' => ['nhớ', 'thói quen', 'habit', 'sở thích', 'pattern'],
        ];
        
        foreach ($categories as $type => $keywords) {
            $matches = 0;
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    $matches++;
                }
            }
            
            if ($matches > 0) {
                $confidence = min(1.0, $matches / 3); // Max at 3 keyword matches
                $analysis[] = [
                    'type' => $type,
                    'confidence' => round($confidence, 2),
                    'matches' => $matches,
                ];
            }
        }
        
        // Sort by confidence
        usort($analysis, fn($a, $b) => $b['confidence'] <=> $a['confidence']);
        
        return $analysis;
    }
}
