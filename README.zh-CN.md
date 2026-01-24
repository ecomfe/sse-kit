<div align="center">

# SSE-Kit

一个支持多端的 SSE (Server-Sent Events) 客户端工具包
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
- **异步迭代器**: 现代化的 `for await...of` 语法
- **生命周期钩子**: `onConnect`、`onComplete`、`onError`、`onHeadersReceived`
- **数据预处理**: 解析前转换数据
- **单元测试**: Vitest 测试基础设施
- **版本管理**: Changesets 自动化版本管理

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

// 方式一: 获取所有事件 (v2.0+ 推荐)
for await (const event of sse.events()) {
    console.log(event.event, event.data, event.id);
}

// 方式二: 仅获取 message 事件 (向后兼容)
for await (const data of sse.message()) {
    console.log(data);
}
```

## API 参考

### 构造函数选项

```typescript
interface ConstructorArgsType<TBody> {
    url: `https://${string}` | `http://${string}`;  // 必填
    method: 'POST' | 'GET';                          // 必填
    headers?: Record<string, string>;                // 请求头
    reqParams?: Record<string, string>;              // 请求参数
    timeout?: number;                                // 连接超时 (默认: 60000ms)
    credentials?: 'include' | 'same-origin' | 'omit';
    enableConsole?: boolean;                         // 启用调试日志

    // 生命周期回调
    onConnect?: () => void;                          // 连接建立
    onComplete?: (response: unknown) => void;        // 请求完成
    onError?: (err: Error) => void;                  // 发生错误
    onHeadersReceived?: (headers: HeadersType) => void;

    // 数据预处理 (在 JSON.parse 之前调用)
    preprocessDataCallback?: (data: string) => string;
}
```

### 实例方法

| 方法 | 返回类型 | 描述 |
|------|----------|------|
| `connect()` | `this` | 建立连接 (可链式调用) |
| `events()` | `AsyncIterableIterator<SSEEvent<TBody>>` | 获取所有事件及事件类型 |
| `message()` | `AsyncIterableIterator<TBody>` | 仅获取 message 事件 |
| `close()` | `void` | 关闭连接 |
| `getCurrentEventId()` | `number` | 获取当前事件计数 |

### 完整示例

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

    // 解码 base64 数据 (小程序常用)
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
        console.log('流结束');
    }
}
```

---

## v2.0 迁移指南

### 破坏性变更

#### `preprocessDataCallback` 参数格式变更

**之前 (v1.x):** 接收带 `data:` 前缀的原始 SSE 行
```typescript
preprocessDataCallback: (data) => {
    if (data.startsWith('data:')) {
        return `data: ${decode(data.replace(/^data:/, ''))}`;
    }
    return data;
}
```

**之后 (v2.0):** 接收不带 `data:` 前缀的纯数据内容
```typescript
preprocessDataCallback: (data) => {
    return decode(data);  // 例如: Base64.decode(data)
}
```

### v2.0 新特性

- **完整 SSE 协议**: 支持 `event:`、`data:`、`id:` 字段
- **`connect()` 方法**: 显式建立连接
- **`events()` 方法**: 获取所有事件及事件类型
- **React Native 支持**: 通过 `react-native-sse` 支持新平台

---

## 平台说明

| 平台 | 引入路径 | 说明 |
|------|----------|------|
| Web (H5) | `sse-kit/lib/bundle.h5.esm` | 标准 fetch 实现 |
| 微信小程序 | `sse-kit/lib/bundle.weapp.esm` | 自动处理 UTF-8 |
| 百度小程序 | `sse-kit/lib/bundle.swan.esm` | 建议使用 base64 编码 |
| React Native | `sse-kit/lib/bundle.rn.esm` | 需要 `react-native-sse` |

---

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式 (选择一个)
pnpm dev:h5     # Web
pnpm dev:weapp  # 微信小程序
pnpm dev:swan   # 百度小程序

# 构建 SDK
pnpm build:sdk

# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 启动测试服务器
pnpm dev:server
```

### 项目结构

```
sse-kit/
├── packages/
│   ├── sse-kit/           # 主 SSE 客户端库
│   │   ├── src/
│   │   │   ├── models/    # SSEProcessor 类
│   │   │   └── utils/     # 工具函数和平台实现
│   │   └── lib/           # 构建输出
│   ├── local-service/     # NestJS 测试服务器
│   └── taro-demo/         # Taro 演示应用
├── .changeset/            # Changesets 配置
└── turbo.json             # Turbo 构建配置
```

### 版本管理

使用 [Changesets](https://github.com/changesets/changesets) 进行版本管理：

```bash
# 创建变更记录
pnpm changeset

# 应用变更并更新版本
pnpm run version

# 构建并发布到 npm
pnpm release
```

### 测试

使用 [Vitest](https://vitest.dev/) 进行单元测试：

```bash
# 运行所有测试
pnpm test

# 仅运行 sse-kit 测试
pnpm test:sdk

# 运行并生成覆盖率报告
pnpm test:coverage
```

---

## 许可证

MIT
