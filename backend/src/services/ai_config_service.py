from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models.ai_config import AIAPIConfig, AIProviderType
from ..models.user import User
from ..schemas.ai_config import (
    AIAPIConfigCreate, 
    AIAPIConfigUpdate, 
    AIAPIConfigResponse,
    GeneratePromptRequest,
    TestConfigRequest
)
import json
import time
from openai import OpenAI, AsyncOpenAI
from anthropic import Anthropic
import httpx

class AIConfigService:
    """AI配置服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_configs(self, user_id: int) -> List[AIAPIConfig]:
        """获取用户的所有AI配置"""
        return self.db.query(AIAPIConfig).filter(
            and_(AIAPIConfig.user_id == user_id, AIAPIConfig.is_active == True)
        ).order_by(AIAPIConfig.is_primary.desc(), AIAPIConfig.created_at.desc()).all()
    
    def get_config_by_id(self, user_id: int, config_id: int) -> Optional[AIAPIConfig]:
        """根据ID获取配置"""
        return self.db.query(AIAPIConfig).filter(
            and_(
                AIAPIConfig.id == config_id,
                AIAPIConfig.user_id == user_id,
                AIAPIConfig.is_active == True
            )
        ).first()
    
    def get_primary_config(self, user_id: int) -> Optional[AIAPIConfig]:
        """获取用户的主配置"""
        return self.db.query(AIAPIConfig).filter(
            and_(
                AIAPIConfig.user_id == user_id,
                AIAPIConfig.is_primary == True,
                AIAPIConfig.is_active == True
            )
        ).first()
    
    def get_configs_for_task(self, user_id: int, task_type: str) -> List[AIAPIConfig]:
        """根据任务类型获取可用的配置"""
        task_field_map = {
            "innovation_analysis": AIAPIConfig.use_for_innovation_analysis,
            "paper_recommendation": AIAPIConfig.use_for_paper_recommendation,
            "research_analysis": AIAPIConfig.use_for_research_analysis,
            "chat": AIAPIConfig.use_for_chat,
            "prompt_generation": AIAPIConfig.use_for_prompt_generation
        }
        
        if task_type not in task_field_map:
            return self.get_user_configs(user_id)
        
        field = task_field_map[task_type]
        return self.db.query(AIAPIConfig).filter(
            and_(
                AIAPIConfig.user_id == user_id,
                AIAPIConfig.is_active == True,
                field == True
            )
        ).order_by(AIAPIConfig.is_primary.desc(), AIAPIConfig.created_at.desc()).all()
    
    def create_config(self, user_id: int, config_data: AIAPIConfigCreate) -> AIAPIConfig:
        """创建新的AI配置"""
        # 如果设置为主配置，先取消其他主配置
        if config_data.is_primary:
            self._unset_primary_configs(user_id)
        
        # 创建新配置
        db_config = AIAPIConfig(
            user_id=user_id,
            **config_data.model_dump()
        )
        
        self.db.add(db_config)
        self.db.commit()
        self.db.refresh(db_config)
        
        return db_config
    
    def update_config(self, user_id: int, config_id: int, config_data: AIAPIConfigUpdate) -> Optional[AIAPIConfig]:
        """更新AI配置"""
        config = self.get_config_by_id(user_id, config_id)
        if not config:
            return None
        
        # 如果设置为主配置，先取消其他主配置
        if config_data.is_primary:
            self._unset_primary_configs(user_id)
        
        # 更新配置
        update_data = config_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        self.db.commit()
        self.db.refresh(config)
        
        return config
    
    def delete_config(self, user_id: int, config_id: int) -> bool:
        """删除AI配置（软删除）"""
        config = self.get_config_by_id(user_id, config_id)
        if not config:
            return False
        
        config.is_active = False
        self.db.commit()
        
        # 如果删除的是主配置，自动设置另一个配置为主配置
        if config.is_primary:
            remaining_configs = self.get_user_configs(user_id)
            if remaining_configs:
                remaining_configs[0].is_primary = True
                self.db.commit()
        
        return True
    
    def set_primary_config(self, user_id: int, config_id: int) -> bool:
        """设置主配置"""
        config = self.get_config_by_id(user_id, config_id)
        if not config:
            return False
        
        # 取消其他主配置
        self._unset_primary_configs(user_id)
        
        # 设置新的主配置
        config.is_primary = True
        self.db.commit()
        
        return True
    
    def _unset_primary_configs(self, user_id: int):
        """取消用户的所有主配置"""
        self.db.query(AIAPIConfig).filter(
            and_(
                AIAPIConfig.user_id == user_id,
                AIAPIConfig.is_primary == True
            )
        ).update({"is_primary": False})
    
    async def test_config(self, user_id: int, config_id: int, test_prompt: str = "Hello, this is a test.") -> Dict[str, Any]:
        """测试AI配置"""
        config = self.get_config_by_id(user_id, config_id)
        if not config:
            return {"success": False, "error": "配置不存在"}
        
        start_time = time.time()
        
        try:
            response = await self._call_ai_api(config, test_prompt)
            latency_ms = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "response": response,
                "latency_ms": latency_ms
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "latency_ms": int((time.time() - start_time) * 1000)
            }
    
    async def generate_prompt(self, user_id: int, request: GeneratePromptRequest) -> Dict[str, Any]:
        """使用主配置生成提示词"""
        # 获取指定配置或主配置
        if request.config_id:
            config = self.get_config_by_id(user_id, request.config_id)
        else:
            # 优先使用支持提示词生成的配置
            configs = self.get_configs_for_task(user_id, "prompt_generation")
            if not configs:
                # 如果没有专门的提示词生成配置，使用主配置
                config = self.get_primary_config(user_id)
            else:
                config = configs[0]
        
        if not config:
            raise ValueError("未找到可用的AI配置")
        
        # 构建生成提示词的请求
        keywords_str = ", ".join(request.keywords)
        context_str = f"\n上下文: {request.context}" if request.context else ""
        
        prompt = f"""请根据以下信息生成一个专业的AI提示词：

