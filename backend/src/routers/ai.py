from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models.user import User
from ..models.research import Research
from ..routers.auth import get_current_user
from ..ai.vision_api import VisionAPI
from ..ai.paper_recommendation import PaperRecommendation
from ..ai.research_analysis import ResearchAnalysis
from ..ai.innovation_extraction import InnovationExtraction

router = APIRouter(prefix="/ai", tags=["ai"])

# 初始化AI服务实例
vision_api = VisionAPI()
paper_recommendation = PaperRecommendation()
research_analysis = ResearchAnalysis()
innovation_extraction = InnovationExtraction()

@router.post("/analyze-image")
async def analyze_image(
    image_url: str,
    prompt: str = None,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """分析图像内容"""
    return await vision_api.analyze_image(image_url, prompt)

@router.post("/analyze-text")
async def analyze_text(
    text: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """分析文本内容"""
    return await vision_api.analyze_text(text)

@router.post("/recommend-papers")
async def recommend_papers(
    research: Research,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """推荐相关论文"""
    return await paper_recommendation.recommend_papers(current_user, research)

@router.post("/analyze-research")
async def analyze_research(
    research: Research,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """分析研究方向"""
    return await research_analysis.analyze_research_direction(research)

@router.post("/analyze-impact")
async def analyze_research_impact(
    research: Research,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """分析研究影响力"""
    return await research_analysis.analyze_research_impact(research)

@router.post("/extract-innovations")
async def extract_innovations(
    paper_content: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """提取论文创新点"""
    return await innovation_extraction.extract_innovations(paper_content)

@router.post("/analyze-feasibility")
async def analyze_implementation_feasibility(
    innovation: Dict[str, Any],
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """分析创新点实现可行性"""
    return await innovation_extraction.analyze_implementation_feasibility(innovation)