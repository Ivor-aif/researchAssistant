# 研究助手 API（v1）

- 基础路径：`/api/v1`
- 认证：除 `/auth/*` 外的接口均需 `Authorization: Bearer <JWT>`

## Auth
- POST `/auth/register` { username, password }
- POST `/auth/login` { username, password } → { token }

## Projects
- GET `/projects` → 项目列表（当前用户）
- POST `/projects` { name, description? }
- PUT `/projects/:id` { name?, description? }
- DELETE `/projects/:id`

## Directions
- GET `/directions?projectId=<id>` → 指定项目方向列表（若不传，返回当前用户所有项目的方向）
- POST `/directions` { projectId, name, description? }
- PUT `/directions/:id` { name?, description? }
- DELETE `/directions/:id`

## Config
- GET `/config/ai` → { type, url_redacted, model_path, params_json }
- GET `/config/ai/:apiName`
- POST `/config/ai` { apiName, type: 'cloud'|'local', url?, apiKey?, modelPath?, paramsJson? }
- POST `/config/ai/test` { apiName } → { status, latency_ms }
- GET `/config/settings`
- POST `/config/settings` { theme?, layout?, timezone?, config_json? }

## Meta
- GET `/meta` → 列出端点清单与版本

## 安全
- 速率限制：全局 200 req/15min
- HTTPS 强制：`ENFORCE_HTTPS=true` 时要求 `req.secure`
- 密钥：`.env` 中 `JWT_SECRET` 与 `CONFIG_ENC_KEY`（32字节）

## 运行
1. `cd server && npm install && npm run start`
2. 前端开发页面位于 `web/`，由后端静态服务在 `http://localhost:4000/`
