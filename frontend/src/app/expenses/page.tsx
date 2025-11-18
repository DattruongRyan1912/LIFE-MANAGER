'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/formatter'

interface Expense {
  id: number
  amount: number
  category: string
  note?: string
  spent_at: string
}

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [last7, setLast7] = useState<Expense[]>([])

  // Form
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Ăn uống')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    loadAll()
    load7Days()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const res = await fetch('/api/expenses')
      const data = await res.json()
      setExpenses(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function load7Days() {
    try {
      const res = await fetch('/api/expenses/7days')
      const data = await res.json()
      setLast7(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return

    const payload = {
      amount: Math.round(Number(amount)),
      category,
      note,
      spent_at: date + 'T12:00:00'
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setAmount('')
        setNote('')
        setCategory('Ăn uống')
        await loadAll()
        await load7Days()
      } else {
        const err = await res.json()
        console.error('Validation error', err)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const total7 = last7.reduce((s, x) => s + x.amount, 0)
  const avg7 = last7.length ? Math.round(total7 / last7.length) : 0

  const byCategory = last7.reduce((acc: Record<string, number>, ex) => {
    acc[ex.category] = (acc[ex.category] || 0) + ex.amount
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">Theo dõi chi tiêu của bạn</p>
        </div>
        <div>
          <Button onClick={() => { loadAll(); load7Days(); }} variant="outline">Refresh</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Tổng 7 ngày</p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(total7)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Trung bình / mục</p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(avg7)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Số mục</p>
            <p className="text-3xl font-bold mt-2">{last7.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Danh mục top</p>
            <p className="text-3xl font-bold mt-2">{Object.keys(byCategory).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Thêm chi tiêu</CardTitle>
            <CardDescription>Amount, Category, Note, Date</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Số tiền (VND)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>

              <div>
                <label className="text-sm font-medium">Danh mục</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option>Ăn uống</option>
                  <option>Đi lại</option>
                  <option>Giải trí</option>
                  <option>Hóa đơn</option>
                  <option>Mua sắm</option>
                  <option>Sức khỏe</option>
                  <option>Học tập</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Ghi chú</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Ngày</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <Button type="submit">Thêm</Button>
                <Button type="button" variant="outline" onClick={() => { setAmount(''); setNote(''); setCategory('Ăn uống'); setDate(new Date().toISOString().slice(0,10)); }}>Hủy</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiêu 7 ngày</CardTitle>
            <CardDescription>Danh sách chi tiết</CardDescription>
          </CardHeader>
          <CardContent>
            {last7.length === 0 ? (
              <p className="text-muted-foreground">Không có chi tiêu trong 7 ngày gần nhất</p>
            ) : (
              <div className="space-y-3">
                {last7.map((ex) => (
                  <div key={ex.id} className="flex items-start justify-between border border-border rounded-lg p-3">
                    <div>
                      <div className="font-medium">{ex.category} • {formatCurrency(ex.amount)}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(ex.spent_at)} {ex.note ? '• ' + ex.note : ''}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(ex.spent_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Category (7 days)</CardTitle>
            <CardDescription>Totals by category</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(byCategory).length === 0 ? (
              <p className="text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(byCategory).map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <div className="text-sm">{k}</div>
                    <div className="font-medium">{formatCurrency(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>Tất cả chi tiêu (mới nhất trước)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-24 flex items-center justify-center">Loading...</div>
            ) : (
              <div className="space-y-2">
                {expenses.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div>
                      <div className="font-medium">{ex.category} • {formatCurrency(ex.amount)}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(ex.spent_at)} {ex.note ? '• ' + ex.note : ''}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(ex.spent_at).toLocaleString('vi-VN')}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
