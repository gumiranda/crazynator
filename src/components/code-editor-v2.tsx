'use client';

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';
import { sql } from '@codemirror/lang-sql';
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

// Custom Dracula theme for CodeMirror
const draculaTheme = EditorView.theme(
  {
    '&': {
      color: '#f8f8f2',
      backgroundColor: '#282a36',
    },
    '.cm-content': {
      padding: '16px',
      caretColor: '#f8f8f0',
      lineHeight: '1.5',
      fontFamily:
        '"JetBrains Mono", "Fira Code", "Cascadia Code", "Roboto Mono", "Source Code Pro", Consolas, "Courier New", monospace',
      fontSize: '14px',
    },
    '.cm-focused .cm-cursor': {
      borderLeftColor: '#f8f8f0',
      borderLeftWidth: '2px',
    },
    '.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: '#44475a',
    },
    '.cm-gutters': {
      backgroundColor: '#282a36',
      color: '#6272a4',
      border: 'none',
      borderRight: '1px solid #44475a',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#44475a30',
      color: '#f8f8f2',
    },
    '.cm-activeLine': {
      backgroundColor: '#44475a20',
    },
    '.cm-lineNumbers': {
      color: '#6272a4',
      minWidth: '3ch',
    },
    '.cm-foldGutter .cm-gutterElement': {
      color: '#6272a4',
    },
    '.cm-searchMatch': {
      backgroundColor: '#ffb86c40',
      border: '1px solid #ffb86c',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#ff5555',
      color: '#f8f8f2',
    },
    '.cm-editor.cm-focused': {
      outline: 'none',
    },
  },
  { dark: true },
);

const lightTheme = EditorView.theme(
  {
    '&': {
      color: '#24292e',
      backgroundColor: '#ffffff',
    },
    '.cm-content': {
      padding: '16px',
      caretColor: '#24292e',
      lineHeight: '1.5',
      fontFamily:
        '"JetBrains Mono", "Fira Code", "Cascadia Code", "Roboto Mono", "Source Code Pro", Consolas, "Courier New", monospace',
      fontSize: '14px',
    },
    '.cm-focused .cm-cursor': {
      borderLeftColor: '#24292e',
      borderLeftWidth: '2px',
    },
    '.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: '#c8e1ff',
    },
    '.cm-gutters': {
      backgroundColor: '#fafbfc',
      color: '#6a737d',
      border: 'none',
      borderRight: '1px solid #e1e4e8',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#f6f8fa',
      color: '#24292e',
    },
    '.cm-activeLine': {
      backgroundColor: '#f6f8fa',
    },
    '.cm-lineNumbers': {
      color: '#6a737d',
      minWidth: '3ch',
    },
    '.cm-foldGutter .cm-gutterElement': {
      color: '#6a737d',
    },
    '.cm-searchMatch': {
      backgroundColor: '#ffdf5d',
      border: '1px solid #e1c84a',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#0366d6',
      color: '#ffffff',
    },
    '.cm-editor.cm-focused': {
      outline: 'none',
    },
  },
  { dark: false },
);

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
      EditorView.theme({
        '&': {
          height: height === '100%' ? '100%' : height,
        },
        '.cm-scroller': {
          fontFamily: 'inherit',
        },
        '.cm-editor': {
          height: '100%',
        },
        '.cm-focused': {
          outline: 'none',
        },
      }),
    ];

    if (readOnly) {
      baseExtensions.push(EditorView.editable.of(false));
    }

    return [...baseExtensions, ...languageExtensions];
  }, [language, height, readOnly]);

  const selectedTheme = useMemo(() => {
    if (theme === 'dark') {
      return [draculaTheme];
    }
    return [lightTheme];
  }, [theme]);

  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        value={value}
        onChange={readOnly ? undefined : handleEditorChange}
        extensions={extensions}
        theme={selectedTheme}
        editable={!readOnly}
        style={{
          fontSize: '14px',
          height: height === '100%' ? '100%' : height,
        }}
        className="h-full"
      />
    </div>
  );
}
