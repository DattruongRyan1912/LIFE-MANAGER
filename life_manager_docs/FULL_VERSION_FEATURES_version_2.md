# FULL VERSION FEATURES – LIFE MANAGER AI
# FULL VERSION FEATURE SET – 30 DAYS

---

# 1. Tasks 2.0 ✅ ( DONE )
- ✅ Recurring tasks  
- ✅ Drag & Drop timeline  
- ✅ Pomodoro suggestions  

# 2. Expenses 2.0 ✅ ( DONE )
- ✅ Chart  
- ✅ Forecast AI  
- ✅ Category insights  

# 3. Study 2.0 ✅ ( DONE )
- ✅ AI Study plan  
- ✅ Weekly chapter plan  

# 4. AI 2.0 ✅ ( DONE )
- ✅ Vector memory (TF-IDF + cosine similarity)
- ✅ Improved context filter (size limits, recency priority)
- ✅ User preference engine (productivity patterns, spending habits)
- ✅ Memory Insights UI (search, statistics, category filtering)
- ✅ Preferences UI (auto-detected patterns with confidence)

# 5. Study 3.0 ( Study3.0_Spec.md ) ✅ ( DONE )
- ✅ Có thể tạo task trong plan ( bằng tay hoặc tự động từ mục tiêu học tập bởi đề xuất của AI) -> từ đó có cơ sở để đánh giá tiến độ , hiệu quả học tập, thiếu sót kiến thức cần bổ sung.
- ✅ Bổ sung giao diện quản lý mục tiêu học tập, theo dõi tiến độ, đánh giá hiệu quả.
- ✅ Bổ sung đề xuất tài liệu học tập dựa trên tiến độ và mục tiêu.
- ✅ Bổ sung nơi lưu trữ ghi chú học tập, insights liên quan đến quá trình học tập.

# 6. Authentication & User Management ⏳ (IN PROGRESS - 50% DONE)
## Database & Backend Infrastructure ✅ DONE
- ✅ Added user_id columns to all tables (expenses, tasks, study_goals, daily_logs, long_term_memories)
- ✅ Updated all models with user relationships
- ✅ Updated ExpenseController with user_id filtering and ownership checks
- ✅ Added getUserId() helper methods to controllers

## Controllers ⏳ IN PROGRESS
- ✅ ExpenseController - fully updated with user filtering
- ⏳ TaskController - needs user_id filtering
- ⏳ StudyGoalController - needs user_id filtering  
- ⏳ MemoryController - needs verification and updates

## Authentication System ❌ NOT STARTED
- ❌ Laravel Sanctum setup
- ❌ User registration and login system
- ❌ Password reset functionality
- ❌ User profile management (update personal info, change password)
- ❌ Frontend Auth Context & login/register UI
- ❌ API token integration in frontend

---

# 6.5 Task v3 Module - Advanced Task Management (Task_v3_Spec.md) ⏳ (PLANNING)

## Phase 1: Complete Auth Infrastructure (Prerequisites) ✅ COMPLETED
- ✅ Task 1: Complete TaskController user_id filtering
  - ✅ Updated index, store, update, destroy with user_id filtering
  - ✅ Added ownership checks to toggle and completePomodoroSession
  - ✅ Updated RecurringTaskService.getTimelineData to accept userId parameter
  - ✅ Updated RecurringTaskService.updateTimelineOrder to filter by userId
- ✅ Task 2: Complete StudyGoalController user_id filtering
  - ✅ Already had user_id filtering in index, store, update, destroy
  - ✅ Added ownership checks to evaluateProgress and dailySuggestions
- ✅ Task 3: Verify and update MemoryController
  - ✅ MemoryController already has getUserId() and user filtering
  - ✅ Updated getMemoryStatistics to pass userId
  - ✅ Updated getMemoriesByCategory to pass userId
  - ✅ Updated cleanOldMemories to pass userId
  - ✅ Updated updatePreference to pass userId

## Phase 2: Backend - Database & API (Week 1-2) ✅ COMPLETED
### Database Schema ✅
- ✅ Task 4: Created migrations for Task v3
  - ✅ Added columns to tasks: status, start_date, actual_minutes, task_type, description
  - ✅ Created task_labels table (id, user_id, name, color)
  - ✅ Created task_label_map table (pivot for many-to-many)
  - ✅ Created task_dependencies table (task_id, blocked_by_task_id)
  - ✅ Created task_logs table (event_type, changes, comment)
  - ✅ All migrations applied successfully
  - ✅ Created models: TaskLabel, TaskDependency, TaskLog
  - ✅ Added relationships to Task model (labels, dependencies, blockedBy, blocking, logs)

