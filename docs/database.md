# 研究助手系统数据库设计

## 1. 数据库选型

系统采用PostgreSQL作为主要数据库，原因如下：
- 强大的全文搜索功能
- 完善的事务支持
- 丰富的数据类型
- 良好的可扩展性

## 2. 数据表设计

### 2.1 用户相关表

#### users（用户表）
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### user_profiles（用户档案表）
```sql
CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    full_name VARCHAR(100),
    institution VARCHAR(200),
    research_fields TEXT[],
    bio TEXT,
    avatar_url VARCHAR(255)
);
```

### 2.2 研究项目相关表

#### research_projects（研究项目表）
```sql
CREATE TABLE research_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### project_milestones（项目里程碑表）
```sql
CREATE TABLE project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES research_projects(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);
```

### 2.3 论文相关表

#### papers（论文表）
```sql
CREATE TABLE papers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    authors TEXT[],
    abstract TEXT,
    publication_date DATE,
    journal VARCHAR(200),
    doi VARCHAR(100) UNIQUE,
    keywords TEXT[],
    full_text_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### paper_annotations（论文注释表）
```sql
CREATE TABLE paper_annotations (
    id SERIAL PRIMARY KEY,
    paper_id INTEGER REFERENCES papers(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    page_number INTEGER,
    highlight_text TEXT,
    annotation_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 创新点相关表

#### innovation_points（创新点表）
```sql
CREATE TABLE innovation_points (
    id SERIAL PRIMARY KEY,
    paper_id INTEGER REFERENCES papers(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    significance_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### innovation_implementations（创新点实现表）
```sql
CREATE TABLE innovation_implementations (
    id SERIAL PRIMARY KEY,
    innovation_point_id INTEGER REFERENCES innovation_points(id),
    project_id INTEGER REFERENCES research_projects(id),
    implementation_status VARCHAR(50),
    implementation_details TEXT,
    results TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.5 研究进度相关表

#### research_logs（研究日志表）
```sql
CREATE TABLE research_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES research_projects(id),
    user_id INTEGER REFERENCES users(id),
    log_type VARCHAR(50),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### experiment_records（实验记录表）
```sql
CREATE TABLE experiment_records (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES research_projects(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    methodology TEXT,
    results TEXT,
    conclusion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 3. 表关系说明

### 3.1 用户与研究项目关系
用户与研究项目之间是一对多关系，一个用户可以创建多个研究项目，每个研究项目属于一个用户。

```sql
-- 在ORM中的关系定义
-- User模型
User.projects = relationship("ResearchProject", back_populates="user")

-- ResearchProject模型
user = relationship("User", back_populates="projects")
```

## 4. 索引设计

### 4.1 基本索引
```sql
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 论文表索引
CREATE INDEX idx_papers_title ON papers USING gin(to_tsvector('english', title));
CREATE INDEX idx_papers_doi ON papers(doi);

-- 研究项目表索引
CREATE INDEX idx_research_projects_user_id ON research_projects(user_id);
CREATE INDEX idx_research_projects_status ON research_projects(status);
```

### 4.2 全文搜索索引
```sql
-- 论文全文搜索索引
CREATE INDEX idx_papers_full_text ON papers USING gin(to_tsvector('english', abstract));

-- 研究日志全文搜索索引
CREATE INDEX idx_research_logs_content ON research_logs USING gin(to_tsvector('english', content));
```

## 5. 数据库维护

### 5.1 备份策略
- 每日增量备份
- 每周全量备份
- 实时WAL日志备份

### 5.2 性能优化
- 定期VACUUM
- 定期更新统计信息
- 监控和优化慢查询

### 5.3 安全策略
- 角色基础访问控制
- 数据加密存储
- 审计日志记录