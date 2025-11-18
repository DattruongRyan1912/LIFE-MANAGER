# API SPECIFICATION – LIFE MANAGER AI

## Base URL
`/api`

---

# 1. TASKS

## GET /tasks/today
Trả về danh sách task trong ngày.

### Response
```json
[
  {
    "id": 1,
    "title": "Hoàn thành báo cáo",
    "priority": "high",
    "due_at": "2025-11-18 10:00",
    "estimated_minutes": 60,
    "done": false
  }
]
```
## POST /tasks
```json
{
  "title": "Học Docker",
  "priority": "medium",
  "due_at": "2025-11-18 14:00",
  "estimated_minutes": 45
}
```

## PATCH /tasks/{id}

```json

{ "done": true }

```
## DELETE /tasks/{id}  


# 2. EXPENSES

## GET /expenses/
```json
[
  { "amount": 120000, "category": "food", "note": "Bún bò", "spent_at": "2025-11-18 08:30" }
]

```
## POST /expenses
```json
{
  "amount": 35000,
  "category": "drink",
  "note": "Cà phê",
  "spent_at": "2025-11-18 09:00"
}

```

# 3. STUDY GOALS

## GET /study-goals
## POST /study-goals
```json
{
  "name": "English B2",
  "progress": 20,
  "deadline": "2025-12-31"
}

```

# 4. AI ASSISTANT
## POST /assistant/chat
### Body 
```json
{
  "message": "Lên kế hoạch hôm nay"
}

```

### Response
```json
{
  "response": "Dưới đây là kế hoạch hôm nay...",
  "context": { ... }
}

```

# 5. MEMORY
## GET /memory/long-term
## POST /memory/long-term

## 6. SUMMARY
### POST /assistant/daily-summary
### POST /assistant/weekly-summary

