from .user import User
from .research import ResearchProject, Paper, ProgressRecord, InnovationPoint
from .ai_config import AIAPIConfig, AIProviderType
from sqlalchemy.orm import relationship

# 更新User模型以支持与研究项目的关系
User.projects = relationship("ResearchProject", back_populates="user")