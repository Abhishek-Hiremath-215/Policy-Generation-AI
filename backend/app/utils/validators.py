"""
Input validation utilities.
"""

import re
from typing import List
from fastapi import HTTPException


class Validators:
    """Input validation utilities."""
    
    ALLOWED_FILE_TYPES = ['pdf', 'docx', 'csv', 'xlsx', 'xls', 'json']
    
    @staticmethod
    def validate_file_type(filename: str) -> str:
        """Validate file type from filename."""
        extension = filename.split('.')[-1].lower()
        if extension not in Validators.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File type '.{extension}' not supported. Allowed: {', '.join(Validators.ALLOWED_FILE_TYPES)}"
            )
        return extension
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL format."""
        url_pattern = re.compile(
            r'^https?://'
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
            r'localhost|'
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
            r'(?::\d+)?'
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        if not url_pattern.match(url):
            raise HTTPException(
                status_code=400,
                detail="Invalid URL format"
            )
        return True
    
    @staticmethod
    def validate_database_connection(connection_string: str) -> bool:
        """Basic validation for database connection string."""
        if not connection_string or len(connection_string) < 10:
            raise HTTPException(
                status_code=400,
                detail="Invalid database connection string"
            )
        return True
