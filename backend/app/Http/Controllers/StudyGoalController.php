<?php

namespace App\Http\Controllers;

use App\Models\StudyGoal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudyGoalController extends Controller
{
    /**
     * Get all study goals
     */
    public function index()
    {
        $goals = StudyGoal::orderBy('deadline', 'asc')->get();
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

        $goal = StudyGoal::create($validator->validated());

        return response()->json($goal, 201);
    }

    /**
     * Update a study goal
     */
    public function update(Request $request, StudyGoal $studyGoal)
    {
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
        $studyGoal->delete();
        return response()->json(['message' => 'Study goal deleted successfully']);
    }
}
