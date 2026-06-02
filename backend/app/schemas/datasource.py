"""
Pydantic schemas for DataSource API.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, Any
from datetime import datetime


class DataSourceBase(BaseModel):
    """Base datasource schema."""
    name: str = Field(..., min_length=1, max_length=255)
    config: Dict[str, Any] = {}


class DatabaseSourceCreate(BaseModel):
    """Schema for creating a database source."""
    name: str = Field(..., min_length=1, max_length=255)
    connection_string: str
    config: Dict[str, Any] = Field(
        default_factory=dict,
        description="Config with 'tables', 'query' etc."
    )


class URLSourceCreate(BaseModel):
    """Schema for creating a URL source."""
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., description="URL to scrape")
    config: Dict[str, Any] = Field(default_factory=dict)


class DataSourceResponse(BaseModel):
    """Schema for datasource response."""
    id: int
    project_id: int
    source_type: str
    name: str
    status: str
    chunks_count: int
    vector_store_id: Optional[str] = None
    created_at: datetime
    last_synced: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DataSourceUpdate(BaseModel):
    """Schema for updating a datasource."""
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
