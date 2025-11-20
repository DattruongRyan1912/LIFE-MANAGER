# 📊 LIFE MANAGER AI - PROJECT OVERVIEW
**Generated:** November 20, 2025  
**Status:** In Development (80% Complete)

---

## 🎯 PROJECT SUMMARY

**Life Manager AI** là ứng dụng quản lý cuộc sống toàn diện với AI assistant tích hợp. Ứng dụng kết hợp quản lý tasks, chi tiêu, học tập và AI chatbot thông minh với khả năng nhớ dài hạn.

**Core Value Proposition:**
- 🤖 AI Assistant với vector memory (TF-IDF + cosine similarity)
- 📋 Advanced Task Management với Kanban, Calendar, Timeline/Gantt views
- 💰 Expense tracking với AI forecast và insights
- 📚 Study management với AI-generated plans
- 🧠 Long-term memory system giúp AI hiểu người dùng theo thời gian

---

## 🏗️ TECH STACK

### Backend
- **Framework:** Laravel 10.x (PHP 8.1+)
- **Database:** PostgreSQL
- **Cache:** Redis (planned)
- **API:** RESTful JSON API
- **AI Integration:** Groq API (LLaMA 3.3 70B Versatile)
- **Authentication:** Laravel Sanctum (partially implemented)

### Frontend
- **Framework:** Next.js 16 (React 19)
- **UI Library:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS 4.x
- **State:** React Hooks (no external state management)
- **Charts:** Chart.js + react-chartjs-2
- **Drag & Drop:** @dnd-kit
- **Markdown:** react-markdown + remark-gfm

### Infrastructure
- **Local Dev:** Laravel built-in server (port 8000) + Next.js dev server (port 3000)
- **Deployment:** Not yet configured
- **Monitoring:** Laravel logs + browser console

---

## 📦 DATABASE SCHEMA

### Core Tables
1. **users** - User authentication (Sanctum ready)
2. **tasks** - Task management với recurring, pomodoro, status, labels
3. **expenses** - Chi tiêu tracking
4. **study_goals** - Mục tiêu học tập
5. **daily_logs** - Daily summaries từ AI
6. **long_term_memories** - Vector memory storage (key-value + metadata)

### Task v3 Extensions
7. **task_labels** - Labels/tags cho tasks
8. **task_label_map** - Many-to-many pivot
9. **task_dependencies** - Task blocking relationships
10. **task_logs** - Activity history cho tasks

### Study 3.0 Extensions
11. **study_modules** - Curriculum modules
12. **study_tasks** - Tasks liên kết với study goals
13. **study_notes** - Ghi chú học tập
14. **study_insights** - AI-generated insights
15. **study_resources** - Tài liệu học tập

**Total Tables:** 15+  
**User-scoped:** All major tables have `user_id` column (multi-tenant ready)

---

## 🎨 FRONTEND STRUCTURE

### Pages (/src/app)
```
/                    → Dashboard (KPI cards, charts)
/tasks               → Task list (legacy)
/tasks-v3            → Advanced task management hub
  - Kanban View      ✅ (5 columns: backlog → done)
  - Calendar View    ✅ (month view với task display)
  - Timeline View    ✅ (Gantt chart với auto-leveling)
  - Today's Tasks    ✅ (Kanban filtered cho hôm nay)
/expenses            → Expense list + add form
/expense-insights    → Charts, forecast, category breakdown
/study               → Study 3.0 module management
/assistant           → AI Chat interface
/memory-insights     → Vector memory search UI
/preferences         → User preference insights
/pomodoro            → Pomodoro timer (standalone)
```

### Key Components
- **Sidebar** - Navigation với active states
- **ThemeToggle** - Dark/light mode
- **TaskDetailDrawer** - Slide-in drawer cho task details
- **KanbanView** - Drag & drop task board
- **CalendarView** - Monthly calendar với tasks
- **TimelineView** - Gantt chart với zoom/pan
- **StudyProgress** - Study goal progress tracking
- **ExpenseChart** - Chart.js visualizations
- **AiChat** - Groq AI chat interface

---

## 🔌 API ENDPOINTS

