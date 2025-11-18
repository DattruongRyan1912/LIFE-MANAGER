# SYSTEM ARCHITECTURE – LIFE MANAGER AI
# SYSTEM ARCHITECTURE – LIFE MANAGER AI

---

# HIGH LEVEL

Frontend (Next.js)
      │
      ▼
Backend (Laravel)
      │
      ├── Task Service
      ├── Expense Service
      ├── Study Service
      ├── AI Gateway (Groq)
      ├── Memory Layer
      └── Context Builder
      ▼
PostgreSQL (Data)
Redis (Cache)
Groq (AI)

---

# COMPONENTS

## 1. Next.js
- Dashboard
- Task list
- Expense screen
- AI Chat

## 2. Laravel Backend
### Modules:
- TaskController
- ExpenseController
- StudyGoalController
- AssistantController
- MemoryUpdater
- ContextBuilder

## 3. AI Engine
- Groq API (Llama3 / R1)

## 4. Memory Layer
- Short-term: tasks + expenses
- Long-term: insights

---

# DATA FLOW – DAILY PLAN
1. User gửi: “Lên kế hoạch hôm nay”
2. Backend lấy:
   - tasks today
   - expense 7 ngày
   - study goals
   - long-term memory
3. Backend gửi context → Groq
4. Groq trả về timeline
5. Backend lưu daily log
6. FE hiển thị timeline

---

# DATA FLOW – DAILY SUMMARY
1. FE gửi request /assistant/daily-summary
2. Backend tạo context ngày
3. Groq sinh summary
4. Lưu vào daily_logs

