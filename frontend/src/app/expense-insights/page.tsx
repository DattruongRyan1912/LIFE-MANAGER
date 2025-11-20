'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, PieChart, AlertCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Helper function to format VND currency
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CategoryInsight {
  category: string;
  total: number;
  count: number;
  average: number;
  percentage: number;
  change: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  largest_expense: number;
  smallest_expense: number;
}

interface Forecast {
  date: string;
  amount: number;
  confidence: string;
}

export default function ExpenseInsightsPage() {
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [insightsRes, forecastRes] = await Promise.all([
        fetch('http://localhost:8000/api/expenses/category-insights'),
        fetch('http://localhost:8000/api/expenses/forecast?days=7'),
      ]);

      const insightsData = await insightsRes.json();
      const forecastData = await forecastRes.json();

      setInsights(insightsData.insights || []);
      setForecast(forecastData.forecast || []);
      setStatistics(forecastData.statistics);
      setRecommendations(forecastData.recommendations || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Forecast Chart Data
  const forecastChartData = {
    labels: forecast.map((f) => new Date(f.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Predicted Spending',
        data: forecast.map((f) => f.amount),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Category Distribution Chart
  const categoryChartData = {
    labels: insights.map((i) => i.category),
    datasets: [
      {
        data: insights.map((i) => i.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
      },
    ],
  };

  // Category Comparison Bar Chart
  const comparisonChartData = {
    labels: insights.map((i) => i.category),
    datasets: [
      {
        label: 'Total Spending',
        data: insights.map((i) => i.total),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <PieChart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Insights</h1>
          <p className="text-muted-foreground">AI-powered spending analysis and forecasts</p>
        </div>
      </div>

      {/* Statistics Summary */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatVND(statistics.mean)}</div>
              <p className="text-xs text-muted-foreground">Daily Average</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatVND(statistics.median)}</div>
              <p className="text-xs text-muted-foreground">Median</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatVND(statistics.min)}</div>
              <p className="text-xs text-muted-foreground">Min Daily</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatVND(statistics.max)}</div>
              <p className="text-xs text-muted-foreground">Max Daily</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">±{formatVND(statistics.std_dev)}</div>
              <p className="text-xs text-muted-foreground">Std Deviation</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Spending Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={forecastChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar
            data={comparisonChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Category Insights Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Category Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.category}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-lg">{insight.category}</h3>
                    {getTrendIcon(insight.trend)}
                    <span
                      className={`text-sm ${
                        insight.change > 0 ? 'text-red-600' : insight.change < 0 ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      {insight.change > 0 ? '+' : ''}
                      {insight.change.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                    <span>Total: {formatVND(insight.total)}</span>
                    <span>Count: {insight.count}</span>
                    <span>Avg: {formatVND(insight.average)}</span>
                    <span>Share: {insight.percentage}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatVND(insight.total)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatVND(insight.smallest_expense)} - {formatVND(insight.largest_expense)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
