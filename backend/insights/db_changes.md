# Proposed Database Changes for Elo System

To support the new Elo rating system, we need to store user ratings per skill, question difficulty adjustments, and enhanced skill metadata for questions.

## 1. New Table: `user_elo_ratings`

Stores the Elo rating for each user-skill pair.

```sql
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
```

## 2. New Table: `question_elo_ratings`

Stores the dynamic difficulty adjustment (delta) for each question.

```sql
CREATE TABLE IF NOT EXISTS question_elo_ratings (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) UNIQUE NOT NULL,
    rating_delta FLOAT DEFAULT 0.0,
    num_updates INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
```

## 3. Update: `question_skills` Table

We need to store whether a skill is primary or secondary, and its weight.

```sql
-- Add columns to existing table
ALTER TABLE question_skills ADD COLUMN skill_type VARCHAR(20) DEFAULT 'primary'; -- 'primary' or 'secondary'
ALTER TABLE question_skills ADD COLUMN weight FLOAT DEFAULT 1.0;
```

**Heuristic for Weights:**
- Total weight of **Primary** skills = 0.70
- Total weight of **Secondary** skills = 0.30
- Individual weight = (Total Category Weight) / (Count of Skills in Category)

## 4. Update: `questions` Table

Add a base Elo difficulty column.

```sql
ALTER TABLE questions ADD COLUMN difficulty_elo_base FLOAT;
```

**Migration Logic:**
- If `difficulty_elo_base` is NULL, we can calculate it from the existing IRT `b` parameter using a helper function.
