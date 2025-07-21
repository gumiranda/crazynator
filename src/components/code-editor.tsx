'use client';

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';
import { sql } from '@codemirror/lang-sql';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { useTheme } from 'next-themes';
import { useCallback, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

const getCodeMirrorLanguage = (fileExtension: string): Extension[] => {
  const ext = fileExtension.toLowerCase();

  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return [javascript()];
    case 'jsx':
      return [javascript({ jsx: true })];
    case 'ts':
    case 'mts':
    case 'cts':
      return [javascript({ typescript: true })];
    case 'tsx':
      return [javascript({ typescript: true, jsx: true })];
    case 'css':
      return [css()];
    case 'html':
    case 'htm':
      return [html()];
    case 'json':
      return [json()];
    case 'md':
    case 'markdown':
      return [markdown()];
    case 'xml':
    case 'svg':
      return [xml()];
    case 'sql':
      return [sql()];
    default:
      return [];
  }
};

// Custom theme additions for better styling
const customThemeExtensions = EditorView.theme({
  '.cm-content': {
    padding: '16px',
    lineHeight: '1.5',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-editor': {
    height: '100%',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
  },
});

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
    500, // 500ms delay
  );

  const handleEditorChange = useCallback(
    (value: string) => {
      debouncedOnChange(value);
    },
    [debouncedOnChange],
  );

  const extensions = useMemo(() => {
    const languageExtensions = getCodeMirrorLanguage(language);
    const baseExtensions = [
      EditorView.lineWrapping,
      customThemeExtensions,
      EditorView.theme({
        '&': {
          height: height === '100%' ? '100%' : height,
        },
      }),
    ];

    if (readOnly) {
      baseExtensions.push(EditorView.editable.of(false));
    }

    return [...baseExtensions, ...languageExtensions];
  }, [language, height, readOnly]);

  // Use official Dracula theme for dark mode, default light theme for light mode
  const selectedTheme = useMemo(() => {
    if (theme === 'dark') {
      return dracula;
    }
    return 'light'; // Use default light theme
  }, [theme]);

  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        value={value}
        onChange={readOnly ? undefined : handleEditorChange}
        extensions={extensions}
        theme={selectedTheme}
        editable={!readOnly}
        height={height === '100%' ? '100%' : height}
        className="h-full"
      />
    </div>
  );
}
