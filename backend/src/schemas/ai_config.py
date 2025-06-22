from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AIProviderType(str, Enum):
    """AI服务提供商类型"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE_AI = "google_ai"
    AZURE_OPENAI = "azure_openai"
    BAIDU_QIANFAN = "baidu_qianfan"
    ALIBABA_DASHSCOPE = "alibaba_dashscope"
    ZHIPU_AI = "zhipu_ai"
    CUSTOM = "custom"

class AIAPIConfigBase(BaseModel):
    """AI API配置基础模型"""
    title: str = Field(..., min_length=1, max_length=100, description="配置标题")
    provider_type: AIProviderType = Field(..., description="AI服务提供商类型")
    api_key: str = Field(..., min_length=1, description="API密钥")
    api_endpoint: Optional[str] = Field(None, description="自定义API端点")
    model_name: Optional[str] = Field(None, description="模型名称")
    
    system_prompt: Optional[str] = Field(None, description="系统提示词")
    default_prompt: Optional[str] = Field(None, description="默认提示词")
    
    is_primary: bool = Field(False, description="是否为主API")
    is_active: bool = Field(True, description="是否启用")
    
    use_for_innovation_analysis: bool = Field(True, description="用于创新点分析")
    use_for_paper_recommendation: bool = Field(True, description="用于论文推荐")
    use_for_research_analysis: bool = Field(True, description="用于研究分析")
    use_for_chat: bool = Field(True, description="用于聊天对话")
    use_for_prompt_generation: bool = Field(False, description="用于提示词生成")
    
    max_tokens: int = Field(4000, ge=1, le=32000, description="最大token数")
    temperature: str = Field("0.7", description="温度参数")
    top_p: str = Field("1.0", description="top_p参数")
    frequency_penalty: str = Field("0.0", description="频率惩罚")
    presence_penalty: str = Field("0.0", description="存在惩罚")

class AIAPIConfigCreate(AIAPIConfigBase):
    """创建AI API配置请求模型"""
    pass

class AIAPIConfigUpdate(BaseModel):
    """更新AI API配置请求模型"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    provider_type: Optional[AIProviderType] = None
    api_key: Optional[str] = Field(None, min_length=1)
    api_endpoint: Optional[str] = None
    model_name: Optional[str] = None
    
    system_prompt: Optional[str] = None
    default_prompt: Optional[str] = None
    
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    
    use_for_innovation_analysis: Optional[bool] = None
    use_for_paper_recommendation: Optional[bool] = None
    use_for_research_analysis: Optional[bool] = None
    use_for_chat: Optional[bool] = None
    use_for_prompt_generation: Optional[bool] = None
    
    max_tokens: Optional[int] = Field(None, ge=1, le=32000)
    temperature: Optional[str] = None
    top_p: Optional[str] = None
    frequency_penalty: Optional[str] = None
    presence_penalty: Optional[str] = None

class AIAPIConfigResponse(AIAPIConfigBase):
    """AI API配置响应模型"""
    id: int
    user_id: int
    api_key: str = Field(..., description="API密钥（已脱敏）")
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AIAPIConfigListResponse(BaseModel):
    """AI API配置列表响应模型"""
    configs: List[AIAPIConfigResponse]
    total: int
    primary_config_id: Optional[int] = None

class SetPrimaryConfigRequest(BaseModel):
    """设置主配置请求模型"""
    config_id: int = Field(..., description="配置ID")

class GeneratePromptRequest(BaseModel):
    """生成提示词请求模型"""
    keywords: List[str] = Field(..., min_items=1, description="关键词列表")
    task_type: str = Field(..., description="任务类型")
    context: Optional[str] = Field(None, description="上下文信息")
    config_id: Optional[int] = Field(None, description="指定使用的配置ID")

class GeneratePromptResponse(BaseModel):
    """生成提示词响应模型"""
    prompt: str = Field(..., description="生成的提示词")
    config_used: AIAPIConfigResponse = Field(..., description="使用的配置信息")

class TestConfigRequest(BaseModel):
    """测试配置请求模型"""
    config_id: int = Field(..., description="配置ID")
    test_prompt: Optional[str] = Field("Hello, this is a test.", description="测试提示词")

class TestConfigResponse(BaseModel):
    """测试配置响应模型"""
    success: bool = Field(..., description="测试是否成功")
    response: Optional[str] = Field(None, description="AI响应内容")
    error: Optional[str] = Field(None, description="错误信息")
    latency_ms: Optional[int] = Field(None, description="响应延迟（毫秒）")