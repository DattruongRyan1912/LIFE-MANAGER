# AI Metrics Dashboard

## Mô tả
Component **MetricsDashboard** hiển thị real-time performance metrics của AI Pipeline, bao gồm:
- Pipeline mode (Smart/Direct)
- Response time
- Token usage và savings
- Cost tracking
- Chi tiết từng layer (6 layers)

## Cách sử dụng

### 1. Import component
```tsx
import { MetricsDashboard } from '@/components/assistant/MetricsDashboard';
```

### 2. Sử dụng trong page
```tsx
<MetricsDashboard 
  metrics={lastMetrics}      // Metrics data từ API response
  mode={lastMode}            // 'smart' hoặc 'direct'
  intent={lastIntent}        // Intent classification result
  isVisible={showMetrics}    // Toggle hiển thị/ẩn
/>
```

## Features

### 1. Overview Cards
- **Pipeline Mode**: Hiển thị Smart/Direct mode và intent
- **Response Time**: Total time (seconds) với breakdown ms
- **Token Usage**: Số tokens đã dùng + % tiết kiệm
- **Cost**: Chi phí (Free Tier = $0)

### 2. Token Optimization Progress Bar
- So sánh Smart Pipeline vs Direct Approach
- Hiển thị số tokens tiết kiệm được
- Progress bar trực quan

### 3. Layer Performance Breakdown
Hiển thị chi tiết 6 layers:

#### Layer 1: Intent Classification
- Model: groq/compound (200K TPM)
- Output: Intent result (study/task/expense/general)
- Metrics: Time, tokens

#### Layer 2: Prompt Rewriting  
- Model: llama-3.1-8b-instant (250K TPM)
- Output: Rewritten prompt
- Metrics: Time, tokens

#### Layer 3: Context Compression
- Model: groq/compound-mini (High TPM)
- Output: Compressed context size
- Metrics: Original → Compressed bytes, time, tokens

#### Layer 4: Memory Routing
- Model: Local Logic
- Output: Number of relevant memories
- Metrics: Time, tokens

#### Layer 5: Main Reasoning
- Model: llama-3.3-70b-versatile (6K TPM)
- Output: AI response
- Metrics: Input/Output tokens, time

#### Layer 6: Output Formatting
- Model: allam-2-7b
- Output: Formatted response
- Metrics: Original → Formatted length, time, tokens

## Props Interface

```typescript
interface MetricsDashboardProps {
  metrics: MetricsData | null;  // Metrics từ API
  mode?: 'smart' | 'direct';     // Pipeline mode
  intent?: string;               // Intent classification
  isVisible?: boolean;           // Hiển thị/ẩn dashboard
}

interface MetricsData {
  pipeline_version?: string;
  layers?: {
    intent?: LayerMetric;
    rewrite?: LayerMetric;
    compression?: LayerMetric;
    memory?: LayerMetric;
    reasoning?: LayerMetric;
    formatting?: LayerMetric;
  };
  total?: {
    time_ms?: number;
    estimated_tokens?: number;
    token_savings?: number;
    cost_usd?: number;
  };
}
```

## API Response Format

Backend cần trả về metrics theo format:
```json
{
  "message": "AI response here",
  "mode": "smart",
  "intent": "study",
  "metrics": {
    "pipeline_version": "smart_v1",
    "layers": {
      "intent": {
        "result": "study",
        "time_ms": 150,
        "estimated_tokens": 150
      },
      "rewrite": {
        "original": "User question",
        "rewritten": "Optimized question",
        "time_ms": 200,
        "estimated_tokens": 250
      },
      "compression": {
        "original_size": 2500,
        "compressed_size": 1100,
        "time_ms": 300,
        "estimated_tokens": 400
      },
      "memory": {
        "memories_count": 2,
        "time_ms": 50,
        "estimated_tokens": 100
      },
      "reasoning": {
        "response_length": 800,
        "time_ms": 1200,
        "estimated_input_tokens": 700,
        "estimated_output_tokens": 200
      },
      "formatting": {
        "original_length": 800,
        "formatted_length": 750,
        "time_ms": 400,
        "estimated_tokens": 300
      }
    },
    "total": {
      "time_ms": 2300,
      "estimated_tokens": 1100,
      "token_savings": 2400,
      "cost_usd": 0
    }
  }
}
```

## Toggle Metrics

Trong assistant page có switch để bật/tắt metrics:
```tsx
const [showMetrics, setShowMetrics] = useState(true);

<Switch
  id="metrics-toggle"
  checked={showMetrics}
  onCheckedChange={setShowMetrics}
/>
```

## Styling

Dashboard sử dụng:
- **shadcn/ui** components (Card, Badge, Progress)
- **Lucide icons** cho visual elements
- **Tailwind CSS** cho responsive design
- **Color-coded layers** để dễ phân biệt

## Performance Tips

1. **Chỉ hiển thị khi cần**: Sử dụng `isVisible` prop
2. **Metrics mới nhất**: Chỉ lưu metrics của response cuối cùng
3. **Không re-render**: Dashboard chỉ update khi có metrics mới

## Demo

Test dashboard bằng cách gửi tin nhắn trong assistant chat:
1. Reload frontend: http://localhost:3000/assistant
2. Gửi câu hỏi bất kỳ
3. Metrics sẽ hiển thị ở trên chat interface
4. Toggle switch để ẩn/hiện metrics

## Dependencies

```json
{
  "@/components/ui/card": "Card components",
  "@/components/ui/badge": "Badge component",
  "@/components/ui/progress": "Progress bar",
  "@/components/ui/switch": "Toggle switch",
  "@/components/ui/label": "Form labels",
  "lucide-react": "Icon library"
}
```

Tất cả dependencies đã có sẵn trong project.
