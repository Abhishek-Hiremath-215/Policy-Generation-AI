"""
User router for simplified user-facing endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db

# Import models directly
from app.models.project import Project
from app.models.document import Document
from app.models.datasource import DataSource

# Import schemas directly
from app.schemas.project import ProjectResponse

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/projects", response_model=List[ProjectResponse])
async def get_available_projects(
    db: Session = Depends(get_db)
):
    """
    Get list of available projects for policy generation.
    
    Simplified endpoint for users to see what projects they can generate policies for.
    """
    projects = db.query(Project).all()
    return projects


@router.get("/projects/{project_id}/info")
async def get_project_info(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Get basic project information.
    
    Returns company name, industry, and data availability status.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check data availability
    completed_docs = db.query(Document).filter(
        Document.project_id == project_id,
        Document.status == "completed"
    ).count()
    
    active_sources = db.query(DataSource).filter(
        DataSource.project_id == project_id,
        DataSource.status == "active"
    ).count()
    
    return {
        'id': project.id,
        'name': project.name,
        'company_name': project.company_name,
        'industry': project.industry,
        'description': project.description,
        'data_available': completed_docs > 0 or active_sources > 0,
        'documents_count': completed_docs,
        'datasources_count': active_sources
    }
