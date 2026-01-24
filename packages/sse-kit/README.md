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
| `message()` | `AsyncIterableIterator<TBody>` | Get message events only (backward compatible) |
| `close()` | `void` | Close connection |
| `getCurrentEventId()` | `number` | Get current event count |

### SSEEvent Type

```typescript
interface SSEEvent<TBody> {
    event: string;   // Event type: 'message' | 'error' | custom
    data: TBody;     // Parsed JSON data
    id?: string;     // Event ID (optional)
}
```

## Full Example

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
    onHeadersReceived: (headers) => console.log('Headers:', headers),

    // Decode base64 data (common in mini programs)
    preprocessDataCallback: (data) => {
        try {
            return atob(data);
        } catch {
            return data;
        }
    }
});

// Use explicit connect + events
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

#### 1. `preprocessDataCallback` Parameter Format Changed

**Before (v1.x):** Received raw SSE line with `data:` prefix
```typescript
// v1.x
preprocessDataCallback: (data) => {
    if (data.startsWith('data:')) {
        return `data: ${decode(data.replace(/^data:/, ''))}`;
    }
    return data;
}
```

**After (v2.0):** Receives pure data content without `data:` prefix
```typescript
// v2.0
preprocessDataCallback: (data) => {
    // data is already extracted from "data: xxx" line
    return decode(data);  // e.g., Base64.decode(data)
}
```

### New Features in v2.0

#### 1. Full SSE Protocol Support

Now supports all SSE fields:
```
event: custom-event
id: 123
data: {"key": "value"}
```

#### 2. New `connect()` Method

Explicitly establish connection (optional, auto-connects on `events()`/`message()`):
```typescript
const sse = new SSEProcessor(options).connect();
```

#### 3. New `events()` Method

Get all events with event type:
```typescript
for await (const event of sse.events()) {
    console.log(event.event);  // 'message', 'done', 'error', etc.
    console.log(event.data);   // Parsed data
    console.log(event.id);     // Event ID
}
```

#### 4. React Native Support

New platform support:
```typescript
import { SSEProcessor } from 'sse-kit/lib/bundle.rn.esm';
```

Requires peer dependency:
```bash
npm install react-native-sse
```

### Backward Compatibility

| API | Status |
|-----|--------|
| `new SSEProcessor(options)` | Compatible |
| `processor.message()` | Compatible |
| `processor.close()` | Compatible |
| `processor.getCurrentEventId()` | Compatible |
| `preprocessDataCallback` | **Parameter format changed** |

---

## Platform Notes

### Baidu Mini Program
- Chinese characters may have encoding issues
- Recommend using base64 encoding for data transmission
- Use `preprocessDataCallback` to decode base64

### WeChat Mini Program
- Handles UTF-8 boundary issues automatically
- ArrayBuffer to string conversion built-in

### React Native
- Requires `react-native-sse` package
- Add to `peerDependencies` in your project

---

## Development

```bash
# Install dependencies
pnpm install

# Start development (choose one)
pnpm dev:h5     # Web
pnpm dev:weapp  # WeChat Mini Program
pnpm dev:swan   # Baidu Mini Program

# Build SDK
pnpm build:sdk

# Start test server
pnpm dev:server

# Test server endpoint
curl -X POST http://localhost:3000/stream/numbers -H "Content-Type: application/json" -d '{}'
```

### Directory Structure

```
lib/
├── bundle.h5.cjs.js
├── bundle.h5.esm.js
├── bundle.weapp.cjs.js
├── bundle.weapp.esm.js
├── bundle.swan.cjs.js
├── bundle.swan.esm.js
├── bundle.rn.cjs.js
├── bundle.rn.esm.js
└── index.d.ts
```

### Multi-platform Build

- Platforms configured in `config/const.js`: `['weapp', 'swan', 'h5', 'rn']`
- Platform-specific code uses file naming: `index.weapp.ts`, `index.swan.ts`, `index.rn.ts`
- Build automatically generates platform-specific bundles

## License

MIT
