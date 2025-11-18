"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  GraduationCap, 
  MessageSquare,
  Home,
  Calendar,
  Clock,
  PieChart,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  name: string
  href?: string
  icon: any
  children?: MenuItem[]
}

const navigation: MenuItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { 
    name: "Tasks", 
    icon: CheckSquare,
    children: [
      { name: "All Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Timeline", href: "/timeline", icon: Calendar },
      { name: "Pomodoro", href: "/pomodoro", icon: Clock },
    ]
  },
  { 
    name: "Expenses", 
    icon: Wallet,
    children: [
      { name: "All Expenses", href: "/expenses", icon: Wallet },
      { name: "Insights", href: "/expense-insights", icon: PieChart },
    ]
  },
  { name: "Study Goals", href: "/study", icon: GraduationCap },
  { name: "AI Assistant", href: "/assistant", icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    )
  }

  const isExpanded = (sectionName: string) => expandedSections.includes(sectionName)

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.href ? pathname === item.href : false
    const isChildActive = item.children?.some(child => child.href === pathname)
    const expanded = isExpanded(item.name)

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSection(item.name)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isChildActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              {item.name}
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {expanded && item.children && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-2">
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.href!}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          level > 0 && "text-sm",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.name}
      </Link>
    )
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <h1 className="text-xl font-bold bg-linear-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            Life Manager AI
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map(item => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="text-xs text-muted-foreground">
            © 2025 Life Manager AI
          </div>
        </div>
      </div>
    </div>
  )
}
