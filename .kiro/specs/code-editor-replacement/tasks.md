# Implementation Plan

- [ ] 1. Install CodeMirror dependencies and remove Monaco Editor
  - Install @uiw/react-codemirror and language extensions
  - Remove @monaco-editor/react from package.json
  - Update package.json with new dependencies
  - _Requirements: 4.1, 4.2_

- [ ] 2. Create new CodeMirror-based CodeEditor component
  - Create new src/components/code-editor-v2.tsx with CodeMirror implementation
  - Implement basic editor setup with value and onChange props
  - Add language detection and extension mapping
  - _Requirements: 2.1, 2.2, 5.1, 5.2, 5.3, 5.4_

- [ ] 3. Implement Dracula theme and theme switching
  - Create custom Dracula theme configuration for CodeMirror
  - Implement theme switching based on next-themes
  - Add fallback theme handling
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. Add comprehensive language support
  - Implement JavaScript/TypeScript/TSX/JSX language support
  - Add CSS, HTML, JSON, Markdown, YAML, XML, SQL, Shell language support
  - Create language extension mapping function
  - Add fallback to plain text for unsupported extensions
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3, 5.4_

- [ ] 5. Implement editor configuration and options
  - Add readonly mode support
  - Configure editor options (line numbers, word wrap, etc.)
  - Implement height prop and responsive sizing
  - Add loading state handling
  - _Requirements: 4.4_

- [ ] 6. Fix file synchronization issue in FileExplore component
  - Remove problematic state reset in updateFragment success callback
  - Ensure editedFiles state persists after save operations
  - Test file editing and saving workflow
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Replace Monaco Editor usage with new CodeEditor
  - Update FileExplore component to use new CodeEditor component
  - Remove import of old Monaco-based CodeEditor
  - Test all file types and editing functionality
  - _Requirements: 4.2, 4.4_

- [ ] 8. Create comprehensive tests for new editor
  - Write unit tests for language detection function
  - Write unit tests for theme switching functionality
  - Write integration tests for file editing workflow
  - Test readonly mode and all editor options
  - _Requirements: 4.4, 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Performance testing and optimization
  - Test bundle size reduction after Monaco removal
  - Test editor initialization performance
  - Test large file handling capabilities
  - Optimize editor configuration for better performance
  - _Requirements: 4.1, 4.3_

- [ ] 10. Clean up and finalize implementation
  - Remove old Monaco-based CodeEditor component file
  - Rename code-editor-v2.tsx to code-editor.tsx
  - Update any remaining references or imports
  - Verify all functionality works as expected
  - _Requirements: 4.1, 4.2_
