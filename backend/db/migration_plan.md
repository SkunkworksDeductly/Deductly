# SQLite to PostgreSQL Migration Plan

## Overview

This document outlines the steps to migrate the Deductly backend from SQLite to PostgreSQL permanently. After migration, all SQLite references will be removed from the codebase.

**Prerequisites (already completed by user):**
- PostgreSQL installed
- `psycopg2` package installed
- Database `deductly` created
- User `aniru` created with access to the database

---

## Phase 1: Schema Conversion

### 1.1 SQL Syntax Differences to Address

| SQLite | PostgreSQL | Notes |
|--------|------------|-------|
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Same |
| `VARCHAR(50)` | `VARCHAR(50)` | Same |
| `TEXT` | `TEXT` | Same |
| `INTEGER` | `INTEGER` | Same |
| `REAL` / `FLOAT` | `REAL` / `FLOAT` | Same |
| `DECIMAL(5,2)` | `DECIMAL(5,2)` | Same |
| `DATE` | `DATE` | Same |
| `CREATE INDEX IF NOT EXISTS` | `CREATE INDEX IF NOT EXISTS` | Same |
| `RANDOM()` | `random()` | Case difference in ORDER BY |

### 1.2 Update Schema File

Replace `backend/db/schema.py` with PostgreSQL-compatible schema:

```python
SCHEMA = """
-- Skills Table
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(50) PRIMARY KEY,
    skill_id VARCHAR(20) UNIQUE NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    sub_domain VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain);
CREATE INDEX IF NOT EXISTS idx_skills_sub_domain ON skills(sub_domain);
CREATE INDEX IF NOT EXISTS idx_skills_domain_sub_domain ON skills(domain, sub_domain);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(50) PRIMARY KEY,
    question_text TEXT NOT NULL,
    answer_choices TEXT,
    correct_answer VARCHAR(10),
    difficulty_level VARCHAR(20),
    question_type VARCHAR(100),
    domain VARCHAR(50) NOT NULL,
    sub_domain VARCHAR(50) NOT NULL,
    source_url TEXT,
    passage_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    b REAL,
    difficulty_elo_base FLOAT
);

CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_questions_sub_domain ON questions(sub_domain);

-- Question-Skills Junction Table
CREATE TABLE IF NOT EXISTS question_skills (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    skill_id VARCHAR(50) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    skill_type VARCHAR(20) DEFAULT 'primary',
    weight FLOAT DEFAULT 1.0,
    UNIQUE(question_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_question_skills_question_id ON question_skills(question_id);
CREATE INDEX IF NOT EXISTS idx_question_skills_skill_id ON question_skills(skill_id);

-- Drills Table
CREATE TABLE IF NOT EXISTS drills (
    id VARCHAR(50) PRIMARY KEY,
    drill_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    question_count INTEGER NOT NULL,
    timing INTEGER,
    difficulty VARCHAR(20),
    skills TEXT,
    drill_type VARCHAR(50),
    question_ids TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'generated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    current_question_index INTEGER DEFAULT 0,
    user_answers TEXT,
    user_highlights TEXT
);

CREATE INDEX IF NOT EXISTS idx_drills_user_id ON drills(user_id);
CREATE INDEX IF NOT EXISTS idx_drills_status ON drills(status);
CREATE INDEX IF NOT EXISTS idx_drills_created_at ON drills(created_at);
CREATE INDEX IF NOT EXISTS idx_drills_user_status ON drills(user_id, status);

-- Drill Results Table
CREATE TABLE IF NOT EXISTS drill_results (
    id VARCHAR(50) PRIMARY KEY,
    drill_id VARCHAR(50) NOT NULL REFERENCES drills(drill_id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    skipped_questions INTEGER NOT NULL DEFAULT 0,
    score_percentage DECIMAL(5,2),
    time_taken INTEGER,
    question_results TEXT,
    skill_performance TEXT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drill_results_drill_id ON drill_results(drill_id);
CREATE INDEX IF NOT EXISTS idx_drill_results_user_id ON drill_results(user_id);
CREATE INDEX IF NOT EXISTS idx_drill_results_completed_at ON drill_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_drill_results_user_drill ON drill_results(user_id, drill_id);

-- Videos Table (must come before study_plan_tasks)
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20),
    duration_seconds INTEGER NOT NULL,
    video_url TEXT,
    thumbnail_url TEXT,
    skill_ids TEXT,
    key_topics TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_difficulty ON videos(difficulty);

-- Study Plans Table
CREATE TABLE IF NOT EXISTS study_plans (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    diagnostic_drill_id VARCHAR(50) REFERENCES drills(drill_id),
    title VARCHAR(255) DEFAULT 'LSAT Study Plan',
    total_weeks INTEGER NOT NULL,
    start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);

-- Study Plan Tasks Table
CREATE TABLE IF NOT EXISTS study_plan_tasks (
    id VARCHAR(50) PRIMARY KEY,
    study_plan_id VARCHAR(50) NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    task_order INTEGER NOT NULL,
    task_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    estimated_minutes INTEGER,
    task_config TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    drill_id VARCHAR(50) REFERENCES drills(drill_id),
    video_id VARCHAR(50) REFERENCES videos(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_plan ON study_plan_tasks(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_week ON study_plan_tasks(study_plan_id, week_number);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_status ON study_plan_tasks(status);

-- User Abilities Table
CREATE TABLE IF NOT EXISTS user_abilities (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    theta_scalar FLOAT NOT NULL,
    mastery_vector TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Item Difficulties Table
CREATE TABLE IF NOT EXISTS item_difficulties (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(100) UNIQUE NOT NULL,
    b FLOAT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Elo Ratings Table
CREATE TABLE IF NOT EXISTS user_elo_ratings (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    skill_id VARCHAR(50) NOT NULL,
    rating FLOAT DEFAULT 1500.0,
    num_updates INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_elo_ratings_user ON user_elo_ratings(user_id);

-- Question Elo Ratings Table
CREATE TABLE IF NOT EXISTS question_elo_ratings (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    rating_delta FLOAT DEFAULT 0.0,
    num_updates INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""
```