### Tasks
```
GET    /api/tasks                   - List all tasks
POST   /api/tasks                   - Create task (auto-sets start_date)
PATCH  /api/tasks/{id}              - Update task
DELETE /api/tasks/{id}              - Delete task
GET    /api/tasks/today             - Today's tasks
GET    /api/tasks/timeline          - Timeline data (recurring expansion)
POST   /api/tasks/timeline/reorder  - Reorder timeline
PATCH  /api/tasks/{id}/toggle       - Toggle done status
POST   /api/tasks/pomodoro/suggest  - AI pomodoro suggestions
POST   /api/tasks/{id}/pomodoro/complete - Log pomodoro session

# Task v3
GET    /api/tasks/kanban            - Kanban board data
GET    /api/tasks/calendar          - Calendar view data
PATCH  /api/tasks/{id}/status       - Update status (with logging)
PATCH  /api/tasks/{id}/calendar-move - Move task date
POST   /api/tasks/{id}/subtasks     - Create subtask
```

### Expenses
```
GET    /api/expenses                - List expenses
POST   /api/expenses                - Create expense
PATCH  /api/expenses/{id}           - Update expense
DELETE /api/expenses/{id}           - Delete expense
GET    /api/expenses/forecast       - AI forecast (7/30 days)
GET    /api/expenses/insights       - Category insights
```

### Study Goals
```
GET    /api/study-goals             - List goals
POST   /api/study-goals             - Create goal
PATCH  /api/study-goals/{id}        - Update goal
DELETE /api/study-goals/{id}        - Delete goal
GET    /api/study-goals/{id}/daily-suggestions - AI daily plan
POST   /api/study-goals/{id}/evaluate - Evaluate progress
```

### Study 3.0
```
GET    /api/study/modules           - List modules
POST   /api/study/modules           - Create module
GET    /api/study/modules/{id}/tasks - Module tasks
POST   /api/study/modules/{id}/tasks - Create task for module
GET    /api/study/notes             - Study notes
POST   /api/study/notes             - Create note
GET    /api/study/insights          - AI insights
GET    /api/study/resources         - Resources
POST   /api/study/resources         - Add resource
GET    /api/study/recommendations/daily-plan - AI daily study plan
```

### AI Assistant
```
POST   /api/assistant/chat          - Chat with AI (with vector memory)
GET    /api/assistant/daily-plan    - Generate daily plan
GET    /api/assistant/daily-summary - Generate daily summary
```

### Memory & Preferences
```
# Vector Memory
POST   /api/memory/vector/store     - Store vector memory
POST   /api/memory/vector/search    - Search memories (TF-IDF)
GET    /api/memory/statistics       - Memory stats
GET    /api/memory/by-category/{cat} - Filter by category
DELETE /api/memory/clean-old        - Clean old memories

# User Preferences (AI-detected patterns)
GET    /api/preferences/insights    - Auto-detected patterns
PATCH  /api/preferences/{key}       - Update preference
```

### Dashboard
```
GET    /api/dashboard/summary       - KPI summary (tasks, expenses, study)
```

---

## 🧠 AI SYSTEM ARCHITECTURE

### Components
1. **AssistantController** - Main AI endpoint handler
2. **ContextBuilder** - Builds context cho AI prompts
3. **MemoryUpdater** - Updates memories sau mỗi conversation
4. **VectorMemoryService** - TF-IDF vector search
5. **UserPreferenceService** - Auto-detect user patterns
6. **ExpenseForecastService** - Forecast chi tiêu
7. **StudyPlanService** - Generate study plans
8. **RecommendationEngine** - Study recommendations

### Context Building Flow
```
User Message
    ↓
ContextBuilder.build(query)
    ↓
Collect:
  - tasks_today (today's tasks)
  - expenses_7days (last 7 days expenses)
  - study_goals (active goals)
  - relevant_memories (vector search nếu có query)
  - user_preferences (detected patterns)
    ↓
Limit context size (~8000 chars / ~2000 tokens)
    ↓
Build system prompt với context
    ↓
Send to Groq API (llama-3.3-70b-versatile)
    ↓
Receive AI response
    ↓
Store conversation in vector memory
    ↓
Update user preferences
```

### Memory System
- **Short-term:** Daily logs (cleared periodically)
- **Long-term:** Vector memories (TF-IDF indexed)
- **Categories:** insights, study_notes, life_goals, mood_logs, preferences
- **Search:** Cosine similarity trên TF-IDF vectors
- **Decay:** Old memories có thể bị xóa (clean-old endpoint)

---

## ✅ FEATURE COMPLETION STATUS

### ✅ COMPLETED (100%)

#### 1. Tasks 2.0
- ✅ Recurring tasks (daily/weekly/monthly expansion)
- ✅ Drag & drop timeline reordering
- ✅ Pomodoro suggestions từ AI
- ✅ Pomodoro session logging

#### 2. Expenses 2.0
- ✅ Chart visualization (category breakdown)
- ✅ AI forecast (7/30 days)
- ✅ Category insights (top spending categories)

