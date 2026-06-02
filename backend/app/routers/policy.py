"""
Policy router for generating policy documents.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
import asyncio
import traceback

from app.database import get_db

# Import models directly
from app.models.project import Project
from app.models.policy import Policy
from app.models.document import Document
from app.models.datasource import DataSource

# Import schemas directly
from app.schemas.policy import PolicyGenerateRequest, PolicyResponse, PolicyStatusResponse

# Import services directly
from app.services.vector_store import VectorStore
from app.services.llm_service import LLMService
from app.services.pdf_generator import PolicyPDFGenerator

from app.config import settings

router = APIRouter(prefix="/policies", tags=["Policy Generation"])


async def generate_policy_background(policy_id: int):
    """
    Background task for generating policy document.
    This handles the entire policy generation workflow.
    """
    from app.database import SessionLocal
    
    db = SessionLocal()
    
    try:
        print(f"\n{'='*60}")
        print(f"🚀 Starting policy generation for policy ID: {policy_id}")
        print(f"{'='*60}\n")
        
        # Get policy and project
        policy = db.query(Policy).filter(Policy.id == policy_id).first()
        if not policy:
            print(f"❌ ERROR: Policy {policy_id} not found in database")
            return
        
        project = db.query(Project).filter(Project.id == policy.project_id).first()
        if not project:
            print(f"❌ ERROR: Project not found for policy {policy_id}")
            return
        
        print(f"✅ Project found: {project.name} (Company: {project.company_name})")
        
        # Update status
        policy.status = "generating"
        policy.progress = 5
        db.commit()
        print(f"📊 Status updated to 'generating' - Progress: 5%")
        
        # Initialize services with detailed error handling
        try:
            print(f"\n📦 Initializing vector store for project_{project.id}...")
            vector_store = VectorStore(f"project_{project.id}")
            chunk_count = vector_store.get_count()
            print(f"✅ Vector store initialized successfully")
            print(f"   - Total chunks available: {chunk_count}")
        except Exception as e:
            print(f"❌ ERROR: Failed to initialize vector store")
            print(f"   Error: {str(e)}")
            print(f"   Traceback:\n{traceback.format_exc()}")
            raise Exception(f"Vector store initialization failed: {str(e)}")
        
        try:
            print(f"\n🤖 Initializing LLM service (Ollama)...")
            llm_service = LLMService()
            print(f"✅ LLM service initialized successfully")
            print(f"   - Provider: {settings.LLM_PROVIDER}")
            print(f"   - Model: {settings.OLLAMA_MODEL}")
            print(f"   - Host: {settings.OLLAMA_HOST}")
        except Exception as e:
            print(f"❌ ERROR: Failed to initialize LLM service")
            print(f"   Error: {str(e)}")
            print(f"   Traceback:\n{traceback.format_exc()}")
            raise Exception(f"LLM service initialization failed: {str(e)}")
        
        # Check if there's data available
        total_chunks = vector_store.get_count()
        if total_chunks == 0:
            error_msg = "No data available. Please upload documents or add data sources first."
            print(f"❌ ERROR: {error_msg}")
            raise Exception(error_msg)
        
        # Count documents and data sources
        doc_count = db.query(Document).filter(
            Document.project_id == project.id,
            Document.status == "completed"
        ).count()
        
        ds_count = db.query(DataSource).filter(
            DataSource.project_id == project.id,
            DataSource.status == "active"
        ).count()
        
        print(f"\n📊 Data summary:")
        print(f"   - Vector chunks: {total_chunks}")
        print(f"   - Documents: {doc_count}")
        print(f"   - Data sources: {ds_count}")
        
        policy.progress = 10
        db.commit()
        
        # Define policy sections
        sections = PolicyPDFGenerator.DEFAULT_SECTIONS
        sections_content = {}
        
        print(f"\n📋 Sections to generate: {len(sections)}")
        for i, section in enumerate(sections, 1):
            print(f"   {i}. {section['title']}")
        
        # Company info for context
        company_info = {
            'company_name': project.company_name,
            'industry': project.industry,
            'description': project.description,
            'metadata': project.project_metadata
        }
        
        # Progress tracking
        total_sections = len(sections)
        progress_per_section = 80 / total_sections
        
        # Generate executive summary
        print(f"\n{'='*60}")
        print(f"📝 Generating section 1/{len(sections)}: Executive Summary")
        print(f"{'='*60}")
        
        policy.progress = 15
        db.commit()
        
        try:
            # Get general context
            print(f"   🔍 Searching for relevant context...")
            general_results = vector_store.search(
                query=f"Overview of {project.company_name} policies, procedures, and organizational structure",
                top_k=10
            )
            print(f"   ✅ Found {len(general_results)} relevant chunks")
            
            general_context = [r['text'] for r in general_results]
            
            print(f"   🤖 Calling LLM to generate executive summary...")
            executive_summary = llm_service.generate_executive_summary(
                company_info=company_info,
                policy_overview=policy.query
            )
            print(f"   ✅ Executive summary generated ({len(executive_summary)} characters)")
            
            sections_content['Executive Summary'] = executive_summary
            policy.progress = 20
            db.commit()
            
        except Exception as e:
            print(f"   ❌ ERROR generating executive summary: {str(e)}")
            print(f"   Traceback:\n{traceback.format_exc()}")
            raise
        
        # Generate each section
        for idx, section in enumerate(sections[1:], 1):
            try:
                print(f"\n{'='*60}")
                print(f"📝 Generating section {idx+1}/{len(sections)}: {section['title']}")
                print(f"{'='*60}")
                
                # Retrieve relevant context
                search_query = f"{section['description']} for {project.company_name}"
                print(f"   🔍 Search query: {search_query[:100]}...")
                
                search_results = vector_store.search(
                    query=search_query,
                    top_k=15
                )
                print(f"   ✅ Found {len(search_results)} relevant chunks")
                
                context_data = [result['text'] for result in search_results]
                
                # Generate section content
                print(f"   🤖 Calling LLM to generate section...")
                section_content = llm_service.generate_policy_section(
                    section_title=section['title'],
                    section_description=section['description'],
                    context_data=context_data,
                    company_info=company_info
                )
                print(f"   ✅ Section generated ({len(section_content)} characters)")
                
                sections_content[section['title']] = section_content
                
                # Update progress
                policy.progress = int(20 + (idx * progress_per_section))
                db.commit()
                print(f"   📊 Progress: {policy.progress}%")
                
                # Small delay
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"   ❌ ERROR generating section {section['title']}: {str(e)}")
                print(f"   Traceback:\n{traceback.format_exc()}")
                # Add placeholder
                sections_content[section['title']] = f"# {section['title']}\n\n[Section generation failed: {str(e)}]"
        
        policy.progress = 90
        db.commit()
        
        # Generate PDF
        print(f"\n{'='*60}")
        print(f"📄 Generating PDF document...")
        print(f"{'='*60}")
        
        output_filename = f"policy_{policy.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        output_path = Path(settings.POLICY_OUTPUT_DIR) / output_filename
        
        print(f"   Output path: {output_path}")
        
        try:
            pdf_path = PolicyPDFGenerator.create_policy_document(
                output_path=str(output_path),
                company_name=project.company_name,
                policy_title=policy.title,
                sections_content=sections_content,
                include_toc=True
            )
            print(f"   ✅ PDF generated successfully: {pdf_path}")
        except Exception as e:
            print(f"   ❌ ERROR generating PDF: {str(e)}")
            print(f"   Traceback:\n{traceback.format_exc()}")
            raise
        
        # Count pages
        page_count = len(sections_content) * 3
        
        # Update policy record
        policy.status = "completed"
        policy.progress = 100
        policy.pdf_path = str(output_path)
        policy.page_count = page_count
        policy.completed_at = datetime.utcnow()
        policy.generation_metadata = {
            'sections_generated': len(sections_content),
            'total_chunks_used': total_chunks,
            'llm_provider': settings.LLM_PROVIDER
        }
        
        db.commit()
        
        print(f"\n{'='*60}")
        print(f"✅ POLICY GENERATION COMPLETED SUCCESSFULLY!")
        print(f"{'='*60}")
        print(f"   Policy ID: {policy.id}")
        print(f"   Sections: {len(sections_content)}")
        print(f"   Pages: ~{page_count}")
        print(f"   PDF: {output_path}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        # Update status to failed
        print(f"\n{'='*60}")
        print(f"❌ POLICY GENERATION FAILED")
        print(f"{'='*60}")
        print(f"   Error: {str(e)}")
        print(f"   Full traceback:\n{traceback.format_exc()}")
        print(f"{'='*60}\n")
        
        policy = db.query(Policy).filter(Policy.id == policy_id).first()
        if policy:
            policy.status = "failed"
            policy.error_message = str(e)
            db.commit()
    
    finally:
        db.close()


@router.post("/generate", response_model=PolicyResponse, status_code=202)
async def generate_policy(
    request: PolicyGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generate a comprehensive policy document.
    
    This endpoint initiates policy generation in the background.
    Use the returned policy ID to check status and download the PDF when ready.
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if project has any data
    doc_count = db.query(Document).filter(
        Document.project_id == request.project_id,
        Document.status == "completed"
    ).count()
    
    ds_count = db.query(DataSource).filter(
        DataSource.project_id == request.project_id,
        DataSource.status == "active"
    ).count()
    
    if doc_count == 0 and ds_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Project has no data. Please upload documents or add data sources first."
        )
    
    # Generate title if not provided
    title = request.title or f"{project.company_name} - Organizational Policy Document"
    
    # Create policy record
    policy = Policy(
        project_id=request.project_id,
        title=title,
        query=request.query,
        status="pending",
        progress=0
    )
    
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    print(f"\n📋 New policy generation requested:")
    print(f"   Policy ID: {policy.id}")
    print(f"   Project: {project.name}")
    print(f"   Title: {title}")
    
    # Start generation in background
    background_tasks.add_task(generate_policy_background, policy.id)
    
    return policy


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    """Get policy details."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    return policy


