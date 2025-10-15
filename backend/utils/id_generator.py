"""
ID Generator Utility
Generates prefixed string IDs for database tables

Two modes:
- Sequential: For seeded/imported data (e.g., sk-1, q-42)
- Random alphanumeric: For runtime-generated data (e.g., dr-a3f2b9, sp-k4m2p1)
"""
import secrets
import string
from typing import Optional

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

# Alphanumeric characters for random ID generation
ALPHANUMERIC = string.ascii_lowercase + string.digits


def generate_id(prefix: str, length: int = 6) -> str:
    """
    Generate a random alphanumeric ID with the given prefix.
    Used for dynamically generated entities (drills, results, plans, tasks).

    Args:
        prefix: Table prefix (e.g., 'dr', 'dres', 'sp', 'spt')
        length: Length of the alphanumeric part (default: 6)

    Returns:
        Prefixed random ID (e.g., 'dr-a3f2b9', 'sp-k4m2p1')
    """
    random_part = ''.join(secrets.choice(ALPHANUMERIC) for _ in range(length))
    return f"{prefix}-{random_part}"


def generate_sequential_id(prefix: str, number: int) -> str:
    """
    Generate a sequential prefixed ID.
    Used for seeded/imported data (questions, skills, etc.).

    Args:
        prefix: Table prefix (e.g., 'sk', 'q')
        number: The sequence number

    Returns:
        Sequential prefixed ID (e.g., 'sk-1', 'q-42')
    """
    return f"{prefix}-{number}"


def get_prefix_for_table(table_name: str) -> Optional[str]:
    """Get prefix for a table name."""
    return TABLE_PREFIXES.get(table_name)
