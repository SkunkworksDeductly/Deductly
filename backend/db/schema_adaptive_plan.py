"""
Database schema for Deductly with Adaptive Study Plan extensions
This extends the base schema with tables needed for contextual bandit and hierarchical planning
"""

# Full schema including base tables + adaptive plan extensions
SCHEMA_ADAPTIVE = """
-- ============================================================================
-- Skills Table
-- ============================================================================
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


-- ============================================================================
-- Questions Table
-- ============================================================================
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
    b REAL
);

CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_questions_sub_domain ON questions(sub_domain);


-- ============================================================================
-- Question-Skills Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_skills (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) NOT NULL,
    skill_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(question_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_question_skills_question_id ON question_skills(question_id);
CREATE INDEX IF NOT EXISTS idx_question_skills_skill_id ON question_skills(skill_id);


-- ============================================================================
-- Drills Table
-- ============================================================================
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


-- ============================================================================
-- Drill Results Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS drill_results (
    id VARCHAR(50) PRIMARY KEY,
    drill_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    skipped_questions INTEGER NOT NULL DEFAULT 0,
    score_percentage DECIMAL(5,2),
    time_taken INTEGER,
    question_results TEXT,
    skill_performance TEXT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drill_id) REFERENCES drills(drill_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_drill_results_drill_id ON drill_results(drill_id);
CREATE INDEX IF NOT EXISTS idx_drill_results_user_id ON drill_results(user_id);
CREATE INDEX IF NOT EXISTS idx_drill_results_completed_at ON drill_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_drill_results_user_drill ON drill_results(user_id, drill_id);


-- ============================================================================
-- Study Plans Table (EXTENDED for Adaptive Planning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_plans (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    diagnostic_drill_id VARCHAR(50),
    title VARCHAR(255) DEFAULT 'LSAT Study Plan',
    total_weeks INTEGER NOT NULL,
    start_date DATE NOT NULL,
    phase_allocation TEXT,
    current_phase VARCHAR(20) DEFAULT 'foundation',
    adaptation_enabled BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diagnostic_drill_id) REFERENCES drills(drill_id)
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);


-- ============================================================================
-- Study Plan Tasks Table (EXTENDED for Adaptive Planning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_plan_tasks (
    id VARCHAR(50) PRIMARY KEY,
    study_plan_id VARCHAR(50) NOT NULL,
    week_number INTEGER NOT NULL,
    task_order INTEGER NOT NULL,
    task_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    estimated_minutes INTEGER,
    task_config TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    drill_id VARCHAR(50),
    video_id VARCHAR(50),
    module_id VARCHAR(50),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (drill_id) REFERENCES drills(drill_id),
    FOREIGN KEY (video_id) REFERENCES videos(id),
    FOREIGN KEY (module_id) REFERENCES modules(module_id)
);

CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_plan ON study_plan_tasks(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_week ON study_plan_tasks(study_plan_id, week_number);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_status ON study_plan_tasks(status);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_module ON study_plan_tasks(module_id);


-- ============================================================================
-- Videos Table
-- ============================================================================
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

-- ============================================================================
-- User Abilities Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_abilities (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    theta_scalar FLOAT NOT NULL,
    mastery_vector TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Item Difficulties Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_difficulties (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(100) UNIQUE NOT NULL,
    b FLOAT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- NEW: Modules Table (for Adaptive Planning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
    module_id VARCHAR(50) PRIMARY KEY,
    module_name VARCHAR(200) NOT NULL,
    module_type VARCHAR(50) NOT NULL,
    target_skills TEXT NOT NULL,
    secondary_skills TEXT,
    difficulty_level VARCHAR(20) NOT NULL,
    phase_suitability TEXT NOT NULL,
    prerequisites TEXT,
    estimated_minutes INTEGER NOT NULL,
    tasks TEXT NOT NULL,
    learning_objectives TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modules_type ON modules(module_type);
CREATE INDEX IF NOT EXISTS idx_modules_difficulty ON modules(difficulty_level);


-- ============================================================================
-- NEW: Bandit Models Table (for Contextual Bandit State)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bandit_models (
    user_id VARCHAR(255) PRIMARY KEY,
    mu_vector TEXT NOT NULL,
    sigma_matrix TEXT NOT NULL,
    dimension INTEGER NOT NULL,
    noise_variance FLOAT DEFAULT 0.1,
    num_updates INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bandit_models_updated ON bandit_models(last_updated);


-- ============================================================================
-- NEW: Mastery Vector History (for Temporal Reward Calculation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mastery_vector_history (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mastery_vector TEXT NOT NULL,
    theta_scalar FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trigger_event VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_mastery_history_user_time ON mastery_vector_history(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_mastery_history_user ON mastery_vector_history(user_id);


-- ============================================================================
-- NEW: Module Completions (for Reward Attribution)
-- ============================================================================
CREATE TABLE IF NOT EXISTS module_completions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(50) NOT NULL,
    study_plan_id VARCHAR(255),
    week_number INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completion_rate FLOAT,
    reward FLOAT,
    mastery_before TEXT,
    mastery_after TEXT,
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_module_completions_user ON module_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module ON module_completions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_plan ON module_completions(study_plan_id);


"""


