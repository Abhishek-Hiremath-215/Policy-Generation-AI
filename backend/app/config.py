"""
Configuration management for the Policy AI System.
Uses only FREE and OPEN-SOURCE components:
- PostgreSQL for database
- Ollama for LLM (free local models)
- Qdrant for vector store (free, open-source)
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database - PostgreSQL (Free & Open Source)
    DATABASE_URL: str = "postgresql://postgres:system@localhost:5432/policy_ai_db"
    
    # LLM Configuration - Ollama Only (Free & Local)
    LLM_PROVIDER: str = "ollama"
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b-instruct-q4_K_M"
    
    # Vector Store - Qdrant (Free & Open Source)
    VECTOR_STORE: str = "qdrant"
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""  # Optional, for cloud/remote instances
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    POLICY_OUTPUT_DIR: str = "./generated_policies"
    MAX_UPLOAD_SIZE: int = 104857600  # 100MB
    
    # Text Processing
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Policy AI System (Free & Open Source)"
    VERSION: str = "1.0.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.POLICY_OUTPUT_DIR, exist_ok=True)
