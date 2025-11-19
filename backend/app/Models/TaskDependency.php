<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskDependency extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'blocked_by_task_id',
    ];

    /**
     * Get the task that is dependent
     */
    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    /**
     * Get the task that is blocking
     */
    public function blockingTask()
    {
        return $this->belongsTo(Task::class, 'blocked_by_task_id');
    }
}
