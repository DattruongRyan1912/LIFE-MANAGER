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
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'done' => 'boolean',
    ];
}
