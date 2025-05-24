from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import Dict, Any
import os
import tempfile
import PyPDF2
from bs4 import BeautifulSoup
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

@router.post("/extract-innovations-file")
async def extract_innovations_from_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """从上传的文件中提取创新点"""
    try:
        # 检查文件类型
        if file.content_type not in ['application/pdf', 'text/html'] and not file.filename.endswith('.html'):
            raise HTTPException(status_code=400, detail="只支持PDF和HTML格式的文件")
        
        # 检查文件大小（10MB限制）
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="文件大小不能超过10MB")
        
        # 解析文件内容
        text_content = ""
        
        if file.content_type == 'application/pdf' or file.filename.endswith('.pdf'):
            # 解析PDF文件
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(content)
                tmp_file.flush()
                
                try:
                    with open(tmp_file.name, 'rb') as pdf_file:
                        pdf_reader = PyPDF2.PdfReader(pdf_file)
                        for page in pdf_reader.pages:
                            text_content += page.extract_text() + "\n"
                finally:
                    os.unlink(tmp_file.name)
                    
        elif file.content_type == 'text/html' or file.filename.endswith('.html'):
            # 解析HTML文件
            soup = BeautifulSoup(content.decode('utf-8', errors='ignore'), 'html.parser')
            # 移除脚本和样式标签
            for script in soup(["script", "style"]):
                script.decompose()
            text_content = soup.get_text()
        
        # 清理文本内容
        text_content = ' '.join(text_content.split())
        
        if len(text_content.strip()) < 100:
            raise HTTPException(status_code=400, detail="文件内容过少，无法进行有效分析")
        
        # 限制文本长度以避免API调用过长
        if len(text_content) > 15000:
            text_content = text_content[:15000] + "..."
        
        # 调用创新点提取服务
        result = await innovation_extraction.extract_innovations(text_content)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件处理失败: {str(e)}")