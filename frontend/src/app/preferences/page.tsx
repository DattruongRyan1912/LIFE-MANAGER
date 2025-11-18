"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  TrendingUp,
  DollarSign,
  BookOpen,
  Target,
  Briefcase,
  RefreshCw,
  Lightbulb,
} from "lucide-react";

interface ProductivityPattern {
  pattern: string;
  peak_hours: number[];
  confidence: number;
  hourly_distribution?: Record<string, number>;
}

interface SpendingHabits {
  average_daily: number;
  top_categories: Record<string, number>;
  spending_style: string;
  variance: number;
}

interface StudyPreferences {
  preferred_types: Record<string, number>;
  average_progress_rate: number;
  consistency: string;
  total_goals: number;
}

interface TaskPriorities {
  preferred_priority: string;
  completion_rate_by_priority: Record<string, number>;
  total_completed: number;
}

interface WorkStyle {
  style: string;
  planning_tendency: number;
  average_task_duration: number;
}

interface Preferences {
  productivity_pattern: ProductivityPattern;
  spending_habits: SpendingHabits;
  study_preferences: StudyPreferences;
  task_priorities: TaskPriorities;
  work_style: WorkStyle;
}

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/preferences/insights");
      const data = await res.json();
      setPreferences(data.preferences);
      setInsights(data.insights || []);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectNow = async () => {
    setDetecting(true);
    try {
      const res = await fetch("http://localhost:8000/api/preferences/detect");
      const data = await res.json();
      setPreferences(data.preferences);
      await fetchInsights(); // Refresh insights
    } catch (error) {
      console.error("Failed to detect preferences:", error);
    } finally {
      setDetecting(false);
    }
  };

  const getPatternLabel = (pattern: string) => {
    const labels: Record<string, string> = {
      morning_person: "🌅 Morning Person",
      afternoon_person: "☀️ Afternoon Person",
      evening_person: "🌆 Evening Person",
      night_owl: "🌙 Night Owl",
      unknown: "🤷 Unknown Pattern",
    };
    return labels[pattern] || pattern;
  };

  const getWorkStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      quick_wins: "⚡ Quick Wins (Many Small Tasks)",
      deep_work: "🧠 Deep Work (Focused Sessions)",
      balanced: "⚖️ Balanced Approach",
      unknown: "🤷 Unknown Style",
    };
    return labels[style] || style;
  };

  const getSpendingStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      consistent: "📊 Consistent Spender",
      moderate: "📈 Moderate Variability",
      variable: "📉 Variable Spending",
      unknown: "🤷 Unknown Pattern",
    };
    return labels[style] || style;
  };

  const getConsistencyLabel = (consistency: string) => {
    const labels: Record<string, string> = {
      high: "🔥 High Consistency",
      medium: "💪 Medium Consistency",
      low: "📚 Building Consistency",
      unknown: "🤷 Unknown",
    };
    return labels[consistency] || consistency;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-600">Analyzing your preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">No preferences detected yet.</p>
            <Button onClick={handleDetectNow}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Detect Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Preferences</h1>
          <p className="text-gray-600 mt-1">
            AI-detected patterns from your behavior (last 30 days)
          </p>
        </div>
        <Button onClick={handleDetectNow} disabled={detecting}>
          <RefreshCw className={`w-4 h-4 mr-2 ${detecting ? "animate-spin" : ""}`} />
          {detecting ? "Detecting..." : "Refresh"}
        </Button>
      </div>

      {/* Insights Summary */}
      {insights.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-900">Key Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-blue-800">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Productivity Pattern */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <CardTitle>Productivity Pattern</CardTitle>
          </div>
          <CardDescription>When you're most productive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-bold mb-2">
                {getPatternLabel(preferences.productivity_pattern.pattern)}
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {(preferences.productivity_pattern.confidence * 100).toFixed(0)}%
              </div>
            </div>

            {preferences.productivity_pattern.peak_hours.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Peak Hours:</div>
                <div className="flex gap-2 flex-wrap">
                  {preferences.productivity_pattern.peak_hours.map((hour) => (
                    <span
                      key={hour}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                    >
                      {hour}:00
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Style */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-500" />
            <CardTitle>Work Style</CardTitle>
          </div>
          <CardDescription>How you approach tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold">
              {getWorkStyleLabel(preferences.work_style.style)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Planning Tendency</div>
                <div className="text-lg font-semibold">
                  {(preferences.work_style.planning_tendency * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Task Duration</div>
                <div className="text-lg font-semibold">
                  {preferences.work_style.average_task_duration} min
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Priorities */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            <CardTitle>Task Priorities</CardTitle>
          </div>
          <CardDescription>Which priorities you focus on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Preferred Priority</div>
              <div className="text-2xl font-bold capitalize">
                {preferences.task_priorities.preferred_priority}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Completion Rates:</div>
              <div className="space-y-2">
                {Object.entries(preferences.task_priorities.completion_rate_by_priority).map(
                  ([priority, rate]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{priority}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{rate}%</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending Habits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <CardTitle>Spending Habits</CardTitle>
          </div>
          <CardDescription>Your expense patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Average Daily</div>
                <div className="text-2xl font-bold">
                  ${preferences.spending_habits.average_daily.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Spending Style</div>
                <div className="text-lg font-semibold">
                  {getSpendingStyleLabel(preferences.spending_habits.spending_style)}
                </div>
              </div>
            </div>

            {Object.keys(preferences.spending_habits.top_categories).length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Top Categories:</div>
                <div className="space-y-2">
                  {Object.entries(preferences.spending_habits.top_categories).map(
                    ([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm">{category}</span>
                        <span className="text-sm font-semibold">${amount.toFixed(2)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Study Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <CardTitle>Study Preferences</CardTitle>
          </div>
          <CardDescription>Your learning patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Avg Progress Rate</div>
                <div className="text-2xl font-bold">
                  {preferences.study_preferences.average_progress_rate}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Consistency</div>
                <div className="text-lg font-semibold">
                  {getConsistencyLabel(preferences.study_preferences.consistency)}
                </div>
              </div>
            </div>

            {Object.keys(preferences.study_preferences.preferred_types).length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Preferred Types:</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(preferences.study_preferences.preferred_types).map(
                    ([type, count]) => (
                      <span
                        key={type}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {type} ({count})
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
