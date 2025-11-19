<?php

namespace App\Services;

use App\Models\StudyGoal;
use App\Models\StudyModule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StudyModuleService
{
    private $groqApiKey;
    private $groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    public function __construct()
    {
        $this->groqApiKey = config('services.groq.api_key');
    }

    /**
     * Generate modules from goal using AI
     * 
     * @param StudyGoal $goal
     * @return array
     */
    public function generateModulesFromGoal(StudyGoal $goal): array
    {
        $prompt = $this->buildModuleGenerationPrompt($goal);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->groqApiUrl, [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert learning curriculum designer. Break down learning goals into structured modules with clear learning objectives.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'temperature' => 0.7,
                'max_tokens' => 2000,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'];
                return $this->parseModulesFromAI($content);
            }

            Log::warning('Groq API failed for module generation', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->generateFallbackModules($goal);
        } catch (\Exception $e) {
            Log::error('Module generation error: ' . $e->getMessage());
            return $this->generateFallbackModules($goal);
        }
    }

    /**
     * Build prompt for AI module generation
     * 
     * @param StudyGoal $goal
     * @return string
     */
    private function buildModuleGenerationPrompt(StudyGoal $goal): string
    {
        $deadline = $goal->deadline->format('Y-m-d');
        $daysRemaining = now()->diffInDays($goal->deadline);
        $studyType = $goal->study_type ?? 'general';

        return <<<PROMPT
Break down this learning goal into 4-8 structured modules:

GOAL: {$goal->name}
TYPE: {$studyType}
DEADLINE: {$deadline} ({$daysRemaining} days remaining)
DESCRIPTION: {$goal->description}

For each module, provide:
1. Title (concise, specific)
2. Description (what will be learned)
3. Estimated hours needed
4. Learning objectives (3-5 points)

Format your response as JSON array:
[
  {
    "title": "Module title",
    "description": "What you'll learn",
    "estimated_hours": 10,
    "objectives": ["Objective 1", "Objective 2", "Objective 3"]
  }
]

Order modules from foundational to advanced. Make sure total estimated hours fit within the deadline.
PROMPT;
    }

    /**
     * Parse AI response into module array
     * 
     * @param string $content
     * @return array
     */
    private function parseModulesFromAI(string $content): array
    {
        // Try to extract JSON from response
        if (preg_match('/\[[\s\S]*\]/', $content, $matches)) {
            $json = $matches[0];
            $modules = json_decode($json, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($modules)) {
                return $modules;
            }
        }

        // Fallback parsing
        return [];
    }

    /**
     * Generate fallback modules when AI fails
     * 
     * @param StudyGoal $goal
     * @return array
     */
    private function generateFallbackModules(StudyGoal $goal): array
    {
        $studyType = $goal->study_type ?? 'general';
        $totalChapters = $goal->total_chapters ?? 10;

        $modulesPerType = [
            'language' => [
                ['title' => 'Fundamentals & Pronunciation', 'description' => 'Basic grammar and pronunciation rules', 'estimated_hours' => 15],
                ['title' => 'Vocabulary Building', 'description' => 'Essential words and phrases', 'estimated_hours' => 20],
                ['title' => 'Grammar & Sentence Structure', 'description' => 'Grammar rules and practice', 'estimated_hours' => 25],
                ['title' => 'Listening & Speaking', 'description' => 'Conversational practice', 'estimated_hours' => 20],
                ['title' => 'Reading & Writing', 'description' => 'Text comprehension and composition', 'estimated_hours' => 20],
            ],
            'technical' => [
                ['title' => 'Introduction & Setup', 'description' => 'Environment and basic concepts', 'estimated_hours' => 8],
                ['title' => 'Core Concepts', 'description' => 'Fundamental principles and syntax', 'estimated_hours' => 15],
                ['title' => 'Intermediate Topics', 'description' => 'Advanced features and patterns', 'estimated_hours' => 20],
                ['title' => 'Practical Projects', 'description' => 'Hands-on implementation', 'estimated_hours' => 25],
                ['title' => 'Best Practices & Optimization', 'description' => 'Professional techniques', 'estimated_hours' => 12],
            ],
            'certification' => [
                ['title' => 'Exam Overview & Strategy', 'description' => 'Understanding exam structure', 'estimated_hours' => 5],
                ['title' => 'Core Topics Study', 'description' => 'Main exam content areas', 'estimated_hours' => 30],
                ['title' => 'Practice Questions', 'description' => 'Sample questions and exercises', 'estimated_hours' => 20],
                ['title' => 'Mock Exams', 'description' => 'Full practice tests', 'estimated_hours' => 15],
                ['title' => 'Review & Weak Areas', 'description' => 'Final preparation', 'estimated_hours' => 10],
            ],
        ];

        return $modulesPerType[$studyType] ?? [
            ['title' => 'Introduction', 'description' => 'Getting started', 'estimated_hours' => 10],
            ['title' => 'Foundation', 'description' => 'Core concepts', 'estimated_hours' => 15],
            ['title' => 'Intermediate', 'description' => 'Building skills', 'estimated_hours' => 20],
            ['title' => 'Advanced', 'description' => 'Mastery level', 'estimated_hours' => 15],
        ];
    }

    /**
     * Create modules for a goal
     * 
     * @param StudyGoal $goal
     * @param array $modulesData
     * @return void
     */
    public function createModulesForGoal(StudyGoal $goal, array $modulesData): void
    {
        foreach ($modulesData as $index => $moduleData) {
            StudyModule::create([
                'goal_id' => $goal->id,
                'title' => $moduleData['title'],
                'description' => $moduleData['description'] ?? null,
                'order_index' => $index,
                'estimated_hours' => $moduleData['estimated_hours'] ?? 10,
                'progress' => 0,
            ]);
        }
    }

    /**
     * Update module
     * 
     * @param StudyModule $module
     * @param array $data
     * @return StudyModule
     */
    public function updateModule(StudyModule $module, array $data): StudyModule
    {
        $module->update($data);
        return $module->fresh();
    }

    /**
     * Delete module and update order
     * 
     * @param StudyModule $module
     * @return void
     */
    public function deleteModule(StudyModule $module): void
    {
        $goalId = $module->goal_id;
        $deletedIndex = $module->order_index;

        $module->delete();

        // Update order indices
        StudyModule::where('goal_id', $goalId)
            ->where('order_index', '>', $deletedIndex)
            ->decrement('order_index');
    }

    /**
     * Reorder modules
     * 
     * @param StudyGoal $goal
     * @param array $moduleIds
     * @return void
     */
    public function reorderModules(StudyGoal $goal, array $moduleIds): void
    {
        foreach ($moduleIds as $index => $moduleId) {
            StudyModule::where('id', $moduleId)
                ->where('goal_id', $goal->id)
                ->update(['order_index' => $index]);
        }
    }

    /**
     * Get module with related data
     * 
     * @param int $moduleId
     * @return StudyModule|null
     */
    public function getModuleWithDetails(int $moduleId): ?StudyModule
    {
        return StudyModule::with(['tasks', 'notes', 'resources', 'insights'])
            ->find($moduleId);
    }
}
