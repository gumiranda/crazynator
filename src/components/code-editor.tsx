'use client';

import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

const getMonacoLanguage = (fileExtension: string): string => {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
  };

  return languageMap[fileExtension.toLowerCase()] || 'plaintext';
};

export default function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = '100%',
}: CodeEditorProps) {
  const { theme } = useTheme();

  // Debounced onChange to avoid too many API calls
  const debouncedOnChange = useDebouncedCallback(
    (value: string) => {
      if (onChange) {
        onChange(value);
      }
    },
    500 // 500ms delay
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        debouncedOnChange(value);
      }
    },
    [debouncedOnChange]
  );

  const monacoLanguage = getMonacoLanguage(language);

  return (
    <div className="h-full w-full">
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        onChange={handleEditorChange}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          contextmenu: true,
          selectOnLineNumbers: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        loading={
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}