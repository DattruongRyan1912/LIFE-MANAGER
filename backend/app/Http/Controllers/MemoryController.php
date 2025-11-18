<?php

namespace App\Http\Controllers;

use App\Models\DailyLog;
use App\Models\LongTermMemory;
use App\Services\VectorMemoryService;
use App\Services\UserPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemoryController extends Controller
{
    protected $vectorMemory;
    protected $userPreference;
    
    public function __construct(VectorMemoryService $vectorMemory, UserPreferenceService $userPreference)
    {
        $this->vectorMemory = $vectorMemory;
        $this->userPreference = $userPreference;
    }

    /**
     * Get recent daily logs (last 7 days)
     */
    public function getDailyLogs(): JsonResponse
    {
        $logs = DailyLog::orderBy('date', 'desc')
            ->take(7)
            ->get();

        return response()->json($logs);
    }

    /**
     * Get all long-term memories
     */
    public function getLongTermMemories(): JsonResponse
    {
        $memories = LongTermMemory::all();

        return response()->json($memories);
    }

    /**
     * Get specific memory by key
     */
    public function getMemoryByKey(string $key): JsonResponse
    {
        $memory = LongTermMemory::where('key', $key)->first();

        if (!$memory) {
            return response()->json(['message' => 'Memory not found'], 404);
        }

        return response()->json($memory);
    }
    
    /**
     * Store vector memory (AI 2.0)
     * POST /memory/vector/store
     */
    public function storeVectorMemory(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string|max:255',
            'value' => 'required',
            'category' => 'required|string|in:preferences,habits,goals,insights,conversations,general',
            'content' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);
        
        $success = $this->vectorMemory->store(
            $request->key,
            $request->value,
            $request->category,
            $request->content ?? json_encode($request->value),
            $request->metadata ?? []
        );
        
        if ($success) {
            return response()->json([
                'message' => 'Memory stored successfully',
                'key' => $request->key,
            ], 201);
        }
        
        return response()->json(['error' => 'Failed to store memory'], 500);
    }
    
    /**
     * Search vector memory (AI 2.0)
     * POST /memory/vector/search
     */
    public function searchVectorMemory(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|max:500',
            'limit' => 'nullable|integer|min:1|max:50',
            'categories' => 'nullable|array',
        ]);
        
        $results = $this->vectorMemory->search(
            $request->query,
            $request->limit ?? 10,
            $request->categories
        );
        
        return response()->json([
            'query' => $request->query,
            'count' => count($results),
            'results' => $results,
        ]);
    }
    
    /**
     * Get memory statistics (AI 2.0)
     * GET /memory/statistics
     */
    public function getMemoryStatistics(): JsonResponse
    {
        $stats = $this->vectorMemory->getStatistics();
        
        return response()->json($stats);
    }
    
    /**
     * Get memories by category (AI 2.0)
     * GET /memory/by-category/{category}
     */
    public function getMemoriesByCategory(string $category): JsonResponse
    {
        $validCategories = ['preferences', 'habits', 'goals', 'insights', 'conversations', 'general'];
        
        if (!in_array($category, $validCategories)) {
            return response()->json(['error' => 'Invalid category'], 400);
        }
        
        $memories = $this->vectorMemory->getByCategory($category, 50);
        
        return response()->json([
            'category' => $category,
            'count' => count($memories),
            'memories' => $memories,
        ]);
    }
    
    /**
     * Clean old memories (AI 2.0)
     * DELETE /memory/clean-old
     */
    public function cleanOldMemories(Request $request): JsonResponse
    {
        $daysUnused = $request->input('days_unused', 90);
        
        $deletedCount = $this->vectorMemory->cleanOldMemories($daysUnused);
        
        return response()->json([
            'message' => "Cleaned {$deletedCount} old memories",
            'deleted_count' => $deletedCount,
        ]);
    }
    
    /**
     * Get user insights (AI 2.0)
     * GET /preferences/insights
     */
    public function getUserInsights(): JsonResponse
    {
        $insights = $this->userPreference->getInsightsSummary();
        
        return response()->json($insights);
    }
    
    /**
     * Detect user preferences (AI 2.0)
     * GET /preferences/detect
     */
    public function detectPreferences(): JsonResponse
    {
        $preferences = $this->userPreference->detectPreferences();
        
        return response()->json([
            'preferences' => $preferences,
            'detected_at' => now()->toISOString(),
        ]);
    }
    
    /**
     * Update user preference (AI 2.0)
     * POST /preferences/update
     */
    public function updatePreference(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'required',
        ]);
        
        $success = $this->vectorMemory->store(
            "preference_{$request->key}",
            $request->value,
            'preferences',
            "{$request->key}: " . json_encode($request->value),
            ['manually_set' => true]
        );
        
        if ($success) {
            return response()->json([
                'message' => 'Preference updated successfully',
                'key' => $request->key,
            ]);
        }
        
        return response()->json(['error' => 'Failed to update preference'], 500);
    }
}
