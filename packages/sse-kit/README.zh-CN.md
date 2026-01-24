<div align="center">

# SSE-Kit

一个支持多端的 SSE（Server-Sent Events）客户端工具包
支持 Web、微信小程序、百度小程序、React Native

[![npm version](https://img.shields.io/npm/v/sse-kit.svg)](https://www.npmjs.com/package/sse-kit)
[![license](https://img.shields.io/npm/l/sse-kit.svg)](https://github.com/ecomfe/sse-kit/blob/main/LICENSE)
[![GitHub](https://img.shields.io/github/stars/ecomfe/sse-kit?style=flat)](https://github.com/ecomfe/sse-kit)

[English](./README.md) | [中文](./README.zh-CN.md)

</div>

---

## 特性

- **多端支持**: Web (H5)、微信小程序、百度小程序、React Native
- **完整 SSE 协议**: 支持 `event:`、`data:`、`id:` 字段
- **TypeScript**: 完整的类型定义
- **异步迭代器**: 现代 `for await...of` 语法
- **生命周期钩子**: `onConnect`、`onComplete`、`onError`、`onHeadersReceived`
- **数据预处理**: 解析前转换数据

## 安装

```bash
npm install sse-kit
# 或者
pnpm add sse-kit
```

## 快速开始

```typescript
import { SSEProcessor } from 'sse-kit/lib/bundle.h5.esm';      // Web
// import { SSEProcessor } from 'sse-kit/lib/bundle.weapp.esm'; // 微信小程序
// import { SSEProcessor } from 'sse-kit/lib/bundle.swan.esm';  // 百度小程序
// import { SSEProcessor } from 'sse-kit/lib/bundle.rn.esm';    // React Native

const sse = new SSEProcessor({
    url: 'https://api.example.com/sse',
    method: 'POST',
    reqParams: { query: 'hello' }
});

// 方式一：获取所有事件（v2.0+ 推荐）
for await (const event of sse.events()) {
    console.log(event.event, event.data, event.id);
}

// 方式二：仅获取 message 事件（向后兼容）
for await (const data of sse.message()) {
    console.log(data);
}
```

## API 参考

### 构造函数参数

```typescript
interface ConstructorArgsType<TBody> {
    url: `https://${string}` | `http://${string}`;  // 必填
    method: 'POST' | 'GET';                          // 必填
    headers?: Record<string, string>;                // 请求头
    reqParams?: Record<string, string>;              // 请求参数
    timeout?: number;                                // 连接超时（默认: 60000ms）
    credentials?: 'include' | 'same-origin' | 'omit';
    enableConsole?: boolean;                         // 开启调试日志

    // 生命周期回调
    onConnect?: () => void;                          // 连接建立
    onComplete?: (response: unknown) => void;        // 请求完成
    onError?: (err: Error) => void;                  // 发生错误
    onHeadersReceived?: (headers: HeadersType) => void;

    // 数据预处理（在 JSON.parse 之前调用）
    preprocessDataCallback?: (data: string) => string;
}
```

### 实例方法

| 方法 | 返回类型 | 描述 |
|------|----------|------|
| `connect()` | `this` | 建立连接（可链式调用） |
| `events()` | `AsyncIterableIterator<SSEEvent<TBody>>` | 获取所有事件（含事件类型） |
| `message()` | `AsyncIterableIterator<TBody>` | 仅获取 message 事件（向后兼容） |
| `close()` | `void` | 关闭连接 |
| `getCurrentEventId()` | `number` | 获取当前事件计数 |

### SSEEvent 类型

```typescript
interface SSEEvent<TBody> {
    event: string;   // 事件类型: 'message' | 'error' | 自定义
    data: TBody;     // 解析后的 JSON 数据
    id?: string;     // 事件 ID（可选）
}
```

## 完整示例

```typescript
const sse = new SSEProcessor<MyDataType>({
    url: 'https://api.example.com/sse',
    method: 'POST',
    headers: { 'Authorization': 'Bearer token' },
    reqParams: { userId: '123' },
    timeout: 120000,
    enableConsole: true,

    onConnect: () => console.log('已连接'),
    onComplete: () => console.log('已完成'),
    onError: (err) => console.error('错误:', err),
    onHeadersReceived: (headers) => console.log('Headers:', headers),

    // 解码 base64 数据（小程序常用）
    preprocessDataCallback: (data) => {
        try {
            return atob(data);
        } catch {
            return data;
        }
    }
});

// 使用显式 connect + events
for await (const event of sse.connect().events()) {
    if (event.event === 'message') {
        handleMessage(event.data);
    } else if (event.event === 'done') {
        console.log('流结束');
    }
}
```

---

## v2.0 升级指南

### Breaking Changes

#### 1. `preprocessDataCallback` 参数格式变更

**之前 (v1.x):** 接收包含 `data:` 前缀的原始 SSE 行
```typescript
// v1.x
preprocessDataCallback: (data) => {
    if (data.startsWith('data:')) {
        return `data: ${decode(data.replace(/^data:/, ''))}`;
    }
    return data;
}
```

**之后 (v2.0):** 接收不含 `data:` 前缀的纯数据内容
```typescript
// v2.0
preprocessDataCallback: (data) => {
    // data 已经从 "data: xxx" 行中提取出来
    return decode(data);  // 例如: Base64.decode(data)
}
```

### v2.0 新特性

#### 1. 完整 SSE 协议支持

现在支持所有 SSE 字段:
```
event: custom-event
id: 123
data: {"key": "value"}
```

#### 2. 新增 `connect()` 方法

显式建立连接（可选，`events()`/`message()` 会自动连接）:
```typescript
const sse = new SSEProcessor(options).connect();
```

#### 3. 新增 `events()` 方法

获取所有事件（包含事件类型）:
```typescript
for await (const event of sse.events()) {
    console.log(event.event);  // 'message', 'done', 'error' 等
    console.log(event.data);   // 解析后的数据
    console.log(event.id);     // 事件 ID
}
```

#### 4. React Native 支持

新增平台支持:
```typescript
import { SSEProcessor } from 'sse-kit/lib/bundle.rn.esm';
```

需要安装 peer dependency:
```bash
npm install react-native-sse
```

### 向后兼容性

| API | 状态 |
|-----|------|
| `new SSEProcessor(options)` | ✅ 兼容 |
| `processor.message()` | ✅ 兼容 |
| `processor.close()` | ✅ 兼容 |
| `processor.getCurrentEventId()` | ✅ 兼容 |
| `preprocessDataCallback` | ⚠️ **参数格式变更** |

---

## 平台注意事项

### 百度小程序
- 中文字符可能出现编码问题
- 建议使用 base64 编码传输数据
- 使用 `preprocessDataCallback` 解码 base64

### 微信小程序
- 自动处理 UTF-8 边界问题
- 内置 ArrayBuffer 到字符串转换

### React Native
- 需要安装 `react-native-sse` 包
- 在项目中添加到 `peerDependencies`

---

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发环境（选择一个）
pnpm dev:h5     # Web
pnpm dev:weapp  # 微信小程序
pnpm dev:swan   # 百度小程序

# 构建 SDK
pnpm build:sdk

# 启动测试服务
pnpm dev:server

# 测试服务接口
curl -X POST http://localhost:3000/stream/numbers -H "Content-Type: application/json" -d '{}'
```

### 目录结构

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

### 多端构建

- 平台配置在 `config/const.js`: `['weapp', 'swan', 'h5', 'rn']`
- 平台特定代码使用文件命名: `index.weapp.ts`、`index.swan.ts`、`index.rn.ts`
- 构建自动生成各平台产物

## 许可证

MIT
