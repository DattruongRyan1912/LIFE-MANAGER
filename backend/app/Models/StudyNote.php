<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'task_id',
        'content',
        'note_type',
    ];

    public function module()
    {
        return $this->belongsTo(StudyModule::class, 'module_id');
    }

    public function task()
    {
        return $this->belongsTo(StudyTask::class, 'task_id');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('note_type', $type);
    }

    public function scopeLessons($query)
    {
        return $query->where('note_type', 'lesson');
    }

    public function scopeReflections($query)
    {
        return $query->where('note_type', 'reflection');
    }

    public function scopeInsights($query)
    {
        return $query->where('note_type', 'insight');
    }
}