---

## Phase 2: Connection Module Updates

### 2.1 Replace `backend/db/connection.py`

Replace the entire file with PostgreSQL-only implementation using `psycopg2`:

```python
"""
Database connection management for Deductly
PostgreSQL backend
"""
import os
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor

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
                self._connection = psycopg2.connect(DATABASE_URL)
            else:
                self._connection = psycopg2.connect(**PG_CONFIG)
            self._connection.autocommit = False
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
        psycopg2 connection object
    """
    return _db.get_connection()


@contextmanager
def get_db_cursor():
    """
    Context manager for database operations.
    Uses RealDictCursor for dict-like row access.
    Automatically commits on success, rolls back on error.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
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
```

### 2.2 Update `backend/db/__init__.py`

Remove `DB_PATH` export (no longer needed):

```python
from .connection import (
    get_db_connection,
    get_db_cursor,
    execute_query,
    execute_update,
)

__all__ = [
    'get_db_connection',
    'get_db_cursor',
    'execute_query',
    'execute_update',
]
```

---

## Phase 3: Query Syntax Updates

### 3.1 Parameter Placeholder Replacement

**Critical change:** SQLite uses `?` placeholders, PostgreSQL uses `%s`.

Files requiring updates:
- `backend/insights/logic.py`
- `backend/skill_builder/logic.py`
- `backend/personalization/logic.py`
- `backend/personalization/routes_adaptive.py`
- `backend/skill_builder/curriculum_logic.py`

**Search and replace pattern:**

| SQLite | PostgreSQL |
|--------|------------|
| `?` | `%s` |
| `cursor.execute(query, (value,))` | Same syntax |

### 3.2 Affected Queries by File

