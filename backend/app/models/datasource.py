"""
DataSource model for database and URL connections.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class DataSource(Base):
    """
    Represents external data sources (databases, URLs).
    Stores connection info and metadata, not the actual data.
    """
    __tablename__ = "datasources"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Source type
    source_type = Column(String(50), nullable=False)  # database, url
    name = Column(String(255), nullable=False)
    
    # Connection details (encrypted in production)
    connection_string = Column(Text)  # For databases
    url = Column(Text)  # For URLs
    
    # Configuration
    config = Column(JSON, default={})  # Additional config like table names, query patterns
    
    # Processing status
    status = Column(String(50), default="active")  # active, inactive, error
    last_synced = Column(DateTime)
    
    # Vector store reference
    vector_store_id = Column(String(100))
    chunks_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="datasources")
