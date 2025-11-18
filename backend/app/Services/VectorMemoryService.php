<?php

namespace App\Services;

use App\Models\LongTermMemory;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VectorMemoryService
{
    private $groqApiKey;
    private $groqApiUrl = 'https://api.groq.com/openai/v1/embeddings';

    public function __construct()
    {
        $this->groqApiKey = env('GROQ_API_KEY');
    }

    /**
     * Store a memory with vector embedding
     * 
     * @param string $key
     * @param array $value
     * @param string $category
     * @param string $content
     * @param array $metadata
     * @return LongTermMemory
     */
    public function store(string $key, array $value, string $category = 'general', string $content = '', array $metadata = []): LongTermMemory
    {
        // Generate embedding for content
        $embedding = $this->generateEmbedding($content ?: json_encode($value));

        return LongTermMemory::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'category' => $category,
                'content' => $content,
                'embedding' => $embedding,
                'relevance_score' => 1.0,
                'metadata' => $metadata,
                'last_accessed_at' => now(),
            ]
        );
    }

    /**
     * Search memories by vector similarity
     * 
     * @param string $query
     * @param int $limit
     * @param array $categories
     * @return array
     */
    public function search(string $query, int $limit = 5, array $categories = []): array
    {
        // Generate query embedding
        $queryEmbedding = $this->generateEmbedding($query);
        
        if (!$queryEmbedding) {
            // Fallback to keyword search
            return $this->keywordSearch($query, $limit, $categories);
        }

        // Get all memories (with optional category filter)
        $memoriesQuery = LongTermMemory::whereNotNull('embedding');
        
        if (!empty($categories)) {
            $memoriesQuery->whereIn('category', $categories);
        }
        
        $memories = $memoriesQuery->get();

        // Calculate cosine similarity for each memory
        $scoredMemories = $memories->map(function ($memory) use ($queryEmbedding) {
            if (!$memory->embedding) return null;
            
            $similarity = $this->cosineSimilarity($queryEmbedding, $memory->embedding);
            
            // Boost by relevance score and recency
            $recencyBoost = $memory->last_accessed_at ? 
                min(1.0, $memory->last_accessed_at->diffInDays(now()) / 30) : 0.5;
            $finalScore = ($similarity * 0.7) + ($memory->relevance_score * 0.2) + ($recencyBoost * 0.1);
            
            // Return as array to avoid DB save issues
            return [
                'id' => $memory->id,
                'key' => $memory->key,
                'value' => $memory->value,
                'content' => $memory->content,
                'category' => $memory->category,
                'relevance_score' => $memory->relevance_score,
                'last_accessed_at' => $memory->last_accessed_at,
                'created_at' => $memory->created_at,
                'updated_at' => $memory->updated_at,
                'metadata' => $memory->metadata,
                'similarity_score' => $similarity,
                'final_score' => $finalScore,
            ];
        })->filter()->sortByDesc('final_score')->take($limit)->values();

        // Mark as accessed (bulk update)
        $memoryIds = $scoredMemories->pluck('id')->toArray();
        if (!empty($memoryIds)) {
            LongTermMemory::whereIn('id', $memoryIds)->update([
                'last_accessed_at' => now(),
            ]);
        }

        return $scoredMemories->toArray();
    }

    /**
     * Generate embedding using simple TF-IDF approach
     * (Fallback when Groq API unavailable)
     * 
     * @param string $text
     * @return array
     */
    private function generateSimpleEmbedding(string $text): array
    {
        // Simple word frequency vector (normalized)
        $words = str_word_count(strtolower($text), 1);
        $wordCount = array_count_values($words);
        
        // Get top 100 words
        arsort($wordCount);
        $topWords = array_slice($wordCount, 0, 100, true);
        
        // Normalize
        $max = max($topWords) ?: 1;
        $embedding = array_map(fn($count) => $count / $max, $topWords);
        
        // Convert to fixed-size array (pad or truncate to 100 dimensions)
        $vector = array_values($embedding);
        $vector = array_pad(array_slice($vector, 0, 100), 100, 0.0);
        
        return $vector;
    }

    /**
     * Generate embedding using Groq API (if available)
     * Falls back to simple embedding
     * 
     * @param string $text
     * @return array|null
     */
    private function generateEmbedding(string $text): ?array
    {
        if (!$this->groqApiKey) {
            return $this->generateSimpleEmbedding($text);
        }

        try {
            // Note: Groq doesn't have embeddings endpoint yet
            // Using simple embedding for now
            return $this->generateSimpleEmbedding($text);
            
            // TODO: When Groq adds embeddings API, use this:
            // $response = Http::withHeaders([
            //     'Authorization' => 'Bearer ' . $this->groqApiKey,
            // ])->post($this->groqApiUrl, [
            //     'model' => 'text-embedding-ada-002',
            //     'input' => $text,
            // ]);
            //
            // if ($response->successful()) {
            //     return $response->json()['data'][0]['embedding'];
            // }
        } catch (\Exception $e) {
            Log::warning('Embedding generation failed: ' . $e->getMessage());
        }

        return $this->generateSimpleEmbedding($text);
    }

    /**
     * Calculate cosine similarity between two vectors
     * 
     * @param array $vec1
     * @param array $vec2
     * @return float
     */
    private function cosineSimilarity(array $vec1, array $vec2): float
    {
        // Ensure same dimensions
        $dim = min(count($vec1), count($vec2));
        $vec1 = array_slice($vec1, 0, $dim);
        $vec2 = array_slice($vec2, 0, $dim);

        $dotProduct = 0;
        $mag1 = 0;
        $mag2 = 0;

        for ($i = 0; $i < $dim; $i++) {
            $dotProduct += $vec1[$i] * $vec2[$i];
            $mag1 += $vec1[$i] * $vec1[$i];
            $mag2 += $vec2[$i] * $vec2[$i];
        }

        $mag1 = sqrt($mag1);
        $mag2 = sqrt($mag2);

        if ($mag1 == 0 || $mag2 == 0) {
            return 0;
        }

        return $dotProduct / ($mag1 * $mag2);
    }

    /**
     * Fallback keyword search
     * 
     * @param string $query
     * @param int $limit
     * @param array $categories
     * @return \Illuminate\Support\Collection
     */
    private function keywordSearch(string $query, int $limit, array $categories): \Illuminate\Support\Collection
    {
        $keywords = explode(' ', strtolower($query));
        
        $memoriesQuery = LongTermMemory::query();
        
        if (!empty($categories)) {
            $memoriesQuery->whereIn('category', $categories);
        }

        foreach ($keywords as $keyword) {
            $memoriesQuery->where(function ($q) use ($keyword) {
                $q->where('key', 'like', "%{$keyword}%")
                  ->orWhere('content', 'like', "%{$keyword}%")
                  ->orWhereRaw('LOWER(value::text) like ?', ["%{$keyword}%"]);
            });
        }

        return $memoriesQuery->mostRelevant($limit)->get();
    }

    /**
     * Get memories by category
     * 
     * @param string $category
     * @param int $limit
     * @return \Illuminate\Support\Collection
     */
    public function getByCategory(string $category, int $limit = 20): \Illuminate\Support\Collection
    {
        return LongTermMemory::byCategory($category)
            ->mostRelevant($limit)
            ->get();
    }

    /**
     * Update memory relevance based on usage
     * 
     * @param int $memoryId
     * @param float $boost
     * @return void
     */
    public function boostRelevance(int $memoryId, float $boost = 0.1): void
    {
        $memory = LongTermMemory::find($memoryId);
        if ($memory) {
            $memory->incrementRelevance($boost);
        }
    }

    /**
     * Clean old, unused memories
     * 
     * @param int $daysUnused
     * @return int
     */
    public function cleanOldMemories(int $daysUnused = 90): int
    {
        return LongTermMemory::where('last_accessed_at', '<', now()->subDays($daysUnused))
            ->where('relevance_score', '<', 0.5)
            ->delete();
    }

    /**
     * Get memory statistics
     * 
     * @return array
     */
    public function getStatistics(): array
    {
        return [
            'total_memories' => LongTermMemory::count(),
            'by_category' => LongTermMemory::selectRaw('category, count(*) as count')
                ->groupBy('category')
                ->get()
                ->pluck('count', 'category'),
            'recently_accessed' => LongTermMemory::recentlyAccessed(7)->count(),
            'high_relevance' => LongTermMemory::where('relevance_score', '>=', 1.0)->count(),
        ];
    }
}
