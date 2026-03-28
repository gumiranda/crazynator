'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TerminalIcon, Loader2Icon, TrashIcon } from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'stdout' | 'stderr' | 'system';
  content: string;
  timestamp: Date;
}

interface SandboxTerminalProps {
  fragmentId: string | null;
  className?: string;
}

export const SandboxTerminal = ({ fragmentId, className }: SandboxTerminalProps) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'welcome',
      type: 'system',
      content: '🚀 Sandbox Terminal - Execute commands in your E2B sandbox',
      timestamp: new Date(),
    },
  ]);
  const [command, setCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), type, content, timestamp: new Date() },
    ]);
  };

  const executeCommand = async () => {
    if (!command.trim() || !fragmentId || isRunning) return;

    const cmd = command.trim();
    addLine('input', `$ ${cmd}`);
    setHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);
    setCommand('');
    setIsRunning(true);

    try {
      const response = await fetch('/api/sandbox/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragmentId, command: cmd }),
      });

      const data = await response.json();

      if (data.stdout) {
        addLine('stdout', data.stdout);
      }
      if (data.stderr) {
        addLine('stderr', data.stderr);
      }
      if (!data.success && !data.stderr) {
        addLine('stderr', data.error || 'Command failed');
      }
    } catch {
      addLine('stderr', 'Failed to connect to sandbox. It may have expired.');
    } finally {
      setIsRunning(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const clearTerminal = () => {
    setLines([
      {
        id: 'cleared',
        type: 'system',
        content: 'Terminal cleared',
        timestamp: new Date(),
      },
    ]);
  };

  if (!fragmentId) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full bg-black text-zinc-500',
          className,
        )}
      >
        <div className="text-center space-y-2">
          <TerminalIcon className="h-8 w-8 mx-auto" />
          <p className="text-sm">Generate code first to access the terminal</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-[#1a1a2e] text-zinc-200 font-mono', className)}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#16162a] border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <TerminalIcon className="h-3 w-3" />
          <span>Terminal</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-200"
          onClick={clearTerminal}
        >
          <TrashIcon className="h-3 w-3" />
        </Button>
      </div>

      {/* Terminal Output */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-0.5">
          {lines.map((line) => (
            <div
              key={line.id}
              className={cn('text-xs whitespace-pre-wrap break-all', {
                'text-green-400': line.type === 'input',
                'text-zinc-300': line.type === 'stdout',
                'text-red-400': line.type === 'stderr',
                'text-blue-400 italic': line.type === 'system',
              })}
            >
              {line.content}
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <Loader2Icon className="h-3 w-3 animate-spin" />
              Running...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Terminal Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-800 bg-[#16162a]">
        <span className="text-green-400 text-xs">$</span>
        <Input
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          className="h-7 text-xs bg-transparent border-none text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0"
          disabled={isRunning}
          autoFocus
        />
      </div>
    </div>
  );
};