@router.get("/{policy_id}/status", response_model=PolicyStatusResponse)
async def get_policy_status(
    policy_id: int,
    db: Session = Depends(get_db)
):
    """
    Check the status of policy generation.
    
    Use this endpoint to poll for completion status.
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Determine message based on status
    status_messages = {
        'pending': 'Policy generation is queued',
        'generating': f'Generating policy... {policy.progress}% complete',
        'completed': 'Policy generation completed successfully',
        'failed': f'Policy generation failed: {policy.error_message}'
    }
    
    return {
        'id': policy.id,
        'status': policy.status,
        'progress': policy.progress,
        'message': status_messages.get(policy.status, 'Unknown status'),
        'pdf_available': policy.status == 'completed' and policy.pdf_path is not None
    }


@router.get("/{policy_id}/download")
async def download_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    """
    Download the generated policy PDF.
    
    Returns 404 if policy not found or not yet completed.
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    if policy.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Policy not ready. Current status: {policy.status}"
        )
    
    if not policy.pdf_path or not Path(policy.pdf_path).exists():
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    # Return file
    filename = Path(policy.pdf_path).name
    return FileResponse(
        path=policy.pdf_path,
        filename=filename,
        media_type='application/pdf'
    )


@router.get("/project/{project_id}/policies", response_model=List[PolicyResponse])
async def list_project_policies(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all policies for a project."""
    policies = db.query(Policy).filter(Policy.project_id == project_id).all()
    return policies


@router.delete("/{policy_id}", status_code=204)
async def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    """Delete a policy and its PDF file."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Delete PDF file if exists
    if policy.pdf_path and Path(policy.pdf_path).exists():
        Path(policy.pdf_path).unlink()
    
    db.delete(policy)
    db.commit()
    
    return None
