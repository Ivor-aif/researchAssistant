# 研究助手系统API接口规范

## 1. API 设计原则

### 1.1 基本原则
- 遵循RESTful设计规范
- 使用HTTPS进行安全传输
- 统一的错误处理机制
- 版本控制
- 规范的数据格式

### 1.2 接口格式
- 基础URL: `/api/v1`
- 请求/响应格式: JSON
- 时间格式: ISO 8601
- 分页参数: page, page_size

## 2. 认证接口

### 2.1 用户注册
```
POST /auth/register
Request:
{
    "username": "string",
    "email": "string",
    "password": "string"
}
Response:
{
    "id": "integer",
    "username": "string",
    "email": "string",
    "token": "string"
}
```

### 2.2 用户登录
```
POST /auth/login
Request:
{
    "email": "string",
    "password": "string"
}
Response:
{
    "token": "string",
    "user": {
        "id": "integer",
        "username": "string",
        "email": "string"
    }
}
```

## 3. 用户接口

### 3.1 获取用户信息
```
GET /users/{user_id}
Response:
{
    "id": "integer",
    "username": "string",
    "email": "string",
    "profile": {
        "full_name": "string",
        "institution": "string",
        "research_fields": ["string"],
        "bio": "string",
        "avatar_url": "string"
    }
}
```

### 3.2 更新用户信息
```
PUT /users/{user_id}
Request:
{
    "profile": {
        "full_name": "string",
        "institution": "string",
        "research_fields": ["string"],
        "bio": "string"
    }
}
Response:
{
    "id": "integer",
    "username": "string",
    "profile": {...}
}
```

## 4. 研究项目接口

### 4.1 创建研究项目
```
POST /projects
Request:
{
    "title": "string",
    "description": "string",
    "start_date": "date",
    "end_date": "date"
}
Response:
{
    "id": "integer",
    "title": "string",
    "description": "string",
    "status": "string",
    "start_date": "date",
    "end_date": "date"
}
```

### 4.2 获取项目列表
```
GET /projects
Query Parameters:
- page: integer
- page_size: integer
- status: string
Response:
{
    "total": "integer",
    "items": [
        {
            "id": "integer",
            "title": "string",
            "description": "string",
            "status": "string"
        }
    ]
}
```

## 5. 论文管理接口

### 5.1 论文检索
```
GET /papers/search
Query Parameters:
- query: string
- page: integer
- page_size: integer
- sort_by: string
Response:
{
    "total": "integer",
    "items": [
        {
            "id": "integer",
            "title": "string",
            "authors": ["string"],
            "abstract": "string",
            "publication_date": "date"
        }
    ]
}
```

### 5.2 添加论文注释
```
POST /papers/{paper_id}/annotations
Request:
{
    "content": "string",
    "page_number": "integer",
    "highlight_text": "string",
    "annotation_type": "string"
}
Response:
{
    "id": "integer",
    "content": "string",
    "page_number": "integer",
    "highlight_text": "string",
    "created_at": "datetime"
}
```

## 6. 创新点分析接口

### 6.1 提取论文创新点
```
POST /papers/{paper_id}/innovation-points
Request:
{
    "paper_text": "string"
}
Response:
{
    "innovation_points": [
        {
            "id": "integer",
            "title": "string",
            "description": "string",
            "category": "string",
            "significance_level": "integer"
        }
    ]
}
```

### 6.2 创新点实现追踪
```
POST /innovation-points/{point_id}/implementations
Request:
{
    "project_id": "integer",
    "implementation_details": "string",
    "status": "string"
}
Response:
{
    "id": "integer",
    "status": "string",
    "implementation_details": "string",
    "created_at": "datetime"
}
```

## 7. 研究进度接口

### 7.1 添加研究日志
```
POST /projects/{project_id}/logs
Request:
{
    "log_type": "string",
    "content": "string"
}
Response:
{
    "id": "integer",
    "log_type": "string",
    "content": "string",
    "created_at": "datetime"
}
```

### 7.2 记录实验数据
```
POST /projects/{project_id}/experiments
Request:
{
    "title": "string",
    "description": "string",
    "methodology": "string",
    "results": "string",
    "conclusion": "string"
}
Response:
{
    "id": "integer",
    "title": "string",
    "results": "string",
    "created_at": "datetime"
}
```

## 8. 错误处理

### 8.1 错误响应格式
```
{
    "error": {
        "code": "string",
        "message": "string",
        "details": {}
    }
}
```

### 8.2 常见错误码
- 400: 请求参数错误
- 401: 未授权
- 403: 权限不足
- 404: 资源不存在
- 422: 请求实体错误
- 500: 服务器内部错误

## 9. 安全规范

### 9.1 认证要求
- 使用JWT进行身份验证
- Token在Header中通过Bearer方式传递
- 敏感操作需要额外验证

### 9.2 权限控制
- 基于角色的访问控制（RBAC）
- API访问频率限制
- 请求来源验证

## 10. 版本控制

### 10.1 版本规则
- 主版本号：不兼容的API修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### 10.2 废弃流程
- 提前通知API废弃计划
- 保持过渡期的向下兼容
- 提供迁移指南