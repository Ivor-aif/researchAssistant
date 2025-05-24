# AI 研究助手

## 项目概述

本项目是一个基于人工智能的研究助手系统，旨在帮助研究人员提高研究效率。系统能够根据用户的研究方向自动检索相关论文、识别创新点、追踪研究进度，并生成研究报告。

## 主要功能

- 智能论文检索：基于用户研究方向的精准论文推荐
- 创新点分析：自动识别和提取论文中的创新点
- 研究进度追踪：可视化展示研究项目的进展情况
- 报告生成：自动生成研究总结和进度报告

## 技术栈

### 前端
- React + TypeScript
- Vite 构建工具
- 现代化UI组件库

### 后端
- C/C++ 核心服务
- Python 辅助服务
- PostgreSQL 数据库

### AI 集成
- OpenAI Vision API
- 自定义机器学习模型

## 快速开始

### 系统要求
- Node.js 18.x
- Python 3.10.x
- PostgreSQL 14.x
- Docker 20.10.x（可选）

### 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd researchAssistant
```

2. 安装依赖
```bash
# 前端依赖
npm install

# 后端依赖
cd backend
pip install -r requirements_utf8.txt
```

3. 启动服务
```bash
# 前端开发服务器
npm run dev

# 后端服务
cd backend
python src/main.py
```

## 文档

- [API文档](./docs/api-documentation.md)
- [系统架构](./docs/system-architecture.md)
- [部署指南](./docs/deployment.md)
- [用户手册](./docs/user-manual.md)

## 贡献指南

欢迎提交问题和改进建议！请查看我们的贡献指南了解详情。

本项目由 Trae AI 助手（包含 Claude-3.5/3.7/4-Sonnet 大模型）提供支持。

## 许可证

本项目采用 [MIT 许可证](./LICENSE)。
