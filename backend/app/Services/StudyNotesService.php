<?php

namespace App\Services;

use App\Models\StudyNote;
use App\Models\StudyInsight;
use App\Models\StudyModule;
use App\Models\StudyTask;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StudyNotesService
{
    private $groqApiKey;
    private $groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    private $vectorMemory;

    public function __construct(VectorMemoryService $vectorMemory)
    {
        $this->groqApiKey = config('services.groq.api_key');
        $this->vectorMemory = $vectorMemory;
    }

    /**
     * Create study note
     * 
     * @param array $data
     * @return StudyNote
     */
    public function createNote(array $data): StudyNote
    {
        $note = StudyNote::create($data);

        // Auto-generate insight if it's a lesson or reflection note
        if (in_array($note->note_type, ['lesson', 'reflection'])) {
            $this->generateInsightFromNote($note);
        }

        return $note;
    }

    /**
     * Update note
     * 
     * @param StudyNote $note
     * @param array $data
     * @return StudyNote
     */
    public function updateNote(StudyNote $note, array $data): StudyNote
    {
        $note->update($data);
        
        // Regenerate insight if content changed significantly
        if (isset($data['content']) && strlen($data['content']) > 100) {
            $this->generateInsightFromNote($note);
        }

        return $note->fresh();
    }

    /**
     * Delete note
     * 
     * @param StudyNote $note
     * @return void
     */
    public function deleteNote(StudyNote $note): void
    {
        $note->delete();
    }

    /**
     * Generate AI insight from note
     * 
     * @param StudyNote $note
     * @return StudyInsight|null
     */
    public function generateInsightFromNote(StudyNote $note): ?StudyInsight
    {
        $prompt = $this->buildInsightPrompt($note);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->groqApiUrl, [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert learning coach. Analyze study notes and extract key insights, patterns, and areas needing improvement.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'temperature' => 0.7,
                'max_tokens' => 500,
            ]);

            if ($response->successful()) {
                $insightContent = $response->json()['choices'][0]['message']['content'];
                
                return $this->storeInsight($note, $insightContent);
            }

            Log::warning('Groq API failed for insight generation');
            return null;
        } catch (\Exception $e) {
            Log::error('Insight generation error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Build prompt for insight generation
     * 
     * @param StudyNote $note
     * @return string
     */
    private function buildInsightPrompt(StudyNote $note): string
    {
        $module = $note->module;
        $goal = $module->goal;

        return <<<PROMPT
Analyze this study note and provide insights:

GOAL: {$goal->name}
MODULE: {$module->title}
NOTE TYPE: {$note->note_type}

NOTE CONTENT:
{$note->content}

Provide:
1. Key learnings (2-3 points)
2. Understanding level (beginner/intermediate/advanced)
3. Potential difficulties or weak areas
4. Suggested next steps
5. Related topics to explore

Keep your response concise (3-5 sentences).
PROMPT;
    }

    /**
     * Store insight with vector embedding
     * 
     * @param StudyNote $note
     * @param string $content
     * @return StudyInsight
     */
    private function storeInsight(StudyNote $note, string $content): StudyInsight
    {
        $module = $note->module;
        $goal = $module->goal;

        // Generate embedding for vector search
        $embedding = $this->vectorMemory->generateSimpleEmbedding($content);

        $insight = StudyInsight::create([
            'related_goal_id' => $goal->id,
            'related_module_id' => $module->id,
            'related_task_id' => $note->task_id,
            'content' => $content,
            'embedding_vector' => $embedding,
        ]);

        // Also store in vector memory for cross-referencing
        $this->vectorMemory->store(
            "study_insight_{$insight->id}",
            $content,
            'insights',
            $content,
            [
                'goal_id' => $goal->id,
                'module_id' => $module->id,
                'source' => 'study_note',
            ]
        );

        return $insight;
    }

    /**
     * Get notes for module
     * 
     * @param StudyModule $module
     * @param string|null $type
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getNotesForModule(StudyModule $module, ?string $type = null)
    {
        $query = $module->notes();

        if ($type) {
            $query->byType($type);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get notes for task
     * 
     * @param StudyTask $task
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getNotesForTask(StudyTask $task)
    {
        return $task->notes()->orderBy('created_at', 'desc')->get();
    }

    /**
     * Search notes by content
     * 
     * @param string $query
     * @param int $limit
     * @return array
     */
    public function searchNotes(string $query, int $limit = 10): array
    {
        $notes = StudyNote::where('content', 'ILIKE', "%{$query}%")
            ->with(['module.goal', 'task'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $notes->map(function($note) {
            return [
                'id' => $note->id,
                'content' => $note->content,
                'note_type' => $note->note_type,
                'goal_name' => $note->module->goal->name,
                'module_name' => $note->module->title,
                'task_name' => $note->task ? $note->task->title : null,
                'created_at' => $note->created_at->toISOString(),
            ];
        })->toArray();
    }

    /**
     * Get insights for module
     * 
     * @param StudyModule $module
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getInsightsForModule(StudyModule $module)
    {
        return StudyInsight::forModule($module->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get recent insights across all goals
     * 
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRecentInsights(int $limit = 10)
    {
        return StudyInsight::with(['goal', 'module', 'task'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Find similar insights using vector search
     * 
     * @param string $query
     * @param int $limit
     * @return array
     */
    public function findSimilarInsights(string $query, int $limit = 5): array
    {
        // Use vector memory to find similar insights
        return $this->vectorMemory->search($query, $limit, ['insights']);
    }
}
