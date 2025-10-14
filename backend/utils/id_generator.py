"""
ID Generator Utility
Generates prefixed string IDs for database tables
"""
import sqlite3
import threading
from typing import Optional

# Thread lock for thread-safe ID generation
_id_lock = threading.Lock()

# Table prefix mapping
TABLE_PREFIXES = {
    'skills': 'sk',
    'questions': 'q',
    'question_skills': 'qs',
    'drills': 'dr',
    'drill_results': 'dres',
    'study_plans': 'sp',
    'study_plan_tasks': 'spt'
}


def generate_id(prefix: str, conn: Optional[sqlite3.Connection] = None) -> str:
    """
    Generate a new prefixed ID for a table.

    Args:
        prefix: Table prefix (e.g., 'sk', 'q', 'dr')
        conn: Optional database connection. If not provided, will not check for existing IDs.

    Returns:
        Prefixed string ID (e.g., 'sk-1', 'q-42', 'dr-123')
    """
    with _id_lock:
        if conn is None:
            # If no connection provided, generate a UUID-based ID
            import uuid
            return f"{prefix}-{uuid.uuid4().hex[:8]}"

        # Get the table name from prefix
        table_name = _get_table_from_prefix(prefix)

        if not table_name:
            raise ValueError(f"Unknown prefix: {prefix}")

        # Get the highest existing ID number for this prefix
        cursor = conn.cursor()

        # Query to find max ID number
        # IDs are in format "prefix-number", so we extract the number part
        cursor.execute(f"""
            SELECT id FROM {table_name}
            WHERE id LIKE ?
            ORDER BY CAST(SUBSTR(id, ?) AS INTEGER) DESC
            LIMIT 1
        """, (f"{prefix}-%", len(prefix) + 2))

        result = cursor.fetchone()

        if result:
            # Extract number from existing ID (e.g., "sk-42" -> 42)
            last_id = result[0]
            last_num = int(last_id.split('-')[-1])
            next_num = last_num + 1
        else:
            # No existing IDs, start at 1
            next_num = 1

        return f"{prefix}-{next_num}"


def generate_sequential_id(prefix: str, start_number: int) -> str:
    """
    Generate a prefixed ID with a specific number (for migrations).

    Args:
        prefix: Table prefix (e.g., 'sk', 'q', 'dr')
        start_number: The number to use in the ID

    Returns:
        Prefixed string ID (e.g., 'sk-1', 'q-42')
    """
    return f"{prefix}-{start_number}"


def _get_table_from_prefix(prefix: str) -> Optional[str]:
    """Get table name from prefix."""
    for table, table_prefix in TABLE_PREFIXES.items():
        if table_prefix == prefix:
            return table
    return None


def get_prefix_for_table(table_name: str) -> Optional[str]:
    """Get prefix for a table name."""
    return TABLE_PREFIXES.get(table_name)
