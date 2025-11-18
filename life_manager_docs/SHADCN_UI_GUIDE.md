# SHADCN UI INTEGRATION GUIDE
**Life Manager AI - Component Library Documentation**

---

## 📦 INSTALLATION SUMMARY

### Packages Installed
```json
{
  "tailwindcss": "^3.x",
  "postcss": "^8.x",
  "autoprefixer": "^10.x",
  "tailwindcss-animate": "^1.x",
  "class-variance-authority": "^0.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x",
  "@radix-ui/react-slot": "^1.x",
  "lucide-react": "^0.x"
}
```

### Migration Notes
- **Migrated from**: Tailwind CSS v4 (beta)
- **Migrated to**: Tailwind CSS v3.x (stable)
- **Reason**: Shadcn UI requires Tailwind v3 for compatibility

---

## 🎨 DESIGN SYSTEM

### Color System (HSL Variables)
```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: 221.2 83.2% 53.3%;
--primary-foreground: 210 40% 98%;
--destructive: 0 84.2% 60.2%;
--border: 214.3 31.8% 91.4%;
--ring: 221.2 83.2% 53.3%;

/* Dark Mode */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--primary: 217.2 91.2% 59.8%;
--destructive: 0 62.8% 30.6%;
```

### Custom Life Manager AI Variables
```css
/* Priority System */
--priority-high: #ef4444;
--priority-high-bg: #fee2e2; /* light */ / #7f1d1d /* dark */
--priority-medium: #f59e0b;
--priority-medium-bg: #fef3c7; /* light */ / #78350f /* dark */
--priority-low: #10b981;
--priority-low-bg: #d1fae5; /* light */ / #14532d /* dark */

/* Text Hierarchy */
--text-primary: #111827; /* light */ / #f8fafc /* dark */
--text-secondary: #4b5563; /* light */ / #cbd5e1 /* dark */
--text-tertiary: #9ca3af; /* light */ / #64748b /* dark */
```

---

## 🧩 INSTALLED COMPONENTS

### 1. Button Component
**Location**: `/frontend/src/components/ui/button.tsx`

**Variants**:
- `default` - Primary blue button
- `destructive` - Red danger button
- `outline` - Bordered button
- `secondary` - Gray secondary button
- `ghost` - No background, hover effect
- `link` - Text link style

**Sizes**:
- `default` - h-9 px-4 py-2
- `sm` - h-8 px-3 (small)
- `lg` - h-10 px-8 (large)
- `icon` - h-9 w-9 (square for icons)

**Usage Example**:
```tsx
import { Button } from "@/components/ui/button"

// Primary button
<Button variant="default">Save Task</Button>

// Danger button
<Button variant="destructive">Delete</Button>

// Small outline button
<Button variant="outline" size="sm">Cancel</Button>

// Icon button with Lucide icon
<Button variant="ghost" size="icon">
  <PlusIcon className="h-4 w-4" />
</Button>
```

### 2. Card Component
**Location**: `/frontend/src/components/ui/card.tsx`

**Subcomponents**:
- `Card` - Container with border, shadow, rounded corners
- `CardHeader` - Top section with padding
- `CardTitle` - Bold title text
- `CardDescription` - Muted description text
- `CardContent` - Main content area
- `CardFooter` - Bottom action area

**Usage Example**:
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Today's Tasks</CardTitle>
    <CardDescription>3 tasks remaining</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Task list here */}
  </CardContent>
  <CardFooter>
    <Button>Add Task</Button>
  </CardFooter>
</Card>
```

### 3. Input Component
**Location**: `/frontend/src/components/ui/input.tsx`

**Features**:
- Consistent styling with design system
- Focus ring with primary color
- Disabled state support
- Full TypeScript support

**Usage Example**:
```tsx
import { Input } from "@/components/ui/input"

// Text input
<Input
  type="text"
  placeholder="Task title..."
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>

// Email input
<Input
  type="email"
  placeholder="your@email.com"
  disabled={loading}
/>
```

---

## 🔧 CONFIGURATION FILES

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class", // Enable class-based dark mode
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### postcss.config.mjs
```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

---

## 🛠️ UTILITY FUNCTIONS

### cn() - ClassName Merger
**Location**: `/frontend/src/lib/utils.ts`

Combines `clsx` (conditional classes) + `tailwind-merge` (deduplicates Tailwind classes)

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage Example**:
```tsx
// Conditional classes
<div className={cn(
  "p-4 rounded-lg",
  isActive && "bg-primary text-white",
  !isActive && "bg-gray-100"
)} />

// Override Tailwind classes (twMerge deduplicates)
<Button className={cn(buttonVariants({ variant }), "px-8")} />
// px-4 from buttonVariants is replaced by px-8
```

