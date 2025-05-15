from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base

class ProjectStatus(enum.Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"

class ResearchProject(Base):
    __tablename__ = "research_projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    user = relationship("User", back_populates="projects")
    papers = relationship("Paper", back_populates="project")
    progress_records = relationship("ProgressRecord", back_populates="project")
    innovation_points = relationship("InnovationPoint", back_populates="project")

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    authors = Column(String(255))
    abstract = Column(Text)
    publication_date = Column(DateTime(timezone=True))
    url = Column(String(512))
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    project = relationship("ResearchProject", back_populates="papers")

class ProgressRecord(Base):
    __tablename__ = "progress_records"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    milestone = Column(String(255))
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    project = relationship("ResearchProject", back_populates="progress_records")

class InnovationPoint(Base):
    __tablename__ = "innovation_points"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    implementation_status = Column(String(50))
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    project = relationship("ResearchProject", back_populates="innovation_points")