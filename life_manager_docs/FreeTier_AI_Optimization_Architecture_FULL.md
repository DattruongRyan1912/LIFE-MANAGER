
# FreeTier AI Optimization Architecture — Life Manager AI

## 1. Mục tiêu
Tài liệu này hướng dẫn triển khai pipeline AI tối ưu token để sử dụng Groq Free Tier (0$) nhưng vẫn đạt hiệu năng gần tương đương Developer Tier. Hệ thống đảm bảo:
- Giảm 70–95% token gửi vào model lớn (70B)
- Không bao giờ bị rate-limit Free Tier
- Tăng tốc độ trả lời
- Giảm chi phí xuống mức 0
- Duy trì chất lượng reasoning cao

## 2. Tổng quan kiến trúc
```
User Request
 ↓
groq/compound
 → Intent detection
 → Clean question
 ↓
llama-3.1-8b-instant
 → Rewrite + structure question
 ↓
groq/compound-mini
 → Compress context
 ↓
llama-3.3-70b-versatile
 → Main reasoning
 ↓
allam-2-7b
 → Summary + formatting
 ↓
User Response
```

## 3. Mô tả từng thành phần
### 3.1 groq/compound — Intent Classifier
- TPM: 200K (siêu lớn)
- Dùng để xác định loại intent: task, study, expense, planning, note…
- Giảm 40–70% context không cần thiết.

### 3.2 llama-3.1-8b-instant — Pre Reasoning / Rewrite
- TPM: 250K
- Dùng để rewrite câu hỏi mơ hồ thành yêu cầu rõ ràng.
- Giảm gánh nặng cho model lớn.

### 3.3 groq/compound-mini — Context Compressor
- Tóm tắt JSON dài thành 200–400 token.
- Loại bỏ field không quan trọng.

### 3.4 llama-3.3-70b-versatile — Main Reasoning Layer
- Thực hiện logic phức tạp, planning, phân tích mô hình…
- Nhận input đã được nén để tiết kiệm token.

### 3.5 allam-2-7b — Output Optimizer
- Tóm tắt kết quả 70B thành câu trả lời ngắn, rõ ràng.
- Tiết kiệm output tokens.

## 4. Memory Router Design
Memory được chia thành nhóm:
- task_memory
- study_memory
- expense_memory
- preference_memory
- conversation_memory

groq/compound xác định nhóm nào cần gửi đi tùy theo intent.

## 5. Quy trình chi tiết
### Bước 1: Detect Intent
```
Input: "Tôi còn bao nhiêu task hôm nay?"
Output: {"intent": "task"}
```

### Bước 2: Rewrite
```
"Hãy liệt kê các task trong tasks_today có status != done"
```

### Bước 3: Compress context
Input task JSON 2000 tokens → 200 tokens.

### Bước 4: Pass vào 70B
Input còn ~400–600 tokens thay vì 3000–5000 tokens.

### Bước 5: Output Formatter
70B output 600 tokens → còn 200 tokens.

## 6. So sánh before/after
### Before optimization
- 3000–6000 tokens/request
- Dễ bị limit 12K TPM của Free Tier
- Tốc độ chậm

### After optimization
- 400–900 tokens/request
- Không bao giờ đụng limit
- Tốc độ nhanh hơn 2–4 lần

## 7. Laravel Implementation Sketch
```
app/AI/
    IntentClassifier.php
    PromptRewriter.php
    ContextCompressor.php
    MemoryRouter.php
    Reasoning70B.php
    OutputFormatter.php
    SmartAIService.php
```

## 8. SmartAIService (pseudo code)
```
$intent = IntentClassifier::run($userMessage);
$context = MemoryRouter::fetch($intent);
$rewrite = PromptRewriter::rewrite($userMessage);
$compressed = ContextCompressor::compress($context);
$answer = Reasoning70B::ask($rewrite, $compressed);
return OutputFormatter::shorten($answer);
```

## 9. Lợi ích tổng thể
- Không bao giờ limit Free Tier
- Token giảm mạnh
- Tốc độ phản hồi tăng
- Duy trì chất lượng 70B
- Không tốn tiền

## 10. Kết luận
Pipeline này giúp Life Manager AI chạy nhanh, mạnh, rẻ và ổn định trong Free Tier của Groq.
