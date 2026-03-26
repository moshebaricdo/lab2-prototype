# Lab2 UI Prototype

This repository is a Lab2 frame/base for interactive coding-lab experiences.

It currently powers a Web Lab 2 prototype, and is being structured so additional Lab2-powered environments (for example Python Lab or Music Lab) can reuse the same shell, UI primitives, and architecture patterns.

## What This Project Is For

- Prototyping and validating Lab2 UX flows quickly
- Iterating on shared Lab2 frame components (header, resource panel, workspace shell)
- Testing environment-specific behavior with environment-specific data

## Current Architecture Snapshot

- Lab-specific workspace views: `src/components/weblab2/views`
- Shared frame/panel components: `src/components/resource-panel`
- Shared UI primitives: `src/components/ui` and `src/components/ui/header`
- Icons: `src/components/icons`
- Environment-specific data: `src/data/weblab2`

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Start local development server

```bash
npm run dev
```

### 3) Validate before shipping changes

```bash
npm run typecheck
npm run build
```

## Design Tokens

Design tokens are generated into `src/styles/tokens.css`.

To regenerate:

```bash
npm run token:generate
```

The generator resolves token files in this order:

1. `WL2_LIGHT_TOKENS_PATH` / `WL2_DARK_TOKENS_PATH` environment variables
2. `tokens/semantic/light.tokens.json` and `tokens/semantic/dark.tokens.json`
3. legacy desktop export paths used during migration

## Related Docs

- Guidelines: `src/guidelines/Guidelines.md`
- Architecture overview: `src/ARCHITECTURE.md`
  