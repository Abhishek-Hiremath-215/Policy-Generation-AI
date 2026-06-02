"""
File handling utilities for secure file operations.
"""

import os
import uuid
import shutil
from pathlib import Path
from typing import BinaryIO
from fastapi import UploadFile
from app.config import settings


class FileHandler:
    """Handles file upload and storage operations."""
    
    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """Generate a unique filename while preserving extension."""
        file_extension = Path(original_filename).suffix
        unique_id = uuid.uuid4().hex
        return f"{unique_id}{file_extension}"
    
    @staticmethod
    async def save_upload_file(
        upload_file: UploadFile,
        project_id: int
    ) -> tuple[str, int]:
        """
        Save uploaded file to disk.
        
        Returns:
            tuple: (file_path, file_size)
        """
        # Create project-specific directory
        project_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        project_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        unique_filename = FileHandler.generate_unique_filename(upload_file.filename)
        file_path = project_dir / unique_filename
        
        # Save file
        file_size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await upload_file.read(8192):
                buffer.write(chunk)
                file_size += len(chunk)
        
        return str(file_path), file_size
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete a file from disk."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Extract file extension."""
        return Path(filename).suffix.lower().replace(".", "")
