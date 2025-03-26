<div align="center">

# SSE-Kit

一个支持多端的 SSE 客户端工具包
支持 Web、微信小程序、百度小程序

[![npm version](https://img.shields.io/npm/v/sse-kit.svg)](https://www.npmjs.com/package/sse-kit)
[![license](https://img.shields.io/npm/l/sse-kit.svg)](https://github.com/ecomfe/sse-kit/blob/main/LICENSE)
[![GitHub](https://img.shields.io/github/stars/ecomfe/sse-kit?style=flat)](https://github.com/ecomfe/sse-kit)

</div>


## ✨ 特性
- 🌐 多端支持：Web、微信小程序、百度小程序
- 📦 开箱即用：完整的 TypeScript 类型支持
- 🛠 功能丰富：支持数据预处理、生命周期回调、请求中断等

## 🚀 快速开始

### 安装
```bash
npm install sse-kit
# 或者
pnpm add sse-kit
```

### 基础使用
```typescript
import { SSEProcessor } from 'sse-kit/lib/bundle.h5.esm';  // Web 环境
// import { SSEProcessor } from 'sse-kit/lib/bundle.weapp.esm';  // 微信小程序
// import { SSEProcessor } from 'sse-kit/lib/bundle.swan.esm';   // 百度小程序

// 创建 SSE 实例
const sse = new SSEProcessor({
    url: 'https://api.example.com/sse',
    method: 'POST'
});

// 接收数据流
for await (const data of sse.message()) {
    console.log('收到消息:', data);
}
```

## 📖 详细使用

### 完整配置示例
```typescript
const sse = new SSEProcessor({
    // 基础配置
    url: 'https://api.example.com/sse',
    method: 'POST',
    reqParams: { userId: '123' },
    headers: { 'Authorization': 'Bearer token' },
    
    // 高级配置
    timeout: 60000,        // 超时时间：60s
    enableConsole: true,   // 开启调试日志
    
    // 生命周期回调
    onHeadersReceived: (headers) => console.log('连接成功'),
    onComplete: () => console.log('请求完成'),
    onError: (err) => console.error('请求错误', err),
    
    // 数据预处理
    preprocessDataCallback: (data) => data
});
```

### 实例方法
- `message()`: 获取数据流
- `getCurrentEventId()`: 获取当前事件 ID
- `close()`: 中断请求

## ⚠️ 注意事项
1. 请求超时默认为 60 秒
2. 百度小程序环境下可能出现中文乱码，建议使用 base64 编码传输数据
3. 开启 `enableConsole: true` 可以查看详细日志，便于调试

## 🔧 本地开发

### 启动开发服务
```bash
# 安装依赖
pnpm install

# 启动开发环境（选择一个）
pnpm dev:h5     # Web 环境
pnpm dev:weapp  # 微信小程序
pnpm dev:swan   # 百度小程序

# 启动本地测试服务
pnpm dev:server
```

### 目录结构
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