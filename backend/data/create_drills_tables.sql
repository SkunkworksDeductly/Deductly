-- Table for storing drill configurations and metadata
CREATE TABLE IF NOT EXISTS drills (
    id VARCHAR(50) PRIMARY KEY,
    drill_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL,

    -- Drill configuration parameters
    question_count INTEGER NOT NULL,
    timing INTEGER,
    difficulty VARCHAR(20),
    skills TEXT,

    -- Drill metadata
    drill_type VARCHAR(50),
    question_ids TEXT NOT NULL,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'generated',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Progress tracking
    current_question_index INTEGER DEFAULT 0,
    user_answers TEXT,

    -- User highlights (JSON: {question_id: [[start, end], ...]})
    user_highlights TEXT
);

-- Table for storing drill performance results
CREATE TABLE IF NOT EXISTS drill_results (
    id VARCHAR(50) PRIMARY KEY,
    drill_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,

    -- Performance metrics
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    skipped_questions INTEGER NOT NULL DEFAULT 0,

    -- Calculated scores
    score_percentage DECIMAL(5,2),
    time_taken INTEGER,

    -- Detailed results (JSON)
    question_results TEXT,
    skill_performance TEXT,

    -- Timestamps
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (drill_id) REFERENCES drills(drill_id) ON DELETE CASCADE
);

-- Indexes for optimizing common queries
CREATE INDEX IF NOT EXISTS idx_drills_user_id ON drills(user_id);
CREATE INDEX IF NOT EXISTS idx_drills_status ON drills(status);
CREATE INDEX IF NOT EXISTS idx_drills_created_at ON drills(created_at);
CREATE INDEX IF NOT EXISTS idx_drills_user_status ON drills(user_id, status);

CREATE INDEX IF NOT EXISTS idx_drill_results_drill_id ON drill_results(drill_id);
CREATE INDEX IF NOT EXISTS idx_drill_results_user_id ON drill_results(user_id);
CREATE INDEX IF NOT EXISTS idx_drill_results_completed_at ON drill_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_drill_results_user_drill ON drill_results(user_id, drill_id);
