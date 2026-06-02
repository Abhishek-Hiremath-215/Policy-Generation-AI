"""
Policy model for generated policies.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Policy(Base):
    """
    Represents a generated policy document.
    """
    __tablename__ = "policies"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Policy details
    title = Column(String(500), nullable=False)
    query = Column(Text, nullable=False)  # User's original query
    
    # Generation status
    status = Column(String(50), default="pending")  # pending, generating, completed, failed
    progress = Column(Integer, default=0)  # 0-100
    
    # Output
    pdf_path = Column(String(500))
    page_count = Column(Integer)
    
    # Metadata
    generation_metadata = Column(JSON, default={})  # Sources used, token count, etc.
    error_message = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    project = relationship("Project", back_populates="policies")
