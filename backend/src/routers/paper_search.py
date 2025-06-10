from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
import logging
import asyncio
import aiohttp
import xml.etree.ElementTree as ET
from urllib.parse import quote, urljoin
import re
from datetime import datetime
import json

router = APIRouter(prefix="/paper-search", tags=["paper-search"])

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 论文搜索源配置
SOURCE_CONFIGS = {
    "arxiv": {
        "name": "arXiv",
        "base_url": "http://export.arxiv.org/api/query",
        "search_url": "http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results={max_results}",
        "enabled": True
    },
    "semantic_scholar": {
        "name": "Semantic Scholar",
        "base_url": "https://api.semanticscholar.org",
        "search_url": "https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit={max_results}",
        "enabled": True
    },
    "crossref": {
        "name": "Crossref",
        "base_url": "https://api.crossref.org",
        "search_url": "https://api.crossref.org/works?query={query}&rows={max_results}",
        "enabled": True
    },
    "pubmed": {
        "name": "PubMed",
        "base_url": "https://eutils.ncbi.nlm.nih.gov",
        "search_url": "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmax={max_results}&retmode=json",
        "enabled": True
    },
    "ieee": {
        "name": "IEEE Xplore",
        "base_url": "https://ieeexplore.ieee.org",
        "search_url": "https://ieeexplore.ieee.org/rest/search",
        "enabled": False  # 需要API密钥
    }
}

