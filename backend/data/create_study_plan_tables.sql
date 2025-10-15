-- Study Plans tables for task-based weekly scheduling

-- Main study plan table (one per user)
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

-- Individual tasks within study plan
CREATE TABLE IF NOT EXISTS study_plan_tasks (
    id VARCHAR(50) PRIMARY KEY,
    study_plan_id VARCHAR(50) NOT NULL,

    -- Organization
    week_number INTEGER NOT NULL,
    task_order INTEGER NOT NULL,

    -- Task metadata
    task_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    estimated_minutes INTEGER,

    -- Task-specific configuration (JSON)
    task_config TEXT NOT NULL,

    -- Completion tracking
    status VARCHAR(20) DEFAULT 'pending',
    drill_id VARCHAR(50),
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (drill_id) REFERENCES drills(drill_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_plan ON study_plan_tasks(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_week ON study_plan_tasks(study_plan_id, week_number);
CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_status ON study_plan_tasks(status);