#### 3. Study 2.0
- ✅ AI study plan generation
- ✅ Weekly chapter planning
- ✅ Progress tracking

#### 4. AI 2.0
- ✅ Vector memory (TF-IDF + cosine similarity)
- ✅ Improved context filter (size limits, recency priority)
- ✅ User preference engine (auto-detect patterns)
- ✅ Memory Insights UI (search, stats, category filter)
- ✅ Preferences UI (detected patterns với confidence)

#### 5. Study 3.0
- ✅ Create tasks in study plans (manual + AI auto-gen)
- ✅ Study goal management UI
- ✅ Progress tracking + evaluation
- ✅ Resource recommendations
- ✅ Study notes storage
- ✅ AI insights for learning gaps

#### 6. Task v3 - Phases 1-3 (Core Views)
- ✅ Database schema (labels, dependencies, logs)
- ✅ Models & relationships
- ✅ Backend API endpoints (kanban, calendar, status updates)
- ✅ **KanbanView** (5 columns, drag & drop, CRUD)
- ✅ **CalendarView** (month view, task display, modals)
- ✅ **TimelineView** (Gantt chart, zoom/pan, auto-leveling)
- ✅ **TodayTasksView** (Kanban for today only)
- ✅ **TaskDetailDrawer** (slide-in, edit mode, subtasks, labels, dependencies, activity log)

### ⏳ IN PROGRESS (50%)

#### 6. Authentication & User Management
- ✅ Database (user_id columns in all tables)
- ✅ Models (user relationships)
- ✅ Controllers (user_id filtering in Expense, Task, StudyGoal, Memory)
- ❌ Laravel Sanctum setup (routes exist, not tested)
- ❌ User registration/login UI
- ❌ Password reset
- ❌ User profile management
- ❌ Frontend Auth Context
- ❌ API token integration

### ❌ NOT STARTED (0%)

#### Task v3 - Phase 4: Advanced Features
- ❌ Labels management UI (create, edit, delete, color picker)
- ❌ Multi-select labels for tasks
- ❌ Dependencies UI (blocking relationships)
- ❌ Dependency graph visualization
- ❌ Circular dependency prevention

#### Task v3 - Phase 5: AI Features
- ❌ AI Task Breakdown (split large task → subtasks)
- ❌ AI Auto Scheduler (assign start dates/times)
- ❌ AI Priority Engine (suggest task priorities)

#### Task v3 - Phase 6: Analytics
- ❌ Task analytics dashboard
- ❌ Estimated vs actual time charts
- ❌ Productivity heatmap
- ❌ Category breakdown
- ❌ Recurrence success rate
- ❌ Workload forecast
- ❌ Export reports (CSV/PDF)

#### 7. Reports
- ❌ Weekly summary
- ❌ Monthly summary
- ❌ Trend analysis

#### 8. Automation
- ❌ Smart reminders
- ❌ Predictive workload
- ❌ Energy level suggestions

#### 9. Integration
- ❌ Calendar sync (Google/Outlook)
- ❌ PWA (Progressive Web App)
- ❌ Offline mode

---

## 🐛 KNOWN ISSUES & RECENT FIXES

### Recent Fixes (Nov 19-20, 2025)
1. ✅ **Timeline bar display** - Fixed flexbox layout, positioning, width calculations
2. ✅ **Task date logic** - Bars now span full due date day (00:00-23:59)
3. ✅ **Auto-set start_date** - Backend auto-sets start_date on task create
4. ✅ **Task filtering on pan/zoom** - Tasks outside view range now hidden correctly
5. ✅ **React Hooks order** - Fixed useMemo placement before early returns
6. ✅ **AI rate limit** - Changed Groq model from llama-3.1-8b-instant → llama-3.3-70b-versatile
7. ✅ **TaskDetailDrawer animation** - Added 300ms slide-in-from-right
8. ✅ **TodayTasksView refactor** - Integrated TaskDetailDrawer, removed old dropdowns

### Current Issues
1. ⚠️ **AI Token Usage** - Context builder gửi quá nhiều data → vượt quota
   - **Impact:** Rate limit errors khi chat nhiều
   - **Solution needed:** Trim context size, limit history, summarize data
   
2. ⚠️ **Old tasks missing start_date** - Tasks created trước Nov 19 có start_date = null
   - **Impact:** Không hiển thị trong Timeline
   - **Workaround:** User đã tự fix data, hoặc dùng `update_start_dates.php`

3. ⚠️ **No authentication** - Multi-user chưa test được
   - **Impact:** Tất cả data dùng chung, không có user separation
   - **Next:** Implement Sanctum login/register

