'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Code,
  FileText,
  MapPin,
  Clock,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { CodeSuggestion } from '@/generated/prisma';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SuggestionCardProps {
  suggestion: CodeSuggestion;
  projectId: string;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onApplied: () => void;
  onDismissed: () => void;
}

const severityConfig = {
  ERROR: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    badgeVariant: 'destructive' as const,
  },
  WARNING: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    badgeVariant: 'secondary' as const,
  },
  INFO: {
    icon: <Info className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    badgeVariant: 'secondary' as const,
  },
};

const categoryLabels = {
  ATOMIC_DESIGN: 'Atomic Design',
  FEATURE_SLICED_DESIGN: 'Feature-Sliced Design',
  REACT_QUERY: 'React Query',
  ZUSTAND: 'Zustand',
  REACT_PATTERNS: 'React Patterns',
  TYPESCRIPT_PATTERNS: 'TypeScript',
  PERFORMANCE_OPTIMIZATION: 'Performance',
  ACCESSIBILITY_IMPROVEMENT: 'Accessibility',
  TESTING_STRATEGY: 'Testing',
};

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPLIED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-red-100 text-red-800',
};

export function SuggestionCard({ 
  suggestion, 
  projectId, 
  isSelected, 
  onSelect, 
  onApplied, 
  onDismissed 
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCodeExample, setShowCodeExample] = useState(false);

  const severityInfo = severityConfig[suggestion.severity];

  // tRPC mutations
  const applyMutation = trpc.suggestions.apply.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Suggestion applied successfully!');
        onApplied();
      } else {
        toast.error(`Failed to apply suggestion: ${data.errors?.join(', ')}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to apply suggestion: ${error.message}`);
    },
  });

  const dismissMutation = trpc.suggestions.dismiss.useMutation({
    onSuccess: () => {
      toast.success('Suggestion dismissed');
      onDismissed();
    },
    onError: (error) => {
      toast.error(`Failed to dismiss suggestion: ${error.message}`);
    },
  });

  const handleApply = () => {
    if (suggestion.status !== 'PENDING') {
      toast.error('Only pending suggestions can be applied');
      return;
    }

    applyMutation.mutate({
      suggestionId: suggestion.id,
      projectId,
    });
  };

  const handleDismiss = () => {
    if (suggestion.status !== 'PENDING') {
      toast.error('Only pending suggestions can be dismissed');
      return;
    }

    dismissMutation.mutate({
      suggestionId: suggestion.id,
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getLanguageFromPath = (filePath?: string | null) => {
    if (!filePath) return 'javascript';
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
    return 'javascript';
  };

  return (
    <Card className={`${suggestion.status === 'PENDING' ? '' : 'opacity-75'} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Selection Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />

            {/* Severity Icon */}
            <div className={`${severityInfo.color} mt-1`}>
              {severityInfo.icon}
            </div>

            {/* Title and Metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm leading-tight">
                  {suggestion.title}
                </h3>
                <Badge variant={severityInfo.badgeVariant} className="text-xs">
                  {suggestion.severity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[suggestion.category]}
                </Badge>
                <Badge className={`text-xs ${statusColors[suggestion.status]}`}>
                  {suggestion.status}
                </Badge>
              </div>

              {/* File and Line Info */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                {suggestion.filePath && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span className="truncate max-w-[200px]" title={suggestion.filePath}>
                      {suggestion.filePath}
                    </span>
                  </div>
                )}
                {suggestion.lineNumber && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Line {suggestion.lineNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(suggestion.createdAt)}</span>
                </div>
              </div>

              {/* Description Preview */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {suggestion.description}
              </p>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          {/* Full Description */}
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2">Description</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {suggestion.description}
            </div>
          </div>

          {/* Code Example */}
          {suggestion.codeExample && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Code Example
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodeExample(!showCodeExample)}
                >
                  {showCodeExample ? 'Hide' : 'Show'}
                </Button>
              </div>
              
              {showCodeExample && (
                <div className="rounded-md overflow-hidden border">
                  <SyntaxHighlighter
                    language={getLanguageFromPath(suggestion.filePath)}
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      fontSize: '12px',
                      maxHeight: '300px',
                    }}
                  >
                    {suggestion.codeExample}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {suggestion.metadata && Object.keys(suggestion.metadata as any).length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2">Additional Information</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                {Object.entries(suggestion.metadata as any).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Link */}
          {suggestion.filePath && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // In a real implementation, this would open the file in the editor
                  toast.info('File navigation would open here in a real implementation');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open File
              </Button>
            </div>
          )}
        </CardContent>
      )}

      {/* Actions */}
      {suggestion.status === 'PENDING' && (
        <CardFooter className="pt-3">
          <div className="flex gap-2 w-full">
            <Button
              variant="default"
              size="sm"
              onClick={handleApply}
              disabled={applyMutation.isPending}
              className="flex-1"
            >
              {applyMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              disabled={dismissMutation.isPending}
              className="flex-1"
            >
              {dismissMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2" />
                  Dismissing...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Dismiss
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      )}

      {/* Applied/Dismissed Status */}
      {suggestion.status !== 'PENDING' && (
        <CardFooter className="pt-3">
          <div className="flex items-center justify-center w-full text-sm text-muted-foreground">
            {suggestion.status === 'APPLIED' && (
              <>
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Applied {suggestion.appliedAt && `on ${formatDate(suggestion.appliedAt)}`}
              </>
            )}
            {suggestion.status === 'DISMISSED' && (
              <>
                <X className="h-4 w-4 text-gray-600 mr-2" />
                Dismissed {suggestion.dismissedAt && `on ${formatDate(suggestion.dismissedAt)}`}
              </>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}