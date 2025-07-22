# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CrazyNator** is an AI-powered code generation and sandbox environment that transforms natural language prompts into fully functional web applications. Users can describe what they want to build, and the system generates complete Next.js applications with real-time previews and live code editing capabilities.

### Key Value Proposition

- **Natural Language to Code**: Convert plain English descriptions into working applications
- **Real-time Code Generation**: Watch your application being built in real-time with live progress updates
- **Instant Sandbox Environment**: Each project gets its own isolated E2B sandbox with immediate preview
- **Live Code Editing**: Edit generated code with syntax highlighting and automatic synchronization
- **Template-Based Starting Points**: Choose from 8 pre-built templates like Netflix clone, Admin dashboard, etc.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Check code formatting
npm run format:check

# Generate Prisma client (runs automatically after npm install)
bunx prisma generate

# Run database migrations
bunx prisma migrate dev

# Reset database
bunx prisma migrate reset
```

## Architecture Overview

This is a sophisticated Next.js 15 application with App Router that provides a complete code generation and sandbox environment. Key architectural components:

### Core Technologies

- **Next.js 15** with App Router and React 19
- **TypeScript** with strict configuration
- **Tailwind CSS 4** for styling with Radix UI components
- **CodeMirror 6** for code editing with Dracula theme support
- **Prisma** with PostgreSQL for data persistence
- **tRPC** for type-safe API layer
- **Clerk** for authentication with plan-based access control
- **Inngest** for background job processing and real-time updates
- **E2B** for sandboxed code execution

### Database Schema

- `Project`: User projects with generated names
- `Message`: Chat messages with USER/ASSISTANT roles and RESULT/ERROR types
- `Fragment`: Code fragments with sandbox URLs and file collections
- `Usage`: Credit/points tracking with expiration

### Key Directories

- `src/app/`: Next.js app router pages and API routes
- `src/components/`: Reusable UI components (ui/, code editors, file explorers)
- `src/modules/`: Feature modules (projects, messages, usage) with server procedures and UI components
- `src/inngest/`: Background job functions for code generation workflow
- `src/trpc/`: Type-safe API configuration and routers
- `src/lib/`: Utility functions (database, sandbox management, usage tracking)
- `sandbox-templates/`: E2B sandbox configurations

### Core Workflows

1. **Project Creation**: User submits prompt → Creates project with initial message → Triggers Inngest job
2. **Code Generation**: Inngest agent uses Claude/OpenAI to generate code → Creates sandbox → Saves files as Fragment
3. **Real-time Updates**: Uses Inngest realtime for live progress updates
4. **File Editing**: Users can edit Fragment files with automatic sandbox sync

### Prisma Configuration

- Client generated to `src/generated/prisma/`
- Migrations in `prisma/migrations/`
- Custom output path configured in schema

### Authentication & Authorization

- Clerk handles authentication with plan-based access (`pro` plan)
- User ownership enforced in tRPC procedures
- Usage/credit system with rate limiting

### Code Execution

- E2B sandboxes for isolated code execution
- Sandbox URLs format: `https://3000-{sandboxId}.e2b.app`
- Automatic file synchronization between database and sandbox
- 15-minute sandbox timeout configured

### Responsive Design

- Mobile-first approach with responsive layouts
- Desktop: Split panels with resizable sections
- Mobile: Full-screen chat with slide-up sheets for previews

## User Stories & Workflows

### Primary User Personas

1. **Indie Developer** - Solo developer looking to quickly prototype ideas
2. **Startup Founder** - Non-technical founder needing MVP development
3. **Learning Developer** - Student or junior developer exploring code patterns
4. **Product Manager** - PM creating functional prototypes for stakeholder demos

### Core User Stories

#### Project Creation & Code Generation

**US-001: Quick Project Creation**
> As a user, I want to describe my project idea in natural language so that I can quickly generate a working application without writing code manually.

- **Acceptance Criteria:**
  - User can enter up to 10,000 characters describing their project
  - System validates input and shows helpful error messages
  - Project creation consumes 1 credit from user's balance
  - System generates unique project name automatically
  - User is redirected to project workspace immediately

**US-002: Template-Based Quick Start**
> As a user, I want to choose from pre-built templates so that I can start with a familiar application structure and customize from there.

- **Available Templates:**
  - Netflix clone with hero banners and modal details
  - Admin dashboard with stats, charts, and tables
  - Kanban board with drag-and-drop functionality
  - File manager with grid layout and operations
  - YouTube clone with video thumbnails and categories
  - E-commerce store with cart and filters
  - Airbnb clone with listings and property details
  - Spotify clone with playlists and music controls

**US-003: Real-time Code Generation**
> As a user, I want to see real-time progress updates while my code is being generated so that I understand what's happening and can anticipate completion.

