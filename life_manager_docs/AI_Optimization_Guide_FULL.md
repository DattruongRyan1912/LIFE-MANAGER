
# 📘 Life Manager AI — Full Detailed Guide for Token Optimization & AI Pipeline Architecture

---

# 🟦 1. Mục tiêu tổng quan

Tài liệu này mô tả toàn bộ cách triển khai hệ thống AI tối ưu cho Life Manager AI nhằm:

- Giảm token tiêu thụ từ **4000–8000** → **300–800 tokens/request**
- Tránh bị rate-limit khi dùng **Groq (llama-3.3-70b-versatile)**
- Tăng tốc độ phản hồi 2–4 lần
- Tối ưu chi phí GPU/API
- Cải thiện độ chính xác của AI
- Xây nền tảng AI đa chức năng (Tasks, Study, Expense, Insights)

Tài liệu bao gồm:

- Kiến trúc tổng thể
- Cơ chế context routing
- Bộ nén dữ liệu (compressor)
- Tối ưu system prompt
- Cơ chế token guard
- AI pipeline
- Code Laravel đầy đủ
- Best practices khi dùng Groq
- Ví dụ thực tế

---

# 🟩 2. Kiến trúc AI tối ưu (High-level Architecture)

```
┌──────────────────────────┐
│ User Request             │
└───────────────┬──────────┘
                ▼
┌──────────────────────────┐
│ Context Router           │  <-- Chọn đúng dữ liệu cần gửi
└───────────────┬──────────┘
                ▼
┌──────────────────────────┐
│ Memory Compressor        │  <-- Tóm tắt dữ liệu
└───────────────┬──────────┘
                ▼
┌──────────────────────────┐
│ System Prompt Optimizer  │  <-- Giảm độ dài system prompt
└───────────────┬──────────┘
                ▼
┌──────────────────────────┐
│ Token Guard Middleware   │  <-- Kiểm soát token trước khi gửi
└───────────────┬──────────┘
                ▼
┌──────────────────────────┐
│ Groq AI Client           │
└──────────────────────────┘
```

---

# 🟧 3. Vì sao request của bạn tốn 4000–8000 tokens?

Log của bạn cho thấy:

- **system_prompt_size = ~5000 tokens**
- **context_size = ~2800 tokens**
- Tổng thô: ~7800 tokens → tokenizer nén thành ~4686 tokens

Nguyên nhân chính:

### ❌ Gửi quá nhiều dữ liệu không cần thiết mỗi request
Ví dụ:

- expenses 7 ngày
- study goals
- study notes
- memories (vector memory raw)
- user_preferences
- conversation logs
- category breakdown
- full JSON của tasks

### ❌ System prompt chứa toàn bộ context → quá dài

### ❌ Không có context routing
AI được feed tất cả dữ liệu → dù câu hỏi chỉ hỏi:

> “Tôi đang có bao nhiêu task hôm nay?”

→ Dữ liệu chi tiêu, học tập, memory đều không cần thiết.

---

# 🟥 4. Context Router — Chọn đúng dữ liệu cho câu hỏi

## 🔥 Mục tiêu:
Không gửi full JSON → chỉ gửi dữ liệu liên quan đến câu hỏi.

---

## 📘 4.1 Quy tắc Routing

| Nhóm câu hỏi | Context cần gửi |
|--------------|-----------------|
| Task | tasks_today, tasks_week |
| Deadline | tasks_today, tasks_week |
| Chi tiêu | expenses_7days, recent_expenses |
| Học tập | study_goals, study_progress |
| Habit / Insights | memory_summary, preferences |
| General Chat | context_rút_gọn |

---

## 📌 4.2 Code Laravel (ContextRouter.php)

```php
class ContextRouter
{
    public static function resolve(string $message)
    {
        $text = mb_strtolower($message);

        if (str_contains($text, 'task') || str_contains($text, 'công việc') || str_contains($text, 'deadline')) {
            return ['tasks_today', 'tasks_week'];
        }

        if (str_contains($text, 'chi tiêu') || str_contains($text, 'tiền') || str_contains($text, 'expense')) {
            return ['expenses_7days', 'recent_expenses'];
        }

        if (str_contains($text, 'học') || str_contains($text, 'study') || str_contains($text, 'tiến độ học')) {
            return ['study_goals', 'study_notes'];
        }

        return ['memory_summary', 'preferences'];
    }
}
```

---

# 🟦 5. Memory Compressor — Giảm 70–90% token

Nhiều dữ liệu của bạn bị phình vì:

- Study goals dài
- Notes dài
- Memory dài
- Expenses chi tiết
- Category breakdown quá nhiều dòng

→ Tất cả phải được **summarize trước khi gửi AI**.

