<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'summary',
        'ai_feedback',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
