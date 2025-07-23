'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  X, 
  Filter, 
  Search,
  RefreshCw,
  Settings,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { SuggestionCard } from './SuggestionCard';
import { PatternAnalyzer } from './PatternAnalyzer';
import { SuggestionStatistics } from './SuggestionStatistics';
import { toast } from 'sonner';

interface SuggestionsPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const severityIcons = {
  ERROR: <AlertCircle className="h-4 w-4 text-red-500" />,
  WARNING: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  INFO: <Info className="h-4 w-4 text-blue-500" />,
};

const severityColors = {
  ERROR: 'bg-red-100 text-red-800 border-red-200',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INFO: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function SuggestionsPanel({ projectId, isOpen, onClose }: SuggestionsPanelProps) {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    severity: '',
    status: 'PENDING',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  // tRPC queries
  const { 
    data: suggestions = [], 
    isLoading: suggestionsLoading, 
    refetch: refetchSuggestions 
  } = trpc.suggestions.getAll.useQuery({
    projectId,
    filters: filters.category || filters.type || filters.severity || filters.status 
      ? filters 
      : undefined,
  });

  const { 
    data: statistics,
    isLoading: statsLoading 
  } = trpc.suggestions.getStatistics.useQuery({ projectId });

  const { 
    data: searchResults = [],
    refetch: searchSuggestions 
  } = trpc.suggestions.search.useQuery(
    {
      projectId,
      query: searchQuery,
      filters: filters.category || filters.severity || filters.status 
        ? filters 
        : undefined,
    },
    { enabled: !!searchQuery }
  );

  // tRPC mutations
  const analyzeMutation = trpc.suggestions.analyze.useMutation({
    onSuccess: (data) => {
      toast.success(`Analysis complete! Generated ${data.suggestions} suggestions.`);
      refetchSuggestions();
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const bulkDismissMutation = trpc.suggestions.bulkDismiss.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedSuggestions([]);
      refetchSuggestions();
    },
    onError: (error) => {
      toast.error(`Failed to dismiss suggestions: ${error.message}`);
    },
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate({ projectId });
  };

  const handleBulkDismiss = () => {
    if (selectedSuggestions.length === 0) {
      toast.error('No suggestions selected');
      return;
    }

    bulkDismissMutation.mutate({
      suggestionIds: selectedSuggestions,
      projectId,
    });
  };

  const handleSuggestionSelect = (suggestionId: string, selected: boolean) => {
    if (selected) {
      setSelectedSuggestions(prev => [...prev, suggestionId]);
    } else {
      setSelectedSuggestions(prev => prev.filter(id => id !== suggestionId));
    }
  };

  const handleSelectAll = () => {
    const currentSuggestions = searchQuery ? searchResults : suggestions;
    const allIds = currentSuggestions.map(s => s.id);
    setSelectedSuggestions(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedSuggestions([]);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      type: '',
      severity: '',
      status: 'PENDING',
    });
    setSearchQuery('');
  };

  const displayedSuggestions = searchQuery ? searchResults : suggestions;
  const hasActiveFilters = filters.category || filters.type || filters.severity || searchQuery;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-background border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Code Suggestions</h2>
          {statistics && (
            <Badge variant="secondary">
              {statistics.pending} pending
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="flex-1 flex flex-col px-4">
          {/* Filters and Search */}
          <div className="space-y-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="ATOMIC_DESIGN">Atomic Design</SelectItem>
                  <SelectItem value="FEATURE_SLICED_DESIGN">Feature-Sliced Design</SelectItem>
                  <SelectItem value="REACT_QUERY">React Query</SelectItem>
                  <SelectItem value="ZUSTAND">Zustand</SelectItem>
                  <SelectItem value="REACT_PATTERNS">React Patterns</SelectItem>
                  <SelectItem value="TYPESCRIPT_PATTERNS">TypeScript</SelectItem>
                  <SelectItem value="PERFORMANCE_OPTIMIZATION">Performance</SelectItem>
                  <SelectItem value="ACCESSIBILITY_IMPROVEMENT">Accessibility</SelectItem>
                  <SelectItem value="TESTING_STRATEGY">Testing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedSuggestions.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">
                  {selectedSuggestions.length} selected
                </span>
                <Button size="sm" variant="outline" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={handleBulkDismiss}
                  disabled={bulkDismissMutation.isPending}
                >
                  Dismiss Selected
                </Button>
              </div>
            )}

            {displayedSuggestions.length > 0 && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            )}
          </div>

          {/* Suggestions List */}
          <ScrollArea className="flex-1">
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading suggestions...</span>
              </div>
            ) : displayedSuggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {hasActiveFilters ? 'No suggestions match your filters' : 'No suggestions found'}
                <div className="mt-2">
                  <Button variant="outline" onClick={handleAnalyze}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Analyze Code
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedSuggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    projectId={projectId}
                    isSelected={selectedSuggestions.includes(suggestion.id)}
                    onSelect={(selected) => handleSuggestionSelect(suggestion.id, selected)}
                    onApplied={() => refetchSuggestions()}
                    onDismissed={() => refetchSuggestions()}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Analyze Tab */}
        <TabsContent value="analyze" className="flex-1 px-4">
          <PatternAnalyzer 
            projectId={projectId} 
            onAnalysisComplete={() => refetchSuggestions()}
          />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="flex-1 px-4">
          <SuggestionStatistics projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}