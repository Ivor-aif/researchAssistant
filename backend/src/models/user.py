from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 论文署名相关字段
    author_name = Column(String, nullable=True)  # 论文署名名称
    author_email = Column(String, nullable=True)  # 通讯作者邮箱
    author_website = Column(String, nullable=True)  # 个人网站链接
    
    # AI服务相关字段
    openai_api_key = Column(String, nullable=True)  # OpenAI API密钥
    other_ai_api_keys = Column(Text, nullable=True)  # 其他AI服务API密钥，存储为JSON字符串