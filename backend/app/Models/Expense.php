<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'amount',
        'category',
        'note',
        'spent_at',
    ];

    protected $casts = [
        'spent_at' => 'datetime',
    ];
}
