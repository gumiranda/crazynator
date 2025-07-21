# Requirements Document

## Introduction

This feature involves replacing the current Monaco Editor with a modern React code editor that provides better theming support (specifically Dracula theme), native TSX support, and fixes the file synchronization issues where edited content reverts to original values after saving to the sandbox.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to use a code editor with Dracula theme support, so that I have a consistent dark theme experience similar to VSCode.

#### Acceptance Criteria

1. WHEN the application loads THEN the code editor SHALL display with a Dracula or VSCode-like dark theme
2. WHEN the user switches between light and dark themes THEN the editor SHALL adapt accordingly
3. WHEN viewing code files THEN the syntax highlighting SHALL be clearly visible with appropriate contrast

### Requirement 2

**User Story:** As a developer, I want native TSX support in the code editor, so that I get proper syntax highlighting and IntelliSense for React TypeScript files.

#### Acceptance Criteria

1. WHEN opening a .tsx file THEN the editor SHALL provide proper TSX syntax highlighting
2. WHEN typing JSX elements THEN the editor SHALL provide appropriate auto-completion and bracket matching
3. WHEN viewing TypeScript React components THEN the editor SHALL correctly highlight both TypeScript and JSX syntax

### Requirement 3

**User Story:** As a developer, I want my file edits to persist correctly after saving, so that my changes don't revert to the original content.

#### Acceptance Criteria

1. WHEN I edit a file and save it THEN the editor content SHALL remain with my changes
2. WHEN the file is synchronized with the sandbox THEN the editor SHALL not revert to the original content
3. WHEN I reload the page after saving THEN the editor SHALL display the saved content, not the original content
4. WHEN multiple files are edited and saved THEN all files SHALL maintain their edited state

### Requirement 4

**User Story:** As a developer, I want to remove the Monaco Editor dependency, so that the application has a lighter bundle size and better performance.

#### Acceptance Criteria

1. WHEN the application builds THEN it SHALL not include Monaco Editor dependencies
2. WHEN the application loads THEN it SHALL use the new code editor component
3. WHEN comparing bundle sizes THEN the new implementation SHALL have equal or smaller bundle size
4. WHEN using the editor THEN it SHALL maintain the same core functionality as Monaco Editor

### Requirement 5

**User Story:** As a developer, I want the new code editor to support all the same file types as the current implementation, so that I don't lose functionality.

#### Acceptance Criteria

1. WHEN opening JavaScript files THEN the editor SHALL provide proper syntax highlighting
2. WHEN opening TypeScript files THEN the editor SHALL provide proper syntax highlighting
3. WHEN opening CSS, HTML, JSON, Markdown, YAML, XML, SQL, and Shell files THEN the editor SHALL provide appropriate syntax highlighting
4. WHEN the file extension is not recognized THEN the editor SHALL default to plain text mode
