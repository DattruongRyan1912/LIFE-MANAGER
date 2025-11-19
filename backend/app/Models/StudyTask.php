<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'description',
        'due_date',
        'estimated_minutes',
        'completed_at',
        'priority',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'estimated_minutes' => 'integer',
    ];

    public function module()
    {
        return $this->belongsTo(StudyModule::class, 'module_id');
    }

    public function notes()
    {
        return $this->hasMany(StudyNote::class, 'task_id');
    }

    public function insights()
    {
        return $this->hasMany(StudyInsight::class, 'related_task_id');
    }

    public function markAsCompleted(): void
    {
        $this->completed_at = now();
        $this->save();

        // Update module progress
        $this->module->updateProgress();
    }

    public function markAsIncomplete(): void
    {
        $this->completed_at = null;
        $this->save();

        // Update module progress
        $this->module->updateProgress();
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    public function isOverdue(): bool
    {
        if (!$this->due_date || $this->isCompleted()) {
            return false;
        }

        return $this->due_date->isPast();
    }

    public function scopePending($query)
    {
        return $query->whereNull('completed_at');
    }

    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    public function scopeOverdue($query)
    {
        return $query->whereNull('completed_at')
            ->where('due_date', '<', now());
    }

    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }
}
