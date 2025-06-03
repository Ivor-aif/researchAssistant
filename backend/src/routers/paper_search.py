from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
import logging

router = APIRouter(prefix="/paper-search", tags=["paper-search"])

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/search")
async def search_from_multiple_sources(
    query: str = Body(...),
    sources: List[Dict[str, Any]] = Body(...)
) -> Dict[str, Any]:
    """
    从多个源搜索论文
    
    参数:
    - query: 搜索关键词
    - sources: 搜索源列表，每个源包含id、name和url
    
    返回:
    - 搜索结果列表
    """
    try:
        logger.info(f"开始搜索论文，关键词: {query}")
        logger.info(f"搜索源: {sources}")
        
        # 验证输入参数
        if not query or not query.strip():
            raise HTTPException(status_code=400, detail="搜索关键词不能为空")

        if not sources or not isinstance(sources, list) or len(sources) == 0:
            raise HTTPException(status_code=400, detail="未选择任何搜索源")
        
        # 验证每个搜索源的格式
        valid_sources = []
        for source in sources:
            if not source or not isinstance(source, dict):
                logger.warning(f"无效的搜索源对象: {source}")
                continue
                
            if not source.get("id") or not isinstance(source.get("id"), str):
                logger.warning(f"搜索源缺少有效的id: {source}")
                continue
                
            if not source.get("name") or not isinstance(source.get("name"), str):
                logger.warning(f"搜索源缺少有效的name: {source}")
                continue
                
            if not source.get("url") or not isinstance(source.get("url"), str):
                logger.warning(f"搜索源缺少有效的url: {source}")
                continue
                
            valid_sources.append(source)
        
        if len(valid_sources) == 0:
            raise HTTPException(status_code=400, detail="没有有效的搜索源")
        
        # 模拟搜索结果
        results = []
        
        for source in valid_sources:
            source_id = source.get("id")
            source_name = source.get("name")
            
            # 为每个源生成2篇模拟论文
            for i in range(2):
                paper = {
                    "id": f"{source_id}-{i+1}",
                    "title": f"{query} 在 {source_name} 领域的研究 {i+1}",
                    "authors": [f"{source_name} 研究员 {chr(65+i)}", f"{source_name} 学者 {chr(67+i)}"],
                    "abstract": f"本研究探讨了 {query} 在 {source_name} 领域的应用和发展前景。这是第 {i+1} 篇相关论文。",
                    "keywords": [query, source_name, "研究", f"主题{i+1}"],
                    "year": 2023 - i,
                    "journal": f"{source_name} Journal",
                    "citations": 50 - (i * 10),
                    "source": source_id,
                    "url": f"{source.get('url')}/paper/{i+1}",
                    "published_date": f"2023-{6-i}-15"
                }
                results.append(paper)
        
        logger.info(f"搜索完成，找到 {len(results)} 篇论文")
        return {"papers": results}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"搜索论文失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"搜索论文失败: {str(e)}")