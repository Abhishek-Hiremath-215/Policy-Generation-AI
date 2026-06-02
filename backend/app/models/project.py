"""
Project model for organizing policy generation projects.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Project(Base):
    """
    Represents a policy generation project.
    Contains company information and project metadata.
    """
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    industry = Column(String(100))
    description = Column(Text)
    
    # Renamed from 'metadata' to avoid SQLAlchemy reserved keyword
    project_metadata = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    datasources = relationship("DataSource", back_populates="project", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="project", cascade="all, delete-orphan")
