"""
Database connection management for Deductly
PostgreSQL backend (psycopg3)
"""
import os
from contextlib import contextmanager
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')


# PostgreSQL configuration
DATABASE_URL = os.getenv('DATABASE_URL')  # Full connection string (for Render, etc.)

PG_CONFIG = {
    'dbname': os.getenv('PG_DATABASE', 'deductly'),
    'user': os.getenv('PG_USER', 'aniru'),
    'password': os.getenv('PG_PASSWORD', ''),
    'host': os.getenv('PG_HOST', 'localhost'),
    'port': os.getenv('PG_PORT', '5432'),
}


class DatabaseConnection:
    """Singleton PostgreSQL connection manager"""
    _instance = None
    _connection = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_connection(self):
        """Get or create database connection"""
        if self._connection is None or self._connection.closed:
            if DATABASE_URL:
                self._connection = psycopg.connect(
                    DATABASE_URL,
                    autocommit=False,
                    row_factory=dict_row
                )
            else:
                self._connection = psycopg.connect(
                    **PG_CONFIG,
                    autocommit=False,
                    row_factory=dict_row
                )
        return self._connection

    def close(self):
        """Close database connection"""
        if self._connection and not self._connection.closed:
            self._connection.close()
            self._connection = None


# Global instance
_db = DatabaseConnection()


def get_db_connection():
    """
    Get database connection.

    Returns:
        psycopg connection object
    """
    return _db.get_connection()


@contextmanager
def get_db_cursor():
    """
    Context manager for database operations.
    Uses dict_row for dict-like row access.
    Automatically commits on success, rolls back on error.
    """
    conn = get_db_connection()
    cursor = conn.cursor(row_factory=dict_row)
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
        query: SQL query string (use %s for placeholders)
        params: Query parameters (optional)

    Returns:
        List of dict-like row objects
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
        query: SQL query string (use %s for placeholders)
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
