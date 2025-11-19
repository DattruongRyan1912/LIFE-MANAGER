
# 🗂 Task Module Version 3 – Full Specification (Life Manager AI)

## 1. Overview
Task v3 nâng cấp toàn bộ hệ thống quản lý công việc theo hướng chuyên sâu giống:
- GitHub Project
- Linear
- Notion Calendar + Timeline
- Asana / ClickUp

Bao gồm:
- Nhiều chế độ hiển thị (List / Kanban / Calendar / Timeline)
- Subtasks, labels, dependencies
- Recurring tasks
- AI auto scheduling
- Drag & drop toàn hệ thống
- Dashboard phân tích hiệu suất

---

## 2. Core Features

### 2.1 Multi-view Task System
#### ✔ List View (nâng cấp)
- Group by: priority, status, type, recurrence
- Sort: created date, due date, estimate, importance
- Quick actions

#### ✔ Kanban View
Columns:
- Backlog
- Next
- In Progress
- Blocked
- Completed

Drag & drop để cập nhật status.

#### ✔ Calendar View
- Month/Week/Day view
- Drag & drop đổi ngày
- Resize task theo thời lượng
- Multi-day tasks
- Recurring task badges

#### ✔ Timeline View (Gantt-like)
- Multi-day range
- Drag start/end
- Priority color bar
- Auto-level (giảm chồng lấp)
- Workload heatmap

---

## 3. Task Properties (giống GitHub Project)
- Status (backlog/next/in_progress/blocked/done)
- Priority (low/medium/high/critical)
- Estimate time
- Actual time (tự ghi từ Pomodoro)
- Recurrence (daily/weekly/monthly/custom)
- Task Type (work/personal/study etc.)
- Subtasks
- Dependencies (blocking tasks)
- Labels/tags
- Notes
- Attachments (optional)

---

## 4. AI Features

### 4.1 AI Auto Task Breakdown
Task lớn → list subtasks thông minh.

### 4.2 AI Auto Scheduler
“Xếp lịch tuần này giúp tôi.”
→ Tự tạo timeline + calendar.

### 4.3 AI Priority Engine
Đọc tất cả task → gợi ý:
- Task quan trọng nhất
- Task nên bỏ
- Task nên dời

### 4.4 AI Daily Planning v3
Sử dụng:
- energy pattern
- deadline
- urgency
- workload

Để tạo lịch học/ngày tối ưu.

---

## 5. Database Schema (Laravel Migration Ready)

### 5.1 tasks table (nâng cấp)
id  
title  
description  
status  
priority  
due_date  
start_date  
estimated_minutes  
actual_minutes  
recurrence  
task_type  
parent_task_id  
order_index  
created_at  
updated_at  

### 5.2 task_labels
id  
name  
color  

### 5.3 task_label_map
task_id  
label_id  

### 5.4 task_dependencies
id  
task_id  
blocked_by_task_id  

### 5.5 task_logs
id  
task_id  
event_type  
timestamp  

---

## 6. API Specification (Summary)

### Task CRUD (Nâng cấp)
- POST /tasks  
- PATCH /tasks/{id}  
- DELETE /tasks/{id}  
- POST /tasks/{id}/subtasks  
- PATCH /tasks/{id}/status  
- PATCH /tasks/{id}/priority  
- PATCH /tasks/{id}/calendar-move  
- PATCH /tasks/{id}/timeline-resize  

### Kanban API
- GET /tasks/kanban  
- PATCH /tasks/{id}/move-column  

### Calendar API
- GET /tasks/calendar  
- PATCH /tasks/{id}/set-date  

### AI API
- POST /tasks/ai/breakdown  
- POST /tasks/ai/auto-schedule  
- POST /tasks/ai/priority  

---

## 7. UI/UX Specification

### Navigation
- Tasks
  - All Tasks
  - Kanban Board
  - Calendar
  - Timeline
  - Pomodoro

### Task Detail Drawer
Hiện bên phải:
- Title
- Description
- Subtasks
- Labels
- Dates
- Priority
- Status
- Dependencies
- Notes
- History

### Calendar
- Drag to move
- Resize bottom to adjust duration
- Multi-day spanning bar
- Tooltip info on hover

### Kanban
- Smooth drag & drop
- Column WIP limit
- Quick add in column

---

## 8. Analytics Dashboard
- Total working hours estimated
- Actual time spent
- Heatmap productivity (giống GitHub)
- Category breakdown
- Recurrence success rate
- Bottlenecks (blocked tasks)
- Workload forecast

---

## 9. Implementation Roadmap – 4 Weeks

### Week 1 – Data Layer + Core UI
- DB migrations
- Status + priority + recurrence
- Subtasks
- Labels
- Basic List filtering

### Week 2 – Kanban + Calendar
- Kanban DnD
- Calendar view + drag & drop
- Sync across views

### Week 3 – Timeline v3 + Analytics
- Gantt view
- Multi-day tasks
- Heatmap
- Productivity dashboard

### Week 4 – AI Features
- Breakdown AI
- Auto-schedule AI
- Priority AI
- Smart suggestion engine

---

## 10. Summary
Task v3 mang lại:
- Quản lý task chuyên sâu dạng GitHub Project
- 4 view mạnh mẽ (List / Kanban / Calendar / Timeline)
- Drag & drop mọi thứ
- AI hỗ trợ lập kế hoạch
- Trải nghiệm tương đương Linear / Asana
- Nền tảng mở rộng dài hạn

VII. Những đề xuất để Task Module trở thành “Production-grade like GitHub Project”

- Task ID ngắn dạng: LM-TASK-00124

- Keyboard shortcuts → tăng tốc thao tác

- Task history log

- Undo/Redo

- Quick Search with fuzzy match

- Recurring task exceptions

- Task templates (Morning routine, Weekly cleaning…)
