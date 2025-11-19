<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyInsight extends Model
{
    use HasFactory;

    protected $fillable = [
        'related_goal_id',
        'related_module_id',
        'related_task_id',
        'content',
        'embedding_vector',
    ];

    protected $casts = [
        'embedding_vector' => 'array',
    ];

    public function goal()
    {
        return $this->belongsTo(StudyGoal::class, 'related_goal_id');
    }

    public function module()
    {
        return $this->belongsTo(StudyModule::class, 'related_module_id');
    }

    public function task()
    {
        return $this->belongsTo(StudyTask::class, 'related_task_id');
    }

    public function scopeForGoal($query, int $goalId)
    {
        return $query->where('related_goal_id', $goalId);
    }

    public function scopeForModule($query, int $moduleId)
    {
        return $query->where('related_module_id', $moduleId);
    }
}
