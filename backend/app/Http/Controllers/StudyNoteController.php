<?php

namespace App\Http\Controllers;

use App\Models\StudyModule;
use App\Models\StudyTask;
use App\Models\StudyNote;
use App\Services\StudyNotesService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudyNoteController extends Controller
{
    private $notesService;

    public function __construct(StudyNotesService $notesService)
    {
        $this->notesService = $notesService;
    }

    /**
     * Get current user ID (default to 1 if not authenticated)
     */
    private function getCurrentUserId(): int
    {
        return auth()->id() ?? 1;
    }

    /**
     * Get notes for module
     * 
     * @param int $moduleId
     * @return JsonResponse
     */
    public function index(int $moduleId): JsonResponse
    {
        $module = StudyModule::findOrFail($moduleId);

        // Check authorization (TEMPORARY: Disabled for development)
        // if ($module->goal->user_id !== $this->getCurrentUserId()) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        $noteType = request()->query('type');
        $notes = $this->notesService->getNotesForModule($module, $noteType);

        return response()->json([
            'success' => true,
            'data' => $notes->map(function($note) {
                return [
                    'id' => $note->id,
                    'content' => $note->content,
                    'note_type' => $note->note_type,
                    'task_id' => $note->task_id,
                    'task_title' => $note->task ? $note->task->title : null,
                    'created_at' => $note->created_at->toISOString(),
                    'updated_at' => $note->updated_at->toISOString(),
                ];
            }),
        ]);
    }

    /**
     * Get single note
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $note = StudyNote::with(['module.goal', 'task'])->findOrFail($id);

        // Check authorization (TEMPORARY: Disabled for development)
        // if ($note->module->goal->user_id !== $this->getCurrentUserId()) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $note->id,
                'module_id' => $note->module_id,
                'module_name' => $note->module->title,
                'task_id' => $note->task_id,
                'task_title' => $note->task ? $note->task->title : null,
                'content' => $note->content,
                'note_type' => $note->note_type,
                'created_at' => $note->created_at->toISOString(),
                'updated_at' => $note->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Create new note
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:study_modules,id',
            'task_id' => 'nullable|exists:study_tasks,id',
            'content' => 'required|string|min:10',
            'note_type' => 'required|in:lesson,reflection,insight',
        ]);

        $module = StudyModule::findOrFail($validated['module_id']);

        // Check authorization (TEMPORARY: Disabled for development)
        // $userId = $this->getCurrentUserId() ?? 1;
        // if ($module->goal->user_id !== $userId) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        // Verify task belongs to module if provided
        if (isset($validated['task_id'])) {
            $task = StudyTask::findOrFail($validated['task_id']);
            if ($task->module_id !== $module->id) {
                return response()->json([
                    'error' => 'Task does not belong to the specified module',
                ], 400);
            }
        }

        $note = $this->notesService->createNote($validated);

        return response()->json([
            'success' => true,
            'message' => 'Note created successfully',
            'data' => [
                'id' => $note->id,
                'content' => $note->content,
                'note_type' => $note->note_type,
                'created_at' => $note->created_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * Update note
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $note = StudyNote::findOrFail($id);

        // Check authorization (TEMPORARY: Disabled for development)
        // if ($note->module->goal->user_id !== $this->getCurrentUserId()) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        $validated = $request->validate([
            'content' => 'sometimes|string|min:10',
            'note_type' => 'sometimes|in:lesson,reflection,insight',
        ]);

        $updatedNote = $this->notesService->updateNote($note, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Note updated successfully',
            'data' => [
                'id' => $updatedNote->id,
                'content' => $updatedNote->content,
                'note_type' => $updatedNote->note_type,
                'updated_at' => $updatedNote->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Delete note
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $note = StudyNote::findOrFail($id);

        // Check authorization (TEMPORARY: Disabled for development)
        // if ($note->module->goal->user_id !== $this->getCurrentUserId()) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        $this->notesService->deleteNote($note);

        return response()->json([
            'success' => true,
            'message' => 'Note deleted successfully',
        ]);
    }

    /**
     * Get insights for module
     * 
     * @param int $moduleId
     * @return JsonResponse
     */
    public function getInsights(int $moduleId): JsonResponse
    {
        $module = StudyModule::findOrFail($moduleId);

        // Check authorization (TEMPORARY: Disabled for development)
        // if ($module->goal->user_id !== $this->getCurrentUserId()) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        $insights = $this->notesService->getInsightsForModule($module);

        return response()->json([
            'success' => true,
            'data' => $insights->map(fn($insight) => [
                'id' => $insight->id,
                'content' => $insight->content,
                'related_task_id' => $insight->related_task_id,
                'created_at' => $insight->created_at->toISOString(),
            ]),
        ]);
    }

    /**
     * Search notes
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:3',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $limit = $validated['limit'] ?? 10;
        $results = $this->notesService->searchNotes($validated['query'], $limit);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Find similar insights using vector search
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function findSimilarInsights(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:10',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        $limit = $validated['limit'] ?? 5;
        $similar = $this->notesService->findSimilarInsights($validated['query'], $limit);

        return response()->json([
            'success' => true,
            'data' => $similar,
        ]);
    }
}
