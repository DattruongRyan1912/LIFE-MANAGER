'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { noteAPI } from '@/lib/api/study3';
import { toast } from 'sonner';
import { Sparkles, Brain, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Insight {
  id: number;
  related_goal_id: number | null;
  related_module_id: number | null;
  related_task_id: number | null;
  content: string;
  created_at: string;
}

interface InsightsPanelProps {
  moduleId: number;
}

export function InsightsPanel({ moduleId }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await noteAPI.getInsights(moduleId);
      setInsights(response.data || []);
    } catch (error) {
      console.error('Failed to load insights:', error);
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setGenerating(true);
    try {
      // Call AI to generate insights from notes
      await noteAPI.getInsights(moduleId);
      toast.success('AI insights generated successfully!');
      loadInsights();
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Insights
          </CardTitle>
          <Button
            onClick={handleGenerateInsights}
            disabled={generating}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading insights...
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No AI insights yet</p>
            <p className="text-sm mt-1">
              Write some study notes first, then click "Generate Insights" to let AI analyze your learning patterns
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950 rounded-r-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(insight.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {insight.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
