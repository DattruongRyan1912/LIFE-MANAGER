<?php

namespace App\Http\Controllers;

use App\Models\DailyLog;
use App\Models\LongTermMemory;
use Illuminate\Http\JsonResponse;

class MemoryController extends Controller
{
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
}
