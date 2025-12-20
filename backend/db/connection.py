"""
Database connection management for Deductly
Provides centralized database access with proper error handling
Supports both SQLite (local dev) and PostgreSQL (production)
"""
import os
from typing import Optional
from contextlib import contextmanager

# Determine database type from environment
DB_TYPE = os.getenv('DB_TYPE', 'sqlite').lower()  # 'sqlite' or 'postgres'

# SQLite configuration
if DB_TYPE == 'sqlite':
    import sqlite3
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'data', 'deductly.db')
    DB_PATH = os.getenv('DB_PATH') or os.getenv('DEDUCTLY_DB_PATH', DEFAULT_DB_PATH)

# PostgreSQL configuration
else:
    import psycopg2
    import psycopg2.extras
    DB_HOST = os.getenv('DB_HOST')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'deductly')
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_PATH = None  # Not used in PostgreSQL mode


class DatabaseConnection:
    """Singleton database connection manager - supports SQLite and PostgreSQL"""

    _instance = None
    _connection = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_connection(self):
        """Get or create database connection"""
        # Check if connection exists and is still valid
        if self._connection is not None:
            if DB_TYPE == 'postgres':
                # For PostgreSQL, check if connection is closed
                if self._connection.closed:
                    print("[DB] Connection closed, reconnecting...")
                    self._connection = None
            # SQLite connections don't have a .closed attribute, assume they're valid

        if self._connection is None:
            if DB_TYPE == 'sqlite':
                self._connection = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=30.0)
                self._connection.row_factory = sqlite3.Row
                # Enable foreign keys
                self._connection.execute("PRAGMA foreign_keys = ON")
                # Enable WAL mode for better concurrency
                self._connection.execute("PRAGMA journal_mode=WAL")
                # Set busy timeout to 30 seconds
                self._connection.execute("PRAGMA busy_timeout=30000")
            else:  # PostgreSQL
                self._connection = psycopg2.connect(
                    host=DB_HOST,
                    port=DB_PORT,
                    database=DB_NAME,
                    user=DB_USER,
                    password=DB_PASSWORD,
                    cursor_factory=psycopg2.extras.RealDictCursor
                )
                # Set connection to autocommit for better Lambda performance
                self._connection.autocommit = False
                print("[DB] New PostgreSQL connection established")
        return self._connection

    def close(self):
        """Close database connection"""
        if self._connection:
            self._connection.close()
            self._connection = None


# Global instance
_db = DatabaseConnection()


def get_db_connection():
    """
    Get database connection (SQLite or PostgreSQL based on DB_TYPE env var).

    Returns:
        Database connection with Row factory (sqlite3.Connection or psycopg2.connection)

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