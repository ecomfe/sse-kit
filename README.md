# SSE-Kit

<div align="center">支持 web & 小程序(微信、百度) SSE SDK</div>

## 特性
- 支持 Web、微信小程序、百度小程序
- 支持 TypeScript，提供完整的类型定义
- 支持自定义数据预处理
- 支持请求生命周期回调
- 支持请求中断

## 安装

```bash
npm install sse-kit
# 或
yarn add sse-kit
# 或
pnpm add sse-kit
```

## 使用方法

### 引入

根据你的平台选择对应的入口文件：

```typescript
// Web 环境
import { SSEProcessor } from 'sse-kit/lib/bundle.h5.esm';
// 微信小程序
import { SSEProcessor } from 'sse-kit/lib/bundle.weapp.esm';
// 百度小程序
import { SSEProcessor } from 'sse-kit/lib/bundle.swan.esm';
```

### 基础用法

```typescript
interface UserMessage {
  message: string;
  timestamp: number;
}

const processor = new SSEProcessor<UserMessage>({
  url: 'https://api.example.com/sse',
  method: 'POST',
  reqParams: {
    userId: '123'
  }
});

// 使用 for await...of 获取数据流
for await (const chunk of processor.message()) {
  console.log('收到消息:', chunk); // chunk 的类型为 UserMessage
}
```

### 完整配置示例

```typescript
const processor = new SSEProcessor<UserMessage>({
  // 必填参数
  url: 'https://api.example.com/sse',  // 请求地址
  method: 'POST',                      // 请求方法：'POST' | 'GET'
  
  // 可选参数
  reqParams: {},                       // 请求参数
  headers: {},                         // 请求头
  timeout: 60000,                      // 超时时间，默认 60s
  enableConsole: true,                 // 是否启用控制台日志
  
  // 生命周期回调
  onHeadersReceived: (headers: Headers) => {
    // 收到响应头时触发
    console.log('headers:', headers);
  },
  onComplete: () => {
    // 请求完成时触发
    console.log('请求完成');
  },
  onError: (err: Error) => {
    // 请求出错时触发
    console.error('请求错误:', err);
  },
  
  // 数据预处理
  preprocessDataCallback: (data: string | ArrayBuffer) => {
    // 在解析 JSON 之前对数据进行预处理
    return data;
  }
});
```

### 实例方法

#### message()
获取数据流的异步迭代器。

```typescript
for await (const chunk of processor.message()) {
  console.log(chunk);
}
```

#### getCurrentEventId()
获取当前事件 ID。

```typescript
const eventId = processor.getCurrentEventId();
```

#### close()
中断请求。

```typescript
processor.close();
```

### 类型说明

```typescript
interface ConstructorArgsType<TBody extends object> {
  // 必填参数
  url: `https://${string}` | `http://${string}`;  // 请求地址
  method: 'POST' | 'GET';                         // 请求方法
  
  // 可选参数
  headers?: Headers | Record<string, string>;     // 请求头
  reqParams?: Record<string, string>;             // 请求参数
  enableConsole?: boolean;                        // 是否启用日志
  timeout?: number;                               // 超时时间
  
  // 回调函数
  onConnect?: () => void;                         // 连接建立时
  onComplete?: () => void;                        // 请求完成时
  onReconnect?: () => void;                       // 重连时
  onError?: (err: Error) => void;                 // 发生错误时
  preprocessDataCallback?: (                      // 数据预处理
    data: string | ArrayBuffer
  ) => string | ArrayBuffer;
  onHeadersReceived?: (headers: Headers) => void; // 收到响应头时
}
```

## 注意事项

1. 泛型参数 `TBody` 必须是一个对象类型
2. 如果数据解析失败，对应的数据块会被跳过，并在控制台输出警告
3. 请求超时默认为 60 秒
4. 在小程序环境中使用时，需要在开发者工具中开启 "开启 UDP 能力"

## 调试

可以通过设置 `enableConsole: true` 开启调试日志，帮助排查问题。

## 快速开始

### 安装
```
$ pnpm install sse-kit
```

### 包目录
```
├─lib
├── bundle.h5.cjs.js
├── bundle.h5.esm.js
├── bundle.swan.cjs.js
├── bundle.swan.esm.js
├── bundle.weapp.cjs.js
└── bundle.weapp.esm.js
```

### 使用
```
// 按照当前平台引入 SDK；
import { SSEProcessor } from 'sse-kit/lib/xxx';

// 实例化 SSE 请求；
const sseInstance = new SSEProcessor({
    url: 'xxx',
    method: "POST",
    reqParams: {},
    onHeadersReceived: () => {
        // 请求连接建立成功，收到 response header；
    },
    onComplete: () => {
        // 请求完成；
    },
    onError: () => {
        // 请求出错；
    },
})；

// 获取 SSE 请求数据；
for await (const chunk of sseInstance.message()) {
   console.info('获取到新的 chunk----------:', chunk);
}
```

## 开发

```
$ pnpm install

// 启动指定平台的 demo 项目，默认启动对应 server 服务，对 sdk 进行构建并 watch 改动；
$ pnpm dev:h5/weapp/swan 

// 本地调试 
$ pnpm run dev:sdk

// 构建 sse-kit SDK
$ pnpm run build:sdk

```

### local-service
> 用于本地调试的后端服务；

```
// 启动本地用于调试的后端服务；
$ pnpm run dev:server

// 确认服务是否启动成功；
$ curl -X POST http://localhost:3000/stream/numbers -H "Content-Type: application/json" -d '{}'

```

### taro-demo
> 用于本地调试的 Taro 项目
```
$ pnpm dev:h5/weapp/swan 
```
- 构建结果在 `taro-demo/dist/*` 目录下，不同端会创建对应的子目录；
- 本地调试时，需要配置 `local-service` 作为后端服务；

### sse-kit-sdk
```
// 本地调试 
$ pnpm run dev:sdk

// 构建产物
$ pnpm run build:sdk
```
#### 多端支持
- 当前支持 web、小程序（微信/百度），在`config/const.ts`中配置；
- 构建时，会根据平台标识自动构建对应平台的产物；
- 编写针对制定端平台的代码时，需要通过文件命名标识，例如：`index.weapp.ts`；