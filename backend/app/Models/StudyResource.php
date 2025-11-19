<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyResource extends Model
{
    use HasFactory;

    protected $fillable = [
        'goal_id',
        'module_id',
        'title',
        'url',
        'reason',
    ];

    public function goal()
    {
        return $this->belongsTo(StudyGoal::class, 'goal_id');
    }

    public function module()
    {
        return $this->belongsTo(StudyModule::class, 'module_id');
    }

    public function scopeForGoal($query, int $goalId)
    {
        return $query->where('goal_id', $goalId);
    }

    public function scopeForModule($query, int $moduleId)
    {
        return $query->where('module_id', $moduleId);
    }
}
