"""
Pydantic schemas for Policy API.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class PolicyGenerateRequest(BaseModel):
    """Request schema for policy generation."""
    project_id: int
    query: str = Field(
        ...,
        min_length=10,
        description="User query for policy generation"
    )
    title: Optional[str] = Field(
        None,
        description="Custom policy title (auto-generated if not provided)"
    )


class PolicyResponse(BaseModel):
    """Schema for policy response."""
    id: int
    project_id: int
    title: str
    query: str
    status: str
    progress: int
    pdf_path: Optional[str] = None
    page_count: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class PolicyStatusResponse(BaseModel):
    """Schema for checking policy generation status."""
    id: int
    status: str
    progress: int
    message: str
    pdf_available: bool = False
