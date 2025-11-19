<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LongTermMemory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'key',
        'value',
        'category',
        'content',
        'embedding',
        'relevance_score',
        'last_accessed_at',
        'metadata',
    ];

    protected $casts = [
        'value' => 'array',
        'embedding' => 'array',
        'metadata' => 'array',
        'last_accessed_at' => 'datetime',
        'relevance_score' => 'float',
    ];

    /**
     * Get the user for this memory
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Update access timestamp
     */
    public function markAsAccessed(): void
    {
        $this->update(['last_accessed_at' => now()]);
    }

    /**
     * Increment relevance score
     */
    public function incrementRelevance(float $amount = 0.1): void
    {
        $this->increment('relevance_score', $amount);
    }

    /**
     * Scope by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope most relevant
     */
    public function scopeMostRelevant($query, int $limit = 10)
    {
        return $query->orderBy('relevance_score', 'desc')
                     ->orderBy('last_accessed_at', 'desc')
                     ->limit($limit);
    }

    /**
     * Scope recently accessed
     */
    public function scopeRecentlyAccessed($query, int $days = 7)
    {
        return $query->where('last_accessed_at', '>=', now()->subDays($days));
    }
}
