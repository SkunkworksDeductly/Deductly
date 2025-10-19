-- Migration: Fix foreign key references in question_skills and drill_results tables
-- Date: 2025-10-18
-- Purpose: Repair incomplete migration that left FK references pointing to non-existent tables

-- Disable foreign key constraints during migration
PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

-- ===== Fix question_skills table =====

-- Create new table with correct foreign keys
CREATE TABLE question_skills_temp (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) NOT NULL,
    skill_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(question_id, skill_id)
);

-- Copy data from old table
INSERT INTO question_skills_temp (id, question_id, skill_id)
SELECT id, question_id, skill_id FROM question_skills;

-- Drop old table
DROP TABLE question_skills;

-- Rename temp table to original name
ALTER TABLE question_skills_temp RENAME TO question_skills;

-- Recreate indexes
CREATE INDEX idx_question_skills_question_id ON question_skills(question_id);
CREATE INDEX idx_question_skills_skill_id ON question_skills(skill_id);


-- ===== Fix drill_results table =====

-- Create new table with correct foreign keys
CREATE TABLE drill_results_temp (
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

-- Copy data from old table
INSERT INTO drill_results_temp
SELECT id, drill_id, user_id, total_questions, correct_answers,
       incorrect_answers, skipped_questions, score_percentage,
       time_taken, question_results, skill_performance, completed_at
FROM drill_results;

-- Drop old table
DROP TABLE drill_results;

-- Rename temp table to original name
ALTER TABLE drill_results_temp RENAME TO drill_results;

-- Recreate indexes
CREATE INDEX idx_drill_results_drill_id ON drill_results(drill_id);
CREATE INDEX idx_drill_results_user_id ON drill_results(user_id);
CREATE INDEX idx_drill_results_completed_at ON drill_results(completed_at);
CREATE INDEX idx_drill_results_user_drill ON drill_results(user_id, drill_id);

COMMIT;

-- Re-enable foreign key constraints
PRAGMA foreign_keys=ON;
