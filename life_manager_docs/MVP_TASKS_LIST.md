# MVP TASK LIST – LIFE MANAGER AI
# MVP DEVELOPMENT CHECKLIST – 7 DAYS

---

# DAY 1
☑ Setup Laravel  
☑ Setup PostgreSQL  
☑ Create migrations  
☑ Test basic API  

---

# DAY 2 – Tasks
☑ Create Task model  
☑ Create TaskController  
☑ /tasks/today  
☑ /tasks (POST)  
☑ Design system + Dark mode  
☑ Shadcn UI integration  
☑ Task CRUD UI with filters  

---

# DAY 3 – Expenses
☑ Expense model  
☑ /expenses/7days  
☑ /expenses (POST)  
☑ Expense UI with Shadcn components  
☑ ExpenseSeeder with 16 samples  
☑ Chart.js integration (Bar + Pie charts)  
☑ Backend tests (6 passed)  

---

# DAY 4 – AI Assistant
☑ Groq API integration  
☑ System Prompt  
☑ AssistantController  
☑ Chat endpoint (/api/assistant/chat)  
☑ Frontend integration  
☑ Backend tests (5 passed)  

---

# DAY 5 – Memory
☑ daily_logs migration (already existed)  
☑ long_term_memory migration (already existed)  
☑ DailyLog model  
☑ LongTermMemory model  
☑ MemoryUpdater service  
☑ DailyLogSeeder (7 days of sample data)  
☑ LongTermMemorySeeder (preferences, habits, goals, insights)  
☑ MemoryController (3 endpoints)  
☑ API routes (/memories/daily-logs, /long-term, /long-term/{key})  
☑ MemorySystemTest (7 tests passed)  
☑ MemoryControllerTest (4 tests passed)  
☑ Total tests: 24 passed  

---

# DAY 6 – Dashboard FE
☑ DashboardController with getSummary() endpoint  
☑ TaskFactory for testing  
☑ DashboardControllerTest (7 tests passed)  
☑ KPI cards (Tasks, Completion Rate, Expenses, Memory)  
☑ Pending Tasks widget with priority badges  
☑ Expense charts (Bar + Pie)  
☑ Memory Timeline with daily logs + AI feedback  
☑ Quick Actions (Add Task, Add Expense, AI Chat)  
☑ Total tests: 31 passed (81 assertions)  

---

# DAY 7 – Chat + Deploy
☐ Chat UI with Shadcn Input/Button  
☐ Deploy BE  
☐ Deploy FE

---

# SHADCN UI COMPONENTS INSTALLED
✅ Button (variants: default, destructive, outline, secondary, ghost, link)  
✅ Card (with Header, Title, Description, Content, Footer)  
✅ Input  
✅ Tailwind CSS v3 + tailwindcss-animate  
✅ Dark mode with class strategy  
✅ Design system với HSL color variables  

