# 多端 SSE 前端 SDK

## 概述

## 安装

## 开发

### steam-local-service

> 用于本地调试的后端服务；

```
// 启动本地用于调试的后端服务；
$ pnpm run start:backend

// 确认服务是否启动成功；
$ curl -X POST http://localhost:3000/stream/numbers -H "Content-Type: application/json" -d '{}'

```

### steam-taro-demo

> 用于本地调试的 Taro 项目