4. ⚠️ **No error boundaries** - Frontend crashes không được handle gracefully
   - **Impact:** White screen khi có lỗi
   - **Next:** Add React Error Boundaries

---

## 📈 PROGRESS METRICS

**Overall Completion: ~80%**

| Module | Status | Completion |
|--------|--------|------------|
| Tasks 2.0 | ✅ Done | 100% |
| Expenses 2.0 | ✅ Done | 100% |
| Study 2.0 | ✅ Done | 100% |
| AI 2.0 | ✅ Done | 100% |
| Study 3.0 | ✅ Done | 100% |
| Task v3 (Phase 1-3) | ✅ Done | 100% |
| Authentication | ⏳ In Progress | 50% |
| Task v3 (Phase 4-6) | ❌ Not Started | 0% |
| Reports | ❌ Not Started | 0% |
| Automation | ❌ Not Started | 0% |
| Integration | ❌ Not Started | 0% |

**Estimated Remaining Work:** 2-3 weeks
- Week 1: Complete Authentication (Sanctum + UI)
- Week 2: Task v3 Advanced Features (Labels, Dependencies, AI)
- Week 3: Analytics, Reports, Polish

---

## 🚀 DEPLOYMENT STATUS

**Current:** Local development only
- Backend: `php artisan serve` (port 8000)
- Frontend: `npm run dev` (port 3000)

**Not Configured:**
- ❌ Production server
- ❌ Domain/SSL
- ❌ CI/CD pipeline
- ❌ Database backups
- ❌ Monitoring/logging service
- ❌ CDN for static assets
- ❌ Email service (SMTP)

**Environment:**
- `.env` configured for local Postgres
- Groq API key present
- No Docker setup

---

## 💡 RECOMMENDATIONS

### High Priority
1. **Optimize AI Context** - Giảm token usage bằng cách:
   - Limit tasks_today to top 10 priority
   - Limit expenses to aggregated summary thay vì full list
   - Limit vector memory search results to top 5
   - Add context size validation before API call

2. **Complete Authentication** - Enable multi-user:
   - Setup Sanctum middleware
   - Create register/login pages
   - Add protected route middleware
   - Test user_id filtering thoroughly

3. **Add Error Handling** - Improve UX:
   - React Error Boundaries
   - Toast notifications cho API errors
   - Retry logic cho failed requests
   - Offline detection

### Medium Priority
4. **Task v3 Advanced** - Labels, Dependencies, AI breakdown
5. **Analytics Dashboard** - Productivity insights
6. **PWA Setup** - Offline support, install prompt
7. **Docker** - Containerize for easier deployment

### Low Priority
8. **Calendar Integration** - Google/Outlook sync
9. **Email Notifications** - Task reminders
10. **Mobile App** - React Native version

---

## 📚 DOCUMENTATION REVIEW

Existing docs are comprehensive:
- ✅ SYSTEM_ARCHITECTURE.md - Clear high-level overview
- ✅ DB_SCHEMA.md - Complete schema (needs update for Task v3 additions)
- ✅ API_SPEC.md - Basic endpoints (needs Task v3 endpoints)
- ✅ FULL_VERSION_FEATURES_version_2.md - Detailed feature checklist
- ✅ Task_v3_Spec.md - Comprehensive Task v3 requirements
- ✅ Study3.0_Spec.md - Study 3.0 requirements
- ✅ VECTOR_MEMORY_DESIGN.md - AI memory architecture
- ✅ AI_Feature_Spec.md - AI features detail

**Missing:**
- ❌ Deployment guide (production setup)
- ❌ Contributing guide (for team members)
- ❌ Testing guide (how to run tests)
- ❌ Troubleshooting guide (common issues)

---

## 🎓 KEY LEARNINGS FROM SESSION

1. **Data Integrity** - Missing start_date caused Timeline issues → Always set defaults in backend
2. **React Hooks Rules** - useMemo must be called unconditionally → Move above early returns
3. **API Rate Limits** - Context size matters → Monitor token usage, implement trimming
4. **User Feedback** - Debug logs in frontend helped identify root cause quickly
5. **Incremental Progress** - Breaking down fixes into small steps (layout → logic → data → optimization)

---

## 🔗 QUICK LINKS

- **Backend:** `http://localhost:8000`
- **Frontend:** `http://localhost:3000`
- **API Docs:** `/Users/ryantruong/Project/Orther/LIFE_MANAGER/life_manager_docs/API_SPEC.md`
- **Database:** PostgreSQL (life_manager)
- **Groq Console:** https://console.groq.com/

---

**Last Updated:** November 20, 2025  
**Next Review:** After Authentication completion
