'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  DollarSign, 
  Clock, 
  Target,
  TrendingDown,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface LayerMetric {
  name: string;
  time_ms?: number;
  estimated_tokens?: number;
  result?: string;
  [key: string]: any;
}

interface MetricsData {
  pipeline_version?: string;
  layers?: {
    intent?: LayerMetric;
    rewrite?: LayerMetric;
    compression?: LayerMetric;
    memory?: LayerMetric;
    reasoning?: LayerMetric;
    formatting?: LayerMetric;
  };
  total?: {
    time_ms?: number;
    estimated_tokens?: number;
    token_savings?: number;
    cost_usd?: number;
  };
}

interface MetricsDashboardProps {
  metrics: MetricsData | null;
  mode?: 'smart' | 'direct';
  intent?: string;
  isVisible?: boolean;
}

export function MetricsDashboard({ metrics, mode = 'smart', intent, isVisible = true }: MetricsDashboardProps) {
  if (!isVisible || !metrics) return null;

  const layers = metrics.layers || {};
  const total = metrics.total || {};

  // Calculate token efficiency
  const baselineTokens = 3500; // Old approach
  const currentTokens = total.estimated_tokens || 0;
  const savings = total.token_savings || 0;
  const savingsPercent = baselineTokens > 0 ? Math.round((savings / baselineTokens) * 100) : 0;

  return (
    <div className="space-y-4 mb-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pipeline Mode */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Mode</p>
                <p className="text-2xl font-bold mt-1">
                  {mode === 'smart' ? 'Smart' : 'Direct'}
                </p>
                {intent && (
                  <Badge variant="secondary" className="mt-2">
                    {intent}
                  </Badge>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold mt-1">
                  {total.time_ms ? (total.time_ms / 1000).toFixed(1) : '0'}s
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {total.time_ms ? `${total.time_ms.toFixed(0)}ms` : 'N/A'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Usage */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-2xl font-bold mt-1">
                  {currentTokens.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <p className="text-xs text-green-500">
                    {savingsPercent}% saved
                  </p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost</p>
                <p className="text-2xl font-bold mt-1">
                  ${total.cost_usd?.toFixed(4) || '0.0000'}
                </p>
                <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                  Free Tier
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Savings Progress */}
      {mode === 'smart' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Token Optimization</CardTitle>
            <CardDescription>
              Comparing Smart Pipeline vs Direct Approach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Smart Pipeline</span>
                <span className="font-medium">{currentTokens} tokens</span>
              </div>
              <Progress value={(currentTokens / baselineTokens) * 100} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Direct Approach (baseline)</span>
                <span className="font-medium">{baselineTokens} tokens</span>
              </div>
              <div className="flex items-center gap-2 mt-2 p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  Saved {savings} tokens ({savingsPercent}% reduction)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layer Performance Breakdown */}
      {mode === 'smart' && Object.keys(layers).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pipeline Layers Performance</CardTitle>
            <CardDescription>
              Breakdown of 6-layer optimization pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Layer 1: Intent Classification */}
              {layers.intent && (
                <LayerCard
                  number={1}
                  name="Intent Classification"
                  model="groq/compound"
                  time={layers.intent.time_ms}
                  tokens={layers.intent.estimated_tokens}
                  result={layers.intent.result}
                  color="blue"
                />
              )}

              {/* Layer 2: Prompt Rewriting */}
              {layers.rewrite && (
                <LayerCard
                  number={2}
                  name="Prompt Rewriting"
                  model="llama-3.1-8b-instant"
                  time={layers.rewrite.time_ms}
                  tokens={layers.rewrite.estimated_tokens}
                  color="purple"
                />
              )}

              {/* Layer 3: Context Compression */}
              {layers.compression && (
                <LayerCard
                  number={3}
                  name="Context Compression"
                  model="groq/compound-mini"
                  time={layers.compression.time_ms}
                  tokens={layers.compression.estimated_tokens}
                  extra={`${layers.compression.original_size} → ${layers.compression.compressed_size} bytes`}
                  color="green"
                />
              )}

              {/* Layer 4: Memory Routing */}
              {layers.memory && (
                <LayerCard
                  number={4}
                  name="Memory Routing"
                  model="Local Logic"
                  time={layers.memory.time_ms}
                  tokens={layers.memory.estimated_tokens}
                  extra={`${layers.memory.memories_count || 0} memories`}
                  color="yellow"
                />
              )}

              {/* Layer 5: Reasoning 70B */}
              {layers.reasoning && (
                <LayerCard
                  number={5}
                  name="Main Reasoning"
                  model="llama-3.3-70b-versatile"
                  time={layers.reasoning.time_ms}
                  tokens={layers.reasoning.estimated_input_tokens}
                  extra={`Output: ${layers.reasoning.estimated_output_tokens?.toFixed(0) || 0} tokens`}
                  color="orange"
                />
              )}

              {/* Layer 6: Output Formatting */}
              {layers.formatting && (
                <LayerCard
                  number={6}
                  name="Output Formatting"
                  model="allam-2-7b"
                  time={layers.formatting.time_ms}
                  tokens={layers.formatting.estimated_tokens}
                  extra={`${layers.formatting.original_length} → ${layers.formatting.formatted_length} chars`}
                  color="pink"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Layer Card Component
interface LayerCardProps {
  number: number;
  name: string;
  model: string;
  time?: number;
  tokens?: number;
  result?: string;
  extra?: string;
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'orange' | 'pink';
}

function LayerCard({ number, name, model, time, tokens, result, extra, color }: LayerCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  };

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
      <div className={`h-10 w-10 rounded-lg ${colorClasses[color]} flex items-center justify-center font-bold border`}>
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{name}</h4>
          {result && (
            <Badge variant="secondary" className="text-xs">
              {result}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{model}</p>
        {extra && (
          <p className="text-xs text-muted-foreground mt-0.5">{extra}</p>
        )}
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-sm font-medium">
          <Clock className="h-3 w-3" />
          {time ? `${time.toFixed(0)}ms` : 'N/A'}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          ~{tokens || 0} tokens
        </p>
      </div>
    </div>
  );
}