### Backend API ✅
- ✅ Task 5: Updated TaskController with new endpoints
  - ✅ GET /tasks/kanban - Get tasks grouped by status (5 columns)
  - ✅ PATCH /tasks/{id}/status - Update task status with logging
  - ✅ GET /tasks/calendar - Get tasks for calendar view with date range
  - ✅ PATCH /tasks/{id}/calendar-move - Move task to different date
  - ✅ POST /tasks/{id}/subtasks - Create subtask under parent task
  - ✅ All routes registered in api.php

## Phase 3: Frontend - Multi-View System (Week 2-3)
### Kanban View
- ⏳ Task 6: Create KanbanView component
  - 5 columns: Backlog, Next, In Progress, Blocked, Completed
  - Drag & drop to move tasks between columns
  - Quick add button in each column
  - WIP limit indicators
  - Column task count badges

### Calendar View
- ⏳ Task 7: Create CalendarView component
  - Month/Week/Day view switcher
  - Drag & drop to change task dates
  - Resize task bottom to adjust duration
  - Multi-day tasks as spanning bars
  - Recurring task badges/icons
  - Click to open task detail drawer

### Timeline/Gantt View
- ⏳ Task 8: Create TimelineView component
  - Horizontal bars showing task start/end dates
  - Drag to change start/end dates
  - Priority color-coded bars
  - Task dependencies with connecting lines
  - Auto-level to reduce overlapping
  - Workload heatmap row at bottom

### Task Detail Drawer
- ⏳ Task 9: Create TaskDetailDrawer component (right sidebar)
  - Editable title and description
  - Subtasks list with add/complete actions
  - Labels selector with color tags
  - Start date & due date pickers
  - Priority and status dropdowns
  - Dependencies selector (blocking tasks)
  - Notes/comments section
  - Activity history log
  - Delete and duplicate buttons

## Phase 4: Advanced Features (Week 3)
### Labels & Dependencies
- ⏳ Task 10: Implement Labels & Dependencies system
  - Label management interface (create, edit, delete labels)
  - Color picker for labels
  - Multi-select labels for tasks
  - Dependencies UI showing blocking relationships
  - Dependency graph visualization
  - Prevent circular dependencies

## Phase 5: AI Features (Week 4)
### AI Task Breakdown
- ⏳ Task 11: Create AI Task Breakdown feature
  - Backend: POST /tasks/ai/breakdown endpoint
  - Use Gemini to analyze large task and suggest subtasks
  - Frontend UI: "Break down with AI" button
  - Display suggested subtasks with option to accept/edit
  - One-click add all subtasks

### AI Auto Scheduler
- ⏳ Task 12: Create AI Auto Scheduler
  - Backend: POST /tasks/ai/auto-schedule endpoint
  - Analyze: deadlines, priority, estimated time, energy patterns
  - Auto-assign start dates and times
  - Consider workload balance across days
  - Show before/after comparison
  - One-click apply schedule

### AI Priority Engine
- ⏳ Task 13: Create AI Priority Engine
  - Backend: POST /tasks/ai/priority endpoint
  - Analyze all tasks and suggest:
    * Most important tasks (urgent + important)
    * Tasks to postpone (low priority)
    * Tasks to remove (outdated/irrelevant)
  - Display recommendations with reasoning
  - Bulk action to apply suggestions

## Phase 6: Analytics & Reporting (Week 4)
### Analytics Dashboard
- ⏳ Task 14: Create Task Analytics Dashboard
  - Total estimated vs actual time chart
  - Productivity heatmap (GitHub contribution style)
  - Category breakdown pie chart
  - Recurrence success rate meter
  - Blocked tasks list with bottleneck analysis
  - Workload forecast (next 7/14/30 days)
  - Completion rate trend line
  - Export reports as CSV/PDF

---

## Task v3 Summary
**Total Tasks: 14**
- Phase 1 (Auth prep): 3 tasks
- Phase 2 (Backend): 2 tasks
- Phase 3 (Frontend Views): 4 tasks
- Phase 4 (Advanced): 1 task
- Phase 5 (AI Features): 3 tasks
- Phase 6 (Analytics): 1 task

**Estimated Timeline: 4 weeks**
**Dependencies:** Must complete Phase 1 (Auth infrastructure) first

---


# 7. Reports
- Weekly summary  
- Monthly summary  
- Trend analysis  

# 8. Automation
- Smart reminders  
- Predictive workload
- Energy level suggestions  

# 9. Integration
- Calendar view  
- PWA Mobile  
- Offline mode  

