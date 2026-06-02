"""
Pydantic schemas for Project API.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ProjectBase(BaseModel):
    """Base project schema."""
    name: str = Field(..., min_length=1, max_length=255)
    company_name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = None
    description: Optional[str] = None
    project_metadata: Dict[str, Any] = {}


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    project_metadata: Optional[Dict[str, Any]] = None


class ProjectResponse(ProjectBase):
    """Schema for project response."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectDetail(ProjectResponse):
    """Detailed project schema with related data counts."""
    documents_count: int = 0
    datasources_count: int = 0
    policies_count: int = 0
