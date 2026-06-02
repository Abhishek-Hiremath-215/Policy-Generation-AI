"""
Vector store service using Qdrant for semantic search and retrieval.
Qdrant is free, open-source, and provides powerful vector search capabilities.
"""

import json
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.config import settings


class VectorStore:
    """
    Vector store using Qdrant for semantic retrieval.
    Stores text chunks as embeddings for semantic search.
    
    Qdrant is free, open-source, and can run:
    - Locally via Docker
    - In-memory for development
    - On a remote server
    """
    
    def __init__(self, collection_name: str):
        """
        Initialize Qdrant vector store.
        
        Args:
            collection_name: Name of the collection/index
        """
        self.collection_name = collection_name
        
        # Initialize embedding model (free, runs locally)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_dim = 384  # Dimension for all-MiniLM-L6-v2
        
        # Initialize Qdrant client
        self._init_qdrant()
    
    def _init_qdrant(self):
        """Initialize Qdrant client and create collection if needed."""
        try:
            # Try to connect to Qdrant server
            if settings.QDRANT_API_KEY:
                # Remote/Cloud instance with API key
                self.client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                    api_key=settings.QDRANT_API_KEY
                )
            elif settings.QDRANT_HOST and settings.QDRANT_HOST != "":
                # Local Qdrant server
                self.client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT
                )
            else:
                # In-memory mode (for development/testing)
                print("⚠️  Using in-memory Qdrant (data will be lost on restart)")
                self.client = QdrantClient(":memory:")
            
            # Create collection if it doesn't exist
            self._ensure_collection_exists()
            
        except Exception as e:
            raise ConnectionError(
                f"Cannot connect to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}. "
                f"Make sure Qdrant is running. "
                f"To start Qdrant with Docker: docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant "
                f"Error: {str(e)}"
            )
    
    def _ensure_collection_exists(self):
        """Create collection if it doesn't exist."""
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            collection_names = [col.name for col in collections]
            
            if self.collection_name not in collection_names:
                # Create new collection
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dim,
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Created Qdrant collection: {self.collection_name}")
        
        except Exception as e:
            print(f"⚠️  Error checking/creating collection: {str(e)}")
    
    def add_texts(
        self,
        texts: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> int:
        """
        Add texts to the vector store.
        
        Args:
            texts: List of text chunks
            metadatas: Optional metadata for each text
            
        Returns:
            Number of texts added
        """
        if not texts:
            return 0
        
        try:
            # Generate embeddings
            embeddings = self.embedding_model.encode(
                texts,
                show_progress_bar=False,
                convert_to_numpy=True
            )
            
            # Prepare points for Qdrant
            points = []
            
            for i, (text, embedding) in enumerate(zip(texts, embeddings)):
                metadata = metadatas[i] if metadatas else {}
                metadata['text'] = text
                
                # Generate unique ID
                point_id = hash(f"{self.collection_name}_{text}_{i}") % (2**63 - 1)
                
                point = PointStruct(
                    id=point_id,
                    vector=embedding.tolist(),
                    payload=metadata
                )
                points.append(point)
            
            # Upsert points to Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            print(f"✅ Added {len(texts)} vectors to Qdrant collection: {self.collection_name}")
            return len(texts)
        
        except Exception as e:
            print(f"❌ Error adding texts to Qdrant: {str(e)}")
            raise
    
    def search(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar texts.
        
        Args:
            query: Query text
            top_k: Number of results to return
            filter_dict: Optional metadata filters (e.g., {'project_id': 1})
            
        Returns:
            List of results with text and metadata
        """
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(
                [query],
                show_progress_bar=False,
                convert_to_numpy=True
            )[0]
            
            # Build filter if provided
            query_filter = None
            if filter_dict:
                conditions = []
                for key, value in filter_dict.items():
                    conditions.append(
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                    )
                if conditions:
                    query_filter = Filter(must=conditions)
            
            # Search in Qdrant
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding.tolist(),
                limit=top_k,
                query_filter=query_filter
            )
            
            # Format results
            results = []
            for hit in search_result:
                result = hit.payload.copy()
                result['score'] = hit.score
                result['id'] = hit.id
                results.append(result)
            
            return results
        
        except Exception as e:
            print(f"❌ Error searching Qdrant: {str(e)}")
            return []
    
    def delete_collection(self):
        """Delete the entire collection."""
        try:
            self.client.delete_collection(collection_name=self.collection_name)
            print(f"🗑️  Deleted Qdrant collection: {self.collection_name}")
        except Exception as e:
            print(f"⚠️  Error deleting collection: {str(e)}")
    
    def get_count(self) -> int:
        """Get total number of vectors in the store."""
        try:
            collection_info = self.client.get_collection(self.collection_name)
            return collection_info.points_count
        except Exception as e:
            print(f"⚠️  Error getting count: {str(e)}")
            return 0
    
    def delete_by_filter(self, filter_dict: Dict[str, Any]) -> bool:
        """
        Delete points matching a filter.
        Useful for removing all chunks from a specific document or datasource.
        
        Args:
            filter_dict: Filter criteria (e.g., {'document_id': 5})
        
        Returns:
            True if successful
        """
        try:
            conditions = []
            for key, value in filter_dict.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                )
            
            if conditions:
                query_filter = Filter(must=conditions)
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=query_filter
                )
                print(f"🗑️  Deleted vectors matching filter: {filter_dict}")
                return True
            
            return False
        
        except Exception as e:
            print(f"⚠️  Error deleting by filter: {str(e)}")
            return False
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection."""
        try:
            collection_info = self.client.get_collection(self.collection_name)
            return {
                'name': self.collection_name,
                'vectors_count': collection_info.points_count,
                'vector_size': collection_info.config.params.vectors.size,
                'distance': collection_info.config.params.vectors.distance.name
            }
        except Exception as e:
            print(f"⚠️  Error getting collection info: {str(e)}")
            return {}
