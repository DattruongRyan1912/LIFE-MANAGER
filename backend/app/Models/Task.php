<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'priority',
        'due_at',
        'estimated_minutes',
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
        'done' => 'boolean',
        'recurrence_end_date' => 'date',
        'recurrence_interval' => 'integer',
        'pomodoro_estimate' => 'integer',
        'pomodoro_completed' => 'integer',
        'timeline_order' => 'integer',
    ];

    // Relationships
    public function parentTask()
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    public function childTasks()
    {
        return $this->hasMany(Task::class, 'parent_task_id');
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