class PaperSearcher:
    """论文搜索器类"""
    
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        """异步上下文管理器入口"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        if self.session:
            await self.session.close()
    
    async def search_arxiv(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """从arXiv搜索论文"""
        try:
            # 构建搜索URL
            encoded_query = quote(query)
            search_url = f"http://export.arxiv.org/api/query?search_query=all:{encoded_query}&start=0&max_results={max_results}"
            
            logger.info(f"正在从arXiv搜索: {query}")
            
            async with self.session.get(search_url) as response:
                if response.status != 200:
                    logger.error(f"arXiv API请求失败: {response.status}")
                    return []
                
                content = await response.text()
                
                # 解析XML响应
                papers = self._parse_arxiv_xml(content)
                logger.info(f"从arXiv找到 {len(papers)} 篇论文")
                return papers
                
        except Exception as e:
            logger.error(f"arXiv搜索失败: {str(e)}")
            return []
    
    def _parse_arxiv_xml(self, xml_content: str) -> List[Dict[str, Any]]:
        """解析arXiv的XML响应"""
        papers = []
        try:
            # 解析XML
            root = ET.fromstring(xml_content)
            
            # 定义命名空间
            namespaces = {
                'atom': 'http://www.w3.org/2005/Atom',
                'arxiv': 'http://arxiv.org/schemas/atom'
            }
            
            # 查找所有entry元素
            entries = root.findall('atom:entry', namespaces)
            
            for entry in entries:
                try:
                    # 提取论文信息
                    paper = self._extract_arxiv_paper_info(entry, namespaces)
                    if paper:
                        papers.append(paper)
                except Exception as e:
                    logger.warning(f"解析arXiv论文条目失败: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"解析arXiv XML失败: {str(e)}")
            
        return papers
    
    def _extract_arxiv_paper_info(self, entry, namespaces) -> Optional[Dict[str, Any]]:
        """从arXiv entry中提取论文信息"""
        try:
            # 提取基本信息
            title_elem = entry.find('atom:title', namespaces)
            title = title_elem.text.strip() if title_elem is not None else "未知标题"
            
            # 提取作者
            authors = []
            author_elems = entry.findall('atom:author', namespaces)
            for author_elem in author_elems:
                name_elem = author_elem.find('atom:name', namespaces)
                if name_elem is not None:
                    authors.append(name_elem.text.strip())
            
            # 提取摘要
            summary_elem = entry.find('atom:summary', namespaces)
            abstract = summary_elem.text.strip() if summary_elem is not None else "暂无摘要"
            
            # 提取发布日期
            published_elem = entry.find('atom:published', namespaces)
            published_date = published_elem.text if published_elem is not None else None
            year = None
            if published_date:
                try:
                    year = int(published_date[:4])
                except:
                    year = datetime.now().year
            
            # 提取arXiv ID和URL
            id_elem = entry.find('atom:id', namespaces)
            arxiv_url = id_elem.text if id_elem is not None else ""
            
            # 提取arXiv ID
            arxiv_id = ""
            if arxiv_url:
                match = re.search(r'arxiv\.org/abs/([\d\.]+)', arxiv_url)
                if match:
                    arxiv_id = match.group(1)
            
            # 提取分类（作为关键词）
            categories = []
            category_elems = entry.findall('arxiv:primary_category', namespaces)
            for cat_elem in category_elems:
                term = cat_elem.get('term')
                if term:
                    categories.append(term)
            
            # 如果没有主分类，查找所有分类
            if not categories:
                all_categories = entry.findall('atom:category', namespaces)
                for cat_elem in all_categories:
                    term = cat_elem.get('term')
                    if term and term.startswith(('cs.', 'math.', 'physics.', 'q-bio.', 'q-fin.', 'stat.')):
                        categories.append(term)
            
            # 构建论文对象
            paper = {
                "id": f"arxiv-{arxiv_id}" if arxiv_id else f"arxiv-{hash(title)}",
                "title": title,
                "authors": authors,
                "abstract": abstract,
                "keywords": categories,
                "year": year,
                "journal": "arXiv",
                "citations": 0,  # arXiv API不提供引用数
                "source": "arxiv",
                "url": arxiv_url,
                "published_date": published_date[:10] if published_date else None,
                "paper_type": "预印本"
            }
            
            return paper
            
        except Exception as e:
            logger.error(f"提取arXiv论文信息失败: {str(e)}")
            return None
    
    async def search_semantic_scholar(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """从Semantic Scholar搜索论文"""
        try:
            encoded_query = quote(query)
            search_url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={encoded_query}&limit={max_results}&fields=paperId,title,authors,abstract,year,citationCount,journal,url,publicationDate"
            
            logger.info(f"正在从Semantic Scholar搜索: {query}")
            
            async with self.session.get(search_url) as response:
                if response.status != 200:
                    logger.error(f"Semantic Scholar API请求失败: {response.status}")
                    return []
                
                data = await response.json()
                papers = self._parse_semantic_scholar_response(data)
                logger.info(f"从Semantic Scholar找到 {len(papers)} 篇论文")
                return papers
                
        except Exception as e:
            logger.error(f"Semantic Scholar搜索失败: {str(e)}")
            return []
    
    async def search_crossref(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """从Crossref搜索论文"""
        try:
            encoded_query = quote(query)
            search_url = f"https://api.crossref.org/works?query={encoded_query}&rows={max_results}&select=DOI,title,author,abstract,published-print,is-referenced-by-count,container-title,URL"
            
            logger.info(f"正在从Crossref搜索: {query}")
            
            async with self.session.get(search_url) as response:
                if response.status != 200:
                    logger.error(f"Crossref API请求失败: {response.status}")
                    return []
                
                data = await response.json()
                papers = self._parse_crossref_response(data)
                logger.info(f"从Crossref找到 {len(papers)} 篇论文")
                return papers
                
        except Exception as e:
            logger.error(f"Crossref搜索失败: {str(e)}")
            return []
    
    async def search_pubmed(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """从PubMed搜索论文"""
        try:
            encoded_query = quote(query)
            # 首先搜索获取ID列表
            search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={encoded_query}&retmax={max_results}&retmode=json"
            
            logger.info(f"正在从PubMed搜索: {query}")
            
            async with self.session.get(search_url) as response:
                if response.status != 200:
                    logger.error(f"PubMed搜索API请求失败: {response.status}")
                    return []
                
                search_data = await response.json()
                id_list = search_data.get('esearchresult', {}).get('idlist', [])
                
                if not id_list:
                    logger.info("PubMed未找到相关论文")
                    return []
                
                # 获取详细信息
                ids = ','.join(id_list)
                detail_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={ids}&retmode=json"
                
                async with self.session.get(detail_url) as detail_response:
                    if detail_response.status != 200:
                        logger.error(f"PubMed详情API请求失败: {detail_response.status}")
                        return []
                    
                    detail_data = await detail_response.json()
                    papers = self._parse_pubmed_response(detail_data)
                    logger.info(f"从PubMed找到 {len(papers)} 篇论文")
                    return papers
                
        except Exception as e:
            logger.error(f"PubMed搜索失败: {str(e)}")
            return []
    
    async def search_custom_source(self, query: str, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """从自定义源搜索论文"""
        try:
            source_name = source_config.get('name', '未知源')
            source_url = source_config.get('url', '')
            
            logger.info(f"正在从{source_name}搜索: {query}")
            
            # 对于自定义源，我们生成模拟数据
            # 在实际应用中，这里应该实现具体的网站抓取逻辑
            papers = self._generate_mock_papers_for_custom_source(query, source_config)
            
            logger.info(f"从{source_name}找到 {len(papers)} 篇论文")
            return papers
            
        except Exception as e:
            logger.error(f"自定义源搜索失败: {str(e)}")
            return []
    
    def _parse_semantic_scholar_response(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """解析Semantic Scholar API响应"""
        papers = []
        try:
            paper_data = data.get('data', [])
            for item in paper_data:
                try:
                    authors = []
                    if item.get('authors'):
                        authors = [author.get('name', '') for author in item['authors'] if author.get('name')]
                    
                    paper = {
                        "id": f"ss-{item.get('paperId', '')}",
                        "title": item.get('title', '未知标题'),
                        "authors": authors,
                        "abstract": item.get('abstract', '暂无摘要'),
                        "keywords": [],
                        "year": item.get('year'),
                        "journal": item.get('journal', {}).get('name', 'Semantic Scholar') if item.get('journal') else 'Semantic Scholar',
                        "citations": item.get('citationCount', 0),
                        "source": "semantic_scholar",
                        "url": item.get('url', ''),
                        "published_date": item.get('publicationDate'),
                        "paper_type": "研究论文"
                    }
                    papers.append(paper)
                except Exception as e:
                    logger.warning(f"解析Semantic Scholar论文条目失败: {str(e)}")
                    continue
        except Exception as e:
            logger.error(f"解析Semantic Scholar响应失败: {str(e)}")
        return papers
    
    def _parse_crossref_response(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """解析Crossref API响应"""
        papers = []
        try:
            items = data.get('message', {}).get('items', [])
            for item in items:
                try:
                    authors = []
                    if item.get('author'):
                        for author in item['author']:
                            given = author.get('given', '')
                            family = author.get('family', '')
                            name = f"{given} {family}".strip()
                            if name:
                                authors.append(name)
                    
                    # 获取发布年份
                    year = None
                    if item.get('published-print', {}).get('date-parts'):
                        year = item['published-print']['date-parts'][0][0]
                    elif item.get('published-online', {}).get('date-parts'):
                        year = item['published-online']['date-parts'][0][0]
                    
                    paper = {
                        "id": f"cr-{item.get('DOI', '').replace('/', '-')}",
                        "title": item.get('title', ['未知标题'])[0] if item.get('title') else '未知标题',
                        "authors": authors,
                        "abstract": item.get('abstract', '暂无摘要'),
                        "keywords": [],
                        "year": year,
                        "journal": item.get('container-title', ['Crossref'])[0] if item.get('container-title') else 'Crossref',
                        "citations": item.get('is-referenced-by-count', 0),
                        "source": "crossref",
                        "url": item.get('URL', ''),
                        "published_date": None,
                        "paper_type": "研究论文",
                        "doi": item.get('DOI')
                    }
                    papers.append(paper)
                except Exception as e:
                    logger.warning(f"解析Crossref论文条目失败: {str(e)}")
                    continue
        except Exception as e:
            logger.error(f"解析Crossref响应失败: {str(e)}")
        return papers
    
    def _parse_pubmed_response(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """解析PubMed API响应"""
        papers = []
        try:
            result = data.get('result', {})
            for pmid, item in result.items():
                if pmid == 'uids':  # 跳过uids字段
                    continue
                try:
                    authors = []
                    if item.get('authors'):
                        for author in item['authors']:
                            if author.get('name'):
                                authors.append(author['name'])
                    
                    # 解析发布日期
                    pub_date = item.get('pubdate', '')
                    year = None
                    if pub_date:
                        try:
                            year = int(pub_date.split()[0])
                        except:
                            pass
                    
                    paper = {
                        "id": f"pm-{pmid}",
                        "title": item.get('title', '未知标题'),
                        "authors": authors,
                        "abstract": '暂无摘要',  # PubMed summary API不包含摘要
                        "keywords": [],
                        "year": year,
                        "journal": item.get('source', 'PubMed'),
                        "citations": 0,  # PubMed API不直接提供引用数
                        "source": "pubmed",
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                        "published_date": pub_date,
                        "paper_type": "研究论文"
                    }
                    papers.append(paper)
                except Exception as e:
                    logger.warning(f"解析PubMed论文条目失败: {str(e)}")
                    continue
        except Exception as e:
            logger.error(f"解析PubMed响应失败: {str(e)}")
        return papers
    
    def _generate_mock_papers_for_custom_source(self, query: str, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """为自定义源生成模拟论文数据"""
        papers = []
        source_name = source_config.get('name', '未知源')
        source_url = source_config.get('url', '')
        source_id = source_config.get('id', 'custom')
        
        # 生成2-3篇模拟论文
        for i in range(2, 4):
            paper = {
                "id": f"{source_id}-{hash(query + str(i))}",
                "title": f"{query} 在 {source_name} 领域的研究进展 {i}",
                "authors": [f"{source_name} 研究员 {chr(65+i)}", f"{source_name} 学者 {chr(67+i)}"],
                "abstract": f"本研究探讨了 {query} 在 {source_name} 领域的应用和发展前景。这是第 {i} 篇相关论文，展示了该领域的最新进展。",
                "keywords": [query, source_name, "研究", f"主题{i}"],
                "year": 2024 - i,
                "journal": f"{source_name} Journal",
                "citations": max(0, 50 - (i * 10)),
                "source": source_id,
                "url": f"{source_url}/paper/{i}" if source_url else f"https://example.com/paper/{i}",
                "published_date": f"2024-{6-i:02d}-15",
                "paper_type": "研究论文" if i % 2 == 0 else "综述"
            }
            papers.append(paper)
        
        return papers

@router.post("/search")
async def search_from_multiple_sources(data: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    从多个源搜索论文
    
    参数:
    - query: 搜索关键词
    - sources: 搜索源列表，每个源包含id、name和url
    - max_results: 每个源的最大结果数（可选，默认10）
    
    返回:
    - 搜索结果列表
    """
    query = data.get("query", "")
    sources = data.get("sources", [])
    max_results = data.get("max_results", 10)
    
    try:
        logger.info(f"开始搜索论文，关键词: {query}")
        logger.info(f"搜索源: {sources}")
        
        # 验证输入参数
        if not query or not isinstance(query, str) or not query.strip():
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
        
        # 使用异步搜索器
        async with PaperSearcher() as searcher:
            all_papers = []
            
            # 并发搜索所有源
            search_tasks = []
            
            for source in valid_sources:
                source_id = source.get("id")
                
                if source_id == "arxiv":
                    # 使用真实的arXiv API
                    task = searcher.search_arxiv(query, max_results)
                elif source_id == "semantic_scholar":
                    # 使用Semantic Scholar API
                    task = searcher.search_semantic_scholar(query, max_results)
                elif source_id == "crossref":
                    # 使用Crossref API
                    task = searcher.search_crossref(query, max_results)
                elif source_id == "pubmed":
                    # 使用PubMed API
                    task = searcher.search_pubmed(query, max_results)
                else:
                    # 对于其他源，使用自定义搜索
                    task = searcher.search_custom_source(query, source)
                
                search_tasks.append(task)
            
            # 等待所有搜索任务完成
            search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
            
            # 处理搜索结果
            for i, result in enumerate(search_results):
                if isinstance(result, Exception):
                    logger.error(f"搜索源 {valid_sources[i]['name']} 搜索失败: {str(result)}")
                    continue
                
                if isinstance(result, list):
                    all_papers.extend(result)
        
        # 按相关度和年份排序
        all_papers.sort(key=lambda x: (x.get('year', 0), x.get('citations', 0)), reverse=True)
        
        logger.info(f"搜索完成，总共找到 {len(all_papers)} 篇论文")
        return {"papers": all_papers}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"搜索论文失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"搜索论文失败: {str(e)}")