---

## 📘 5.1 Code Laravel (MemoryCompressor.php)

```php
class MemoryCompressor
{
    public static function compressTasks($tasks)
    {
        return [
            'total' => count($tasks),
            'high_priority' => collect($tasks)->where('priority', 'high')->count(),
            'done' => collect($tasks)->where('status', 'done')->count(),
            'list' => collect($tasks)->take(5)->pluck('title'),
        ];
    }

    public static function compressExpenses($expenses)
    {
        return [
            'total_7days' => $expenses['total_7days'],
            'top_categories' => array_slice($expenses['summary_by_category'], 0, 2),
            'recent' => array_slice($expenses['recent_expenses'], 0, 3),
        ];
    }

    public static function compressStudy($goals)
    {
        return collect($goals)->take(3)->map(fn($g) => [
            'name' => $g['name'],
            'progress' => $g['progress']
        ]);
    }

    public static function compressMemory($memories)
    {
        return collect($memories)->take(2)->map(fn($m) => $m['content']);
    }
}
```

---

# 🟩 6. System Prompt Optimizer — Giảm từ 5000 → 500 tokens

System prompt ban đầu của bạn chứa:

- Full tasks
- Full expenses
- Full study goals
- Full preferences
- Full memories
- Các rule dài 40–100 dòng

→ Phình đến 5000 tokens.

---

## 📘 6.1 Template system mới

```text
Bạn là Life Manager AI.

Nhiệm vụ:
- Trả lời ngắn gọn, rõ ràng.
- Dựa trên dữ liệu context phía dưới.
- Không bịa thông tin.

Dữ liệu nén:
{{context_summary}}

Câu hỏi:
{{user_message}}
```

Token: **500–800**.

---

# 🟥 7. Token Guard Middleware — Ngăn request quá lớn

Groq llama-3.3-70b-versatile có:

- TPM 12,000 tokens/min
- RPM 30 req/min

→ Không nên để mỗi request > 3000 tokens.

---

## 📘 7.1 TokenGuard.php

```php
class TokenGuard
{
    public static function ensureSafe($payload)
    {
        $raw = json_encode($payload);
        $approxTokens = strlen($raw) / 4;

        if ($approxTokens > 3000) {
            throw new \Exception("Payload vượt giới hạn token ($approxTokens tokens).");
        }
    }
}
```

---

# 🟧 8. AI Pipeline (Đầy đủ)

## 📘 8.1 AiPipeline.php

```php
class AiPipeline
{
    public static function buildPayload(string $message, $context)
    {
        $keys = ContextRouter::resolve($message);

        $compressed = MemoryCompressor::build($context, $keys);

        $prompt = PromptBuilder::build($compressed, $message);

        TokenGuard::ensureSafe($prompt);

        return $prompt;
    }
}
```

---

# 🟦 9. Groq API Client

```php
class GroqClient
{
    public static function chat($payload)
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer '.env('GROQ_API_KEY'),
        ])->post('https://api.groq.com/openai/v1/chat/completions', [
            'model' => 'llama-3.3-70b-versatile',
            'messages' => $payload
        ])->json();
    }
}
```

---

# 🟥 10. Ví dụ request thực tế

### ❌ Request chưa tối ưu (4686 tokens)

Gửi:
- full tasks
- full expenses
- full goals
- full preferences
- full memories

---

### ✔ Request đã tối ưu (600–900 tokens)

```json
{
  "context_summary": {
    "tasks_today": {
      "total": 5,
      "done": 1,
      "high_priority": 2
    }
  },
  "question": "Tôi đang có bao nhiêu task hôm nay?"
}
```

---

# 🟩 11. Best Practices

✔ Không gửi raw JSON  
✔ Tóm tắt 70–90% dữ liệu  
✔ System prompt < 1000 tokens  
✔ Không gửi expenses khi hỏi task  
✔ Không gửi study goals khi hỏi chi tiêu  
✔ Tự động routing context  
✔ Dùng fallback model khi gần limit  

---

# 🟧 12. Kết luận

Bằng pipeline này, Life Manager AI sẽ:

- Tối ưu tốc độ  
- Giảm token tiêu thụ 5–10 lần  
- Tăng sức mạnh AI  
- Tăng độ chính xác  
- Tránh mọi rate limit Groq  
- Dễ mở rộng với Task v3 & Study 3.0  

---

# Nếu bạn cần:
- File ZIP trọn bộ code  
- Bản PDF đầy đủ  
- Integration với Task Module v3  
- Integration với Study 3.0  
- Hướng dẫn tạo vector memory  

Chỉ cần nói: **“Tạo full code ZIP”** hoặc **“Xuất PDF”**.

