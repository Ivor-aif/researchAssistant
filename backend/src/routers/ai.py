from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from typing import Dict, Any
import os
import tempfile
import PyPDF2
from bs4 import BeautifulSoup
import json
from ..ai.innovation_extraction import InnovationExtraction

# 条件导入数据库相关模块
try:
    from ..models.user import User
    from ..models.research import Research
    from ..routers.auth import get_current_user
    from ..ai.vision_api import VisionAPI
    from ..ai.paper_recommendation import PaperRecommendation
    from ..ai.research_analysis import ResearchAnalysis
    from ..database import get_db
    from sqlalchemy.orm import Session
    HAS_AUTH = True
except ImportError:
    HAS_AUTH = False

router = APIRouter(prefix="/ai", tags=["ai"])

# 初始化创新点分析服务（不依赖数据库）
innovation_extraction = InnovationExtraction()

# 条件初始化其他AI服务
if HAS_AUTH:
    vision_api = VisionAPI()
    paper_recommendation = PaperRecommendation()
    research_analysis = ResearchAnalysis()

# 需要认证的路由（仅在有数据库时可用）
if HAS_AUTH:
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
    paper_content: str = Body(..., embed=True)
) -> Dict[str, Any]:
    """提取论文创新点"""
    return await innovation_extraction.extract_innovations(paper_content)

@router.post("/analyze-feasibility")
async def analyze_implementation_feasibility(
    innovation: Dict[str, Any]
) -> Dict[str, Any]:
    """分析创新点实现可行性"""
    return await innovation_extraction.analyze_implementation_feasibility(innovation)

@router.post("/extract-innovations-file")
async def extract_innovations_from_file(
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """从上传的文件中提取创新点"""
    try:
        print(f"开始处理文件: {file.filename}, 类型: {file.content_type}")
        
        # 检查文件类型
        if file.content_type not in ['application/pdf', 'text/html', 'text/plain'] and not file.filename.endswith('.html') and not file.filename.endswith('.pdf') and not file.filename.endswith('.txt'):
            raise HTTPException(status_code=400, detail="只支持PDF、HTML和TXT格式的文件")
        
        # 这里添加文件处理逻辑
        return {"message": "文件处理成功", "innovations": ["示例创新点1", "示例创新点2"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理文件时出错: {str(e)}")

# API密钥管理接口
if HAS_AUTH:
    @router.post("/api-keys")
    async def update_api_keys(
        api_keys: Dict[str, Any],
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> Dict[str, Any]:
        """更新用户的API密钥"""
        try:
            # 更新OpenAI API密钥
            if "openai_api_key" in api_keys:
                current_user.openai_api_key = api_keys["openai_api_key"]
            
            # 更新其他API密钥
            if "other_api_keys" in api_keys:
                current_user.other_ai_api_keys = json.dumps(api_keys["other_api_keys"])
            
            # 保存到数据库
            db.commit()
            
            return {"success": True, "message": "API密钥已更新"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"更新API密钥失败: {str(e)}")
    
    @router.get("/api-keys")
    async def get_api_keys(
        current_user: User = Depends(get_current_user)
    ) -> Dict[str, Any]:
        """获取用户的API密钥"""
        try:
            result = {"openai_api_key": current_user.openai_api_key or ""}
            
            # 解析其他API密钥
            if current_user.other_ai_api_keys:
                try:
                    result["other_api_keys"] = json.loads(current_user.other_ai_api_keys)
                except json.JSONDecodeError:
                    result["other_api_keys"] = {}
            else:
                result["other_api_keys"] = {}
                
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取API密钥失败: {str(e)}")

@router.post("/process-file")
async def process_file(
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """处理上传的文件并提取内容"""
    try:
        # 检查文件大小（10MB限制）
        file_size = 0
        content = await file.read()
        file_size = len(content)
        print(f"文件大小: {file_size / 1024 / 1024:.2f} MB")
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="文件大小不能超过10MB")
        
        # 解析文件内容
        text_content = ""
        
        if file.content_type == 'application/pdf' or file.filename.endswith('.pdf'):
            print("开始解析PDF文件...")
            # 解析PDF文件
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(content)
                tmp_file.flush()
                
                try:
                    with open(tmp_file.name, 'rb') as pdf_file:
                        pdf_reader = PyPDF2.PdfReader(pdf_file)
                        print(f"PDF页数: {len(pdf_reader.pages)}")
                        for page_num, page in enumerate(pdf_reader.pages):
                            page_text = page.extract_text() or ""
                            text_content += page_text + "\n"
                            if page_num % 10 == 0 and page_num > 0:
                                print(f"已处理 {page_num} 页")
                finally:
                    os.unlink(tmp_file.name)
                    
        elif file.content_type == 'text/html' or file.filename.endswith('.html'):
            print("开始解析HTML文件...")
            # 解析HTML文件
            soup = BeautifulSoup(content.decode('utf-8', errors='ignore'), 'html.parser')
            # 移除脚本和样式标签
            for script in soup(["script", "style"]):
                script.decompose()
            text_content = soup.get_text()
        
        elif file.content_type == 'text/plain' or file.filename.endswith('.txt'):
            print("开始解析纯文本文件...")
            # 解析纯文本文件
            text_content = content.decode('utf-8', errors='ignore')
        
        # 清理文本内容
        text_content = ' '.join(text_content.split())
        print(f"提取的文本长度: {len(text_content)}")
        
        if len(text_content.strip()) < 10:
            raise HTTPException(status_code=400, detail="文件内容过少，无法进行有效分析")
        
        # 限制文本长度以避免API调用过长
        if len(text_content) > 15000:
            print(f"文本过长，截断至15000字符")
            text_content = text_content[:15000] + "..."
        
        print("开始调用创新点提取服务...")
        # 调用创新点提取服务
        result = await innovation_extraction.extract_innovations(text_content)
        print(f"创新点提取完成: {result['success']}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"文件处理失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"文件处理失败: {str(e)}")