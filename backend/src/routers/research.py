from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.research import ResearchProject, Paper, ProgressRecord, InnovationPoint, ProjectStatus
from ..security import verify_token

router = APIRouter(prefix="/research", tags=["research"])

@router.post("/projects")
def create_project(
    title: str,
    description: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """创建研究项目"""
    project = ResearchProject(
        title=title,
        description=description,
        start_date=start_date,
        end_date=end_date,
        user_id=user_id,
        status=ProjectStatus.PLANNING
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/projects")
def get_projects(
    user_id: int = Depends(verify_token),
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """获取用户的研究项目列表"""
    projects = db.query(ResearchProject).filter(
        ResearchProject.user_id == user_id
    ).offset(skip).limit(limit).all()
    return projects

@router.post("/projects/{project_id}/papers")
def add_paper(
    project_id: int,
    title: str,
    authors: str,
    abstract: Optional[str] = None,
    url: Optional[str] = None,
    publication_date: Optional[datetime] = None,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """添加相关论文"""
    # 验证项目所有权
    project = db.query(ResearchProject).filter(
        ResearchProject.id == project_id,
        ResearchProject.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    paper = Paper(
        title=title,
        authors=authors,
        abstract=abstract,
        url=url,
        publication_date=publication_date,
        project_id=project_id
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper

@router.post("/projects/{project_id}/progress")
def record_progress(
    project_id: int,
    content: str,
    milestone: Optional[str] = None,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """记录研究进度"""
    project = db.query(ResearchProject).filter(
        ResearchProject.id == project_id,
        ResearchProject.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    progress = ProgressRecord(
        content=content,
        milestone=milestone,
        project_id=project_id
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress

@router.post("/projects/{project_id}/innovation-points")
def add_innovation_point(
    project_id: int,
    title: str,
    description: str,
    implementation_status: Optional[str] = None,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """添加创新点"""
    project = db.query(ResearchProject).filter(
        ResearchProject.id == project_id,
        ResearchProject.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    innovation = InnovationPoint(
        title=title,
        description=description,
        implementation_status=implementation_status,
        project_id=project_id
    )
    db.add(innovation)
    db.commit()
    db.refresh(innovation)
    return innovation