<div align="center">

# SSE-Kit

A multi-platform SSE (Server-Sent Events) client toolkit
Supports Web, WeChat Mini Program, Baidu Mini Program, and React Native

[![npm version](https://img.shields.io/npm/v/sse-kit.svg)](https://www.npmjs.com/package/sse-kit)
[![license](https://img.shields.io/npm/l/sse-kit.svg)](https://github.com/ecomfe/sse-kit/blob/main/LICENSE)
[![GitHub](https://img.shields.io/github/stars/ecomfe/sse-kit?style=flat)](https://github.com/ecomfe/sse-kit)

[English](./README.md) | [中文](./README.zh-CN.md)

</div>

---

## Features

- **Multi-platform**: Web (H5), WeChat Mini Program, Baidu Mini Program, React Native
- **Full SSE Protocol**: Supports `event:`, `data:`, `id:` fields
- **TypeScript**: Complete type definitions
- **Async Iterator**: Modern `for await...of` syntax
- **Lifecycle Hooks**: `onConnect`, `onComplete`, `onError`, `onHeadersReceived`
- **Data Preprocessing**: Transform data before parsing
- **Unit Testing**: Vitest testing infrastructure
- **Version Management**: Changesets for automated versioning

## Installation

```bash
npm install sse-kit
# or
pnpm add sse-kit
```

## Quick Start

```typescript
import { SSEProcessor } from 'sse-kit/lib/bundle.h5.esm';      // Web
// import { SSEProcessor } from 'sse-kit/lib/bundle.weapp.esm'; // WeChat
// import { SSEProcessor } from 'sse-kit/lib/bundle.swan.esm';  // Baidu
// import { SSEProcessor } from 'sse-kit/lib/bundle.rn.esm';    // React Native

const sse = new SSEProcessor({
    url: 'https://api.example.com/sse',
    method: 'POST',
    reqParams: { query: 'hello' }
});

// Method 1: Get all events (recommended for v2.0+)
for await (const event of sse.events()) {
    console.log(event.event, event.data, event.id);
}

// Method 2: Get message events only (backward compatible)
for await (const data of sse.message()) {
    console.log(data);
}
```

## API Reference

### Constructor Options

```typescript
interface ConstructorArgsType<TBody> {
    url: `https://${string}` | `http://${string}`;  // Required
    method: 'POST' | 'GET';                          // Required
    headers?: Record<string, string>;                // Request headers
    reqParams?: Record<string, string>;              // Request parameters
    timeout?: number;                                // Connection timeout (default: 60000ms)
    credentials?: 'include' | 'same-origin' | 'omit';
    enableConsole?: boolean;                         // Enable debug logs

    // Lifecycle callbacks
    onConnect?: () => void;                          // Connection established
    onComplete?: (response: unknown) => void;        // Request completed
    onError?: (err: Error) => void;                  // Error occurred
    onHeadersReceived?: (headers: HeadersType) => void;

    // Data preprocessing (called before JSON.parse)
    preprocessDataCallback?: (data: string) => string;
}
```

### Instance Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `connect()` | `this` | Establish connection (chainable) |
| `events()` | `AsyncIterableIterator<SSEEvent<TBody>>` | Get all events with event type |
| `message()` | `AsyncIterableIterator<TBody>` | Get message events only |
| `close()` | `void` | Close connection |
| `getCurrentEventId()` | `number` | Get current event count |

### Full Example

```typescript
const sse = new SSEProcessor<MyDataType>({
    url: 'https://api.example.com/sse',
    method: 'POST',
    headers: { 'Authorization': 'Bearer token' },
    reqParams: { userId: '123' },
    timeout: 120000,
    enableConsole: true,

    onConnect: () => console.log('Connected'),
    onComplete: () => console.log('Completed'),
    onError: (err) => console.error('Error:', err),

    // Decode base64 data (common in mini programs)
    preprocessDataCallback: (data) => {
        try {
            return atob(data);
        } catch {
            return data;
        }
    }
});

for await (const event of sse.connect().events()) {
    if (event.event === 'message') {
        handleMessage(event.data);
    } else if (event.event === 'done') {
        console.log('Stream done');
    }
}
```

---

## v2.0 Migration Guide

### Breaking Changes

#### `preprocessDataCallback` Parameter Format Changed

**Before (v1.x):** Received raw SSE line with `data:` prefix
```typescript
preprocessDataCallback: (data) => {
    if (data.startsWith('data:')) {
        return `data: ${decode(data.replace(/^data:/, ''))}`;
    }
    return data;
}
```

**After (v2.0):** Receives pure data content without `data:` prefix
```typescript
preprocessDataCallback: (data) => {
    return decode(data);  // e.g., Base64.decode(data)
}
```

### New Features in v2.0

- **Full SSE Protocol**: Supports `event:`, `data:`, `id:` fields
- **`connect()` Method**: Explicitly establish connection
- **`events()` Method**: Get all events with event type
- **React Native Support**: New platform via `react-native-sse`

---

## Platform Notes

| Platform | Import Path | Notes |
|----------|-------------|-------|
| Web (H5) | `sse-kit/lib/bundle.h5.esm` | Standard fetch-based |
| WeChat Mini Program | `sse-kit/lib/bundle.weapp.esm` | Auto UTF-8 handling |
| Baidu Mini Program | `sse-kit/lib/bundle.swan.esm` | Recommend base64 encoding |
| React Native | `sse-kit/lib/bundle.rn.esm` | Requires `react-native-sse` |

---

## Development

```bash
# Install dependencies
pnpm install

# Development (choose one)
pnpm dev:h5     # Web
pnpm dev:weapp  # WeChat Mini Program
pnpm dev:swan   # Baidu Mini Program

# Build SDK
pnpm build:sdk

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Start test server
pnpm dev:server
```

### Project Structure

```
sse-kit/
├── packages/
│   ├── sse-kit/           # Main SSE client library
│   │   ├── src/
│   │   │   ├── models/    # SSEProcessor class
│   │   │   └── utils/     # Utilities and platform implementations
│   │   └── lib/           # Build output
│   ├── local-service/     # NestJS test server
│   └── taro-demo/         # Taro demo application
├── .changeset/            # Changesets configuration
└── turbo.json             # Turbo build configuration
```

### Version Management

Using [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Create a changeset
pnpm changeset

# Apply changesets and update versions
pnpm run version

# Build and publish to npm
pnpm release
```

### Testing

Using [Vitest](https://vitest.dev/) for unit testing:

```bash
# Run all tests
pnpm test

# Run sse-kit tests only
pnpm test:sdk

# Run with coverage
pnpm test:coverage
```

---

## License

MIT
