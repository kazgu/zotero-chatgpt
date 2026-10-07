# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Zotero 7–10 plugin that integrates ChatGPT functionality into the reference management workflow. The plugin provides a chat interface in the reader pane, supports PDF content attachment, and includes features for generating literature reviews from selected papers.

## Development Commands

### Build and Development
```bash
npm start              # Start dev server, launch Zotero with hot reload
npm run build          # Production build (runs TypeScript check + build)
npm run lint           # Format with Prettier and lint with ESLint
npm run release        # Create release package
```

### Environment Setup
- Copy `.env.example` to `.env` and configure:
  - `ZOTERO_PLUGIN_ZOTERO_BIN_PATH`: Path to Zotero binary
  - `ZOTERO_PLUGIN_PROFILE_PATH`: Development profile path
  - `ZOTERO_PLUGIN_DATA_DIR`: Optional database directory

## Architecture

### Plugin Lifecycle (src/hooks.ts)
The plugin follows Zotero's lifecycle hooks pattern:
- `onStartup()`: Initializes locale, registers preferences, waits for Zotero ready
- `onMainWindowLoad(win)`: Creates ztoolkit instance, registers UI components per window
- `onMainWindowUnload(win)`: Cleanup for window close
- `onShutdown()`: Full cleanup on plugin disable/uninstall

### Core Module Structure (src/modules/main.ts)
Organized into factory classes using the `@example` decorator pattern:

**BasicExampleFactory**: Preferences and notifier registration
**KeyExampleFactory**: Keyboard shortcuts (currently disabled)
**UIExampleFactory**: Main UI components
  - `registerReaderItemPaneSection()`: Chat interface in reader pane (lines 268-797)
  - `registerRightClickMenuItem()`: Context menu integration
  - `registerStyleSheet()`: Custom CSS injection

**HelperExampleFactory**: Dialog and utility functions
  - `dialogExample()`: Literature review generator (lines 804-1081)
    - Collects selected papers with title/abstract/authors
    - Generates related work section using ChatGPT streaming API
    - Special handling: Items with abstractNote='Topic' are treated as the review topic

### Chat Session Management
Uses WeakMap to store per-item chat sessions (lines 18-31 in main.ts):
- Preserves conversation history across UI refreshes
- Tracks PDF attachment state to avoid re-sending large content
- Messages include role (user/assistant/system), content, and timestamp

### API Integration
OpenAI-compatible streaming API:
- Credentials from preferences: `getPref('input')`, `getPref('base')`, `getPref('model')`
- Streaming response handling with SSE format parsing
- Markdown rendering with code block support (lines 479-517)
- Error recovery for incomplete markdown during streaming

### Global Objects
- `addon`: Main addon instance (Zotero[config.addonInstance])
- `ztoolkit`: Zotero Plugin Toolkit instance, recreated per window
- `rootURI`: Base URI for chrome:// resources

## Build System (zotero-plugin.config.ts)

Uses `zotero-plugin-scaffold`:
- Source: `src/` (TypeScript) + `addon/` (static assets)
- Output: `build/` directory
- Entry point: `src/index.ts` → `build/addon/chrome/content/scripts/zoterochatbot.js`
- Target: Firefox 115 syntax floor (compatible with Zotero 7 through 10; manifest has no `strict_max_version`)
- Assets copied from `addon/**/*.*` (manifest, locales, preferences UI, icons)

## Localization

Fluent (.ftl) files in `addon/locale/{en-US,zh-CN}/`:
- Access via `getString(key)` or `getLocaleID(key)` helpers
- Keys prefixed with addon namespace for FTL insertion
- Supports both English and Chinese

## Key Files

- `src/index.ts`: Plugin bootstrap, global object setup
- `src/addon.ts`: Addon class definition with data/hooks/api structure
- `src/hooks.ts`: Lifecycle event dispatcher
- `src/modules/main.ts`: All UI and feature implementations (1128 lines)
- `src/modules/preferenceScript.ts`: Preferences pane logic
- `src/utils/prefs.ts`: Preference getter/setter wrappers
- `addon/chrome/content/preferences.xhtml`: Preferences UI
- `package.json`: Config object with addonName, addonID, addonRef, addonInstance

## Important Patterns

### Decorator Pattern
The `@example` decorator wraps methods with try-catch logging. Used throughout factory classes for debugging.

### Preference Access
```typescript
const apiKey = getPref('input') as string;
const baseUrl = getPref('base') as string;
const model = getPref('model') as string;
```

### UI Element Creation
Uses ztoolkit.UI.createElement() for programmatpulation. Preference for inline styles in bodyXHTML for item pane sections.

### Streaming Response Handling
Parse SSE format: split by newlines, strip "data:" prefix, handle "[DONE]" marker, extract delta content from JSON chunks.

## Notes

- The plugin uses WeakMap for chat sessions to prevent memory leaks when items are deleted
- PDF content is cached in session after first attachment to avoid re-reading large files
- Markdown rendering includes fallback to plain text if HTML parsing fails mid-stream
- The literature review feature expects one item with abstractNote='Topic' to define the review subject
