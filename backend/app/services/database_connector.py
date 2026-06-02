"""
Database connector service for connecting to external databases.
"""

from sqlalchemy import create_engine, inspect, text
from typing import List, Dict, Any
import pandas as pd


class DatabaseConnector:
    """Connects to external databases and extracts data."""
    
    def __init__(self, connection_string: str):
        """
        Initialize database connector.
        
        Args:
            connection_string: SQLAlchemy-compatible connection string
        """
        self.connection_string = connection_string
        self.engine = None
    
    def connect(self) -> bool:
        """
        Establish database connection.
        
        Returns:
            True if connection successful
        """
        try:
            self.engine = create_engine(self.connection_string)
            # Test connection
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            raise Exception(f"Database connection failed: {str(e)}")
    
    def get_tables(self) -> List[str]:
        """Get list of all tables in the database."""
        if not self.engine:
            self.connect()
        
        inspector = inspect(self.engine)
        return inspector.get_table_names()
    
    def get_table_schema(self, table_name: str) -> List[Dict[str, Any]]:
        """Get schema information for a table."""
        if not self.engine:
            self.connect()
        
        inspector = inspect(self.engine)
        columns = inspector.get_columns(table_name)
        return columns
    
    def extract_table_data(self, table_name: str, limit: int = None) -> str:
        """
        Extract data from a table and convert to text format.
        
        Args:
            table_name: Name of the table
            limit: Maximum number of rows to extract
            
        Returns:
            Text representation of the data
        """
        if not self.engine:
            self.connect()
        
        try:
            query = f"SELECT * FROM {table_name}"
            if limit:
                query += f" LIMIT {limit}"
            
            df = pd.read_sql(query, self.engine)
            
            # Create structured text representation
            text_parts = []
            text_parts.append(f"Table: {table_name}")
            text_parts.append(f"Columns: {', '.join(df.columns.tolist())}")
            text_parts.append(f"Total Rows: {len(df)}")
            text_parts.append("\n")
            
            # Add sample rows
            for idx, row in df.iterrows():
                row_text = " | ".join([f"{col}: {val}" for col, val in row.items()])
                text_parts.append(f"Row {idx + 1}: {row_text}")
            
            # Add summary statistics
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                text_parts.append("\n\nSummary Statistics:")
                text_parts.append(df[numeric_cols].describe().to_string())
            
            return "\n".join(text_parts)
            
        except Exception as e:
            raise Exception(f"Error extracting table data: {str(e)}")
    
    def execute_custom_query(self, query: str) -> str:
        """
        Execute a custom SQL query and return results as text.
        
        Args:
            query: SQL query to execute
            
        Returns:
            Text representation of query results
        """
        if not self.engine:
            self.connect()
        
        try:
            df = pd.read_sql(query, self.engine)
            
            text_parts = []
            text_parts.append(f"Query Results ({len(df)} rows):")
            text_parts.append(f"Columns: {', '.join(df.columns.tolist())}")
            text_parts.append("\n")
            
            for idx, row in df.iterrows():
                row_text = " | ".join([f"{col}: {val}" for col, val in row.items()])
                text_parts.append(f"Row {idx + 1}: {row_text}")
            
            return "\n".join(text_parts)
            
        except Exception as e:
            raise Exception(f"Error executing query: {str(e)}")
    
    def extract_all_tables(self, limit_per_table: int = 1000) -> str:
        """
        Extract data from all tables in the database.
        
        Args:
            limit_per_table: Max rows per table
            
        Returns:
            Combined text representation of all tables
        """
        tables = self.get_tables()
        all_text = []
        
        for table in tables:
            try:
                table_text = self.extract_table_data(table, limit=limit_per_table)
                all_text.append(f"\n\n{'='*60}\n")
                all_text.append(table_text)
            except Exception as e:
                all_text.append(f"\n\nError extracting table {table}: {str(e)}")
        
        return "\n".join(all_text)
