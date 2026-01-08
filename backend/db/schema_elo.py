"""
Database schema for Deductly with Elo System extensions
This extends the schema with tables needed for the Elo rating system
"""

# Full schema extension for Elo
SCHEMA_ELO = """
-- ============================================================================
-- NEW: User Elo Ratings Table
-- ============================================================================
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


-- ============================================================================
-- NEW: Question Elo Ratings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_elo_ratings (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) UNIQUE NOT NULL,
    rating_delta FLOAT DEFAULT 0.0,
    num_updates INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ============================================================================
-- UPDATES: Existing Tables
-- ============================================================================
-- Note: These are handled via ALTER TABLE in the migration script
-- questions: add difficulty_elo_base
-- question_skills: add skill_type, weight
"""


def get_migration_script():
    """
    Generate SQL migration script to add Elo tables and columns to existing database.

    Returns:
        str: SQL migration script
    """
    return """
-- ============================================================================
-- MIGRATION SCRIPT: Add Elo System Support
-- ============================================================================

-- Create user_elo_ratings table
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

-- Create question_elo_ratings table
CREATE TABLE IF NOT EXISTS question_elo_ratings (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) UNIQUE NOT NULL,
    rating_delta FLOAT DEFAULT 0.0,
    num_updates INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Add new columns to questions
-- Check if column exists first to avoid errors in SQLite (though ADD COLUMN is usually safe if not exists logic is handled by app or ignored)
-- SQLite doesn't support IF NOT EXISTS for ADD COLUMN directly in standard SQL, 
-- but we can just run it and catch error or assume it's needed.
-- We will wrap in a transaction.

ALTER TABLE questions ADD COLUMN difficulty_elo_base FLOAT;

-- Add new columns to question_skills
ALTER TABLE question_skills ADD COLUMN skill_type VARCHAR(20) DEFAULT 'primary';
ALTER TABLE question_skills ADD COLUMN weight FLOAT DEFAULT 1.0;

"""


def apply_migration(conn):
    """
    Apply migration to add Elo tables to existing database.

    Args:
        conn: SQLite database connection
    """
    migration_sql = get_migration_script()
    # Split by statement to handle potential errors gracefully if columns exist, 
    # or just execute script. SQLite executescript is usually fine but stops on error.
    # For ADD COLUMN, if it exists, it throws error.
    # We'll try to execute safely.
    
    try:
        conn.executescript(migration_sql)
        conn.commit()
        print("Migration applied successfully")
    except Exception as e:
        print(f"Error applying migration: {e}")
        print("Attempting to apply statements individually...")
        conn.rollback()
        
        statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
        for stmt in statements:
            try:
                conn.execute(stmt)
                conn.commit()
            except Exception as inner_e:
                if "duplicate column name" in str(inner_e):
                    print(f"Skipping duplicate column: {stmt[:50]}...")
                elif "already exists" in str(inner_e):
                    print(f"Skipping existing table: {stmt[:50]}...")
                else:
                    print(f"Error executing statement: {stmt}")
                    print(f"Reason: {inner_e}")

if __name__ == "__main__":
    import sqlite3
    import sys
    import os

    # Determine database path
    # User specified 'test_study_plan.db'
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'test_study_plan.db')

    if len(sys.argv) > 1 and sys.argv[1] == 'migrate':
        print(f"Migrating database at: {db_path}")
        conn = sqlite3.connect(db_path)
        apply_migration(conn)
        conn.close()
    else:
        print("Usage: python schema_elo.py migrate")
