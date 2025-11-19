<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'goal_id',
        'title',
        'description',
        'order_index',
        'progress',
        'estimated_hours',
    ];

    protected $casts = [
        'progress' => 'float',
        'estimated_hours' => 'integer',
        'order_index' => 'integer',
    ];

    public function goal()
    {
        return $this->belongsTo(StudyGoal::class, 'goal_id');
    }

    public function tasks()
    {
        return $this->hasMany(StudyTask::class, 'module_id');
    }

    public function notes()
    {
        return $this->hasMany(StudyNote::class, 'module_id');
    }

    public function insights()
    {
        return $this->hasMany(StudyInsight::class, 'related_module_id');
    }

    public function resources()
    {
        return $this->hasMany(StudyResource::class, 'module_id');
    }

    public function calculateProgress(): float
    {
        $totalTasks = $this->tasks()->count();
        
        if ($totalTasks === 0) {
            return 0;
        }

        $completedTasks = $this->tasks()->whereNotNull('completed_at')->count();
        
        return ($completedTasks / $totalTasks) * 100;
    }

    public function updateProgress(): void
    {
        $this->progress = $this->calculateProgress();
        $this->save();

        // Update goal progress
        $this->goal->updateProgress();
    }

    public function completedTasksCount(): int
    {
        return $this->tasks()->whereNotNull('completed_at')->count();
    }

    public function pendingTasksCount(): int
    {
        return $this->tasks()->whereNull('completed_at')->count();
    }
}
