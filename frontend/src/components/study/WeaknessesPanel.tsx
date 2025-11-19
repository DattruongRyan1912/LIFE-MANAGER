'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { recommendationAPI } from '@/lib/api/study3';
import { toast } from 'sonner';
import { AlertTriangle, TrendingDown, Clock, Target } from 'lucide-react';

interface Weakness {
  type: 'low_progress' | 'overdue' | 'stagnant' | 'no_practice';
  module_id?: number;
  module_title?: string;
  task_count?: number;
  progress?: number;
  days_since_update?: number;
  recommendation: string;
}

interface WeaknessesPanelProps {
  goalId: number;
}

export function WeaknessesPanel({ goalId }: WeaknessesPanelProps) {
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goalId) {
      loadWeaknesses();
    }
  }, [goalId]);

  const loadWeaknesses = async () => {
    setLoading(true);
    try {
      const response = await recommendationAPI.getWeaknesses(goalId);
      setWeaknesses(response.data || []);
    } catch (error) {
      console.error('Failed to load weaknesses:', error);
      toast.error('Failed to load weakness analysis');
    } finally {
      setLoading(false);
    }
  };

  const getWeaknessIcon = (type: string) => {
    switch (type) {
      case 'low_progress':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'overdue':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'stagnant':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getWeaknessColor = (type: string) => {
    switch (type) {
      case 'low_progress':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'overdue':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'stagnant':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getWeaknessLabel = (type: string) => {
    switch (type) {
      case 'low_progress':
        return 'Low Progress';
      case 'overdue':
        return 'Overdue';
      case 'stagnant':
        return 'Stagnant';
      case 'no_practice':
        return 'No Practice';
      default:
        return type;
    }
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="bg-orange-50 dark:bg-orange-950">
        <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
          <AlertTriangle className="h-5 w-5" />
          Areas Needing Attention
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Analyzing weaknesses...
          </div>
        ) : weaknesses.length === 0 ? (
          <div className="text-center py-8 text-green-600 dark:text-green-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-70" />
            <p className="font-medium">Great job! 🎉</p>
            <p className="text-sm mt-1 text-muted-foreground">
              No major weaknesses detected. Keep up the good work!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {weaknesses.map((weakness, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-2 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getWeaknessIcon(weakness.type)}
                    <Badge className={getWeaknessColor(weakness.type)}>
                      {getWeaknessLabel(weakness.type)}
                    </Badge>
                  </div>
                  {weakness.progress !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {weakness.progress}% complete
                    </span>
                  )}
                </div>

                {weakness.module_title && (
                  <h4 className="font-medium text-sm">{weakness.module_title}</h4>
                )}

                <p className="text-sm text-muted-foreground">
                  {weakness.recommendation}
                </p>

                {(weakness.task_count || weakness.days_since_update) && (
                  <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                    {weakness.task_count && (
                      <span>{weakness.task_count} tasks</span>
                    )}
                    {weakness.days_since_update && (
                      <span>{weakness.days_since_update} days since update</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
