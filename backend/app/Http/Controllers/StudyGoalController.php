<?php

namespace App\Http\Controllers;

use App\Models\StudyGoal;
use App\Services\StudyPlanService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudyGoalController extends Controller
{
    /**
     * Get all study goals
     */
    public function index()
    {
        $goals = StudyGoal::where('user_id', $this->getUserId())
            ->orderBy('deadline', 'asc')
            ->get();
        return response()->json($goals);
    }

    /**
     * Create a new study goal
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'progress' => 'required|integer|min:0|max:100',
            'deadline' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $this->getUserId();
        $goal = StudyGoal::create($data);

        return response()->json($goal, 201);
    }

    /**
     * Update a study goal
     */
    public function update(Request $request, StudyGoal $studyGoal)
    {
        if ($studyGoal->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'progress' => 'integer|min:0|max:100',
            'deadline' => 'date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $studyGoal->update($validator->validated());

        return response()->json($studyGoal);
    }

    /**
     * Delete a study goal
     */
    public function destroy(StudyGoal $studyGoal)
    {
        if ($studyGoal->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $studyGoal->delete();
        return response()->json(['message' => 'Study goal deleted successfully']);
    }

    /**
     * Generate AI-powered weekly study plan
     */
    public function generatePlan(StudyGoal $studyGoal)
    {
        $studyPlanService = new StudyPlanService();
        $plan = $studyPlanService->generateWeeklyPlan($studyGoal);

        // Save the plan to database
        $studyGoal->update([
            'weekly_plan' => $plan['weekly_plan'],
        ]);

        return response()->json($plan);
    }

    /**
     * Get weekly study plan
     */
    public function getWeeklyPlan(StudyGoal $studyGoal)
    {
        if (!$studyGoal->hasPlan()) {
            return response()->json([
                'message' => 'No plan generated yet. Please generate a plan first.',
                'has_plan' => false
            ]);
        }

        return response()->json([
            'weekly_plan' => $studyGoal->weekly_plan,
            'has_plan' => true
        ]);
    }

    /**
     * Update chapter completion status
     */
    public function updateChapter(Request $request, StudyGoal $studyGoal)
    {
        $validator = Validator::make($request->all(), [
            'chapter_index' => 'required|integer',
            'completed' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $chapters = $studyGoal->chapters ?? [];
        $index = $request->chapter_index;

        if (isset($chapters[$index])) {
            $chapters[$index]['completed'] = $request->completed;
            $studyGoal->chapters = $chapters;
            
            // Auto-update progress based on completed chapters
            $studyGoal->progress = $studyGoal->calculateProgress();
            $studyGoal->save();

            return response()->json([
                'message' => 'Chapter updated successfully',
                'progress' => $studyGoal->progress,
                'chapters' => $studyGoal->chapters
            ]);
        }

        return response()->json(['error' => 'Chapter not found'], 404);
    }

    /**
     * Evaluate current study progress
     */
    public function evaluateProgress(StudyGoal $studyGoal)
    {
        if ($studyGoal->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $studyPlanService = new StudyPlanService();
        $evaluation = $studyPlanService->evaluateProgress($studyGoal);

        // Save AI feedback
        if (isset($evaluation['ai_feedback'])) {
            $studyGoal->update(['ai_feedback' => $evaluation['ai_feedback']]);
        }

        return response()->json($evaluation);
    }

    /**
     * Get daily study suggestions
     */
    public function dailySuggestions(StudyGoal $studyGoal)
    {
        if ($studyGoal->user_id !== $this->getUserId()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $studyPlanService = new StudyPlanService();
        $suggestions = $studyPlanService->suggestDailyStudy($studyGoal);

        return response()->json($suggestions);
    }

    /**
     * Get current user ID for multi-tenancy
     */
    private function getUserId(): int
    {
        return auth()->id() ?? 1;
    }
}
