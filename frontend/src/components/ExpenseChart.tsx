'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface Expense {
  id: number
  amount: number
  category: string
  note?: string
  spent_at: string
}

interface ExpenseChartProps {
  expenses: Expense[]
}

export function ExpenseBarChart({ expenses }: ExpenseChartProps) {
  // Group by date
  const byDate: Record<string, number> = {}
  
  expenses.forEach((ex) => {
    const date = new Date(ex.spent_at).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric'
    })
    byDate[date] = (byDate[date] || 0) + ex.amount
  })

  const sortedDates = Object.keys(byDate).sort((a, b) => {
    const dateA = new Date(a)
    const dateB = new Date(b)
    return dateA.getTime() - dateB.getTime()
  })

  const data = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Chi tiêu (VND)',
        data: sortedDates.map((date) => byDate[date]),
        backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(context.parsed.y)
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('vi-VN', {
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value)
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiêu theo ngày</CardTitle>
        <CardDescription>Biểu đồ 7 ngày gần nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpensePieChart({ expenses }: ExpenseChartProps) {
  // Group by category
  const byCategory: Record<string, number> = {}
  
  expenses.forEach((ex) => {
    byCategory[ex.category] = (byCategory[ex.category] || 0) + ex.amount
  })

  const categories = Object.keys(byCategory)
  const amounts = categories.map((cat) => byCategory[cat])

  // Predefined colors for common categories
  const categoryColors: Record<string, string> = {
    'Ăn uống': 'rgba(239, 68, 68, 0.8)',      // Red
    'Đi lại': 'rgba(59, 130, 246, 0.8)',      // Blue
    'Giải trí': 'rgba(168, 85, 247, 0.8)',    // Purple
    'Hóa đơn': 'rgba(251, 191, 36, 0.8)',     // Amber
    'Mua sắm': 'rgba(236, 72, 153, 0.8)',     // Pink
    'Sức khỏe': 'rgba(34, 197, 94, 0.8)',     // Green
    'Học tập': 'rgba(99, 102, 241, 0.8)',     // Indigo
  }

  const colors = categories.map((cat) => categoryColors[cat] || 'rgba(156, 163, 175, 0.8)')

  const data = {
    labels: categories,
    datasets: [
      {
        label: 'Chi tiêu',
        data: amounts,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(context.parsed)
            return `${label}: ${value}`
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiêu theo danh mục</CardTitle>
        <CardDescription>Phân bố 7 ngày gần nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Pie data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
