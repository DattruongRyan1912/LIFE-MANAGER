'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function GroqMetricsPage() {
  const [loading, setLoading] = useState(false);
  const [showLimits, setShowLimits] = useState(true);
  const [timeRange, setTimeRange] = useState('30m');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [metrics, setMetrics] = useState<any>(null);
  const [rateLimits, setRateLimits] = useState<any>(null);

  const models = [
    { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B Versatile' },
    { value: 'llama-3.1-8b-instant', label: 'LLaMA 3.1 8B Instant' },
    { value: 'groq/compound', label: 'Compound (Intent)' },
    { value: 'groq/compound-mini', label: 'Compound Mini (Compress)' },
    { value: 'allam-2-7b', label: 'Allam 2 7B' },
  ];

  const timeRanges = [
    { value: '15m', label: 'Last 15 minutes' },
    { value: '30m', label: 'Last 30 minutes' },
    { value: '1h', label: 'Last 1 hour' },
    { value: '3h', label: 'Last 3 hours' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '24h', label: 'Last 24 hours' },
  ];

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/groq/metrics?model=${selectedModel}&time_range=${timeRange}`
      );
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRateLimits = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/groq/rate-limits');
      const data = await response.json();
      if (data.success) {
        setRateLimits(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch rate limits:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchRateLimits();
  }, [selectedModel, timeRange]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentLimit = () => {
    if (!rateLimits || !selectedModel) return null;
    return rateLimits[selectedModel];
  };

  const limit = getCurrentLimit();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groq API Metrics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor API usage, limits, and performance in real-time
          </p>
        </div>
        <Button onClick={fetchMetrics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Show Limits Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="show-limits"
                checked={showLimits}
                onCheckedChange={setShowLimits}
              />
              <Label htmlFor="show-limits">Show Limits</Label>
            </div>

            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model Selector */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Show all API Keys</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits Summary */}
      {limit && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Requests Per Minute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{limit.rpm.toLocaleString()}</div>
                {(metrics?.usage_percentage?.rpm || 0) > 80 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    High
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.summary?.total_requests || 0} used ({metrics?.usage_percentage?.rpm?.toFixed(1) || 0}%)
              </p>
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      (metrics?.usage_percentage?.rpm || 0) > 80 
                        ? 'bg-destructive' 
                        : (metrics?.usage_percentage?.rpm || 0) > 50 
                        ? 'bg-yellow-500' 
                        : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(metrics?.usage_percentage?.rpm || 0, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tokens Per Minute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{limit.tpm.toLocaleString()}</div>
                {(metrics?.usage_percentage?.tpm || 0) > 80 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    High
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.summary?.total_tokens || 0} used ({metrics?.usage_percentage?.tpm?.toFixed(1) || 0}%)
              </p>
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      (metrics?.usage_percentage?.tpm || 0) > 80 
                        ? 'bg-destructive' 
                        : (metrics?.usage_percentage?.tpm || 0) > 50 
                        ? 'bg-yellow-500' 
                        : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(metrics?.usage_percentage?.tpm || 0, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Requests Per Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{limit.rpd.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Daily limit</p>
              {/* Progress Bar - Mock daily usage */}
              <div className="mt-3">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: '5%' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tokens Per Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(limit.tpd / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground mt-1">Daily limit</p>
              {/* Progress Bar - Mock daily usage */}
              <div className="mt-3">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: '8%' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HTTP Status Codes Chart */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>HTTP Status Codes</CardTitle>
            <CardDescription>API response status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.http_status_codes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  stroke="#888"
                />
                <YAxis stroke="#888" />
                <Tooltip 
                  labelFormatter={formatTimestamp}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                />
                <Bar dataKey="count" fill="#00d9ff" name="200 OK" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#00d9ff]" />
                <span className="text-sm text-muted-foreground">200 OK</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests and Tokens Charts */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requests Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{models.find(m => m.value === selectedModel)?.label || 'Model'}</CardTitle>
              <CardDescription>Requests</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.requests}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    stroke="#888"
                  />
                  <YAxis stroke="#888" />
                  {/* Red Limit Line */}
                  {showLimits && limit && (
                    <ReferenceLine 
                      y={limit.rpm} 
                      stroke="#ff4444" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ 
                        value: 'Limit', 
                        position: 'right',
                        fill: '#ff4444',
                        fontSize: 12
                      }}
                    />
                  )}
                  <Tooltip 
                    labelFormatter={formatTimestamp}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#00d9ff" 
                    strokeWidth={2}
                    dot={{ fill: '#00d9ff', r: 4 }}
                    name="Requests"
                  />
                </LineChart>
              </ResponsiveContainer>
              {showLimits && limit && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-px w-4 bg-destructive" />
                    <span className="text-muted-foreground">Limit: {limit.rpm} requests/min</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tokens Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{models.find(m => m.value === selectedModel)?.label || 'Model'}</CardTitle>
              <CardDescription>Total Tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.tokens}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    stroke="#888"
                  />
                  <YAxis stroke="#888" />
                  {/* Red Limit Line */}
                  {showLimits && limit && (
                    <ReferenceLine 
                      y={limit.tpm} 
                      stroke="#ff4444" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ 
                        value: 'Limit', 
                        position: 'right',
                        fill: '#ff4444',
                        fontSize: 12
                      }}
                    />
                  )}
                  <Tooltip 
                    labelFormatter={formatTimestamp}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="input_tokens" 
                    stroke="#00ff88" 
                    strokeWidth={2}
                    dot={{ fill: '#00ff88', r: 4 }}
                    name="Input Tokens"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="output_tokens" 
                    stroke="#00d9ff" 
                    strokeWidth={2}
                    dot={{ fill: '#00d9ff', r: 4 }}
                    name="Output Tokens"
                  />
                </LineChart>
              </ResponsiveContainer>
              {showLimits && limit && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-px w-4 bg-destructive" />
                    <span className="text-muted-foreground">Limit: {limit.tpm.toLocaleString()} tokens/min</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Summary */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Summary ({timeRange})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold mt-1">{metrics.summary.total_requests}</p>
                <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-500">
                  {metrics.summary.success_rate}% success
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Input Tokens</p>
                <p className="text-2xl font-bold mt-1">{metrics.summary.total_input_tokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Output Tokens</p>
                <p className="text-2xl font-bold mt-1">{metrics.summary.total_output_tokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold mt-1">{metrics.summary.total_tokens.toLocaleString()}</p>
                {limit && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {metrics.usage_percentage.tpm.toFixed(1)}% of {limit.tpm.toLocaleString()} limit
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
