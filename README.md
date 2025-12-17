# Research Assistant

这是一个用于管理研究项目和方向的 Web 应用程序。它提供了项目跟踪、研究方向管理以及 AI 辅助配置等功能。

## 功能特性

- **用户认证**：支持用户注册和登录。
- **项目管理**：创建、查看、更新和删除研究项目。
- **方向管理**：在项目中管理具体的研究方向。
- **AI 配置**：支持配置云端或本地 AI 模型以辅助研究。
- **设置**：自定义主题、布局和时区设置。

## 目录结构

- `server/`: 后端 Node.js/Express 代码，同时也负责提供前端静态资源服务。
- `web/`: 前端 React 代码 (使用 ES Modules，无需构建)。

## 快速开始

### 前提条件

- [Node.js](https://nodejs.org/) (建议 v16 或更高版本)

### 安装与运行

1. 进入 server 目录：
   ```bash
   cd server
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动服务器：
   ```bash
   npm start
   ```

4. 访问应用：
   打开浏览器访问 [http://localhost:4000](http://localhost:4000)。

## 环境变量

你可以在 `server` 目录下创建一个 `.env` 文件来配置环境变量（参考代码中的默认值）：

- `PORT`: 服务器端口 (默认: 4000)
- `JWT_SECRET`: JWT 签名密钥
- `ENFORCE_HTTPS`: 是否强制 HTTPS (默认: false)

## 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。
