<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\StudyGoalController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\MemoryController;
use App\Http\Controllers\DashboardController;

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
Route::apiResource('tasks', TaskController::class);

// Expenses
Route::get('/expenses/7days', [ExpenseController::class, 'last7Days']);
Route::get('/expenses/forecast', [ExpenseController::class, 'forecast']);
Route::get('/expenses/category-insights', [ExpenseController::class, 'categoryInsights']);
Route::apiResource('expenses', ExpenseController::class);

// Study Goals
Route::apiResource('study-goals', StudyGoalController::class);

// AI Assistant
Route::post('/assistant/chat', [AssistantController::class, 'chat']);
Route::get('/assistant/daily-plan', [AssistantController::class, 'dailyPlan']);
Route::get('/assistant/daily-summary', [AssistantController::class, 'dailySummary']);

// Memory System
Route::get('/memories/daily-logs', [MemoryController::class, 'getDailyLogs']);
Route::get('/memories/long-term', [MemoryController::class, 'getLongTermMemories']);
Route::get('/memories/long-term/{key}', [MemoryController::class, 'getMemoryByKey']);
