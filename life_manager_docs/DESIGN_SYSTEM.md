# Life Manager AI - Design System Guide

## 🎨 Color Palette

### Brand Colors
- **Primary (Blue)**: `#3b82f6` - Main brand color, used for CTAs and important UI elements
- **Secondary (Violet)**: `#8b5cf6` - Secondary actions and accents
- **Accent (Cyan)**: `#06b6d4` - Highlights and special features

### Semantic Colors
- **Success (Green)**: `#10b981` - Success states, completed tasks
- **Warning (Amber)**: `#f59e0b` - Warnings, medium priority
- **Error (Red)**: `#ef4444` - Errors, high priority, critical items
- **Info (Blue)**: `#3b82f6` - Information, tips

### Task Priority Colors
- **High Priority**: Red (`#ef4444`) with light red background (`#fee2e2`)
- **Medium Priority**: Amber (`#f59e0b`) with light amber background (`#fef3c7`)
- **Low Priority**: Green (`#10b981`) with light green background (`#d1fae5`)

---

## 🔤 Typography

### Font Families
- **Sans-serif**: Geist Sans (primary), system-ui fallback
- **Monospace**: Geist Mono (code, technical content)

### Font Sizes
- **Text xs**: 0.75rem (12px)
- **Text sm**: 0.875rem (14px)
- **Text base**: 1rem (16px)
- **Text lg**: 1.125rem (18px)
- **Text xl**: 1.25rem (20px)
- **Text 2xl**: 1.5rem (24px)
- **Text 3xl**: 1.875rem (30px)

---

## 📐 Spacing

### Standard Spacing Scale
- **xs**: 0.5rem (8px)
- **sm**: 0.75rem (12px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

---

## 🔘 Components

### Buttons

#### Primary Button
```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
  Secondary Action
</button>
```

#### Danger Button
```tsx
<button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Delete
</button>
```

### Cards

#### Basic Card
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  Card Content
</div>
```

#### Hover Card
```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  Interactive Card
</div>
```

### Inputs

#### Text Input
```tsx
<input 
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="Enter text..."
/>
```

#### Select
```tsx
<select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Option 1</option>
</select>
```

### Badges

#### Priority Badges
```tsx
// High Priority
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
  Cao
</span>

// Medium Priority
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
  Trung bình
</span>

// Low Priority
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
  Thấp
</span>
```

---

## 💡 Usage Examples

### Using Color Constants

```typescript
import { colors, classNames, getPriorityClassName } from '@/lib/colors';

// Direct color values
const buttonStyle = {
  backgroundColor: colors.primary.DEFAULT,
  color: 'white',
};

// Using class names
<button className={classNames.button.primary}>
  Click me
</button>

// Priority badge
<span className={getPriorityClassName('high')}>
  High Priority
</span>
```

### Task Card Example

```tsx
import { getPriorityColor, classNames } from '@/lib/colors';

function TaskCard({ task }) {
  const priorityColor = getPriorityColor(task.priority);
  
  return (
    <div className={classNames.card.hover}>
      <h3 className="font-bold text-lg">{task.title}</h3>
      <span 
        className="mt-2 inline-block px-3 py-1 rounded-full text-sm"
        style={{ 
          backgroundColor: priorityColor.bg,
          color: priorityColor.text 
        }}
      >
        {task.priority}
      </span>
    </div>
  );
}
```

---

## 🎯 Best Practices

### Color Usage
1. **Consistency**: Always use defined color variables instead of arbitrary values
2. **Contrast**: Ensure text has sufficient contrast (WCAG AA minimum 4.5:1)
3. **Accessibility**: Use semantic colors appropriately (green for success, red for errors)

### Component Styling
1. **Reusability**: Use predefined class names from `classNames` object
2. **Consistency**: Maintain consistent spacing, border radius, and shadows
3. **Responsive**: Always consider mobile-first design

### Naming Conventions
1. **BEM-like**: Use descriptive class names (e.g., `task-card__title`)
2. **Semantic**: Name based on purpose, not appearance
3. **Consistent**: Follow established patterns in the codebase

---

## 🔧 Customization

To customize the design system, edit:
- **Colors**: `frontend/src/lib/colors.ts`
- **Global Styles**: `frontend/src/app/globals.css`
- **Theme Variables**: CSS custom properties in `globals.css`

---

## 📱 Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Example
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

---

## 🌙 Dark Mode

Dark mode colors are automatically handled in `globals.css`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

---

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
