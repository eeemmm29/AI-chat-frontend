# Frontend Architecture & Guidelines

This directory contains the Next.js App Router frontend for the Chat Website.

## Tech Stack
- **Framework**: Next.js (App Router), TypeScript.
- **Package Manager**: PNPM.
- **UI Components**: HeroUI v3 for clean basic design.
- **State/Real-time**: Socket.io-client.

## Features to Implement
- User list / Search box.
- Input box for sending messages.
- Chat window showing message history.
- Dark mode toggle (via HeroUI/next-themes).
- Typing indicator UI.

## Integration
- Refer to `../AI-chat-backend/GEMINI.md` for API endpoint shapes and Socket.io events.
- All real-time messaging should be handled via the socket connection.