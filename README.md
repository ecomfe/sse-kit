<h1 align="center">SSE-Kit</h1>
<div align="center">支持 web & 小程序(微信、百度) SSE SDK</div>

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

// 本地启动 Demo、 sdk 模块及本地测试的 SSE 服务；（默认 demo 项目为微信小程序）
$ pnpm start 

// 启动指定平台的 demo 项目
$ pnpm start h5/weapp/swan 

```

### local-service
> 用于本地调试的后端服务；

```
// 启动本地用于调试的后端服务；
$ pnpm run start:backend

// 确认服务是否启动成功；
$ curl -X POST http://localhost:3000/stream/numbers -H "Content-Type: application/json" -d '{}'

```

### taro-demo
> 用于本地调试的 Taro 项目
```
$ pnpm start:frontend
```
- 构建结果在 `taro-demo/dist/*` 目录下，不同端会创建对应的子目录；
- 本地调试时，需要配置 `local-service` 作为后端服务；

### sse-kit-sdk
```
// 本地调试 
$ pnpm run dev

// 构建产物
$ pnpm run build
```
#### 多端支持
- 当前支持 web、小程序（微信/百度），在`config/const.ts`中配置；
- 构建时，会根据平台标识自动构建对应平台的产物；
- 编写针对制定端平台的代码时，需要通过文件命名标识，例如：`index.weapp.ts`；