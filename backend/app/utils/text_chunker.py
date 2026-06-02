"""
Text chunking utilities for processing large documents.
"""

from typing import List
from app.config import settings


class TextChunker:
    """Handles text chunking for vector storage and LLM processing."""
    
    def __init__(
        self,
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Input text to chunk
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + self.chunk_size
            
            # If this is not the last chunk, try to break at a sentence or word
            if end < text_length:
                # Look for sentence end
                for delimiter in ['. ', '.\n', '! ', '? ', '\n\n']:
                    last_delimiter = text.rfind(delimiter, start, end)
                    if last_delimiter != -1:
                        end = last_delimiter + len(delimiter)
                        break
                else:
                    # If no sentence break, try word boundary
                    last_space = text.rfind(' ', start, end)
                    if last_space != -1:
                        end = last_space
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - self.chunk_overlap if end < text_length else text_length
        
        return chunks
    
    def chunk_by_tokens(self, text: str, max_tokens: int = 500) -> List[str]:
        """
        Chunk text by approximate token count.
        Rough estimation: 1 token ≈ 4 characters.
        """
        approx_chars_per_token = 4
        chunk_size_chars = max_tokens * approx_chars_per_token
        
        old_chunk_size = self.chunk_size
        self.chunk_size = chunk_size_chars
        
        chunks = self.chunk_text(text)
        
        self.chunk_size = old_chunk_size
        return chunks
