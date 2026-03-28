'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckIcon, SparklesIcon } from 'lucide-react';
import { UI_LIBRARIES, UI_LIBRARY_PRESETS, type UILibrary } from '@/constants/ui-libraries';

interface UILibrarySelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  compact?: boolean;
}

export const UILibrarySelector = ({ selected, onChange, compact }: UILibrarySelectorProps) => {
  const [showPresets, setShowPresets] = useState(true);

  const toggleLibrary = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const applyPreset = (libraryIds: string[]) => {
    onChange([...libraryIds]);
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">UI Libraries</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {UI_LIBRARIES.map((lib) => (
            <Button
              key={lib.id}
              type="button"
              variant={selected.includes(lib.id) ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => toggleLibrary(lib.id)}
            >
              {lib.icon} {lib.name}
              {selected.includes(lib.id) && <CheckIcon className="ml-1 h-3 w-3" />}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Quick Presets</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setShowPresets(!showPresets)}
          >
            {showPresets ? 'Hide' : 'Show'}
          </Button>
        </div>
        {showPresets && (
          <div className="grid grid-cols-2 gap-2">
            {UI_LIBRARY_PRESETS.map((preset) => {
              const isActive = preset.libraries.every((l) => selected.includes(l));
              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  className="h-auto flex-col items-start p-3 text-left"
                  onClick={() => applyPreset([...preset.libraries])}
                >
                  <div className="flex items-center gap-2">
                    <span>{preset.icon}</span>
                    <span className="text-sm font-medium">{preset.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{preset.description}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Individual Libraries */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">All Libraries</h3>
        <div className="grid gap-3">
          {UI_LIBRARIES.map((lib) => (
            <LibraryCard
              key={lib.id}
              library={lib}
              isSelected={selected.includes(lib.id)}
              onToggle={() => toggleLibrary(lib.id)}
            />
          ))}
        </div>
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Selected ({selected.length})</h3>
            <div className="flex flex-wrap gap-1">
              {selected.map((id) => {
                const lib = UI_LIBRARIES.find((l) => l.id === id);
                return (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {lib?.icon} {lib?.name}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => toggleLibrary(id)}
                    >
                      &times;
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function LibraryCard({
  library,
  isSelected,
  onToggle,
}: {
  library: UILibrary;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-sm',
        isSelected && 'ring-2 ring-primary border-primary',
      )}
      onClick={onToggle}
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>{library.icon}</span>
            {library.name}
            <Badge variant="outline" className="text-[10px]">
              {library.category}
            </Badge>
          </CardTitle>
          {isSelected && (
            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <CheckIcon className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <CardDescription className="text-xs">{library.description}</CardDescription>
        <div className="flex flex-wrap gap-1 mt-2">
          {library.recommended.slice(0, 3).map((rec) => (
            <Badge key={rec} variant="secondary" className="text-[10px]">
              {rec}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
