# AI API 配置功能 - 功能说明

## 🎯 功能概述

本次更新为研究助手系统添加了完整的AI API配置管理功能，允许用户同时配置多个AI服务提供商，为不同的研究任务选择最适合的AI模型。

## 🚀 新增功能

### 1. 多AI提供商支持
- **OpenAI**: GPT-3.5, GPT-4系列
- **Anthropic**: Claude-3系列
- **Google**: Gemini系列
- **国产大模型**: 百度文心一言、阿里通义千问、腾讯混元、智谱ChatGLM、月之暗面Kimi
- **自定义API**: 支持任何兼容OpenAI API格式的服务

### 2. 智能配置管理
- **配置标题**: 为每个AI配置设置易记的名称
- **主配置设置**: 指定默认使用的AI配置
- **使用场景分配**: 为不同功能模块指定专用的AI配置
- **提示词模板**: 为每个配置设置专用的系统和默认提示词
- **高级参数调节**: 精细控制温度、最大token数、频率惩罚等参数

### 3. 内置提示词生成器
- 通过关键词和任务类型自动生成AI提示词
- 支持上下文信息补充
- 可指定使用特定的AI配置生成
- 一键复制生成的提示词

### 4. 配置测试功能
- 实时测试AI配置的可用性
- 显示响应时间和AI回复内容
- 快速验证配置是否正确

## 📁 文件结构

### 后端文件
```
backend/
├── src/
│   ├── models/
│   │   ├── ai_config.py          # AI配置数据模型
│   │   └── user.py               # 用户模型（已更新）
│   ├── schemas/
│   │   └── ai_config.py          # AI配置API模式
│   ├── services/
│   │   └── ai_config_service.py  # AI配置业务逻辑
│   └── routers/
│       └── ai_config.py          # AI配置API路由
└── migrations/
    └── add_ai_config_table.py    # 数据库迁移脚本
```

### 前端文件
```
src/
├── types/
│   └── aiConfig.ts               # AI配置类型定义
├── services/
│   └── aiConfigService.ts        # AI配置前端服务
├── pages/
│   └── AIConfig/
│       └── index.tsx             # AI配置管理页面
├── api/
│   └── index.ts                  # API接口（已更新）
└── router/
    └── index.tsx                 # 路由配置（已更新）
```

## 🛠 安装和配置

### 1. 数据库迁移
```bash
# 进入后端目录
cd backend

# 运行数据库迁移
python migrations/add_ai_config_table.py
```

### 2. 启动服务
```bash
# 启动后端服务
cd backend
python -m uvicorn src.main:app --reload

# 启动前端服务
cd ..
npm run dev
# 或
yarn dev
```

### 3. 访问功能
1. 登录系统
2. 在侧边栏点击「AI配置」
3. 开始配置您的AI服务

## 🎨 使用场景

### 场景1：学术研究工作流
- **创新点分析**: 使用GPT-4进行深度分析
- **论文推荐**: 使用Claude-3进行文献推荐
- **研究分析**: 使用通义千问进行中文文献分析
- **聊天对话**: 使用GPT-3.5进行日常交互

### 场景2：多语言研究
- **英文论文**: 配置OpenAI GPT-4
- **中文论文**: 配置百度文心一言
- **跨语言对比**: 配置Google Gemini

### 场景3：成本优化
- **简单任务**: 使用成本较低的模型（如GPT-3.5）
- **复杂分析**: 使用高性能模型（如GPT-4）
- **批量处理**: 使用国产模型降低成本

## 🔧 技术特性

### 数据安全
- API密钥加密存储
- 前端显示时自动脱敏
- 支持密钥更新而不显示原值

### 性能优化
- 懒加载页面组件
- API调用缓存
- 智能配置选择算法

### 用户体验
- 直观的配置管理界面
- 实时配置测试
- 详细的错误提示
- 一键复制功能

## 📊 API接口

### 主要端点
- `GET /ai-config` - 获取用户配置列表
- `POST /ai-config` - 创建新配置
- `PUT /ai-config/{id}` - 更新配置
- `DELETE /ai-config/{id}` - 删除配置
- `POST /ai-config/{id}/set-primary` - 设置主配置
- `POST /ai-config/{id}/test` - 测试配置
- `POST /ai-config/generate-prompt` - 生成提示词

### 数据模型
```python
class AIAPIConfig:
    id: int
    user_id: int
    title: str
    provider_type: AIProviderType
    api_key: str
    api_endpoint: Optional[str]
    model_name: Optional[str]
    system_prompt: Optional[str]
    default_prompt: Optional[str]
    is_primary: bool
    is_active: bool
    use_for_innovation_analysis: bool
    use_for_paper_recommendation: bool
    use_for_research_analysis: bool
    use_for_chat: bool
    use_for_prompt_generation: bool
    max_tokens: Optional[int]
    temperature: Optional[str]
    top_p: Optional[str]
    frequency_penalty: Optional[str]
    presence_penalty: Optional[str]
    created_at: datetime
    updated_at: datetime
```

## 🔄 兼容性

### 向后兼容
- 保留原有的API密钥管理接口
- 现有功能无需修改即可使用新的AI配置
- 平滑迁移路径

### 前向扩展
- 模块化设计，易于添加新的AI提供商
- 灵活的配置参数系统
- 可扩展的使用场景定义

## 📝 使用示例

### 创建配置
```typescript
const config = await AIConfigService.createConfig({
  title: 'GPT-4 创新分析',
  provider_type: 'openai',
  api_key: 'sk-xxx...',
  model_name: 'gpt-4',
  system_prompt: '你是一个专业的科研创新分析专家',
  use_for_innovation_analysis: true,
  temperature: '0.3',
  max_tokens: 4000
});
```

### 生成提示词
```typescript
const prompt = await AIConfigService.generatePrompt({
  keywords: ['机器学习', '深度学习'],
  task_type: 'innovation_analysis',
  context: '研究神经网络优化方法'
});
```

### 测试配置
```typescript
const result = await AIConfigService.testConfig(
  configId, 
  'Hello, this is a test message.'
);
console.log(`响应时间: ${result.latency_ms}ms`);
console.log(`AI回复: ${result.response}`);
```

## 🚧 后续计划

### 短期目标
- [ ] 添加配置导入/导出功能
- [ ] 实现配置模板库
- [ ] 添加使用统计和成本分析

### 长期目标
- [ ] 支持更多AI提供商
- [ ] 智能配置推荐
- [ ] 配置性能监控
- [ ] 团队配置共享

## 📞 支持

如有问题或建议，请：
1. 查看 `docs/AI_CONFIG_GUIDE.md` 详细使用指南
2. 检查控制台错误信息
3. 联系开发团队

---

**版本**: v1.0.0  
**更新日期**: 2024年1月  
**兼容性**: 向后兼容，无破坏性更改