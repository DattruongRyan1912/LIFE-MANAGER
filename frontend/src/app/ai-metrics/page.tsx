'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Activity, 
  Zap, 
  TrendingDown,
  Clock,
  Target,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';

export default function AIMetricsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mock historical data - In production, fetch from backend API
  const historicalMetrics = {
    totalRequests: 127,
    successRate: 98.4,
    avgResponseTime: 8.2,
    totalTokensSaved: 304800,
    avgTokensPerRequest: 1100,
    baselineTokensPerRequest: 3500,
    totalCost: 0,
    pipelineVersion: 'smart_v1',
    lastUpdated: new Date().toISOString(),
  };

  const layerStats = [
    {
      layer: 1,
      name: 'Intent Classification',
      model: 'groq/compound',
      avgTime: 150,
      avgTokens: 150,
      successRate: 99.2,
      color: 'blue',
    },
    {
      layer: 2,
      name: 'Prompt Rewriting',
      model: 'llama-3.1-8b-instant',
      avgTime: 220,
      avgTokens: 250,
      successRate: 98.8,
      color: 'purple',
    },
    {
      layer: 3,
      name: 'Context Compression',
      model: 'groq/compound-mini',
      avgTime: 310,
      avgTokens: 400,
      successRate: 99.5,
      color: 'green',
    },
    {
      layer: 4,
      name: 'Memory Routing',
      model: 'Local Logic',
      avgTime: 45,
      avgTokens: 100,
      successRate: 100,
      color: 'yellow',
    },
    {
      layer: 5,
      name: 'Main Reasoning',
      model: 'llama-3.3-70b-versatile',
      avgTime: 1250,
      avgTokens: 700,
      successRate: 97.6,
      color: 'orange',
    },
    {
      layer: 6,
      name: 'Output Formatting',
      model: 'allam-2-7b',
      avgTime: 420,
      avgTokens: 300,
      successRate: 98.9,
      color: 'pink',
    },
  ];

  const refreshMetrics = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMetrics({
        ...historicalMetrics,
        lastUpdated: new Date().toISOString(),
      });
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    refreshMetrics();
  }, []);

  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Pipeline Metrics</h1>
          <p className="text-muted-foreground mt-1">
            Real-time performance analytics for FreeTier AI optimization
          </p>
        </div>
        <Button onClick={refreshMetrics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-3xl font-bold mt-1">
                  {historicalMetrics.totalRequests}
                </p>
                <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {historicalMetrics.successRate}% success
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold mt-1">
                  {historicalMetrics.avgResponseTime}s
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ~{(historicalMetrics.avgResponseTime * 1000).toFixed(0)}ms per request
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Savings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens Saved</p>
                <p className="text-3xl font-bold mt-1">
                  {(historicalMetrics.totalTokensSaved / 1000).toFixed(0)}K
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <p className="text-xs text-green-500">
                    {Math.round((1 - historicalMetrics.avgTokensPerRequest / historicalMetrics.baselineTokensPerRequest) * 100)}% reduction
                  </p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-3xl font-bold mt-1">
                  ${historicalMetrics.totalCost.toFixed(2)}
                </p>
                <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                  100% Free Tier
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Architecture Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            6-Layer Pipeline Architecture
          </CardTitle>
          <CardDescription>
            Performance breakdown of FreeTier AI optimization layers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {layerStats.map((layer) => (
              <div
                key={layer.layer}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                {/* Layer Number */}
                <div className={`h-12 w-12 rounded-lg ${colorClasses[layer.color as keyof typeof colorClasses]} flex items-center justify-center font-bold text-lg border`}>
                  {layer.layer}
                </div>

                {/* Layer Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{layer.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {layer.model}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Avg: {layer.avgTime}ms
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      ~{layer.avgTokens} tokens
                    </span>
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {layer.successRate}% success
                    </span>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="text-right">
                  {layer.successRate >= 99 ? (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Excellent
                    </Badge>
                  ) : layer.successRate >= 97 ? (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Good
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Monitor
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Efficiency Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Smart Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Smart Pipeline</CardTitle>
            <CardDescription>Multi-model optimization approach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Tokens/Request</span>
                <span className="font-bold text-lg">{historicalMetrics.avgTokensPerRequest}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="font-medium">{historicalMetrics.avgResponseTime}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cost/Request</span>
                <span className="font-medium text-green-500">$0.00</span>
              </div>
              <div className="pt-2 border-t">
                <Badge variant="secondary" className="w-full justify-center bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Direct Approach */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Direct Approach</CardTitle>
            <CardDescription>Single model baseline (for comparison)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Tokens/Request</span>
                <span className="font-bold text-lg line-through">{historicalMetrics.baselineTokensPerRequest}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="font-medium">~5-7s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cost/Request</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="pt-2 border-t">
                <Badge variant="secondary" className="w-full justify-center">
                  Legacy
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Pipeline Version</p>
              <p className="font-medium mt-1">{historicalMetrics.pipelineVersion}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium mt-1">
                {new Date(historicalMetrics.lastUpdated).toLocaleString('vi-VN')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Operational
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
