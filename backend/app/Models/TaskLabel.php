<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskLabel extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'color',
    ];

    /**
     * Get the user that owns the label
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all tasks with this label
     */
    public function tasks()
    {
        return $this->belongsToMany(Task::class, 'task_label_map', 'label_id', 'task_id');
    }
}
