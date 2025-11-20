# Task API Endpoints - Complete Reference

## Base URL
```
http://localhost:8000/api
```

---

## 📋 Task CRUD Operations

### 1. Get All Tasks
```http
GET /tasks
```
**Response:**
```json
[
  {
    "id": 1,
    "title": "Complete project",
    "description": "Finish the task module",
    "priority": "high",
    "status": "in_progress",
    "task_type": "work",
    "done": false,
    "due_at": "2025-11-20T15:00:00",
    "start_date": "2025-11-19T09:00:00",
    "estimated_minutes": 120,
    "actual_minutes": 60,
    "recurrence_type": "none",
    "pomodoro_estimate": 4,
    "pomodoro_completed": 2,
    "labels": [
      {
        "id": 1,
        "name": "urgent",
        "color": "#FF0000"
      }
    ]
  }
]
```

### 2. Create Task
```http
POST /tasks
```
**Request Body:**
```json
{
  "title": "New task",
  "description": "Task description",
  "priority": "medium",
  "status": "backlog",
  "task_type": "work",
  "due_at": "2025-11-20T15:00:00",
  "start_date": "2025-11-19T09:00:00",
  "estimated_minutes": 60,
  "recurrence_type": "none",
  "recurrence_interval": 1,
  "pomodoro_estimate": 2
}
```
**Response:** Created task object

### 3. Update Task
```http
PUT /tasks/{id}
PATCH /tasks/{id}
```
**Request Body:** Same as create (all fields optional)

### 4. Delete Task
```http
DELETE /tasks/{id}
```
**Response:** `204 No Content`

---

## 🎯 Task Status & Actions

### 5. Toggle Task Completion
```http
PATCH /tasks/{id}/toggle
```
**Response:**
```json
{
  "id": 1,
  "done": true,
  "updated_at": "2025-11-19T10:30:00"
}
```

### 6. Update Task Status (v3)
```http
PATCH /tasks/{id}/status
```
**Request Body:**
```json
{
  "status": "in_progress"
}
```
**Allowed Values:** `backlog`, `next`, `in_progress`, `blocked`, `done`

**Response:**
```json
{
  "id": 1,
  "status": "in_progress",
  "log": {
    "event_type": "status_changed",
    "changes": {
      "old_status": "next",
      "new_status": "in_progress"
    }
  }
}
```

---

## 📅 Task Views

### 7. Get Today's Tasks
```http
GET /tasks/today
```
**Response:** Array of tasks with `due_at` = today

### 8. Get Kanban Board Data (v3)
```http
GET /tasks/kanban
```
**Response:**
```json
{
  "backlog": [...tasks],
  "next": [...tasks],
  "in_progress": [...tasks],
  "blocked": [...tasks],
  "done": [...tasks]
}
```

### 9. Get Calendar View (v3)
```http
GET /tasks/calendar?start_date=2025-11-01&end_date=2025-11-30
```
**Query Parameters:**
- `start_date`: ISO 8601 datetime
- `end_date`: ISO 8601 datetime

**Response:** Array of tasks with `due_at` or `start_date` between dates

### 10. Get Timeline View
```http
GET /tasks/timeline?view=week&start_date=2025-11-19
```
**Query Parameters:**
- `view`: `day`, `week`, or `month` (default: `week`)
- `start_date`: ISO 8601 date (default: today)

**Response:**
```json
{
  "2025-11-19": [...tasks],
  "2025-11-20": [...tasks],
  ...
}
```

---

## 🗂️ Timeline Management

### 11. Update Timeline Order
```http
POST /tasks/timeline/reorder
```
**Request Body:**
```json
{
  "date": "2025-11-19",
  "task_ids": [3, 1, 2]
}
```
**Response:** `200 OK`

### 12. Move Task on Calendar (v3)
```http
PATCH /tasks/{id}/calendar-move
```
**Request Body:**
```json
{
  "due_at": "2025-11-20T15:00:00",
  "start_date": "2025-11-20T09:00:00"
}
```

---

## 🍅 Pomodoro Features

### 13. Suggest Pomodoro Sessions
```http
POST /tasks/pomodoro/suggest
```
**Request Body:**
```json
{
  "task_id": 1,
  "title": "Complete project",
  "estimated_minutes": 120,
  "priority": "high"
}
```
**Response:**
```json
{
  "recommended_pomodoros": 4,
  "reasoning": "High priority task with 120 minutes = 4 Pomodoro sessions"
}
```

### 14. Complete Pomodoro Session
```http
POST /tasks/{id}/pomodoro/complete
```
**Response:**
```json
{
  "id": 1,
  "pomodoro_completed": 3,
  "pomodoro_estimate": 4,
  "progress_percentage": 75
}
```

---

