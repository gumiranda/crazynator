# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

This is a Next.js 15 application with App Router that provides a code generation and sandbox environment. Key architectural components:

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