---

## 📋 ADDING MORE COMPONENTS

### Installation Command
```bash
npx shadcn@latest add [component-name]
```

### Recommended Components for Life Manager AI

#### For Forms
```bash
npx shadcn@latest add form label textarea select checkbox radio-group
```

#### For Data Display
```bash
npx shadcn@latest add table badge avatar separator progress
```

#### For Feedback
```bash
npx shadcn@latest add dialog alert toast popover
```

#### For Navigation
```bash
npx shadcn@latest add tabs dropdown-menu navigation-menu
```

#### For Date/Time
```bash
npx shadcn@latest add calendar date-picker
```

---

## 🎯 USAGE BEST PRACTICES

### 1. Component Composition
✅ **Good**: Use Shadcn components as building blocks
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function TaskCard({ task }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{task.description}</p>
        <Button variant="outline">Edit</Button>
      </CardContent>
    </Card>
  )
}
```

### 2. Custom Styling
✅ **Good**: Extend with className prop
```tsx
<Button className="w-full mt-4" variant="default">
  Submit
</Button>
```

❌ **Avoid**: Inline styles (breaks design system)
```tsx
<Button style={{ width: '100%', marginTop: '16px' }}>
  Submit
</Button>
```

### 3. Dark Mode
✅ **Good**: Use CSS variables
```tsx
<div className="bg-background text-foreground border-border">
  Content adapts to light/dark mode automatically
</div>
```

### 4. Custom Variants
✅ **Good**: Extend component variants with CVA
```tsx
import { cva } from "class-variance-authority"

const taskCardVariants = cva(
  "rounded-lg border p-4",
  {
    variants: {
      priority: {
        high: "border-red-500 bg-red-50 dark:bg-red-950",
        medium: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
        low: "border-green-500 bg-green-50 dark:bg-green-950",
      },
    },
  }
)

<div className={taskCardVariants({ priority: task.priority })}>
  {task.title}
</div>
```

---

## 🌓 DARK MODE IMPLEMENTATION

### Theme Toggle Component
**Location**: `/frontend/src/components/ThemeToggle.tsx`

```tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = stored || (prefersDark ? "dark" : "light")
    
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  )
}
```

---

## 🔄 MIGRATION FROM CUSTOM COMPONENTS

### Before (Custom Component)
```tsx
// Old TaskCard.tsx
export function TaskCard({ task }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="font-bold text-lg">{task.title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{task.description}</p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        Edit
      </button>
    </div>
  )
}
```

### After (Shadcn Components)
```tsx
// New TaskCard.tsx with Shadcn UI
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function TaskCard({ task }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{task.description}</p>
        <Button variant="default" className="mt-4">
          Edit
        </Button>
      </CardContent>
    </Card>
  )
}
```

**Benefits**:
- ✅ Consistent design system
- ✅ Automatic dark mode support
- ✅ Accessible by default
- ✅ Less custom CSS to maintain
- ✅ TypeScript props validation

---

## 📚 RESOURCES

### Official Documentation
- **Shadcn UI**: https://ui.shadcn.com
- **Tailwind CSS v3**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/primitives
- **CVA**: https://cva.style/docs

### Component Browser
- Browse all components: `npx shadcn@latest`
- View component code: https://ui.shadcn.com/docs/components

### Icons
- **Lucide React**: https://lucide.dev
- Usage: `import { CheckIcon, XIcon } from "lucide-react"`

---

## ✅ NEXT STEPS FOR LIFE MANAGER AI

### Phase 1: Refactor Existing Components
- [ ] Refactor TaskCard to use Shadcn Card
- [ ] Replace custom buttons with Shadcn Button
- [ ] Update form inputs to Shadcn Input

### Phase 2: Enhance UI with New Components
- [ ] Add Dialog for task creation/editing
- [ ] Add Toast notifications for actions
- [ ] Add Calendar for date picking
- [ ] Add Badge for task status/priority

### Phase 3: Build Dashboard with Shadcn
- [ ] KPI cards with Card component
- [ ] Data tables with Table component
- [ ] Charts integration with custom Card wrappers
- [ ] Navigation with Tabs/Navigation-menu

### Phase 4: Polish & Accessibility
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Focus management
- [ ] ARIA labels verification

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot find module '@/components/ui/button'"
**Solution**: Check `tsconfig.json` has path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Styles not applying
**Solution**: Restart dev server after changing `globals.css` or `tailwind.config.ts`

### Issue: Dark mode not working
**Solution**: Ensure `darkMode: "class"` in `tailwind.config.ts` and `<html>` has `class="dark"`

---

**Last Updated**: November 18, 2025  
**Version**: Shadcn UI + Tailwind v3 Migration Complete
