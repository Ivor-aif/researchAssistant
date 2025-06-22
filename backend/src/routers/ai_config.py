from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models.user import User
from ..routers.auth import get_current_user
from ..services.ai_config_service import AIConfigService
from ..schemas.ai_config import (
    AIAPIConfigCreate,
    AIAPIConfigUpdate,
    AIAPIConfigResponse,
    AIAPIConfigListResponse,
    SetPrimaryConfigRequest,
    GeneratePromptRequest,
    GeneratePromptResponse,
    TestConfigRequest,
    TestConfigResponse
)

router = APIRouter(prefix="/ai-config", tags=["ai-config"])

@router.get("/", response_model=AIAPIConfigListResponse)
async def get_user_ai_configs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的所有AI配置"""
    service = AIConfigService(db)
    configs = service.get_user_configs(current_user.id)
    primary_config = service.get_primary_config(current_user.id)
    
    config_responses = [service._config_to_response(config) for config in configs]
    
    return AIAPIConfigListResponse(
        configs=config_responses,
        total=len(config_responses),
        primary_config_id=primary_config.id if primary_config else None
    )

@router.get("/{config_id}", response_model=AIAPIConfigResponse)
async def get_ai_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定的AI配置"""
    service = AIConfigService(db)
    config = service.get_config_by_id(current_user.id, config_id)
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI配置不存在"
        )
    
    return service._config_to_response(config)

@router.post("/", response_model=AIAPIConfigResponse)
async def create_ai_config(
    config_data: AIAPIConfigCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建新的AI配置"""
    service = AIConfigService(db)
    
    try:
        config = service.create_config(current_user.id, config_data)
        return service._config_to_response(config)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"创建AI配置失败: {str(e)}"
        )

@router.put("/{config_id}", response_model=AIAPIConfigResponse)
async def update_ai_config(
    config_id: int,
    config_data: AIAPIConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新AI配置"""
    service = AIConfigService(db)
    
    config = service.update_config(current_user.id, config_id, config_data)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI配置不存在"
        )
    
    return service._config_to_response(config)

@router.delete("/{config_id}")
async def delete_ai_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除AI配置"""
    service = AIConfigService(db)
    
    success = service.delete_config(current_user.id, config_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI配置不存在"
        )
    
    return {"message": "AI配置已删除"}

@router.post("/set-primary")
async def set_primary_config(
    request: SetPrimaryConfigRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """设置主配置"""
    service = AIConfigService(db)
    
    success = service.set_primary_config(current_user.id, request.config_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI配置不存在"
        )
    
    return {"message": "主配置已设置"}

@router.post("/test/{config_id}", response_model=TestConfigResponse)
async def test_ai_config(
    config_id: int,
    request: TestConfigRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """测试AI配置"""
    service = AIConfigService(db)
    
    result = await service.test_config(
        current_user.id, 
        config_id, 
        request.test_prompt
    )
    
    return TestConfigResponse(**result)

@router.post("/generate-prompt", response_model=GeneratePromptResponse)
async def generate_prompt(
    request: GeneratePromptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """生成AI提示词"""
    service = AIConfigService(db)
    
    try:
        result = await service.generate_prompt(current_user.id, request)
        return GeneratePromptResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成提示词失败: {str(e)}"
        )

@router.get("/for-task/{task_type}", response_model=List[AIAPIConfigResponse])
async def get_configs_for_task(
    task_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取适用于特定任务的AI配置"""
    service = AIConfigService(db)
    configs = service.get_configs_for_task(current_user.id, task_type)
    
    return [service._config_to_response(config) for config in configs]

@router.get("/primary", response_model=AIAPIConfigResponse)
async def get_primary_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取主配置"""
    service = AIConfigService(db)
    config = service.get_primary_config(current_user.id)
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未设置主配置"
        )
    
    return service._config_to_response(config)