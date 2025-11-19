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

    /**
     * Get the modules for the goal (Study 3.0)
     */
    public function modules()
    {
        return $this->hasMany(StudyModule::class, 'goal_id');
    }

    /**
     * Get the insights for the goal (Study 3.0)
     */
    public function insights()
    {
        return $this->hasMany(StudyInsight::class, 'related_goal_id');
    }

    /**
     * Get the resources for the goal (Study 3.0)
     */
    public function resources()
    {
        return $this->hasMany(StudyResource::class, 'goal_id');
    }

    /**
     * Update progress based on modules (Study 3.0)
     */
    public function updateProgress(): void
    {
        $modules = $this->modules;

        if ($modules->isEmpty()) {
            // Fallback to chapters-based progress
            $this->progress = $this->calculateProgress();
        } else {
            // Calculate from modules
            $avgProgress = $modules->avg('progress');
            $this->progress = round($avgProgress);
        }

        $this->save();
    }

    /**
     * Get all tasks across all modules (Study 3.0)
     */
    public function allTasks()
    {
        return StudyTask::whereHas('module', function($query) {
            $query->where('goal_id', $this->id);
        });
    }
}
