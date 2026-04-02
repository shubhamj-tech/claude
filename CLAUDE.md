# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in chat, Claude generates code using virtual file system tools, and results render in an iframe.

## Commands

```bash
npm run setup          # First-time setup: install deps, generate Prisma client, run migrations
npm run dev            # Start dev server at http://localhost:3000 (uses --turbopack)
npm run build          # Production build
npm run lint           # ESLint
npm run test           # Run all tests with Vitest
npm run db:reset       # Reset database (destructive)
```

Run a single test file:
```bash
npx vitest src/lib/__tests__/file-system.test.ts
```

**Note:** All scripts require `NODE_OPTIONS='--require ./node-compat.cjs'` (already in package.json scripts).

**Environment:** Add `ANTHROPIC_API_KEY` to `.env` for real AI generation. Without it, a mock provider generates placeholder components.

## Architecture

### Data Flow

1. User sends a message → `/api/chat` route
2. `streamText()` (Vercel AI SDK) calls Claude with `str_replace_editor` and `file_manager` tools
3. Claude uses tools to create/modify files in the virtual file system
4. `FileSystemContext` processes tool calls and updates in-memory state
5. `PreviewFrame` detects changes, transforms JSX via Babel standalone, renders in iframe using ESM.SH CDN for imports

### Key Abstractions

**Virtual File System** (`src/lib/file-system.ts`): In-memory tree of `FileNode` objects — no disk writes. Serialized to JSON for database persistence. The `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) exposes this to components and handles AI tool call results via `handleToolCall()`.

**AI Tools** (`src/lib/tools/`):
- `str_replace_editor`: Claude's primary code editing tool — supports `create`, `str_replace`, `insert`, `view`, `undo_edit` commands
- `file_manager`: Directory operations — list, check existence, delete, rename

**Preview Pipeline** (`src/lib/transform/jsx-transformer.ts`):
- Babel standalone transforms JSX/TSX → JS in browser
- `createImportMap()` maps bare specifiers to ESM.SH CDN URLs
- `createPreviewHTML()` produces iframe-ready HTML with importmap

**Provider** (`src/lib/provider.ts`): Returns real Anthropic provider (`claude-haiku-4-5`) or `MockLanguageModel` based on `ANTHROPIC_API_KEY` presence. Mock generates keyword-based placeholder components.

### Authentication

JWT sessions via `jose` (HS256, 7-day expiry) stored in `httpOnly` cookies. `src/lib/auth.ts` manages tokens; `src/actions/index.ts` has server actions for sign-up/sign-in/sign-out. Middleware in `src/middleware.ts` protects `/api/projects` and `/api/filesystem` routes.

### Database

Schema is defined in `prisma/schema.prisma` — reference it for data structure questions. Prisma client is generated to `src/generated/prisma`.

Two models:
- `User`: id, email, password (hashed), createdAt, updatedAt — has many Projects
- `Project`: id, name, userId? (nullable — supports anonymous users), messages (JSON string), data (JSON string — serialized virtual FS), createdAt, updatedAt

Anonymous work is tracked in localStorage and can be associated with an account after sign-up.

### Layout

`src/app/main-content.tsx` is the primary layout: resizable panels with chat (35%) on left, preview/code editor (65%) on right. Right panel has tabs to switch between iframe preview and Monaco code editor + file tree.

## Path Aliases

`@/*` maps to `./src/*`. Use this for all non-library imports.

## Tech Stack Versions

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4 (PostCSS-based, no config file)
- Prisma + SQLite
- Vercel AI SDK (`ai` package) + `@ai-sdk/anthropic`
- shadcn/ui components in `src/components/ui/`
- Monaco Editor for code editing
- Vitest + jsdom for tests
