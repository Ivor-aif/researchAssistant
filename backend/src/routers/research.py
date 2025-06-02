from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

# 尝试导入数据库相关模块
try:
    from sqlalchemy.orm import Session
    from ..database import get_db
    from ..models.research import ResearchProject, Paper, ProgressRecord, InnovationPoint, ProjectStatus
    from ..models.user import User
    HAS_DATABASE = True
except ImportError:
    HAS_DATABASE = False
    # 模拟数据库连接失败时的替代实现
    # 定义模拟的枚举类型
    class ProjectStatus:
        PLANNING = "planning"
        IN_PROGRESS = "in_progress"
        COMPLETED = "completed"

# 从auth.py导入get_current_user
from ..routers.auth import get_current_user

# 模拟数据
mock_projects = [
    {
        "id": 1,
        "title": "人工智能在学术研究中的应用",
        "description": "研究AI如何辅助学术研究和创新",
        "start_date": "2023-01-01T00:00:00",
        "end_date": "2023-12-31T00:00:00",
        "user_id": 1,
        "status": ProjectStatus.IN_PROGRESS if HAS_DATABASE else "in_progress"
    }
]

mock_papers = [
    {
        "id": "paper1",
        "title": "人工智能在学术研究中的应用",
        "authors": ["张三", "李四"],
        "abstract": "本文探讨了人工智能技术在现代学术研究中的应用和影响...",
        "keywords": ["人工智能", "学术研究", "技术应用"],
        "year": 2023,
        "journal": "计算机科学与技术",
        "citations": 45,
        "source": "arXiv",
        "url": "https://example.com/paper1",
        "project_id": 1,
        "isFavorite": False
    }
]

mock_progress = [
    {
        "id": 1,
        "project_id": 1,
        "date": "2023-06-15T10:30:00",
        "description": "完成文献综述",
        "achievements": "收集了30篇相关论文并进行了分析"
    }
]

mock_innovations = [
    {
        "id": 1,
        "paper_id": "paper1",
        "description": "提出了一种新的机器学习算法",
        "impact_factor": 8.5,
        "application_areas": ["自然语言处理", "计算机视觉"]
    }
]

router = APIRouter(prefix="/research", tags=["research"])

@router.post("/projects")
def create_project(
    title: str,
    description: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user = Depends(get_current_user),
    db = None
):
    """创建研究项目"""
    if HAS_DATABASE and db is None:
        db = next(get_db())
        
    if HAS_DATABASE:
        # 正常数据库操作
        project = ResearchProject(
            title=title,
            description=description,
            start_date=start_date,
            end_date=end_date,
            user_id=current_user.id,
            status=ProjectStatus.PLANNING
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project
    else:
        # 模拟创建项目
        user_id = current_user["id"] if isinstance(current_user, dict) else current_user.id
        new_project = {
            "id": len(mock_projects) + 1,
            "title": title,
            "description": description,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "user_id": user_id,
            "status": "planning"
        }
        mock_projects.append(new_project)
        return new_project

@router.get("/projects")
def get_projects(
    current_user = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10,
    db = None
):
    """获取用户的研究项目列表"""
    if HAS_DATABASE and db is None:
        db = next(get_db())
        
    if HAS_DATABASE:
        # 正常数据库查询
        projects = db.query(ResearchProject).filter(
            ResearchProject.user_id == current_user.id
        ).offset(skip).limit(limit).all()
        return projects
    else:
        # 返回模拟数据
        user_id = current_user["id"] if isinstance(current_user, dict) else current_user.id
        user_projects = [p for p in mock_projects if p["user_id"] == user_id]
        return user_projects[skip:skip+limit]

@router.post("/projects/{project_id}/papers")
def add_paper(
    project_id: int,
    paper_data: Dict[str, Any],
    current_user = Depends(get_current_user),
    db = None
):
    """添加论文到研究项目"""
    if HAS_DATABASE and db is None:
        db = next(get_db())
        
    if HAS_DATABASE:
        # 检查项目是否存在且属于当前用户
        project = db.query(ResearchProject).filter(
            ResearchProject.id == project_id,
            ResearchProject.user_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or not owned by current user"
            )
            
        # 创建新论文
        paper = Paper(
            **paper_data,
            project_id=project_id
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)
        return paper
    else:
        # 模拟添加论文
        user_id = current_user["id"] if isinstance(current_user, dict) else current_user.id
        # 检查项目是否存在且属于当前用户
        project = next((p for p in mock_projects if p["id"] == project_id and p["user_id"] == user_id), None)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or not owned by current user"
            )
            
        # 创建新论文
        new_paper = {
            **paper_data,
            "id": f"paper{len(mock_papers) + 1}",
            "project_id": project_id
        }
        mock_papers.append(new_paper)
        return new_paper

@router.get("/papers")
def search_papers(
    query: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    db = None
):
    """搜索论文"""
    if HAS_DATABASE and db is None:
        db = next(get_db())
        
    if HAS_DATABASE:
        # 正常数据库查询
        papers_query = db.query(Paper)
        
        if query:
            papers_query = papers_query.filter(
                Paper.title.ilike(f"%{query}%") | 
                Paper.abstract.ilike(f"%{query}%") |
                Paper.keywords.any(query)
            )
            
        total = papers_query.count()
        papers = papers_query.offset(skip).limit(limit).all()
        
        return {"papers": papers, "total": total}
    else:
        # 返回模拟数据
        filtered_papers = mock_papers
        if query:
            query = query.lower()
            filtered_papers = [p for p in mock_papers if 
                              query in p["title"].lower() or 
                              query in p["abstract"].lower() or 
                              any(query in k.lower() for k in p["keywords"])]
        
        return {"papers": filtered_papers[skip:skip+limit], "total": len(filtered_papers)}

@router.get("/projects/{project_id}/progress")
def get_project_progress(
    project_id: int,
    current_user = Depends(get_current_user),
    db = None
):
    """获取研究项目的进度记录"""
    if HAS_DATABASE and db is None:
        db = next(get_db())
        
    if HAS_DATABASE:
        # 检查项目是否存在且属于当前用户
        project = db.query(ResearchProject).filter(
            ResearchProject.id == project_id,
            ResearchProject.user_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or not owned by current user"
            )
            
        # 获取进度记录
        progress_records = db.query(ProgressRecord).filter(
            ProgressRecord.project_id == project_id
        ).order_by(ProgressRecord.date.desc()).all()
        
        return progress_records
    else:
        # 返回模拟数据
        user_id = current_user["id"] if isinstance(current_user, dict) else current_user.id
        # 检查项目是否存在且属于当前用户
        project = next((p for p in mock_projects if p["id"] == project_id and p["user_id"] == user_id), None)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or not owned by current user"
            )
            
        # 获取进度记录
        progress_records = [p for p in mock_progress if p["project_id"] == project_id]
        return sorted(progress_records, key=lambda x: x["date"], reverse=True)