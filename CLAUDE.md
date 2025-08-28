# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a multi-platform SSE (Server-Sent Events) client toolkit supporting Web, WeChat Mini Programs, and Baidu Smart Mini Programs. The project uses a monorepo structure with pnpm workspaces and Turbo for build orchestration.

## Project Structure

```
packages/
├── sse-kit/           # Main SSE client library
├── local-service/     # NestJS development server for testing
└── taro-demo/         # Taro demo application for testing
```

## Development Commands

All commands should be run from the repository root using pnpm.

### Core Development
- `pnpm install` - Install all dependencies
- `pnpm dev:sdk` - Start SSE kit development mode with hot reload
- `pnpm build:sdk` - Build the SSE kit library

### Platform-Specific Development
- `pnpm dev:h5` - Web/H5 development (includes SDK and test server)
- `pnpm dev:weapp` - WeChat Mini Program development
- `pnpm dev:swan` - Baidu Smart Mini Program development
- `pnpm dev:server` - Start the NestJS test server only

### Testing
- `pnpm test` - Run tests in local-service package
- Test server endpoint: `curl -X POST http://localhost:3000/stream/numbers -H "Content-Type: application/json" -d '{}'`

### Type Checking
- `pnpm check-types` - Run TypeScript type checking across all packages

## Multi-Platform Build System

The SSE kit uses a custom build system that creates platform-specific bundles:

### Platform Support
Platforms are defined in `packages/sse-kit/config/const.js`:
- `h5` - Web browsers
- `weapp` - WeChat Mini Programs  
- `swan` - Baidu Smart Mini Programs
- `rn` - React Native

### Platform-Specific Code
Use file naming conventions for platform-specific implementations:
- `index.ts` - Default implementation
- `index.weapp.ts` - WeChat Mini Program specific
- `index.swan.ts` - Baidu Smart Mini Program specific
- `index.rn.ts` - React Native specific

### Build Output
Each platform generates both CJS and ESM bundles in `packages/sse-kit/lib/`:
- `bundle.{platform}.cjs.js`
- `bundle.{platform}.esm.js`
- Corresponding `.d.ts` files

## Core Architecture

### SSEProcessor Class
Main class in `packages/sse-kit/src/models/SSEProcessor.ts`:
- Implements async iterator pattern via `message()` method
- Supports request timeout (default 60s)
- Platform-agnostic streaming via `requestStreaming` utilities
- Includes abort/close functionality

### Key Features
- **Multi-platform networking**: Different implementations for web vs mini-programs
- **Data preprocessing**: Configurable data transformation callbacks
- **Lifecycle hooks**: onHeadersReceived, onComplete, onError callbacks
- **Request timeout**: Configurable timeout with abort handling
- **Console logging**: Debug logging that can be enabled/disabled

### Request Streaming Utilities
Located in `packages/sse-kit/src/utils/requestStreaming/`:
- Platform-specific HTTP streaming implementations
- Handles differences between fetch API, XMLHttpRequest, and mini-program APIs
- Manages chunk processing and data parsing

## Development Notes

### Platform Considerations
- Baidu Smart Mini Program may have Chinese character encoding issues - use base64 when needed
- Each platform has different networking APIs requiring separate implementations
- The build system uses Rollup with custom Babel plugins for platform-specific bundling

### Debugging
- Set `enableConsole: true` in SSEProcessor options for detailed logging
- Use the local-service package to test streaming endpoints during development

## Current Working Branch
The repository is currently on branch `fix_abortError` working on abort error handling improvements.

## Development History

### Recent Optimizations (fix_abortError branch)
**Key Issues Addressed:**
1. **Error Swallowing**: Fixed critical issue in encodeBuffer.ts where original parsing errors were being masked
2. **Resource Leaks**: Implemented proper ReadableStream reader cleanup to prevent SSE connection resource leaks during abort operations
3. **Request Duplication**: Added deduplication mechanisms to prevent browser auto-retry causing backend to receive duplicate requests during 10s stalled scenarios
4. **Code Structure**: Optimized codebase while maintaining 100% API compatibility and multi-platform build architecture

**Major Changes:**
- Created `common.ts` utilities for shared functionality across platforms while preserving platform-specific build separation
- Fixed error propagation in `encodeBuffer.ts` - now returns undefined instead of throwing masked JSON errors
- Added proper resource cleanup for streaming readers in web platform implementation
- Implemented RequestState class for consistent state management across platforms
- Converted all Chinese comments and strings to English for GitHub publication

**Files Modified:**
- `src/utils/requestStreaming/common.ts` (NEW) - Shared utilities and RequestState management
- `src/utils/requestStreaming/index.ts` - Enhanced with proper reader cleanup and error handling
- `src/utils/encodeBuffer.ts` - Fixed error masking, updated to English comments
- `src/models/SSEProcessor.ts` - Updated error messages and comments to English
- `config/const.js`, `loaders/index.js` - Converted build system comments to English
- All utility files - Converted JSDoc comments from Chinese to English

**Build Verification:**
All platform bundles (weapp, swan, h5, rn) build successfully with no TypeScript errors. The multi-platform architecture is preserved while code maintainability is significantly improved.