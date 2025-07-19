'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface CommunityProjectFiltersProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  sortBy: 'recent' | 'popular' | 'stars';
  onSortChange: (sort: 'recent' | 'popular' | 'stars') => void;
}

const availableTags = [
  'AI', 'Chat', 'React', 'Dashboard', 'E-commerce', 'Analytics',
  'Productivity', 'TypeScript', 'Widget', 'Weather', 'API',
  'Crypto', 'Finance', 'Charts', 'Food', 'Recipe', 'Search',
  'Mobile', 'Web', 'Game', 'Education', 'Health', 'Social',
  'Business', 'Entertainment', 'Utilities', 'Development',
  'Design', 'Marketing'
];

export const CommunityProjectFilters = ({
  selectedTags,
  onTagsChange,
  sortBy,
  onSortChange,
}: CommunityProjectFiltersProps) => {
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros</CardTitle>
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllTags}
              className="text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sort Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ordenar por</label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="popular">Mais populares</SelectItem>
              <SelectItem value="stars">Mais curtidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags selecionadas</label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Filtrar por tecnologia</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};