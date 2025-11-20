<?php

namespace App\Http\Controllers;

use App\Models\TaskLabel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LabelController extends Controller
{
    /**
     * Get user_id from authenticated user or request
     */
    private function getUserId(Request $request)
    {
        return Auth::id() ?? $request->input('user_id', 1);
    }

    /**
     * Get all labels for the current user
     */
    public function index(Request $request)
    {
        $userId = $this->getUserId($request);

        $labels = TaskLabel::where('user_id', $userId)
            ->orderBy('name')
            ->get();

        return response()->json($labels);
    }

    /**
     * Create a new label
     */
    public function store(Request $request)
    {
        $userId = $this->getUserId($request);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if label with same name already exists for this user
        $exists = TaskLabel::where('user_id', $userId)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Label with this name already exists'
            ], 409);
        }

        $label = TaskLabel::create([
            'user_id' => $userId,
            'name' => $request->name,
            'color' => $request->color,
        ]);

        return response()->json($label, 201);
    }

    /**
     * Update a label
     */
    public function update(Request $request, $id)
    {
        $userId = $this->getUserId($request);

        $label = TaskLabel::where('user_id', $userId)->find($id);

        if (!$label) {
            return response()->json(['message' => 'Label not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:50',
            'color' => 'sometimes|required|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check name uniqueness if name is being updated
        if ($request->has('name') && $request->name !== $label->name) {
            $exists = TaskLabel::where('user_id', $userId)
                ->where('name', $request->name)
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Label with this name already exists'
                ], 409);
            }
        }

        $label->update($request->only(['name', 'color']));

        return response()->json($label);
    }

    /**
     * Delete a label
     */
    public function destroy(Request $request, $id)
    {
        $userId = $this->getUserId($request);

        $label = TaskLabel::where('user_id', $userId)->find($id);

        if (!$label) {
            return response()->json(['message' => 'Label not found'], 404);
        }

        // Detach from all tasks before deleting
        $label->tasks()->detach();

        $label->delete();

        return response()->json(['message' => 'Label deleted successfully']);
    }

    /**
     * Get tasks for a specific label
     */
    public function getTasks(Request $request, $id)
    {
        $userId = $this->getUserId($request);

        $label = TaskLabel::where('user_id', $userId)->find($id);

        if (!$label) {
            return response()->json(['message' => 'Label not found'], 404);
        }

        $tasks = $label->tasks()
            ->where('user_id', $userId)
            ->with(['labels', 'dependencies', 'blockedBy', 'subtasks'])
            ->get();

        return response()->json([
            'label' => $label,
            'tasks' => $tasks,
            'count' => $tasks->count()
        ]);
    }
}