- **Acceptance Criteria:**
  - Real-time progress indicators show generation steps
  - Streaming updates display current AI reasoning and actions
  - User can see files being created and sandbox being setup
  - Generation process can take 2-5 minutes with live feedback

#### Code Editing & Management

**US-004: Live Code Editor**
> As a developer, I want to edit the generated code with syntax highlighting and auto-completion so that I can customize and extend the generated application.

- **Acceptance Criteria:**
  - CodeMirror 6 editor with Dracula theme
  - Syntax highlighting for HTML, CSS, JavaScript, TypeScript, JSON
  - Changes automatically sync to the sandbox environment
  - File tree explorer shows hierarchical project structure
  - Support for creating, editing, and deleting files

**US-005: Real-time Preview**
> As a user, I want to see my application running live so that I can immediately test functionality and see the results of my changes.

- **Acceptance Criteria:**
  - Embedded iframe shows sandbox at `https://3000-{sandboxId}.e2b.app`
  - Preview updates automatically when code changes
  - Full responsive preview works on different screen sizes
  - Preview handles runtime errors gracefully

#### Mobile Experience

**US-006: Mobile-First Interface**
> As a mobile user, I want a touch-optimized interface so that I can create and edit projects on my phone or tablet.

- **Acceptance Criteria:**
  - Full-screen chat interface on mobile devices
  - Slide-up sheets for code preview and editing
  - Touch-optimized controls and gestures
  - Floating action button for quick access to preview
  - Responsive tab interface for preview/code switching

#### Authentication & Usage Management

**US-007: Credit-Based Usage System**
> As a user, I want a transparent credit system so that I can understand my usage limits and upgrade when needed.

- **Acceptance Criteria:**
  - 5 free credits per user with 30-day expiration
  - 1 credit consumed per project creation
  - Clear usage indicators and remaining credit display
  - Automatic redirect to pricing when credits exhausted
  - Grace period and upgrade prompts for existing users

**US-008: Clerk Authentication**
> As a user, I want secure authentication so that my projects are private and accessible only to me.

- **Acceptance Criteria:**
  - Social login options (Google, GitHub, etc.)
  - Email/password authentication
  - User profile management
  - Project ownership enforcement
  - Secure session management

#### Project Management

**US-009: Project History & Chat**
> As a user, I want to maintain a conversation history with the AI so that I can iterate on my project and make refinements over time.

- **Acceptance Criteria:**
  - Persistent chat history per project
  - Message threading with USER/ASSISTANT roles
  - Support for follow-up questions and refinements
  - Error handling with helpful recovery suggestions
  - Export capability for generated code

**US-010: Project Organization**
> As a user, I want to see all my projects in one place so that I can easily navigate between different applications I'm building.

- **Acceptance Criteria:**
  - Dashboard view with project cards
  - Search and filter capabilities
  - Project metadata (creation date, last modified)
  - Quick actions (rename, delete, duplicate)
  - Sorting by various criteria

### Advanced Use Cases

**US-011: Code Learning & Exploration**
> As a learning developer, I want to understand how the generated code works so that I can learn modern web development patterns.

- **Acceptance Criteria:**
  - Well-commented generated code
  - README files explaining architecture
  - Component documentation and usage examples
  - Best practices implementation (TypeScript, accessibility, etc.)

**US-012: Prototype to Production**
> As a startup founder, I want to evolve my prototype into a production-ready application so that I can validate my business idea and scale.

- **Acceptance Criteria:**
  - Clean, maintainable code structure
  - Production-ready deployment configuration
  - Environment variable management
  - Database integration patterns
  - API route implementations

### Error Handling & Edge Cases

**US-013: Graceful Error Recovery**
> As a user, I want helpful error messages and recovery options so that I can resolve issues and continue working productively.

- **Acceptance Criteria:**
  - Clear error messages with actionable suggestions
  - Automatic retry mechanisms for transient failures
  - Fallback UI when sandbox connection fails
  - Rate limiting with clear communication
  - Support for manual intervention when automated processes fail

**US-014: Sandbox Management**
> As a user, I want my sandbox environment to be reliable and persistent so that I can trust my development environment.

- **Acceptance Criteria:**
  - 15-minute sandbox timeout with extension options
  - Automatic reconnection when sandbox goes idle
  - File persistence across browser sessions
  - Terminal access for package installations
  - Hot reload for development changes

### Performance & Scalability

**US-015: Fast Response Times**
> As a user, I want the application to be responsive so that I can work efficiently without waiting for slow interfaces.

- **Acceptance Criteria:**
  - Sub-second response times for UI interactions
  - Optimistic UI updates where appropriate
  - Efficient code bundling with Turbopack
  - Lazy loading of heavy components
  - CDN delivery for static assets

This comprehensive set of user stories covers the full spectrum of CrazyNator's capabilities, from basic project creation to advanced code editing and deployment scenarios.
