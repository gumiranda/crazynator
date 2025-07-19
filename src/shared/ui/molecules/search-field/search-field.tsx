'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../../atoms/button/button';
import { Input } from '../../atoms/input/input';
import { cn } from '@/shared/lib/utils';

export interface SearchFieldProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showClearButton?: boolean;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  placeholder = 'Pesquisar...',
  value: controlledValue,
  onSearch,
  onClear,
  className,
  disabled = false,
  isLoading = false,
  showClearButton = true,
}) => {
  const [internalValue, setInternalValue] = useState('');
  
  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledValue !== undefined ? () => {} : setInternalValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(value);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative flex items-center', className)}>
      <div className="relative flex-1">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
        />
        
        {/* Clear button */}
        {showClearButton && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-12 top-1/2 h-6 w-6 -translate-y-1/2 hover:bg-transparent"
          >
            <X size={14} />
          </Button>
        )}
        
        {/* Search button */}
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={disabled || isLoading}
          className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 hover:bg-transparent"
        >
          <Search size={14} />
        </Button>
      </div>
    </form>
  );
};