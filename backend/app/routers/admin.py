"""
Admin router for managing projects, documents, and data sources.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import asyncio
from datetime import datetime

from app.database import get_db

# Import models directly
from app.models.project import Project
from app.models.document import Document
from app.models.datasource import DataSource

# Import schemas directly
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetail
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.schemas.datasource import DatabaseSourceCreate, URLSourceCreate, DataSourceResponse, DataSourceUpdate

# Import services directly
from app.services.document_processor import DocumentProcessor
from app.services.url_scraper import URLScraper
from app.services.database_connector import DatabaseConnector
from app.services.vector_store import VectorStore

# Import utils directly
from app.utils.file_handler import FileHandler
from app.utils.text_chunker import TextChunker
from app.utils.validators import Validators

from app.config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])


# ==================== PROJECT MANAGEMENT ====================

@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new project.
    
    Projects organize all data sources and policies for a company.
    """
    db_project = Project(
        name=project.name,
        company_name=project.company_name,
        industry=project.industry,
        description=project.description,
        project_metadata=project.project_metadata
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return db_project


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of all projects."""
    projects = db.query(Project).offset(skip).limit(limit).all()
    return projects


@router.get("/projects/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get counts
    documents_count = db.query(Document).filter(Document.project_id == project_id).count()
    datasources_count = db.query(DataSource).filter(DataSource.project_id == project_id).count()
    
    project_dict = {
        "id": project.id,
        "name": project.name,
        "company_name": project.company_name,
        "industry": project.industry,
        "description": project.description,
        "project_metadata": project.project_metadata,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "documents_count": documents_count,
        "datasources_count": datasources_count,
        "policies_count": len(project.policies)
    }
    
    return project_dict


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update fields
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Delete a project and all associated data."""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete associated vector stores
    try:
        vector_store = VectorStore(f"project_{project_id}")
        vector_store.delete_collection()
    except:
        pass
    
    db.delete(project)
    db.commit()
    
    return None


# ==================== DOCUMENT MANAGEMENT ====================

async def process_document_background(
    document_id: int,
    file_path: str,
    file_type: str,
    project_id: int
):
    """Background task to process uploaded document."""
    from app.database import SessionLocal
    
    db = SessionLocal()
    
    try:
        # Get document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return
        
        # Update status
        document.status = "processing"
        db.commit()
        
        # Extract text
        processor = DocumentProcessor()
        text = processor.process_document(file_path, file_type)
        
        # Chunk text
        chunker = TextChunker()
        chunks = chunker.chunk_text(text)
        
        # Store in vector database
        vector_store = VectorStore(f"project_{project_id}")
        
        metadatas = [
            {
                'document_id': document_id,
                'project_id': project_id,
                'filename': document.filename,
                'chunk_index': i
            }
            for i in range(len(chunks))
        ]
        
        vector_store.add_texts(chunks, metadatas)
        
        # Update document
        document.status = "completed"
        document.text_chunks_count = len(chunks)
        document.vector_store_id = f"project_{project_id}"
        document.processed_at = datetime.utcnow()
        
        db.commit()
        
    except Exception as e:
        # Update status to failed
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = "failed"
            document.extraction_metadata = str(e)
            db.commit()
    
    finally:
        db.close()


@router.post("/projects/{project_id}/documents", response_model=DocumentUploadResponse)
async def upload_document(
    project_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a document to a project.
    
    Supported formats: PDF, DOCX, CSV, Excel, JSON
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate file type
    file_type = Validators.validate_file_type(file.filename)
    
    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
        )
    
    # Save file
    file_path, actual_size = await FileHandler.save_upload_file(file, project_id)
    
    # Create document record
    document = Document(
        project_id=project_id,
        filename=file.filename,
        file_type=file_type,
        file_path=file_path,
        file_size=actual_size,
        status="pending"
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Process document in background
    background_tasks.add_task(
        process_document_background,
        document.id,
        file_path,
        file_type,
        project_id
    )
    
    return {
        "message": "Document uploaded successfully and processing started",
        "document": document
    }


@router.get("/projects/{project_id}/documents", response_model=List[DocumentResponse])
async def list_project_documents(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all documents for a project."""
    documents = db.query(Document).filter(Document.project_id == project_id).all()
    return documents


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Get document details."""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Delete a document."""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    FileHandler.delete_file(document.file_path)
    
    # Note: Vector embeddings remain in the collection (indexed by document_id)
    # They can be filtered out during retrieval
    
    db.delete(document)
    db.commit()
    
    return None


# ==================== DATA SOURCE MANAGEMENT ====================

async def process_database_source_background(
    datasource_id: int,
    connection_string: str,
    config: dict,
    project_id: int
):
    """Background task to process database source."""
    from app.database import SessionLocal
    
    db = SessionLocal()
    
    try:
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if not datasource:
            return
        
        # Connect to database
        db_connector = DatabaseConnector(connection_string)
        db_connector.connect()
        
        # Extract data
        if 'tables' in config:
            # Extract specific tables
            all_text = []
            for table in config['tables']:
                table_text = db_connector.extract_table_data(
                    table,
                    limit=config.get('limit_per_table', 1000)
                )
                all_text.append(table_text)
            text = "\n\n".join(all_text)
        
        elif 'query' in config:
            # Execute custom query
            text = db_connector.execute_custom_query(config['query'])
        
        else:
            # Extract all tables
            text = db_connector.extract_all_tables(
                limit_per_table=config.get('limit_per_table', 500)
            )
        
        # Chunk text
        chunker = TextChunker()
        chunks = chunker.chunk_text(text)
        
        # Store in vector database
        vector_store = VectorStore(f"project_{project_id}")
        
        metadatas = [
            {
                'datasource_id': datasource_id,
                'project_id': project_id,
                'source_type': 'database',
                'chunk_index': i
            }
            for i in range(len(chunks))
        ]
        
        vector_store.add_texts(chunks, metadatas)
        
        # Update datasource
        datasource.status = "active"
        datasource.chunks_count = len(chunks)
        datasource.vector_store_id = f"project_{project_id}"
        datasource.last_synced = datetime.utcnow()
        
        db.commit()
        
    except Exception as e:
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if datasource:
            datasource.status = "error"
            datasource.config['error'] = str(e)
            db.commit()
    
    finally:
        db.close()


async def process_url_source_background(
    datasource_id: int,
    url: str,
    project_id: int
):
    """Background task to process URL source."""
    from app.database import SessionLocal
    
    db = SessionLocal()
    
    try:
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if not datasource:
            return
        
        # Scrape URL
        scraper = URLScraper()
        result = scraper.scrape_url(url)
        
        if result['status'] != 'success':
            raise Exception(result.get('error', 'Scraping failed'))
        
        text = f"Title: {result['title']}\n\n{result['content']}"
        
        # Chunk text
        chunker = TextChunker()
        chunks = chunker.chunk_text(text)
        
        # Store in vector database
        vector_store = VectorStore(f"project_{project_id}")
        
        metadatas = [
            {
                'datasource_id': datasource_id,
                'project_id': project_id,
                'source_type': 'url',
                'url': url,
                'chunk_index': i
            }
            for i in range(len(chunks))
        ]
        
        vector_store.add_texts(chunks, metadatas)
        
        # Update datasource
        datasource.status = "active"
        datasource.chunks_count = len(chunks)
        datasource.vector_store_id = f"project_{project_id}"
        datasource.last_synced = datetime.utcnow()
        
        db.commit()
        
    except Exception as e:
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if datasource:
            datasource.status = "error"
            datasource.config['error'] = str(e)
            db.commit()
    
    finally:
        db.close()


@router.post("/projects/{project_id}/datasources/database", response_model=DataSourceResponse)
async def add_database_source(
    project_id: int,
    source: DatabaseSourceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Add a database as a data source.
    
    Connection string format: postgresql://user:password@host:port/database
    Config can include: tables (list), query (str), limit_per_table (int)
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate connection string
    Validators.validate_database_connection(source.connection_string)
    
    # Create datasource record
    datasource = DataSource(
        project_id=project_id,
        source_type="database",
        name=source.name,
        connection_string=source.connection_string,
        config=source.config,
        status="pending"
    )
    
    db.add(datasource)
    db.commit()
    db.refresh(datasource)
    
    # Process in background
    background_tasks.add_task(
        process_database_source_background,
        datasource.id,
        source.connection_string,
        source.config,
        project_id
    )
    
    return datasource


@router.post("/projects/{project_id}/datasources/url", response_model=DataSourceResponse)
async def add_url_source(
    project_id: int,
    source: URLSourceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Add a URL as a data source.
    
    The system will scrape content from the URL.
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate URL
    Validators.validate_url(source.url)
    
    # Create datasource record
    datasource = DataSource(
        project_id=project_id,
        source_type="url",
        name=source.name,
        url=source.url,
        config=source.config,
        status="pending"
    )
    
    db.add(datasource)
    db.commit()
    db.refresh(datasource)
    
    # Process in background
    background_tasks.add_task(
        process_url_source_background,
        datasource.id,
        source.url,
        project_id
    )
    
    return datasource


@router.get("/projects/{project_id}/datasources", response_model=List[DataSourceResponse])
async def list_project_datasources(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all data sources for a project."""
    datasources = db.query(DataSource).filter(DataSource.project_id == project_id).all()
    return datasources


@router.get("/datasources/{datasource_id}", response_model=DataSourceResponse)
async def get_datasource(
    datasource_id: int,
    db: Session = Depends(get_db)
):
    """Get datasource details."""
    datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    
    if not datasource:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    return datasource


@router.patch("/datasources/{datasource_id}", response_model=DataSourceResponse)
async def update_datasource(
    datasource_id: int,
    update: DataSourceUpdate,
    db: Session = Depends(get_db)
):
    """Update a datasource."""
    datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    
    if not datasource:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(datasource, field, value)
    
    datasource.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(datasource)
    
    return datasource


@router.delete("/datasources/{datasource_id}", status_code=204)
async def delete_datasource(
    datasource_id: int,
    db: Session = Depends(get_db)
):
    """Delete a datasource."""
    datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    
    if not datasource:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    db.delete(datasource)
    db.commit()
    
    return None


@router.post("/datasources/{datasource_id}/resync")
async def resync_datasource(
    datasource_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Re-sync a datasource to update its data."""
    datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    
    if not datasource:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    # Set status to pending
    datasource.status = "pending"
    db.commit()
    
    # Process based on type
    if datasource.source_type == "database":
        background_tasks.add_task(
            process_database_source_background,
            datasource.id,
            datasource.connection_string,
            datasource.config,
            datasource.project_id
        )
    elif datasource.source_type == "url":
        background_tasks.add_task(
            process_url_source_background,
            datasource.id,
            datasource.url,
            datasource.project_id
        )
    
    return {"message": "Re-sync initiated", "status": "pending"}
