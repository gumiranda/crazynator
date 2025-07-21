# Design Document

## Overview

This design outlines the replacement of Monaco Editor with CodeMirror 6, a modern, lightweight code editor that provides better theming support, native TSX support, and resolves file synchronization issues. The implementation will maintain the same API surface while improving performance and user experience.

## Architecture

### Current Architecture Issues

- Monaco Editor has a large bundle size (~2MB)
- File synchronization issue where `editedFiles` state gets overwritten after save
- Limited theme customization options
- Complex setup for custom themes

### New Architecture

- **CodeMirror 6** as the core editor engine
- **@uiw/react-codemirror** as the React wrapper
- **@codemirror/theme-one-dark** or custom Dracula theme
- **@codemirror/lang-javascript** for TSX/JSX support
- Improved state management to prevent synchronization issues

## Components and Interfaces

### 1. New CodeEditor Component

```typescript
interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  theme?: 'light' | 'dark';
}
```

### 2. Language Support Extensions

```typescript
const languageExtensions = {
  javascript: javascript(),
  typescript: javascript({ typescript: true, jsx: true }),
  tsx: javascript({ typescript: true, jsx: true }),
  jsx: javascript({ jsx: true }),
  css: css(),
  html: html(),
  json: json(),
  markdown: markdown(),
  // ... other languages
};
```

### 3. Theme Configuration

```typescript
const draculaTheme = EditorView.theme({
  '&': {
    color: '#f8f8f2',
    backgroundColor: '#282a36',
  },
  '.cm-content': {
    padding: '16px',
    caretColor: '#f8f8f0',
  },
  '.cm-focused .cm-cursor': {
    borderLeftColor: '#f8f8f0',
  },
  // ... more Dracula theme styles
});
```

## Data Models

### File State Management Fix

The current issue is in the `FileExplore` component where the state management causes the editor to revert:

**Current Problem:**

```typescript
// After save, this line overwrites editedFiles with the same content
setEditedFiles({ ...editedFiles });
```

**Solution:**

```typescript
// Remove the problematic state reset and ensure proper state flow
const updateFragment = useMutation(
  trpc.projects.updateFragment.mutationOptions({
    onSuccess: (updatedFragment) => {
      toast.success('Files saved and synced with sandbox');
      setHasUnsavedChanges(false);
      // Don't reset editedFiles - keep the current edited state
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save files');
    },
  }),
);
```

### State Flow Diagram

```
User edits file → editedFiles state updated → hasUnsavedChanges = true
                                          ↓
User saves → API call to updateFragment → Success → hasUnsavedChanges = false
                                                  → Keep editedFiles unchanged
```

## Error Handling

### 1. Editor Loading States

- Show loading spinner while CodeMirror initializes
- Graceful fallback to textarea if editor fails to load
- Error boundary around editor component

### 2. Language Detection Fallback

- If language extension fails to load, fallback to plain text
- Log warnings for unsupported file types
- Maintain backward compatibility with existing language mapping

### 3. Theme Loading

- Fallback to default theme if custom theme fails
- Respect system theme preferences
- Handle theme switching without editor re-initialization

## Testing Strategy

### 1. Unit Tests

- Test language detection function
- Test theme switching functionality
- Test editor value changes and onChange callbacks
- Test readonly mode behavior

### 2. Integration Tests

- Test file editing and saving workflow
- Test synchronization with sandbox
- Test theme persistence across page reloads
- Test multiple file editing scenarios

### 3. Performance Tests

- Compare bundle size before and after
- Test editor initialization time
- Test large file handling
- Test memory usage with multiple editors

## Implementation Dependencies

### New Dependencies to Add

```json
{
  "@uiw/react-codemirror": "^4.21.21",
  "@codemirror/lang-javascript": "^6.2.1",
  "@codemirror/lang-css": "^6.2.1",
  "@codemirror/lang-html": "^6.4.6",
  "@codemirror/lang-json": "^6.0.1",
  "@codemirror/lang-markdown": "^6.2.4",
  "@codemirror/lang-xml": "^6.0.2",
  "@codemirror/lang-sql": "^6.5.4",
  "@codemirror/theme-one-dark": "^6.1.2"
}
```

### Dependencies to Remove

```json
{
  "@monaco-editor/react": "^4.7.0"
}
```

## Migration Strategy

### Phase 1: Setup New Editor

1. Install CodeMirror dependencies
2. Create new CodeEditor component alongside existing one
3. Implement basic functionality and theming

### Phase 2: Feature Parity

1. Implement all language support
2. Add theme switching
3. Ensure API compatibility with existing component

### Phase 3: Integration and Testing

1. Replace Monaco Editor usage in FileExplore component
2. Fix state management issues
3. Test file synchronization thoroughly

### Phase 4: Cleanup

1. Remove Monaco Editor dependencies
2. Remove old CodeEditor component
3. Update any remaining references
