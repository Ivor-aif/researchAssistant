# 研究助手系统用户使用手册

## 1. 系统简介

研究助手系统是一个智能化的研究辅助工具，旨在帮助研究人员提高研究效率和质量。本系统集成了论文检索、创新点分析、研究进度追踪等多个功能模块，并结合AI技术提供智能化的研究辅助服务。

## 2. 快速开始

### 2.1 账号注册与登录
1. 访问系统登录页面
2. 点击"注册"按钮，填写必要信息
3. 完成注册后，使用账号密码登录系统

### 2.2 系统界面导航
1. 左侧导航栏包含系统主要功能模块
2. 顶部工具栏提供快捷操作和用户设置
3. 主内容区域显示当前功能的详细内容

## 3. 核心功能

### 3.1 论文检索
1. 在搜索框中输入关键词、作者或标题
2. 选择搜索范围和过滤条件
3. 查看搜索结果列表
4. 点击论文标题查看详情

### 3.2 创新点分析
1. 上传或选择已检索的论文
2. 系统自动分析论文中的创新点
3. 查看创新点列表和详细说明
4. 保存分析结果或导出报告

### 3.3 研究进度追踪
1. 创建研究项目
2. 添加研究里程碑和任务
3. 更新研究进度和状态
4. 查看进度统计和可视化图表

### 3.4 论文复现
1. 选择需要复现的论文
2. 查看实验步骤和代码
3. 运行复现实验
4. 记录和比较实验结果

### 3.5 报告生成
1. 选择报告类型和内容
2. 自定义报告模板和格式
3. 生成研究报告
4. 导出或分享报告

## 4. 系统测试

### 4.1 运行测试
系统提供了完整的测试脚本，用户可以运行这些脚本来验证系统功能是否正常。

#### 运行所有测试
```bash
python run_tests.py
```

#### 只运行后端测试
```bash
python run_tests.py --backend-only
```

#### 只运行前端测试
```bash
python run_tests.py --frontend-only
```

#### 包含性能测试
```bash
python run_tests.py --performance
```

### 4.2 前端测试
前端测试主要验证用户界面和交互功能是否正常。

```bash
# 运行所有前端测试
node run_frontend_tests.js

# 运行特定组件测试
node run_frontend_tests.js researchProgress
node run_frontend_tests.js paperReproduction

# 生成测试覆盖率报告
node run_frontend_tests.js all --coverage
```

### 4.3 后端测试
后端测试主要验证API接口和业务逻辑是否正常。

```bash
# 运行所有后端测试
python run_backend_tests.py

# 运行特定测试
python run_backend_tests.py paper_search
python run_backend_tests.py research_project

# 运行性能测试
python run_backend_tests.py performance

# 生成测试覆盖率报告
python run_backend_tests.py all --coverage
```

### 4.4 测试报告
测试完成后，系统会生成测试报告，包括测试通过率、代码覆盖率和性能指标等信息。测试报告可以在以下位置查看：

- 前端测试报告：`/reports/frontend-test-report.html`
- 后端测试报告：`/reports/backend-test-report.html`
- 性能测试报告：`/reports/performance-test-report.html`

## 5. 常见问题

### 5.1 登录问题
- **问题**：无法登录系统
- **解决方案**：检查账号密码是否正确，网络连接是否正常

### 5.2 搜索问题
- **问题**：搜索结果不符合预期
- **解决方案**：尝试使用不同的关键词或调整过滤条件

### 5.3 系统性能问题
- **问题**：系统响应缓慢
- **解决方案**：检查网络连接，关闭不必要的应用程序，或联系系统管理员

## 6. 联系支持（以下联系方式暂时为 AI 虚构）

如果您在使用过程中遇到任何问题，请通过以下方式联系我们：

- 邮箱：support@researchassistant.com
- 电话：400-123-4567
- 在线客服：点击系统右下角的"客服"图标