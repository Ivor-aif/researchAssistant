# 研究助手系统API文档

## 1. API概述

研究助手系统API是基于RESTful架构设计的Web服务接口，提供了用户认证、论文检索、研究项目管理等功能。本文档详细说明了各API的使用方法、参数要求和响应格式。

### 1.1 基本信息

- **基础URL**: `/api/v1`
- **认证方式**: JWT Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 1.2 认证方式

除了注册和登录接口外，所有API请求都需要在HTTP头部包含有效的认证令牌：

```
Authorization: Bearer {token}
```

### 1.3 错误处理

所有API错误响应都遵循统一的格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

常见错误代码：
- `UNAUTHORIZED`: 未授权访问
- `VALIDATION_ERROR`: 请求参数验证失败
- `RESOURCE_NOT_FOUND`: 请求的资源不存在
- `INTERNAL_ERROR`: 服务器内部错误

## 2. 用户认证API

### 2.1 用户注册

- **URL**: `/auth/register`
- **方法**: POST
- **描述**: 创建新用户账号

#### 请求参数

```json
{
  "username": "用户名",
  "email": "邮箱地址",
  "password": "密码"
}
```

#### 响应

```json
{
  "id": 1,
  "username": "用户名",
  "email": "邮箱地址",
  "token": "JWT令牌"
}
```

### 2.2 用户登录

- **URL**: `/auth/login`
- **方法**: POST
- **描述**: 用户登录并获取认证令牌

#### 请求参数

```json
{
  "email": "邮箱地址",
  "password": "密码"
}
```

#### 响应

```json
{
  "token": "JWT令牌",
  "user": {
    "id": 1,
    "username": "用户名",
    "email": "邮箱地址"
  }
}
```

## 3. 研究项目API

### 3.1 创建研究项目

- **URL**: `/research/projects`
- **方法**: POST
- **描述**: 创建新的研究项目

#### 请求参数

```json
{
  "title": "项目标题",
  "description": "项目描述",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-12-31T00:00:00Z"
}
```

#### 响应

```json
{
  "id": 1,
  "title": "项目标题",
  "description": "项目描述",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-12-31T00:00:00Z",
  "status": "PLANNING",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### 3.2 获取项目列表

- **URL**: `/research/projects`
- **方法**: GET
- **描述**: 获取当前用户的研究项目列表

#### 查询参数

- `skip` (可选): 分页起始位置，默认为0
- `limit` (可选): 每页项目数量，默认为10

#### 响应

```json
[
  {
    "id": 1,
    "title": "项目标题",
    "description": "项目描述",
    "start_date": "2023-01-01T00:00:00Z",
    "end_date": "2023-12-31T00:00:00Z",
    "status": "PLANNING",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

## 4. 论文API

### 4.1 添加论文

- **URL**: `/research/projects/{project_id}/papers`
- **方法**: POST
- **描述**: 向研究项目添加论文

#### 请求参数

```json
{
  "title": "论文标题",
  "authors": "作者列表",
  "abstract": "论文摘要",
  "url": "论文链接",
  "publication_date": "2023-01-01T00:00:00Z"
}
```

#### 响应

```json
{
  "id": 1,
  "title": "论文标题",
  "authors": "作者列表",
  "abstract": "论文摘要",
  "url": "论文链接",
  "publication_date": "2023-01-01T00:00:00Z",
  "project_id": 1,
  "created_at": "2023-01-01T00:00:00Z"
}
```

## 5. 创新点API

### 5.1 添加创新点

- **URL**: `/research/papers/{paper_id}/innovation-points`
- **方法**: POST
- **描述**: 为论文添加创新点

#### 请求参数

```json
{
  "content": "创新点内容",
  "category": "创新点类别",
  "significance": "重要性评分(1-5)"
}
```

#### 响应

```json
{
  "id": 1,
  "content": "创新点内容",
  "category": "创新点类别",
  "significance": 5,
  "paper_id": 1,
  "created_at": "2023-01-01T00:00:00Z"
}
```

## 6. 研究进度API

### 6.1 记录研究进度

- **URL**: `/research/projects/{project_id}/progress`
- **方法**: POST
- **描述**: 记录研究项目进度

#### 请求参数

```json
{
  "content": "进度内容",
  "milestone": "里程碑名称"
}
```

#### 响应

```json
{
  "id": 1,
  "content": "进度内容",
  "milestone": "里程碑名称",
  "project_id": 1,
  "created_at": "2023-01-01T00:00:00Z"
}
```

## 7. 报告生成API

### 7.1 生成研究报告

- **URL**: `/research/projects/{project_id}/report`
- **方法**: POST
- **描述**: 生成研究项目报告

#### 请求参数

```json
{
  "title": "报告标题",
  "format": "报告格式(PDF/DOCX)",
  "sections": ["introduction", "literature_review", "methodology", "results", "conclusion"]
}
```

#### 响应

```json
{
  "id": 1,
  "title": "报告标题",
  "format": "PDF",
  "url": "报告下载链接",
  "project_id": 1,
  "created_at": "2023-01-01T00:00:00Z"
}
```

## 8. AI分析API

### 8.1 论文创新点分析

- **URL**: `/ai/analyze-innovation`
- **方法**: POST
- **描述**: 使用AI分析论文创新点

#### 请求参数

```json
{
  "paper_id": 1,
  "analysis_depth": "detailed"
}
```

#### 响应

```json
{
  "innovation_points": [
    {
      "content": "创新点内容",
      "category": "创新点类别",
      "significance": 5,
      "explanation": "详细解释"
    }
  ],
  "analysis_summary": "分析总结"
}
```

### 8.2 研究方向推荐

- **URL**: `/ai/recommend-directions`
- **方法**: POST
- **描述**: 基于当前研究获取AI推荐的研究方向

#### 请求参数

```json
{
  "project_id": 1,
  "count": 5
}
```

#### 响应

```json
{
  "recommendations": [
    {
      "direction": "推荐研究方向",
      "rationale": "推荐理由",
      "potential_impact": "潜在影响",
      "related_papers": ["相关论文ID"]
    }
  ]
}
```

## 9. 性能优化

为确保API的高性能和可靠性，系统实施了以下优化措施：

1. **缓存策略**：使用Redis缓存热点数据，减少数据库查询
2. **数据库优化**：添加适当的索引，优化查询语句
3. **请求限流**：实施API请求限流，防止过载
4. **异步处理**：对耗时操作使用异步任务处理
5. **数据压缩**：对API响应进行GZIP压缩，减少传输数据量

## 10. 安全措施

系统API实施了以下安全措施：

1. **JWT认证**：使用JWT进行用户身份验证
2. **HTTPS加密**：所有API通信使用HTTPS加密
3. **参数验证**：严格验证所有API输入参数
4. **CORS策略**：实施适当的跨域资源共享策略
5. **敏感数据保护**：对敏感数据进行加密存储

## 11. 错误码参考

| 错误码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 12. 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| v1.0 | 2023-01-01 | 初始版本 |
| v1.1 | 2023-03-15 | 添加AI分析API |
| v1.2 | 2023-06-30 | 性能优化和安全增强 |