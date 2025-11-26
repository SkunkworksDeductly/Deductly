"""
Complete database schema for Deductly
This is the single source of truth for all table definitions
"""

# Full schema as one coherent file
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
-- Study Plans Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_plans (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    diagnostic_drill_id VARCHAR(50),
    title VARCHAR(255) DEFAULT 'LSAT Study Plan',
    total_weeks INTEGER NOT NULL,
    start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diagnostic_drill_id) REFERENCES drills(drill_id)
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);


-- ============================================================================
-- Study Plan Tasks Table
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
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (drill_id) REFERENCES drills(drill_id),
    FOREIGN KEY (video_id) REFERENCES videos(id)
);

CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_plan ON study_plan_tasks(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_week ON study_plan_tasks(study_plan_id, week_number);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_status ON study_plan_tasks(status);


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


"""


def create_all_tables(conn):
    """
    Create all tables in the database.
    
    Args:
        conn: SQLite database connection
    """
    conn.executescript(SCHEMA)
    conn.commit()
    print("All tables created successfully")


def drop_all_tables(conn):
    """
    Drop all tables (use with caution!)
    
    Args:
        conn: SQLite database connection
    """
    tables = [
        'videos',
        'study_plan_tasks',
        'study_plans',
        'drill_results',
        'drills',
        'question_skills',
        'questions',
        'skills'
    ]

    for table in tables:
        conn.execute(f"DROP TABLE IF EXISTS {table}")

    conn.commit()
    print("All tables dropped")
