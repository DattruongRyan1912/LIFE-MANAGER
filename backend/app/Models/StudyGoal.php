<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyGoal extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'progress',
        'deadline',
        'chapters',
        'weekly_plan',
        'ai_feedback',
        'total_chapters',
        'study_type',
    ];

    protected $casts = [
        'deadline' => 'date',
        'chapters' => 'array',
        'weekly_plan' => 'array',
    ];

    /**
     * Get completed chapters count
     */
    public function completedChaptersCount(): int
    {
        if (!$this->chapters) return 0;
        return collect($this->chapters)->where('completed', true)->count();
    }

    /**
     * Calculate progress based on completed chapters
     */
    public function calculateProgress(): int
    {
        if (!$this->total_chapters || $this->total_chapters == 0) return $this->progress;
        return (int) (($this->completedChaptersCount() / $this->total_chapters) * 100);
    }

    /**
     * Check if study plan exists
     */
    public function hasPlan(): bool
    {
        return !empty($this->weekly_plan);
    }
}
