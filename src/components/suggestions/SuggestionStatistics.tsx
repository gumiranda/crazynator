'use client';

import React from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Lightbulb,
  Target,
  Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SuggestionStatisticsProps {
  projectId: string;
}

const COLORS = {
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
  PENDING: '#f59e0b',
  APPLIED: '#10b981',
  DISMISSED: '#6b7280',
  EXPIRED: '#ef4444',
};

const categoryColors = {
  ATOMIC_DESIGN: '#8b5cf6',
  FEATURE_SLICED_DESIGN: '#06b6d4',
  REACT_QUERY: '#f97316',
  ZUSTAND: '#84cc16',
  REACT_PATTERNS: '#ec4899',
  TYPESCRIPT_PATTERNS: '#3b82f6',
  PERFORMANCE_OPTIMIZATION: '#ef4444',
  ACCESSIBILITY_IMPROVEMENT: '#10b981',
  TESTING_STRATEGY: '#f59e0b',
};

export function SuggestionStatistics({ projectId }: SuggestionStatisticsProps) {
  const { data: statistics, isLoading } = trpc.suggestions.getStatistics.useQuery({ projectId });
  const { data: metrics } = trpc.suggestions.getAnalysisMetrics.useQuery({ projectId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading statistics...</span>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No statistics available</p>
        <p className="text-sm">Run an analysis to generate statistics</p>
      </div>
    );
  }

  // Prepare data for charts
  const statusData = [
    { name: 'Pending', value: statistics.pending, color: COLORS.PENDING },
    { name: 'Applied', value: statistics.applied, color: COLORS.APPLIED },
    { name: 'Dismissed', value: statistics.dismissed, color: COLORS.DISMISSED },
  ].filter(item => item.value > 0);

  const categoryData = statistics.categoryBreakdown.map(item => ({
    name: item.category.replace(/_/g, ' '),
    value: item.count,
    color: categoryColors[item.category] || '#6b7280',
  }));

  const severityData = statistics.severityBreakdown.map(item => ({
    name: item.severity,
    value: item.count,
    color: COLORS[item.severity],
  }));

  const completionRate = statistics.total > 0 
    ? Math.round((statistics.applied / statistics.total) * 100)
    : 0;

  const dismissalRate = statistics.total > 0 
    ? Math.round((statistics.dismissed / statistics.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applied</p>
                <p className="text-2xl font-bold text-green-600">{statistics.applied}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dismissed</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.dismissed}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <h3 className="font-semibold">Completion Rate</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Applied Suggestions</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="w-full" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dismissal Rate</span>
                <span className="font-medium">{dismissalRate}%</span>
              </div>
              <Progress value={dismissalRate} className="w-full" />

              <div className="text-xs text-muted-foreground mt-2">
                {statistics.applied} applied, {statistics.dismissed} dismissed out of {statistics.total} total
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold">Code Quality Metrics</h3>
            </div>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Maintainability</span>
                  <span className="font-medium">{Math.round(metrics.metrics.maintainabilityIndex)}%</span>
                </div>
                <Progress value={metrics.metrics.maintainabilityIndex} className="w-full" />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Technical Debt</span>
                  <Badge variant={metrics.metrics.technicalDebt > 10 ? 'destructive' : 'secondary'}>
                    {metrics.metrics.technicalDebt} issues
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  {metrics.metrics.linesOfCode.toLocaleString()} lines of code analyzed
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Run an analysis to see code quality metrics
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Status Distribution</h3>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No data available
              </div>
            )}
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Severity Distribution</h3>
          </CardHeader>
          <CardContent>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Category Breakdown</h3>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <Separator />

              {/* Category Details */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Category Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {statistics.categoryBreakdown.map((item) => (
                    <div key={item.category} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: categoryColors[item.category] || '#6b7280' }}
                        />
                        <span className="text-sm font-medium">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No category data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-semibold">Insights</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.total === 0 && (
              <div className="flex items-center gap-2 text-blue-600">
                <Lightbulb className="h-4 w-4" />
                <span className="text-sm">Run your first code analysis to get personalized suggestions</span>
              </div>
            )}

            {statistics.pending > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  You have {statistics.pending} pending suggestions that could improve your code
                </span>
              </div>
            )}

            {completionRate > 80 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  Excellent! You've applied {completionRate}% of suggestions
                </span>
              </div>
            )}

            {dismissalRate > 50 && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  High dismissal rate ({dismissalRate}%) - consider adjusting your preferences
                </span>
              </div>
            )}

            {statistics.severityBreakdown.find(s => s.severity === 'ERROR')?.count > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  {statistics.severityBreakdown.find(s => s.severity === 'ERROR')?.count} critical issues need attention
                </span>
              </div>
            )}

            {metrics && metrics.metrics.maintainabilityIndex < 50 && (
              <div className="flex items-center gap-2 text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">
                  Low maintainability score ({Math.round(metrics.metrics.maintainabilityIndex)}%) - focus on refactoring
                </span>
              </div>
            )}

            {statistics.total > 10 && completionRate < 20 && (
              <div className="flex items-center gap-2 text-blue-600">
                <Target className="h-4 w-4" />
                <span className="text-sm">
                  Try applying some suggestions to improve your code quality score
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}