#### `backend/insights/logic.py`
```python
# Before (SQLite):
cursor.execute(query, (q,))

# After (PostgreSQL):
cursor.execute(query, (q,))  # Same! psycopg2 accepts tuples
```

But the actual query string placeholders need changing:
```python
# Before:
query = f"SELECT b FROM item_difficulties WHERE question_id = ?"

# After:
query = f"SELECT b FROM item_difficulties WHERE question_id = %s"
```

#### `backend/skill_builder/logic.py`
Key queries to update:
- `_fetch_questions()` - multiple `?` placeholders
- `create_drill_session()` - INSERT with 10 `?` placeholders
- `submit_drill_answers()` - INSERT with 11 `?` placeholders
- All UPDATE and SELECT queries

### 3.3 RANDOM() Function

```python
# SQLite:
ORDER BY RANDOM()

# PostgreSQL:
ORDER BY random()
```

Update in `backend/skill_builder/logic.py`:
```python
def _build_question_query(where_filters, exclude_ids=None):
    # Change RANDOM() to random()
    return f"""
        SELECT {fields}
        FROM questions
        WHERE {where_clause}
        ORDER BY random()
        LIMIT %s
    """
```

### 3.4 ON CONFLICT Syntax

SQLite and PostgreSQL both support `ON CONFLICT ... DO UPDATE`, but verify syntax compatibility:

```sql
-- Works in both (from insights/logic.py):
INSERT INTO user_elo_ratings (id, user_id, skill_id, rating, num_updates, last_updated)
VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
ON CONFLICT(user_id, skill_id) DO UPDATE SET
    rating = excluded.rating,
    num_updates = excluded.num_updates,
    last_updated = CURRENT_TIMESTAMP
```

---

## Phase 4: Data Migration

### 4.1 One-Time Migration Script

Create `backend/db/migrate_data.py` (run once, then delete):

```python
#!/usr/bin/env python3
"""
One-time migration: SQLite -> PostgreSQL
Run this script once to transfer all data, then delete it.
"""
import sqlite3
import psycopg2
import os

# SQLite source (your current database)
SQLITE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'test_study_plan.db')

# PostgreSQL target
PG_CONFIG = {
    'dbname': 'deductly',
    'user': 'aniru',
    'password': '',  # Add password if required
    'host': 'localhost',
    'port': '5432',
}

# Tables in dependency order (parents before children)
TABLES = [
    'skills',
    'questions',
    'question_skills',
    'videos',
    'drills',
    'drill_results',
    'study_plans',
    'study_plan_tasks',
    'user_abilities',
    'item_difficulties',
    'user_elo_ratings',
    'question_elo_ratings',
]


def migrate():
    print("=" * 50)
    print("SQLite to PostgreSQL Migration")
    print("=" * 50)

    # Verify SQLite file exists
    if not os.path.exists(SQLITE_PATH):
        print(f"ERROR: SQLite database not found at {SQLITE_PATH}")
        return

    # Connect to both databases
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    pg_conn = psycopg2.connect(**PG_CONFIG)
    pg_cur = pg_conn.cursor()

    total_migrated = 0

    try:
        for table in TABLES:
            print(f"\nMigrating {table}...")

            # Check if table exists in SQLite
            sqlite_cur.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (table,)
            )
            if not sqlite_cur.fetchone():
                print(f"  Table does not exist in SQLite, skipping")
                continue

            # Get all rows from SQLite
            sqlite_cur.execute(f"SELECT * FROM {table}")
            rows = sqlite_cur.fetchall()

            if not rows:
                print(f"  No data in {table}")
                continue

            # Get column names
            columns = [desc[0] for desc in sqlite_cur.description]

            # Build INSERT query for PostgreSQL
            placeholders = ', '.join(['%s'] * len(columns))
            col_names = ', '.join(columns)
            insert_query = f"""
                INSERT INTO {table} ({col_names})
                VALUES ({placeholders})
                ON CONFLICT DO NOTHING
            """

            # Insert each row
            count = 0
            errors = 0
            for row in rows:
                try:
                    pg_cur.execute(insert_query, tuple(row))
                    count += 1
                except Exception as e:
                    errors += 1
                    if errors <= 3:  # Only show first 3 errors
                        print(f"  Error: {e}")
                    pg_conn.rollback()

            pg_conn.commit()
            total_migrated += count
            print(f"  Migrated {count} rows" + (f" ({errors} errors)" if errors else ""))

        print("\n" + "=" * 50)
        print(f"Migration complete! Total rows migrated: {total_migrated}")
        print("=" * 50)
        print("\nNext steps:")
        print("1. Verify data: psql -U aniru -d deductly -c 'SELECT COUNT(*) FROM skills;'")
        print("2. Delete this script and SQLite files")
        print("3. Update connection.py to PostgreSQL-only")

    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == '__main__':
    migrate()
```