关键词: {keywords_str}
任务类型: {request.task_type}{context_str}

要求：
1. 提示词应该清晰、具体、可操作
2. 包含必要的上下文和约束条件
3. 适合{request.task_type}任务
4. 长度适中，不超过500字

请直接返回生成的提示词，不需要额外说明："""
        
        try:
            response = await self._call_ai_api(config, prompt)
            return {
                "prompt": response.strip(),
                "config_used": self._config_to_response(config)
            }
        except Exception as e:
            raise ValueError(f"生成提示词失败: {str(e)}")
    
    async def _call_ai_api(self, config: AIAPIConfig, prompt: str) -> str:
        """调用AI API"""
        if config.provider_type == AIProviderType.OPENAI:
            return await self._call_openai_api(config, prompt)
        elif config.provider_type == AIProviderType.ANTHROPIC:
            return await self._call_anthropic_api(config, prompt)
        elif config.provider_type == AIProviderType.CUSTOM:
            return await self._call_custom_api(config, prompt)
        else:
            raise ValueError(f"不支持的AI提供商: {config.provider_type}")
    
    async def _call_openai_api(self, config: AIAPIConfig, prompt: str) -> str:
        """调用OpenAI API"""
        client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.api_endpoint if config.api_endpoint else None
        )
        
        messages = []
        if config.system_prompt:
            messages.append({"role": "system", "content": config.system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = await client.chat.completions.create(
            model=config.model_name or "gpt-3.5-turbo",
            messages=messages,
            max_tokens=config.max_tokens,
            temperature=float(config.temperature),
            top_p=float(config.top_p),
            frequency_penalty=float(config.frequency_penalty),
            presence_penalty=float(config.presence_penalty)
        )
        
        return response.choices[0].message.content
    
    async def _call_anthropic_api(self, config: AIAPIConfig, prompt: str) -> str:
        """调用Anthropic API"""
        client = Anthropic(api_key=config.api_key)
        
        system_prompt = config.system_prompt or ""
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        response = await client.messages.create(
            model=config.model_name or "claude-3-sonnet-20240229",
            max_tokens=config.max_tokens,
            temperature=float(config.temperature),
            messages=[{"role": "user", "content": full_prompt}]
        )
        
        return response.content[0].text
    
    async def _call_custom_api(self, config: AIAPIConfig, prompt: str) -> str:
        """调用自定义API"""
        if not config.api_endpoint:
            raise ValueError("自定义API需要提供端点地址")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                config.api_endpoint,
                json={
                    "prompt": prompt,
                    "system_prompt": config.system_prompt,
                    "max_tokens": config.max_tokens,
                    "temperature": float(config.temperature),
                    "model": config.model_name
                },
                headers={"Authorization": f"Bearer {config.api_key}"}
            )
            response.raise_for_status()
            return response.json().get("response", "")
    
    def _config_to_response(self, config: AIAPIConfig) -> AIAPIConfigResponse:
        """将配置模型转换为响应模型"""
        config_dict = config.to_dict()
        return AIAPIConfigResponse(**config_dict)