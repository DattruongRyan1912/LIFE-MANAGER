# DB SCHEMA – LIFE MANAGER AI
(full content from conversation)

---

# ============================================
# 📦 **2) DB_SCHEMA.md**
# ============================================

```md
# DATABASE SCHEMA – LIFE MANAGER AI

---

# 1. TASKS
| field              | type        |
|-------------------|-------------|
| id                | int         |
| title             | string      |
| priority          | enum        |
| due_at            | datetime    |
| estimated_minutes | int         |
| done              | boolean     |
| created_at        | timestamp   |

---

# 2. EXPENSES
| field     | type      |
|-----------|-----------|
| id        | int       |
| amount    | int       |
| category  | string    |
| note      | text      |
| spent_at  | datetime  |
| created_at| timestamp |

---

# 3. STUDY_GOALS
| field     | type       |
|-----------|------------|
| id        | int        |
| name      | string     |
| progress  | int        |
| deadline  | date       |

---

# 4. DAILY_LOGS
| field     | type      |
|-----------|-----------|
| id        | int       |
| date      | date      |
| summary   | text      |
| ai_feedback | text    |

---

# 5. LONG_TERM_MEMORY
| field  | type   |
|--------|--------|
| id     | int    |
| key    | string |
| value  | json   |

---

# MIGRATION MẪU – TASKS

```php
Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->enum('priority', ['low','medium','high'])->default('medium');
    $table->dateTime('due_at');
    $table->integer('estimated_minutes')->nullable();
    $table->boolean('done')->default(false);
    $table->timestamps();
});
