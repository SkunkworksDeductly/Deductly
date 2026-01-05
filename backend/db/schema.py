"""
Complete database schema for Deductly (PostgreSQL)
This is the single source of truth for all table definitions
"""

# Full schema as one coherent file
# Tables are ordered by dependency (parents before children)
SCHEMA = """
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
    b REAL,
    difficulty_elo_base FLOAT
);

CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_questions_sub_domain ON questions(sub_domain);


-- ============================================================================
-- Question-Skills Junction Table
-- ============================================================================
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


-- ============================================================================
-- Videos Table (must come before study_plan_tasks due to FK reference)
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
-- Drills Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS drills (
    id VARCHAR(50) PRIMARY KEY,
    drill_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    question_count INTEGER NOT NULL,
    timing INTEGER,
    difficulty TEXT,
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


-- ============================================================================
-- Study Plans Table
-- ============================================================================
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


-- ============================================================================
-- Study Plan Tasks Table
-- ============================================================================
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
-- User Elo Ratings Table
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
-- Question Elo Ratings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_elo_ratings (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    rating_delta FLOAT DEFAULT 0.0,
    num_updates INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def create_all_tables(conn):
    """
    Create all tables in the database.

    Args:
        conn: psycopg2 database connection
    """
    cursor = conn.cursor()
    # Split by semicolon and execute each statement
    statements = [s.strip() for s in SCHEMA.split(';') if s.strip()]
    for statement in statements:
        if statement:
            cursor.execute(statement)
    conn.commit()
    cursor.close()
    print("All tables created successfully")


def drop_all_tables(conn):
    """
    Drop all tables (use with caution!)

    Args:
        conn: psycopg2 database connection
    """
    # Order matters: children before parents (reverse of creation order)
    tables = [
        'question_elo_ratings',
        'user_elo_ratings',
        'item_difficulties',
        'user_abilities',
        'study_plan_tasks',
        'study_plans',
        'drill_results',
        'drills',
        'videos',
        'question_skills',
        'questions',
        'skills',
    ]

    cursor = conn.cursor()
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
    conn.commit()
    cursor.close()
    print("All tables dropped")
