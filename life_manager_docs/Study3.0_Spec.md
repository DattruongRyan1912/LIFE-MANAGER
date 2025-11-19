
# 📘 Study 3.0 Specification – Life Manager AI

## 1. Overview
Study 3.0 is an upgraded learning management subsystem that integrates:
- Goal management
- Study module breakdown
- Task generation (manual + AI-powered)
- Progress tracking
- Resource recommendation
- Study notes + insights
- AI analysis for weaknesses & suggestions

---

## 2. Objectives
- Transform high-level learning goals into actionable tasks.
- Track actual completion progress based on tasks.
- Build learning habits via AI insights.
- Provide personalized study recommendations.
- Store structured notes to improve AI reasoning quality.

---

## 3. Core Features

### 3.1. Goal → Module → Task System
User defines a study goal (e.g., “Tiếng Anh B2”).

AI automatically:
- Breaks the goal into modules.
- Generates study tasks for each module.
- Allows user to adjust manually.

### 3.2. Progress Tracking
Each layer has dynamic progress:
- Goal progress = average(module progress)
- Module progress = completed_tasks / total_tasks
- Task completion tracked individually

### 3.3. Study Notes & Insights
Notes divided into:
- **Lesson Notes**
- **Reflection Notes**
- **AI Insights**

AI automatically creates insight entries after reading user notes.

### 3.4. Recommendation Engine (AI)
AI provides:
- What to study today
- Weak areas to revisit
- Suggested resources (documentation, videos, exercises)
- Additional tasks when user is behind schedule

### 3.5. Vector Memory (optional – Full version)
Indexing:
- notes
- insights
- difficulties
- past study sessions

Used to improve AI recommendations.

---

## 4. System Design

### 4.1 Architecture Overview
Frontend (Next.js)
    ↓
Backend (Laravel)
    ├── StudyGoalService
    ├── StudyModuleService
    ├── StudyTaskService
    ├── StudyNotesService
    ├── StudyProgressEvaluator
    ├── RecommendationEngine
    ├── AI Client (Groq)
    └── Vector Engine (ChromaDB optional)
Database (PostgreSQL)

---

## 5. User Flows

### 5.1 Create Study Goal
User sets goal → Backend saves → AI → auto-generate modules → auto-generate tasks.

### 5.2 Study Session Flow
User selects module/task → reads resources → writes notes → AI summarizes → store insights.

### 5.3 Daily Study Recommendation
User asks: “Hôm nay học gì?”
Backend:
- Check progress
- Check pending tasks
- Search notes
- AI returns structured plan.

---

## 6. Database Schema

### 6.1 study_goals
id (pk)  
title  
description  
target_date  
progress  
created_at  
updated_at  

### 6.2 study_modules
id (pk)  
goal_id (fk)  
title  
description  
order_index  
progress  
estimated_hours  
created_at  
updated_at  

### 6.3 study_tasks
id (pk)  
module_id (fk)  
title  
description  
due_date  
estimated_minutes  
completed_at  
priority  
created_at  
updated_at  

### 6.4 study_notes
id (pk)  
module_id (fk)  
task_id (fk nullable)  
content  
note_type (lesson/reflection/insight)  
created_at  
updated_at  

### 6.5 study_insights
id (pk)  
related_goal_id  
related_module_id  
related_task_id  
content  
embedding_vector (optional)  
created_at  

### 6.6 study_resources
id (pk)  
goal_id  
module_id  
title  
url  
reason  
created_at  

---

## 7. AI Flows

### 7.1 Goal Breakdown Prompt
“Break down goal X into modules, include learning objectives.”

### 7.2 Task Generation Prompt
“For Module Y, generate tasks with estimated time and priority.”

### 7.3 Study Recommendation Prompt
“Based on progress + remaining tasks + notes, what should user study next?”

### 7.4 Notes Summarization Prompt
“Summarize this learning note and extract insights & weaknesses.”

---

## 8. UI/UX Specification

### 8.1 Study Dashboard
- Goal list  
- Progress graph  
- Study timeline  
- AI suggestions box  

### 8.2 Goal Detail Page
- Module list  
- Task list  
- Notes panel  
- Insights section  
- Recommended resources  

### 8.3 Study Session UI
- Task content  
- Note editor  
- AI assistant card  
- Resource panel  

---

## 9. Roadmap

### Week 1
- CRUD goals, modules, tasks  
- Manual task creation  
- Basic UI  

### Week 2
- AI task generation  
- Study Notes  
- Insight summary  

### Week 3
- Recommendation engine  
- Resource generator  
- Progress dashboard  

### Week 4
- Vector memory integration  
- Weakness detection engine  
- Smart learning assistant  

---

## 10. Summary
Study 3.0 brings:
- Structured learning  
- Deep personalization via AI  
- Long-term memory for learning patterns  
- Automated task creation  
- Insight-driven recommendations  

It transforms Life Manager into a complete AI Learning Companion.
