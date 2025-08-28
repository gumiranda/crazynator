# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrazyNator AI is a Next.js application that allows users to create apps and websites by chatting with AI. The platform provides an interactive development environment where AI can generate, modify, and preview code in real-time using E2B sandboxes.

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Stripe
- **AI/Code Execution**: E2B Code Interpreter sandboxes
- **Real-time**: Inngest for background jobs and real-time updates
- **State Management**: Zustand
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Configured for Vercel

## Development Commands

```bash
# Setup
bun install                 # Install dependencies
bun run db:generate        # Generate Prisma client
bun run db:push           # Push schema to database
bun run db:migrate        # Run database migrations
bun run db:studio         # Open Prisma Studio

# Development
bun run dev               # Start development server (with Turbopack)
bun run build            # Build for production
bun run start            # Start production server

# Code Quality
bun run lint             # Run ESLint
bun run format          # Format code with Prettier
bun run format:check    # Check code formatting
```

## Architecture

### Core Modules (src/modules/)

- **projects**: Project management, CRUD operations, and file handling
- **messages**: AI conversation handling with role-based messaging
- **github**: GitHub integration for repository sync and management
- **subscription**: Stripe-based payment and subscription management
- **usage**: Usage tracking and limits enforcement

### Key Components

- **E2B Sandboxes**: Isolated code execution environments with timeout management
- **Inngest Functions**: Background job processing for AI operations and GitHub sync
- **tRPC API**: Type-safe API layer with modular routers
- **Prisma Schema**: Relational data model with projects, messages, fragments, and GitHub integration

### Database Schema

- `Project`: User projects with associated messages and GitHub repositories
- `Message`: AI conversations with USER/ASSISTANT roles and RESULT/ERROR types
- `Fragment`: Code snippets/files associated with messages, linked to sandbox URLs
- `GitHubRepository`: Connected repositories with sync status tracking
- `Subscription`: Stripe subscription management
- `Usage`: Rate limiting and usage tracking

### File Structure Patterns

- Route handlers in `src/app/api/`
- UI components follow shadcn/ui patterns in `src/components/ui/`
- Business logic in module-specific `server/procedures.ts` files
- Reusable hooks in `src/hooks/`
- Constants and configuration in `src/constants/`

## Environment Variables

Required environment variables (see env-example.txt):

- `DATABASE_URL`: PostgreSQL connection string
- `E2B_API_KEY`: E2B sandboxes API key
- `CLERK_*`: Clerk authentication keys
- `STRIPE_*`: Stripe payment processing keys
- `INNGEST_*`: Inngest event processing keys
- `GITHUB_*`: GitHub OAuth integration keys

## Testing Strategy

The project uses comprehensive end-to-end testing rather than unit tests. Test commands focus on integration testing of the full user workflow from project creation through AI-generated code execution.

## GitHub Integration

The platform includes deep GitHub integration allowing users to:

- Connect GitHub accounts via OAuth
- Sync project files to repositories
- Handle batched file operations with compression for large payloads
- Track sync status and handle errors gracefully

## Subscription Model

Freemium model with Stripe integration:

- Usage-based limitations for free users
- Premium subscriptions with increased limits
- Real-time usage tracking and enforcement