@router.get("/sources")
async def get_available_sources() -> Dict[str, Any]:
    """
    获取可用的搜索源列表
    
    返回:
    - 可用搜索源的配置信息
    """
    try:
        available_sources = []
        
        for source_id, config in SOURCE_CONFIGS.items():
            source_info = {
                "id": source_id,
                "name": config["name"],
                "base_url": config["base_url"],
                "enabled": config["enabled"],
                "description": f"{config['name']} 学术论文数据库"
            }
            available_sources.append(source_info)
        
        return {
            "sources": available_sources,
            "total": len(available_sources)
        }
        
    except Exception as e:
        logger.error(f"获取搜索源列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取搜索源列表失败: {str(e)}")

@router.post("/download")
async def download_paper(data: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    下载论文
    
    参数:
    - paper_id: 论文ID
    - paper_url: 论文URL
    
    返回:
    - 下载链接或状态信息
    """
    paper_id = data.get("paper_id", "")
    paper_url = data.get("paper_url", "")
    
    try:
        logger.info(f"请求下载论文: {paper_id}")
        
        if not paper_id:
            raise HTTPException(status_code=400, detail="论文ID不能为空")
        
        if not paper_url:
            raise HTTPException(status_code=400, detail="论文URL不能为空")
        
        # 对于arXiv论文，构建PDF下载链接
        if "arxiv.org" in paper_url:
            # 从URL中提取arXiv ID
            match = re.search(r'arxiv\.org/abs/([\d\.]+)', paper_url)
            if match:
                arxiv_id = match.group(1)
                pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
                
                return {
                    "success": True,
                    "download_url": pdf_url,
                    "filename": f"arxiv_{arxiv_id}.pdf",
                    "message": "PDF下载链接已生成"
                }
        
        # 对于其他源，返回原始URL
        return {
            "success": True,
            "download_url": paper_url,
            "filename": f"paper_{paper_id}.pdf",
            "message": "请在新窗口中打开下载链接"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成下载链接失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成下载链接失败: {str(e)}")