## 👶 Subtask Management (v3)

### 15. Create Subtask
```http
POST /tasks/{id}/subtasks
```
**Request Body:**
```json
{
  "title": "Subtask title",
  "description": "Subtask description",
  "priority": "medium",
  "estimated_minutes": 30
}
```
**Response:** Created subtask (inherits parent's `status`, `task_type`)

---

## 🏷️ Labels (v3)

### Get Task Labels
Labels are included in task objects via `labels` relationship:
```json
"labels": [
  {
    "id": 1,
    "name": "urgent",
    "color": "#FF0000"
  }
]
```

**Label Management Endpoints:** (To be implemented in Phase 4)
- `GET /labels` - Get all user labels
- `POST /labels` - Create label
- `POST /tasks/{id}/labels` - Attach label to task
- `DELETE /tasks/{id}/labels/{labelId}` - Remove label from task

---

## 🔗 Dependencies (v3)

**Dependency Endpoints:** (To be implemented in Phase 4)
- `GET /tasks/{id}/dependencies` - Get task dependencies
- `POST /tasks/{id}/dependencies` - Add dependency
- `DELETE /tasks/{id}/dependencies/{dependencyId}` - Remove dependency

---

## 📊 Task Statistics

**Available in Dashboard API:**
```http
GET /dashboard/summary
```
Returns task statistics including:
- `tasks.total` - Total tasks
- `tasks.completed` - Completed tasks
- `tasks.completion_rate` - Completion percentage
- `tasks.pending` - Pending tasks array

---

## 🔍 Search & Filter

**Filter by Query Parameters on `/tasks`:**
```http
GET /tasks?priority=high&status=in_progress&done=false
```

**Supported Filters:**
- `priority`: `low`, `medium`, `high`
- `status`: `backlog`, `next`, `in_progress`, `blocked`, `done`
- `task_type`: any custom string
- `done`: `true`, `false`
- `recurrence_type`: `none`, `daily`, `weekly`, `monthly`

---

## 📝 Task Logs (v3)

Task logs are automatically created for:
- `created` - Task created
- `status_changed` - Status updated
- `priority_changed` - Priority changed
- `completed` - Task marked done
- `reopened` - Task reopened
- `label_added` / `label_removed`
- `dependency_added` / `dependency_removed`

**Get Task Logs:** (To be implemented)
```http
GET /tasks/{id}/logs
```

---

## ✅ Task Model Fields

### Core Fields
- `id` - Integer, primary key
- `title` - String (required)
- `description` - Text (nullable)
- `priority` - Enum: `low`, `medium`, `high` (default: `medium`)
- `done` - Boolean (default: `false`)
- `user_id` - Foreign key to users table

### Task v3 Fields
- `status` - Enum: `backlog`, `next`, `in_progress`, `blocked`, `done` (default: `backlog`)
- `task_type` - String (default: `work`)
- `start_date` - DateTime (nullable)
- `actual_minutes` - Integer (default: `0`)

### Dates & Time
- `due_at` - DateTime (nullable)
- `estimated_minutes` - Integer (nullable)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Recurrence
- `recurrence_type` - Enum: `none`, `daily`, `weekly`, `monthly` (default: `none`)
- `recurrence_interval` - Integer (default: `1`)
- `recurrence_end_date` - Date (nullable)

### Pomodoro
- `pomodoro_estimate` - Integer (nullable)
- `pomodoro_completed` - Integer (default: `0`)

### Hierarchy
- `parent_task_id` - Foreign key (nullable) - For subtasks
- `timeline_order` - Integer (default: `0`) - For timeline ordering

---

## 🔐 Authentication

All endpoints require user authentication via:
- `user_id` filtering (currently defaults to user ID = 1)
- Ownership checks on update/delete operations

**Future:** Will implement Sanctum token authentication

---

## 🚀 Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Resource deleted
- `400 Bad Request` - Validation error
- `403 Forbidden` - Not authorized (not task owner)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 📋 Example Usage

### Create a task in Kanban
```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature X",
    "description": "Add new feature",
    "priority": "high",
    "status": "next",
    "estimated_minutes": 90
  }'
```

### Move task to In Progress
```bash
curl -X PATCH http://localhost:8000/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

### Get Kanban board
```bash
curl http://localhost:8000/api/tasks/kanban
```

---

## 📌 Notes

1. **All dates** use ISO 8601 format: `YYYY-MM-DDTHH:MM:SS`
2. **Task filtering** automatically applies `user_id` filter
3. **Soft deletes** are not implemented (hard delete)
4. **Labels & Dependencies** require junction tables (already migrated)
5. **Task logs** are automatically created on status/priority changes

---

Last Updated: November 19, 2025
Version: Task v3 (Phase 2 Complete)
