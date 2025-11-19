<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\StudyGoalController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\MemoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StudyModuleController;
use App\Http\Controllers\StudyTaskController;
use App\Http\Controllers\StudyNoteController;
use App\Http\Controllers\StudyRecommendationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Dashboard
Route::get('/dashboard/summary', [DashboardController::class, 'getSummary']);

// Tasks
Route::get('/tasks/today', [TaskController::class, 'today']);
Route::get('/tasks/timeline', [TaskController::class, 'timeline']);
Route::post('/tasks/timeline/reorder', [TaskController::class, 'updateTimelineOrder']);
Route::post('/tasks/pomodoro/suggest', [TaskController::class, 'suggestPomodoro']);
Route::post('/tasks/{task}/pomodoro/complete', [TaskController::class, 'completePomodoroSession']);
Route::patch('/tasks/{task}/toggle', [TaskController::class, 'toggle']);

// Task v3 - Kanban, Calendar, Subtasks
Route::get('/tasks/kanban', [TaskController::class, 'kanban']);
Route::get('/tasks/calendar', [TaskController::class, 'calendar']);
Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
Route::patch('/tasks/{task}/calendar-move', [TaskController::class, 'calendarMove']);
Route::post('/tasks/{task}/subtasks', [TaskController::class, 'createSubtask']);

Route::apiResource('tasks', TaskController::class);

// Expenses
Route::get('/expenses/7days', [ExpenseController::class, 'last7Days']);
Route::get('/expenses/forecast', [ExpenseController::class, 'forecast']);
Route::get('/expenses/category-insights', [ExpenseController::class, 'categoryInsights']);
Route::apiResource('expenses', ExpenseController::class);

// Study Goals
Route::apiResource('study-goals', StudyGoalController::class);
Route::post('/study-goals/{studyGoal}/generate-plan', [StudyGoalController::class, 'generatePlan']);
Route::get('/study-goals/{studyGoal}/weekly-plan', [StudyGoalController::class, 'getWeeklyPlan']);
Route::post('/study-goals/{studyGoal}/update-chapter', [StudyGoalController::class, 'updateChapter']);
Route::get('/study-goals/{studyGoal}/evaluate', [StudyGoalController::class, 'evaluateProgress']);
Route::get('/study-goals/{studyGoal}/daily-suggestions', [StudyGoalController::class, 'dailySuggestions']);

// AI Assistant
Route::post('/assistant/chat', [AssistantController::class, 'chat']);
Route::get('/assistant/daily-plan', [AssistantController::class, 'dailyPlan']);
Route::get('/assistant/daily-summary', [AssistantController::class, 'dailySummary']);

// Memory System (Legacy)
Route::get('/memories/daily-logs', [MemoryController::class, 'getDailyLogs']);
Route::get('/memories/long-term', [MemoryController::class, 'getLongTermMemories']);
Route::get('/memories/long-term/{key}', [MemoryController::class, 'getMemoryByKey']);

// Vector Memory & Preferences (AI 2.0)
Route::prefix('memory')->group(function () {
    Route::post('/vector/store', [MemoryController::class, 'storeVectorMemory']);
    Route::post('/vector/search', [MemoryController::class, 'searchVectorMemory']);
    Route::get('/statistics', [MemoryController::class, 'getMemoryStatistics']);
    Route::get('/by-category/{category}', [MemoryController::class, 'getMemoriesByCategory']);
    Route::delete('/clean-old', [MemoryController::class, 'cleanOldMemories']);
});

Route::prefix('preferences')->group(function () {
    Route::get('/insights', [MemoryController::class, 'getUserInsights']);
    Route::get('/detect', [MemoryController::class, 'detectPreferences']);
    Route::post('/update', [MemoryController::class, 'updatePreference']);
});

// Study 3.0 - Modules
Route::prefix('study-goals/{goalId}')->group(function () {
    Route::get('/modules', [StudyModuleController::class, 'index']);
    Route::post('/generate-modules', [StudyModuleController::class, 'generateModules']);
    Route::post('/reorder-modules', [StudyModuleController::class, 'reorder']);
});

Route::prefix('study-modules')->group(function () {
    Route::get('/{id}', [StudyModuleController::class, 'show']);
    Route::post('/', [StudyModuleController::class, 'store']);
    Route::put('/{id}', [StudyModuleController::class, 'update']);
    Route::delete('/{id}', [StudyModuleController::class, 'destroy']);
});

// Study 3.0 - Tasks
Route::prefix('study-modules/{moduleId}')->group(function () {
    Route::get('/tasks', [StudyTaskController::class, 'index']);
    Route::post('/generate-tasks', [StudyTaskController::class, 'generateTasks']);
    Route::get('/tasks/pending', [StudyTaskController::class, 'getPending']);
    Route::get('/tasks/overdue', [StudyTaskController::class, 'getOverdue']);
});

Route::prefix('study-tasks')->group(function () {
    Route::get('/{id}', [StudyTaskController::class, 'show']);
    Route::post('/', [StudyTaskController::class, 'store']);
    Route::put('/{id}', [StudyTaskController::class, 'update']);
    Route::delete('/{id}', [StudyTaskController::class, 'destroy']);
    Route::post('/{id}/toggle', [StudyTaskController::class, 'toggleCompletion']);
    Route::post('/{id}/reschedule', [StudyTaskController::class, 'reschedule']);
    Route::post('/bulk-priority', [StudyTaskController::class, 'bulkUpdatePriority']);
});

// Study 3.0 - Notes
Route::prefix('study-modules/{moduleId}')->group(function () {
    Route::get('/notes', [StudyNoteController::class, 'index']);
    Route::get('/insights', [StudyNoteController::class, 'getInsights']);
});

Route::prefix('study-notes')->group(function () {
    Route::get('/{id}', [StudyNoteController::class, 'show']);
    Route::post('/', [StudyNoteController::class, 'store']);
    Route::put('/{id}', [StudyNoteController::class, 'update']);
    Route::delete('/{id}', [StudyNoteController::class, 'destroy']);
    Route::post('/search', [StudyNoteController::class, 'search']);
    Route::post('/similar-insights', [StudyNoteController::class, 'findSimilarInsights']);
});

// Study 3.0 - Recommendations
Route::prefix('study')->group(function () {
    Route::get('/daily-plan', [StudyRecommendationController::class, 'getDailyPlan']);
    Route::get('/goals-overview', [StudyRecommendationController::class, 'getGoalsOverview']);
    Route::get('/statistics', [StudyRecommendationController::class, 'getStatistics']);
});

Route::prefix('study-modules/{moduleId}')->group(function () {
    Route::get('/resources', [StudyRecommendationController::class, 'getResourceSuggestions']);
});

Route::prefix('study-goals/{goalId}')->group(function () {
    Route::get('/weaknesses', [StudyRecommendationController::class, 'getWeaknesses']);
});