### 4.2 Run Migration

```bash
cd backend
source venv/bin/activate

# First, create tables in PostgreSQL
psql -U aniru -d deductly -c "$(python -c 'from db.schema import SCHEMA; print(SCHEMA)')"

# Then run migration
python db/migrate_data.py

# Verify row counts match
psql -U aniru -d deductly -c "SELECT 'skills' as t, COUNT(*) FROM skills UNION ALL SELECT 'questions', COUNT(*) FROM questions;"
```

---

## Phase 5: Environment Configuration

### 5.1 Update `.env` File

Add PostgreSQL configuration:

```env
# PostgreSQL Database Configuration
PG_DATABASE=deductly
PG_USER=aniru
PG_PASSWORD=
PG_HOST=localhost
PG_PORT=5432

# Or use a connection string (takes precedence, used by Render):
# DATABASE_URL=postgresql://aniru@localhost:5432/deductly
```

### 5.2 Update `requirements.txt`

Ensure `psycopg2-binary` is included:

```
psycopg2-binary>=2.9.0
```

### 5.3 Remove Old SQLite References

Delete or archive these files:
- `backend/data/test_study_plan.db` (after successful migration)
- `backend/data/deductly.db` (if exists)
- Any other `.db` files in `backend/data/`

---

## Phase 6: Testing

### 6.1 Create Test Script

Create `backend/db/test_connection.py`:

```python
#!/usr/bin/env python3
"""Test PostgreSQL connection and basic operations"""
from connection import get_db_connection, get_db_cursor

def test_connection():
    print("Testing PostgreSQL connection...")
    conn = get_db_connection()
    print(f"  Connected: {conn}")

    with get_db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as count FROM skills")
        result = cursor.fetchone()
        print(f"  Skills count: {result['count']}")

        cursor.execute("SELECT COUNT(*) as count FROM questions")
        result = cursor.fetchone()
        print(f"  Questions count: {result['count']}")

    print("Connection test passed!")

if __name__ == '__main__':
    test_connection()
```

### 6.2 Run Tests

```bash
cd backend
python db/test_connection.py
python -c "from app import app; print('App loaded successfully')"
```

### 6.3 API Endpoint Testing

```bash
# Start backend
python app.py

# Test endpoints
curl http://localhost:5001/
curl http://localhost:5001/api/skill-builder/skills
```

---

## Phase 7: Deployment Considerations

### 7.1 Render Configuration

Update Render environment variables:
- `DATABASE_URL` - Use Render's PostgreSQL connection string
- Remove any old SQLite-related variables

### 7.2 Database Backup Strategy

```bash
# Backup PostgreSQL
pg_dump -U aniru deductly > backup.sql

# Restore
psql -U aniru deductly < backup.sql
```

---

## Phase 8: Cleanup

### 8.1 Remove SQLite References from Codebase

After successful migration and testing, remove all SQLite imports and references:

**Files to update:**
- Remove `import sqlite3` from any files that still have it
- Remove `setup_database.py` or update it to use PostgreSQL
- Update `insert_lsat_questions.py` to use PostgreSQL

