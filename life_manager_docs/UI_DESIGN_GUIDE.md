# 🎨 LIFE MANAGER AI – UI DESIGN GUIDELINE  
Tài liệu dùng để ép AI sinh ra UI đúng phong cách hiện đại, tối giản, đẹp và đồng nhất.

---

# 1️⃣ MỤC TIÊU UI CỦA DỰ ÁN

- Tối giản (Minimalist)
- Rõ ràng (Clean)
- Tinh tế như Linear / Notion / Apple
- Dùng TailwindCSS + shadcn/ui
- Không màu mè, không viền dư
- Chỉ dùng palette: neutral + 1 accent color
- Layout giống SaaS hiện đại

---

# 2️⃣ CÁC KEYWORD UI QUAN TRỌNG NHẤT

## 🟦 PHONG CÁCH
- "Minimalist UI"
- "Modern SaaS dashboard"
- "Linear-inspired design"
- "Notion-like layout"
- "Apple-style clean UI"
- "Vercel-style monochrome aesthetic"
- "Tailwind + shadcn/ui only"

## 🟩 TONE & MÀU
- "muted grayscale palette"
- "neutral foreground"
- "soft background surfaces"
- "accent color #6366f1 (indigo) or #0ea5e9 (sky)"

## 🟧 LAYOUT
- "3-column responsive card layout"
- "fixed left sidebar + scrollable main"
- "dashboard KPI row (4 cards)"
- "AI chat layout like ChatGPT"

## 🟥 COMPONENT STYLE
- "rounded-xl card with subtle shadow-sm"
- "soft borders (border-gray-200)"
- "spacing scale: p-6, p-8, gap-6"
- "large title (text-2xl font-semibold)"
- "text-sm for labels"

## 🟫 TRÁNH
- "do NOT use default HTML button"
- "do NOT use bootstrap"
- "do NOT use bright colors"
- "no heavy borders"
- "avoid clutter"

---

# 3️⃣ QUY TẮC SỬ DỤNG SHADCN/UI

Dùng các component sau:

- `<Card />`
- `<Button />`
- `<Input />`
- `<Textarea />`
- `<Tabs />`
- `<Dialog />`
- `<Sheet />`
- `<Skeleton />`
- `<Badge />`
- `<ScrollArea />`

## Quy tắc:
- Luôn wrap các phần block bằng `<Card>`
- Button phải dùng shadcn Button
- Input/Textarea cũng dùng shadcn
- Icons lấy từ **lucide-react**

---

# 4️⃣ LAYOUT CHUẨN CHO DỰ ÁN

## 🎯 DASHBOARD LAYOUT
┌───────────────────────────────┐
│ Sidebar (fixed) │
├───────────────────────────────┤
│ Header (date + greeting) │
├───────────────────────────────┤
│ KPI Cards (grid) │
├───────────────────────────────┤
│ AI Timeline Today │
├───────────────────────────────┤
│ Expenses / Study Progress │
└───────────────────────────────┘


## 🎯 AI CHAT LAYOUT
- Left sidebar (history optional)
- Main area: Chat thread
- Bottom: sticky input box

## 🎯 TASK LIST LAYOUT
- Filter bar (Today / Week)
- List: Card rows
- Badge: priority
- Checkbox round + animation

---

# 5️⃣ TAILWIND STYLE RULES

## Spacing
p-6
p-8
gap-6
gap-8
## Typography
text-2xl font-semibold → tiêu đề lớn
text-base → nội dung
text-sm text-muted-foreground → label
## Colors (palette chuẩn)
bg-neutral-50
bg-neutral-100
border-neutral-200
text-neutral-900
text-muted-foreground
## Shadows
shadow-sm
shadow-md (rất nhẹ)
## Radius
rounded-xl
rounded-2xl (hero areas)

---

# 6️⃣ PROMPT MẪU ĐỂ ÉP AI TẠO UI ĐẸP

## 🔥 Prompt chuyên nghiệp
+ Use this prompt every time when asking AI for UI code:

++ Build a clean, modern, minimalist UI using:

+++ Next.js App Router

+++ TailwindCSS

+++ shadcn/ui components

+++ Lucide icons

++ Design style guidelines:

+++ Inspired by Linear, Vercel and Notion

+++ Monochrome palette with one accent color

+++ Neutral background, subtle shadows, soft borders

+++ Card-based layout with rounded-xl

+++ Spacious layout (gap-6, p-6, p-8)

+++ No gradients, no heavy borders, no clutter

++ Rules:

+++ Do NOT use default HTML button/input

+++ Use shadcn/ui Button, Input, Card, Tabs, Dialog

+++ Use mobile-first responsive layout

+++ Components must be modular and reusable

## 🔥 Prompt dành riêng cho dự án Life Manager
When generating UI code, follow this design:

+++ Life Dashboard with KPI stats

+++ Task Manager with priority badges

+++ Expense Tracker with clean rows

+++ AI Assistant chat like ChatGPT

+++ Use card-based UI with rounded-xl

+++ Use Tailwind spacing scale

+++ Keep the interface minimal and calm

+++ Use shadcn/ui for all components.
Do not invent your own HTML styling.


---

# 7️⃣ COMPONENT STYLE GUIDE

## 🟦 KPI CARD
- Big number  
- Subtext  
- Icon (lucide)  
- bg-neutral-50 border-neutral-200  

## 🟩 TASK ITEM
- Checkbox left  
- Title  
- Priority badge  
- Due time right  

## 🟧 EXPENSE ITEM
- Amount large  
- Note small  
- Category badge  

## 🟥 TIMELINE BLOCK (AI)
- Time range  
- Title  
- Priority color indicator  

## 🟪 CHAT MESSAGE
- AI bubble: neutral surface  
- User bubble: accent surface  
- Timestamp muted  

---

# 8️⃣ COLOR PALETTE (Recommended)

### Light mode:
bg: #f9fafb
foreground: #111
border: #e5e7eb
accent: #6366f1 (indigo) or #0ea5e9 (sky)
muted: #6b7280


### Dark mode:
bg: #111
surface: #181818
border: #2d2d2d
accent: #6366f1
text: #f9fafb
muted: #9ca3af


---

# 9️⃣ CODE SNIPPET MẪU

## Card KPI
```tsx
<Card className="p-6 rounded-xl shadow-sm">
  <div className="text-muted-foreground text-sm">Tasks Today</div>
  <div className="text-3xl font-bold mt-2">6</div>
</Card>
```

### Task Item
``` tsx
<Card className="p-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <Checkbox />
    <span className="font-medium">Finish report</span>
  </div>
  <Badge variant="outline">High</Badge>
</Card>
```

### Chat Input

``` tsx
<div className="border-t p-4 flex items-center gap-3">
  <Input placeholder="Message the assistant..." className="flex-1" />
  <Button>Send</Button>
</div>

```