def create_all_tables(conn):
    """
    Create all tables including adaptive planning extensions.

    Args:
        conn: SQLite database connection
    """
    conn.executescript(SCHEMA_ADAPTIVE)
    conn.commit()
    print("All tables created successfully (including adaptive planning extensions)")


def get_migration_script():
    """
    Generate SQL migration script to add adaptive planning tables to existing database.
    This assumes the base tables already exist.

    Returns:
        str: SQL migration script
    """
    return """
-- ============================================================================
-- MIGRATION SCRIPT: Add Adaptive Planning Support
-- ============================================================================

-- Add new columns to study_plans
ALTER TABLE study_plans ADD COLUMN phase_allocation TEXT;
ALTER TABLE study_plans ADD COLUMN current_phase VARCHAR(20) DEFAULT 'foundation';
ALTER TABLE study_plans ADD COLUMN adaptation_enabled BOOLEAN DEFAULT 1;

-- Add new column to study_plan_tasks
ALTER TABLE study_plan_tasks ADD COLUMN module_id VARCHAR(50);

-- Create new modules table
CREATE TABLE IF NOT EXISTS modules (
    module_id VARCHAR(50) PRIMARY KEY,
    module_name VARCHAR(200) NOT NULL,
    module_type VARCHAR(50) NOT NULL,
    target_skills TEXT NOT NULL,
    secondary_skills TEXT,
    difficulty_level VARCHAR(20) NOT NULL,
    phase_suitability TEXT NOT NULL,
    prerequisites TEXT,
    estimated_minutes INTEGER NOT NULL,
    tasks TEXT NOT NULL,
    learning_objectives TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modules_type ON modules(module_type);
CREATE INDEX IF NOT EXISTS idx_modules_difficulty ON modules(difficulty_level);

-- Create bandit_models table
CREATE TABLE IF NOT EXISTS bandit_models (
    user_id VARCHAR(255) PRIMARY KEY,
    mu_vector TEXT NOT NULL,
    sigma_matrix TEXT NOT NULL,
    dimension INTEGER NOT NULL,
    noise_variance FLOAT DEFAULT 0.1,
    num_updates INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bandit_models_updated ON bandit_models(last_updated);

-- Create mastery_vector_history table
CREATE TABLE IF NOT EXISTS mastery_vector_history (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mastery_vector TEXT NOT NULL,
    theta_scalar FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trigger_event VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_mastery_history_user_time ON mastery_vector_history(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_mastery_history_user ON mastery_vector_history(user_id);

-- Create module_completions table
CREATE TABLE IF NOT EXISTS module_completions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(50) NOT NULL,
    study_plan_id VARCHAR(255),
    week_number INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completion_rate FLOAT,
    reward FLOAT,
    mastery_before TEXT,
    mastery_after TEXT,
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_module_completions_user ON module_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module ON module_completions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_plan ON module_completions(study_plan_id);

-- Add foreign key constraint for module_id in study_plan_tasks
-- Note: SQLite doesn't support ADD CONSTRAINT, so this is informational only
-- The constraint is enforced in the application layer
"""


def apply_migration(conn):
    """
    Apply migration to add adaptive planning tables to existing database.

    Args:
        conn: SQLite database connection
    """
    migration_sql = get_migration_script()
    conn.executescript(migration_sql)
    conn.commit()
    print("Migration applied successfully")


if __name__ == "__main__":
    import sqlite3
    import sys
    import os

    # Determine database path
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'test_study_plan.db')

    if len(sys.argv) > 1:
        if sys.argv[1] == 'create':
            # Create fresh database with all tables
            conn = sqlite3.connect(db_path)
            create_all_tables(conn)
            conn.close()
            print(f"Database created at: {db_path}")
        elif sys.argv[1] == 'migrate':
            # Apply migration to existing database
            conn = sqlite3.connect(db_path)
            apply_migration(conn)
            conn.close()
            print(f"Migration applied to: {db_path}")
        else:
            print("Usage: python schema_adaptive_plan.py [create|migrate]")
            print("  create  - Create fresh database with all tables")
            print("  migrate - Add adaptive planning tables to existing database")
    else:
        print("Usage: python schema_adaptive_plan.py [create|migrate]")
        print("  create  - Create fresh database with all tables")
        print("  migrate - Add adaptive planning tables to existing database")
