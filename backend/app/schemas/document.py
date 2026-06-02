"""
Pydantic schemas for Document API.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DocumentBase(BaseModel):
    """Base document schema."""
    filename: str
    file_type: str
    file_size: Optional[int] = None


class DocumentCreate(DocumentBase):
    """Schema for creating a document."""
    project_id: int


class DocumentResponse(DocumentBase):
    """Schema for document response."""
    id: int
    project_id: int
    file_path: str
    status: str
    text_chunks_count: int
    vector_store_id: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Response after document upload."""
    message: str
    document: DocumentResponse
