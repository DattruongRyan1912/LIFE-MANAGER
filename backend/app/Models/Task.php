<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'priority',
        'status',
        'task_type',
        'due_at',
        'start_date',
        'estimated_minutes',
        'actual_minutes',
        'done',
        'recurrence_type',
        'recurrence_interval',
        'recurrence_end_date',
        'parent_task_id',
        'pomodoro_estimate',
        'pomodoro_completed',
        'timeline_order',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'start_date' => 'datetime',
        'done' => 'boolean',
        'recurrence_end_date' => 'date',
        'recurrence_interval' => 'integer',
        'pomodoro_estimate' => 'integer',
        'pomodoro_completed' => 'integer',
        'timeline_order' => 'integer',
        'actual_minutes' => 'integer',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parentTask()
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    public function childTasks()
    {
        return $this->hasMany(Task::class, 'parent_task_id');
    }

    // Task v3 relationships
    public function labels()
    {
        return $this->belongsToMany(TaskLabel::class, 'task_label_map', 'task_id', 'label_id');
    }

    public function dependencies()
    {
        return $this->hasMany(TaskDependency::class, 'task_id');
    }

    public function blockedBy()
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'task_id', 'blocked_by_task_id');
    }

    public function blocking()
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'blocked_by_task_id', 'task_id');
    }

    public function logs()
    {
        return $this->hasMany(TaskLog::class, 'task_id')->orderBy('created_at', 'desc');
    }

    // Helper methods
    public function isRecurring(): bool
    {
        return $this->recurrence_type !== 'none';
    }

    public function pomodoroProgress(): float
    {
        if (!$this->pomodoro_estimate || $this->pomodoro_estimate === 0) {
            return 0;
        }
        return min(100, ($this->pomodoro_completed / $this->pomodoro_estimate) * 100);
    }
}
