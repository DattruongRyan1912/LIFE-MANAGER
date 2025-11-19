# Authentication Implementation Plan

## Mục tiêu
Chuẩn bị hệ thống để có authentication, cho phép quản lí dữ liệu theo từng user.

---

## Phase 1: Database Schema Updates

### 1.1 Add user_id to tables

Cần tạo migrations để add `user_id` foreign key:

```
Tables cần update:
- expenses → user_id
- tasks → user_id  
- study_goals → user_id
- daily_logs → user_id
- memories/long_term_memory → user_id
- study_notes → user_id (through module.goal.user_id)
```

**Command tạo migrations:**
```bash
php artisan make:migration add_user_id_to_expenses_table
php artisan make:migration add_user_id_to_tasks_table
php artisan make:migration add_user_id_to_study_goals_table
php artisan make:migration add_user_id_to_daily_logs_table
php artisan make:migration add_user_id_to_long_term_memory_table
```

---

## Phase 2: Model Updates

### 2.1 Update Models

**Expense.php:**
```php
protected $fillable = [
    'user_id',      // ADD
    'amount',
    'category',
    'note',
    'spent_at',
];

public function user()
{
    return $this->belongsTo(User::class);
}
```

**Task.php:**
```php
protected $fillable = [
    'user_id',      // ADD
    'title',
    // ... rest of fields
];

public function user()
{
    return $this->belongsTo(User::class);
}
```

**StudyGoal.php:**
```php
protected $fillable = [
    'user_id',      // ADD
    'name',
    // ... rest of fields
];

public function user()
{
    return $this->belongsTo(User::class);
}
```

---

## Phase 3: Controller Updates

### 3.1 Base Controller with Auth Helper

Create `BaseController.php`:
```php
<?php

namespace App\Http\Controllers;

class BaseController extends Controller
{
    /**
     * Get authenticated user ID
     */
    protected function getUserId(): int
    {
        return auth()->id() ?? 1; // Fallback for development
    }

    /**
     * Check if user owns resource
     */
    protected function checkOwnership($model, $userIdField = 'user_id'): bool
    {
        if (!auth()->check()) return false;
        return $model->{$userIdField} === $this->getUserId();
    }
}
```

### 3.2 Controllers to Update

**ExpenseController:**
```php
public function index()
{
    $expenses = Expense::where('user_id', $this->getUserId())
        ->orderBy('spent_at', 'desc')
        ->get();
    return response()->json($expenses);
}

public function store(Request $request)
{
    $validated = $request->validate([
        'amount' => 'required|integer|min:0',
        'category' => 'required|string',
        'note' => 'nullable|string',
        'spent_at' => 'required|date',
    ]);

    $validated['user_id'] = $this->getUserId();
    $expense = Expense::create($validated);

    return response()->json($expense, 201);
}

public function destroy(Expense $expense)
{
    if (!$this->checkOwnership($expense)) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    $expense->delete();
    return response()->json(['message' => 'Deleted']);
}
```

**TaskController:**
```php
public function index()
{
    $tasks = Task::where('user_id', $this->getUserId())
        ->orderBy('due_at', 'asc')
        ->get();
    return response()->json($tasks);
}

public function store(Request $request)
{
    $validated = $request->validate([/* ... */]);
    $validated['user_id'] = $this->getUserId();
    $task = Task::create($validated);
    return response()->json($task, 201);
}

public function destroy(Task $task)
{
    if (!$this->checkOwnership($task)) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    $task->delete();
    return response()->json(['message' => 'Deleted']);
}
```

**StudyGoalController:**
```php
public function index()
{
    $goals = StudyGoal::where('user_id', $this->getUserId())->get();
    return response()->json($goals);
}

public function store(Request $request)
{
    $validated = $request->validate([/* ... */]);
    $validated['user_id'] = $this->getUserId();
    $goal = StudyGoal::create($validated);
    return response()->json($goal, 201);
}

public function destroy(StudyGoal $goal)
{
    if (!$this->checkOwnership($goal)) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    $goal->delete();
    return response()->json(['message' => 'Deleted']);
}
```

---

## Phase 4: Already Done ✅

Các controllers đã có `getCurrentUserId()`:
- ✅ StudyNoteController
- ✅ StudyRecommendationController

Chúng ta chỉ cần uncomment auth checks sau khi auth system được implement.

---

## Phase 5: Authentication System Implementation

### 5.1 Setup Laravel Sanctum

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### 5.2 Create Auth Routes

```php
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});
```

### 5.3 Create AuthController

```php
public function register(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8|confirmed',
    ]);

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
    ]);

    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json(['token' => $token, 'user' => $user]);
}

public function login(Request $request)
{
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($credentials)) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }

    $user = Auth::user();
    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json(['token' => $token, 'user' => $user]);
}
```

---

## Phase 6: Frontend Integration

### 6.1 Setup Auth Context

Create `AuthContext.tsx`:
```tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### 6.2 Update API Calls

```tsx
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getAuthHeader() {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function getExpenses() {
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    headers: getAuthHeader(),
  });
  return response.json();
}
```

---

## Implementation Checklist

- [ ] Phase 1: Create migrations for user_id
- [ ] Phase 2: Update models with relationships
- [ ] Phase 3: Update controllers with user filtering
- [ ] Phase 4: Uncomment auth checks in Study controllers
- [ ] Phase 5: Setup Sanctum & AuthController
- [ ] Phase 6: Create login/register UI
- [ ] Phase 7: Update frontend API calls with token
- [ ] Phase 8: Test end-to-end authentication

---

## Current Status - November 19, 2025

### Phase 1: Database Schema Updates ✅ COMPLETED
- ✅ Created 5 migrations to add user_id columns to:
  - expenses table
  - tasks table
  - study_goals table
  - daily_logs table
  - long_term_memories table
- ✅ All migrations applied successfully with foreign key constraints

### Phase 2: Model Updates ✅ COMPLETED
- ✅ Updated Expense model: added user_id to $fillable, added user() relationship
- ✅ Updated Task model: added user_id to $fillable, added user() relationship
- ✅ Updated StudyGoal model: added user_id to $fillable, added user() relationship
- ✅ Updated DailyLog model: added user_id to $fillable, added user() relationship
- ✅ Updated LongTermMemory model: added user_id to $fillable, added user() relationship

### Phase 3: Controller Updates ⏳ IN PROGRESS
- ✅ ExpenseController: Updated all methods (index, last7Days, store, update, destroy) with user_id filtering and ownership checks
- ⏳ TaskController: TODO - Add user_id filtering to all methods
- ⏳ StudyGoalController: TODO - Add user_id filtering to all methods
- ⏳ MemoryController: TODO - Check if exists and add user_id filtering

### Phase 4: Already Done ✅
- ✅ StudyNoteController (6 auth checks commented)
- ✅ StudyRecommendationController (2 auth checks commented)

### Phase 5-6: Authentication & Frontend ⏳ NOT STARTED
- ❌ Setup Laravel Sanctum
- ❌ Create AuthController with register/login
- ❌ Create login/register UI
- ❌ Setup Auth Context in frontend
- ❌ Update frontend API calls with Bearer token

---

## Notes

- Currently all controllers fallback to `user_id = 1` via `auth()->id() ?? 1`
- This allows development without authentication
- Once Sanctum is setup, auth()->id() will return actual user ID
- Auth checks in Study controllers are already in place, just need to uncomment
