<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyGoal extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'progress',
        'deadline',
    ];

    protected $casts = [
        'deadline' => 'date',
    ];
}
