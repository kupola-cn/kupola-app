中文 | [English](./README.md)

# Kupola App

[Kupola](https://github.com/kupola-cn/kupola) 管理后台示例项目，包含前端应用和基于 PostgreSQL 的 Go 后端。

本项目用于展示如何使用 Kupola 的运行时、路由、认证和组件包构建实际管理后台。前端默认提供 Mock 模式，也可以按需切换到 Go + PostgreSQL 后端。

## 项目结构

```text
kupola-app/
├── frontend/              # Kupola + Vite 前端
├── backend/               # Gin + GORM 后端
│   ├── config/             # 配置加载
│   ├── database/           # 数据库连接、迁移和种子数据
│   ├── middleware/         # 认证和请求日志
│   ├── models/             # GORM 模型
│   ├── routes/              # API 路由和处理器
│   ├── scripts/setup-dev.ps1  # Windows 初始化脚本
│   ├── scripts/setup-dev.sh   # Linux/macOS 初始化脚本
│   ├── config.example.yaml
│   └── main.go
└── README.md
```

## 运行模式

本项目默认使用 **Mock 模式**。使用者只需要安装 Node.js，即可直接运行前端，不需要安装 Go、PostgreSQL，也不需要启动后端：

```powershell
cd frontend
npm install
npm run dev
```

Mock 模式适合快速体验页面、权限交互和前端业务流程。Mock 数据保存在浏览器内存中，刷新页面后恢复初始数据。

**HTTP + PostgreSQL 模式是可选项**，仅用于真实后端联调、数据库验证和接口开发。启用方式见下方“后端初始化”和“真实后端联调”。

## 环境要求

- Node.js 20+

只有使用 HTTP + PostgreSQL 模式时才需要额外安装：

- Go 1.22+
- PostgreSQL 14+
- PostgreSQL 服务运行在本机 `127.0.0.1:5432`

默认数据库配置为：用户 `postgres`，密码 `123456`，数据库 `kupola_app`。可以通过 `KUPOLA_*` 环境变量覆盖，不要在生产环境使用这些默认值。

## 后端初始化（可选）

Windows PowerShell：

```powershell
cd backend
.\scripts\setup-dev.ps1
```

Linux/macOS：

```bash
cd backend
bash ./scripts/setup-dev.sh
```

两套脚本都会创建 `kupola_app` 数据库，然后执行 GORM 迁移和初始种子数据。数据库结构和测试数据的唯一来源是后端代码中的 `migrate`、`seed` 命令，避免手写 SQL 与模型定义不一致。

当前初始化范围仅包含用户模块：创建 `users` 表，并写入 12 条业务用户和 4 条系统登录账号。组织机构、角色、权限点、菜单、字典、操作日志、登录日志和通知消息目前仍使用前端 Mock 数据，尚未创建对应的后端数据表。

也可以手动执行：

```powershell
cd backend
$env:KUPOLA_DATABASE_PASSWORD = '123456'
createdb -h 127.0.0.1 -p 5432 -U postgres kupola_app
go run . migrate
go run . seed
```

数据库已存在时，跳过 `createdb` 即可。启动命令：

```powershell
go run . server
```

后端地址：`http://127.0.0.1:8080`，健康检查：`http://127.0.0.1:8080/health`。

可用的后端命令：

```text
go run . server    start HTTP server
go run . migrate   run database migrations
go run . seed      seed initial users
```

## 前端启动

```powershell
cd frontend
npm install
npm run dev
```

前端默认使用 Mock 模式，不依赖 PostgreSQL 或后端服务。前端地址：`http://127.0.0.1:5173`。

默认 Mock 账号：`admin/newpass123`，其他测试账号密码为 `123456`。Mock 用户数据和用户 CRUD 只保存在当前浏览器进程内，刷新页面会恢复初始数据。

## 真实后端联调（可选）

先按上面的“后端初始化”完成数据库和后端启动，再在启动 Vite 前设置：

```powershell
$env:VITE_API_MODE = 'http'
npm run dev
```

HTTP 模式会通过 Vite 代理把 `/api` 请求发送到后端 `8080` 端口。

## 配置

可以复制 `backend/config.example.yaml` 为 `backend/config.yaml` 后按本机环境修改，也可以使用环境变量：

```powershell
$env:KUPOLA_DATABASE_PASSWORD = '123456'
$env:KUPOLA_JWT_SECRET = 'replace-with-a-secret-at-least-32-characters'
go run . server
```

生产环境必须替换数据库密码和 JWT 密钥。

## 初始账号

新数据库执行 `seed` 后的初始密码如下：

| 用户名 | 角色 |
| --- | --- |
| admin | 管理员，`newpass123` |
| operator | 运营管理员，`123456` |
| viewer | 只读成员，`123456` |
| auditor | 审计员，`123456` |

## 验证

```powershell
cd backend
go test ./...
go vet ./...

cd ..\frontend
npm run build
$env:KUPOLA_TEST_PASSWORD = 'newpass123'
npm run test:e2e
```

如管理员密码被修改过，可通过 `KUPOLA_TEST_PASSWORD` 指定当前密码。
