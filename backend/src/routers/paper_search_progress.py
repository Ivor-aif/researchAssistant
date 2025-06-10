from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
import logging
import asyncio
import aiohttp
import json
from urllib.parse import quote
from .paper_search import PaperSearcher, SOURCE_CONFIGS

router = APIRouter(prefix="/paper-search", tags=["paper-search-progress"])

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProgressPaperSearcher(PaperSearcher):
    """支持进度反馈的论文搜索器"""
    
    def __init__(self, progress_callback=None):
        super().__init__()
        self.progress_callback = progress_callback
    
    async def send_progress(self, message: str, current: int, total: int, papers_found: int = 0):
        """发送进度信息"""
        if self.progress_callback:
            progress_data = {
                "type": "progress",
                "message": message,
                "current": current,
                "total": total,
                "papers_found": papers_found,
                "percentage": round((current / total) * 100, 1) if total > 0 else 0
            }
            await self.progress_callback(progress_data)
    
    async def search_with_progress(self, query: str, sources: List[Dict[str, Any]], max_results: int = 10):
        """带进度反馈的搜索"""
        total_sources = len(sources)
        all_papers = []
        
        await self.send_progress("开始搜索论文...", 0, total_sources)
        
        for i, source in enumerate(sources):
            source_id = source.get("id")
            source_name = source.get("name", source_id)
            
            await self.send_progress(f"正在从 {source_name} 搜索...", i, total_sources, len(all_papers))
            
            try:
                papers = []
                if source_id == "arxiv":
                    papers = await self.search_arxiv(query, max_results)
                elif source_id == "semantic_scholar":
                    papers = await self.search_semantic_scholar(query, max_results)
                elif source_id == "crossref":
                    papers = await self.search_crossref(query, max_results)
                elif source_id == "pubmed":
                    papers = await self.search_pubmed(query, max_results)
                else:
                    papers = await self.search_custom_source(query, source)
                
                all_papers.extend(papers)
                
                await self.send_progress(
                    f"从 {source_name} 找到 {len(papers)} 篇论文", 
                    i + 1, 
                    total_sources, 
                    len(all_papers)
                )
                
                # 添加小延迟，让用户能看到进度
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"从 {source_name} 搜索失败: {str(e)}")
                await self.send_progress(
                    f"从 {source_name} 搜索失败: {str(e)}", 
                    i + 1, 
                    total_sources, 
                    len(all_papers)
                )
        
        # 排序结果
        all_papers.sort(key=lambda x: (x.get('year', 0), x.get('citations', 0)), reverse=True)
        
        await self.send_progress("搜索完成！", total_sources, total_sources, len(all_papers))
        
        # 发送最终结果
        if self.progress_callback:
            final_data = {
                "type": "complete",
                "papers": all_papers,
                "total_found": len(all_papers)
            }
            await self.progress_callback(final_data)
        
        return all_papers

@router.post("/search-with-progress")
async def search_with_progress_stream(data: Dict[str, Any] = Body(...)):
    """
    带实时进度反馈的论文搜索
    
    参数:
    - query: 搜索关键词
    - sources: 搜索源列表
    - max_results: 每个源的最大结果数
    
    返回:
    - Server-Sent Events 流，包含搜索进度和结果
    """
    query = data.get("query", "")
    sources = data.get("sources", [])
    max_results = data.get("max_results", 10)
    
    # 验证输入参数
    if not query or not isinstance(query, str) or not query.strip():
        raise HTTPException(status_code=400, detail="搜索关键词不能为空")

    if not sources or not isinstance(sources, list) or len(sources) == 0:
        raise HTTPException(status_code=400, detail="未选择任何搜索源")
    
    # 验证搜索源
    valid_sources = []
    for source in sources:
        if not source or not isinstance(source, dict):
            continue
        if not source.get("id") or not source.get("name"):
            continue
        valid_sources.append(source)
    
    if len(valid_sources) == 0:
        raise HTTPException(status_code=400, detail="没有有效的搜索源")
    
    async def generate_progress_stream():
        """生成进度流"""
        try:
            progress_queue = asyncio.Queue()
            
            async def progress_callback(data):
                await progress_queue.put(data)
            
            # 创建搜索器并开始搜索
            async with ProgressPaperSearcher(progress_callback) as searcher:
                # 启动搜索任务
                search_task = asyncio.create_task(
                    searcher.search_with_progress(query, valid_sources, max_results)
                )
                
                # 持续发送进度更新
                while not search_task.done():
                    try:
                        # 等待进度更新或超时
                        progress_data = await asyncio.wait_for(progress_queue.get(), timeout=1.0)
                        yield f"data: {json.dumps(progress_data, ensure_ascii=False)}\n\n"
                    except asyncio.TimeoutError:
                        # 发送心跳
                        yield f"data: {{\"type\": \"heartbeat\"}}\n\n"
                
                # 确保获取所有剩余的进度更新
                while not progress_queue.empty():
                    progress_data = await progress_queue.get()
                    yield f"data: {json.dumps(progress_data, ensure_ascii=False)}\n\n"
                
                # 等待搜索完成
                await search_task
                
        except Exception as e:
            logger.error(f"搜索过程中发生错误: {str(e)}")
            error_data = {
                "type": "error",
                "message": f"搜索失败: {str(e)}"
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        generate_progress_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    )

@router.get("/sources-with-status")
async def get_sources_with_status() -> Dict[str, Any]:
    """
    获取所有搜索源及其状态
    
    返回:
    - 搜索源列表，包含可用性状态
    """
    try:
        sources_with_status = []
        
        for source_id, config in SOURCE_CONFIGS.items():
            source_info = {
                "id": source_id,
                "name": config["name"],
                "base_url": config["base_url"],
                "enabled": config["enabled"],
                "description": f"{config['name']} 学术论文数据库",
                "status": "available" if config["enabled"] else "disabled"
            }
            sources_with_status.append(source_info)
        
        return {
            "sources": sources_with_status,
            "total": len(sources_with_status),
            "enabled_count": len([s for s in sources_with_status if s["enabled"]])
        }
        
    except Exception as e:
        logger.error(f"获取搜索源状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取搜索源状态失败: {str(e)}")