### 8.2 Update CLAUDE.md

Update the project documentation to reflect PostgreSQL:
- Change "SQLite database at `backend/data/deductly.db`" to PostgreSQL references
- Update database setup instructions

### 8.3 Delete SQLite Files

```bash
# After confirming migration success
rm backend/data/*.db
```

---

## Implementation Checklist

- [ ] **Phase 1: Schema**
  - [ ] Update `schema.py` with PostgreSQL-compatible schema
  - [ ] Verify table creation order (foreign key dependencies)
  - [ ] Run schema on PostgreSQL: `psql -U aniru -d deductly -f schema.sql`

- [ ] **Phase 2: Connection**
  - [ ] Replace `connection.py` with PostgreSQL-only version
  - [ ] Update `__init__.py` to remove `DB_PATH` export
  - [ ] Test connection

- [ ] **Phase 3: Query Updates**
  - [ ] Replace `?` with `%s` in `insights/logic.py`
  - [ ] Replace `?` with `%s` in `skill_builder/logic.py`
  - [ ] Replace `?` with `%s` in `personalization/logic.py`
  - [ ] Replace `?` with `%s` in `personalization/routes_adaptive.py`
  - [ ] Update `RANDOM()` to `random()`
  - [ ] Remove any `import sqlite3` statements

- [ ] **Phase 4: Data Migration**
  - [ ] Create migration script
  - [ ] Run migration from SQLite to PostgreSQL
  - [ ] Verify data integrity (row counts match)

- [ ] **Phase 5: Environment**
  - [ ] Update `.env` with PostgreSQL config
  - [ ] Verify `psycopg2-binary` in `requirements.txt`

- [ ] **Phase 6: Testing**
  - [ ] Test database connection
  - [ ] Test all API endpoints
  - [ ] Run full application workflow

- [ ] **Phase 7: Deployment**
  - [ ] Update Render environment variables
  - [ ] Deploy and verify production connectivity
  - [ ] Monitor for errors

- [ ] **Phase 8: Cleanup**
  - [ ] Remove SQLite imports from all files
  - [ ] Delete SQLite database files
  - [ ] Update CLAUDE.md documentation

---

## Files to Modify Summary

| File | Changes |
|------|---------|
| `backend/db/connection.py` | Replace with PostgreSQL-only version |
| `backend/db/__init__.py` | Remove `DB_PATH` export |
| `backend/db/schema.py` | Update to PostgreSQL syntax |
| `backend/db/migrate_data.py` | NEW - One-time migration script |
| `backend/db/test_connection.py` | NEW - Connection test script |
| `backend/insights/logic.py` | Replace `?` with `%s`, remove `import sqlite3` |
| `backend/skill_builder/logic.py` | Replace `?` with `%s`, `RANDOM()` -> `random()`, remove `import sqlite3` |
| `backend/personalization/logic.py` | Replace `?` with `%s`, remove `import sqlite3` |
| `backend/personalization/routes_adaptive.py` | Replace `?` with `%s` if applicable |
| `setup_database.py` | Update to use PostgreSQL |
| `insert_lsat_questions.py` | Update to use PostgreSQL |
| `.env` | Add PostgreSQL config |
| `CLAUDE.md` | Update database documentation |

---

## Quick Reference: SQLite to PostgreSQL Syntax

| Item | SQLite | PostgreSQL |
|------|--------|------------|
| Placeholder | `?` | `%s` |
| Random | `RANDOM()` | `random()` |
| Boolean | `0`/`1` | `FALSE`/`TRUE` (or `0`/`1`) |
| Autoincrement | `INTEGER PRIMARY KEY` | `SERIAL PRIMARY KEY` |
| String concat | `\|\|` | `\|\|` (same) |
| Current time | `CURRENT_TIMESTAMP` | `CURRENT_TIMESTAMP` (same) |
