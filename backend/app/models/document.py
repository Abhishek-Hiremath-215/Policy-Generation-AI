"""
Document model for uploaded files.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Document(Base):
    """
    Represents an uploaded document.
    Stores metadata and extracted text reference, not the full file.
    """
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # File information
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, csv, excel, json
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger)
    
    # Processing status
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    
    # Extracted content reference (not full content)
    text_chunks_count = Column(Integer, default=0)
    vector_store_id = Column(String(100))  # Reference to vector store
    
    # Metadata
    extraction_metadata = Column(Text)  # JSON string with extraction info
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)
    
    # Relationships
    project = relationship("Project", back_populates="documents")
