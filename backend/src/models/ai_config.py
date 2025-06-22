from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base

class AIProviderType(enum.Enum):
    """AI服务提供商类型"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE_AI = "google_ai"
    AZURE_OPENAI = "azure_openai"
    BAIDU_QIANFAN = "baidu_qianfan"
    ALIBABA_DASHSCOPE = "alibaba_dashscope"
    ZHIPU_AI = "zhipu_ai"
    CUSTOM = "custom"

class AIAPIConfig(Base):
    """AI API配置模型"""
    __tablename__ = "ai_api_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 基本配置
    title = Column(String(100), nullable=False)  # 用户自定义标题
    provider_type = Column(Enum(AIProviderType), nullable=False)  # 提供商类型
    api_key = Column(String(500), nullable=False)  # API密钥
    api_endpoint = Column(String(500), nullable=True)  # 自定义API端点
    model_name = Column(String(100), nullable=True)  # 模型名称
    
    # 提示词配置
    system_prompt = Column(Text, nullable=True)  # 系统提示词
    default_prompt = Column(Text, nullable=True)  # 默认提示词
    
    # 配置选项
    is_primary = Column(Boolean, default=False)  # 是否为主API
    is_active = Column(Boolean, default=True)  # 是否启用
    
    # 使用场景配置
    use_for_innovation_analysis = Column(Boolean, default=True)  # 用于创新点分析
    use_for_paper_recommendation = Column(Boolean, default=True)  # 用于论文推荐
    use_for_research_analysis = Column(Boolean, default=True)  # 用于研究分析
    use_for_chat = Column(Boolean, default=True)  # 用于聊天对话
    use_for_prompt_generation = Column(Boolean, default=False)  # 用于提示词生成
    
    # 高级配置
    max_tokens = Column(Integer, default=4000)  # 最大token数
    temperature = Column(String(10), default="0.7")  # 温度参数
    top_p = Column(String(10), default="1.0")  # top_p参数
    frequency_penalty = Column(String(10), default="0.0")  # 频率惩罚
    presence_penalty = Column(String(10), default="0.0")  # 存在惩罚
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    user = relationship("User", back_populates="ai_configs")
    
    def __repr__(self):
        return f"<AIAPIConfig(id={self.id}, title='{self.title}', provider='{self.provider_type.value}', is_primary={self.is_primary})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "title": self.title,
            "provider_type": self.provider_type.value,
            "api_key": self.api_key[:10] + "..." if self.api_key else None,  # 隐藏完整密钥
            "api_endpoint": self.api_endpoint,
            "model_name": self.model_name,
            "system_prompt": self.system_prompt,
            "default_prompt": self.default_prompt,
            "is_primary": self.is_primary,
            "is_active": self.is_active,
            "use_for_innovation_analysis": self.use_for_innovation_analysis,
            "use_for_paper_recommendation": self.use_for_paper_recommendation,
            "use_for_research_analysis": self.use_for_research_analysis,
            "use_for_chat": self.use_for_chat,
            "use_for_prompt_generation": self.use_for_prompt_generation,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "frequency_penalty": self.frequency_penalty,
            "presence_penalty": self.presence_penalty,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }