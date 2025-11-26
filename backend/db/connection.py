"""
Database connection management for Deductly
Provides centralized database access with proper error handling
"""
import sqlite3
import os
from typing import Optional
from contextlib import contextmanager

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'data', 'test_study_plan.db')

# Allow override via environment variable (useful for testing)
DB_PATH = os.getenv('DEDUCTLY_DB_PATH', DEFAULT_DB_PATH)


class DatabaseConnection:
    """Singleton database connection manager"""

    _instance = None
    _connection = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_connection(self) -> sqlite3.Connection:
        """Get or create database connection"""
        if self._connection is None:
            self._connection = sqlite3.connect(DB_PATH, check_same_thread=False)
            self._connection.row_factory = sqlite3.Row
            # Enable foreign keys
            self._connection.execute("PRAGMA foreign_keys = ON")
        return self._connection

    def close(self):
        """Close database connection"""
        if self._connection:
            self._connection.close()
            self._connection = None


# Global instance
_db = DatabaseConnection()


def get_db_connection() -> sqlite3.Connection:
    """
    Get database connection.
    
    Returns:
        sqlite3.Connection: Database connection with Row factory
        
    Example:
        >>> conn = get_db_connection()
        >>> cursor = conn.cursor()
        >>> cursor.execute("SELECT * FROM skills")
    """
    return _db.get_connection()


@contextmanager
def get_db_cursor():
    """
    Context manager for database operations.
    Automatically commits on success, rolls back on error.
    
    Example:
        >>> with get_db_cursor() as cursor:
        ...     cursor.execute("INSERT INTO skills ...")
        ...     # Automatically committed
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def execute_query(query: str, params: tuple = None) -> list:
    """
    Execute a SELECT query and return results.
    
    Args:
        query: SQL query string
        params: Query parameters (optional)
        
    Returns:
        List of Row objects
    """
    with get_db_cursor() as cursor:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.fetchall()


def execute_update(query: str, params: tuple = None) -> int:
    """
    Execute an INSERT/UPDATE/DELETE query.
    
    Args:
        query: SQL query string
        params: Query parameters (optional)
        
    Returns:
        Number of affected rows
    """
    with get_db_cursor() as cursor:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.rowcount