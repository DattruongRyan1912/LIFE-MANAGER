<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\ExpenseForecastService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ExpenseController extends Controller
{
    /**
     * Get expenses from last 7 days
     */
    public function last7Days()
    {
        $expenses = Expense::whereBetween('spent_at', [
            Carbon::now()->subDays(7),
            Carbon::now()
        ])
        ->orderBy('spent_at', 'desc')
        ->get();

        return response()->json($expenses);
    }

    /**
     * Get all expenses
     */
    public function index()
    {
        $expenses = Expense::orderBy('spent_at', 'desc')->get();
        return response()->json($expenses);
    }

    /**
     * Create a new expense
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|integer|min:0',
            'category' => 'required|string|max:255',
            'note' => 'nullable|string',
            'spent_at' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $expense = Expense::create($validator->validated());

        return response()->json($expense, 201);
    }

    /**
     * Update an expense
     */
    public function update(Request $request, Expense $expense)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'integer|min:0',
            'category' => 'string|max:255',
            'note' => 'nullable|string',
            'spent_at' => 'date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $expense->update($validator->validated());

        return response()->json($expense);
    }

    /**
     * Delete an expense
     */
    public function destroy(Expense $expense)
    {
        $expense->delete();
        return response()->json(['message' => 'Expense deleted successfully']);
    }

    /**
     * Get expense forecast (AI-powered)
     */
    public function forecast(Request $request)
    {
        $daysAhead = $request->input('days', 7);
        
        $forecastService = new ExpenseForecastService();
        $forecast = $forecastService->getForecast($daysAhead);
        
        return response()->json($forecast);
    }

    /**
     * Get category insights
     */
    public function categoryInsights()
    {
        $forecastService = new ExpenseForecastService();
        $insights = $forecastService->getCategoryInsights();
        
        return response()->json($insights);
    }
}
