# 研究助手系统部署文档

## 1. 系统要求

### 1.1 硬件要求
- CPU: 4核心及以上
- 内存: 8GB及以上
- 存储: 50GB可用空间
- 网络: 100Mbps及以上带宽

### 1.2 软件要求
- 操作系统: Ubuntu 20.04 LTS或更高版本
- Docker: 20.10.x或更高版本
- Docker Compose: 2.x或更高版本
- Node.js: 18.x
- Python: 3.10.x
- PostgreSQL: 14.x

## 2. 部署步骤

### 2.1 环境准备
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl git build-essential

# 安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2.2 克隆代码仓库
```bash
git clone https://github.com/your-org/research-assistant.git
cd research-assistant
```

### 2.3 配置环境变量
```bash
# 创建环境变量文件
cp .env.example .env

# 编辑环境变量
nano .env

# 配置以下变量
DB_HOST=postgres
DB_PORT=5432
DB_NAME=research_assistant
DB_USER=postgres
DB_PASSWORD=your_secure_password

OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
```

### 2.4 启动服务
```bash
# 构建并启动服务
docker-compose up -d

# 检查服务状态
docker-compose ps
```

### 2.5 初始化数据库
```bash
# 运行数据库迁移
docker-compose exec backend python -m alembic upgrade head

# 导入初始数据（如果需要）
docker-compose exec backend python scripts/init_data.py
```

## 3. 系统配置

### 3.1 Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3.2 SSL配置
```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

## 4. 监控与维护

### 4.1 日志管理
```bash
# 查看服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4.2 备份策略
```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres research_assistant > backup.sql

# 备份上传的文件
tar -czf uploads_backup.tar.gz ./uploads
```

### 4.3 系统更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动服务
docker-compose up -d --build

# 运行数据库迁移
docker-compose exec backend python -m alembic upgrade head
```

## 5. 故障排除

### 5.1 常见问题
1. 数据库连接失败
   - 检查数据库容器状态
   - 验证环境变量配置
   - 检查网络连接

2. API服务无响应
   - 检查后端服务日志
   - 验证API端口是否正确开放
   - 检查系统资源使用情况

3. 前端页面加载失败
   - 检查Nginx配置
   - 验证前端构建是否成功
   - 检查浏览器控制台错误

### 5.2 性能优化
1. 数据库优化
   - 定期执行VACUUM
   - 更新统计信息
   - 优化查询索引

2. 缓存配置
   - 配置Redis缓存
   - 设置适当的缓存过期时间
   - 监控缓存命中率

## 6. 安全配置

### 6.1 防火墙设置
```bash
# 安装UFW
sudo apt install -y ufw

# 配置防火墙规则
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 6.2 安全更新
```bash
# 启用自动安全更新
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 7. 性能监控

### 7.1 监控工具
- Prometheus: 系统指标收集
- Grafana: 数据可视化
- Node Exporter: 主机指标收集

### 7.2 告警配置
- 配置邮件告警
- 设置Slack通知
- 监控关键指标阈值