Deductly – Per-Skill Elo & Question Difficulty Context
0. Project Snapshot

Product: Deductly – adaptive LSAT-style prep platform (starting with our own questions, not LSAC’s).

Stack preference:

Backend: Flask (Python)

DB: currently unspecified in this file (assume SQL, usually SQLite or Postgres; ORM via SQLAlchemy is fine)

Core modeling stack:

Batch psychometrics: Rasch/GLMM (IRT) used for global ability and question difficulty.

Online adaptation: per-skill Elo ratings + (optionally) question Elo.

This file defines how to implement per-skill Elo inside the backend and how it interacts with question difficulty (Rasch vs Elo).

1. Goals of This Module

For every user and every skill, maintain a per-skill ability estimate that updates online after each question.

For every question, maintain a difficulty estimate:

Seeded from a 4-level heuristic difficulty (our content pipeline labels questions as Level 1–4).

Evolved over time via IRT (Rasch) as the “source of truth”.

Optionally adjusted online with a small Elo delta.

Keep the internal math clean (unbounded ratings), and expose user-friendly scores on a 120–180 (or similar) scale at the API layer.

2. Question Difficulty Design
2.1 Initial difficulty (content pipeline)

Each question is tagged with a discrete difficulty level (1–4) at creation time, based on our own heuristics / validation:

Level 1 – easiest

Level 2 – easy/medium

Level 3 – medium/hard

Level 4 – hardest

We map this to an initial Rasch difficulty b_j:

Example mapping:

Level 1 → b = -1.5

Level 2 → b = -0.5

Level 3 → b = +0.5

Level 4 → b = +1.5

These are priors, not permanent labels. As real users answer questions, we re-estimate b_j with Rasch.

2.2 Batch Rasch fit for difficulty

We periodically run a batch job (outside the request path) that:

Reads the attempts table (user_id, question_id, correctness).

Fits a Rasch model:

User ability: theta_i

Question difficulty: b_j

Uses the 4-level difficulty mapping as priors to prevent wild movement on small sample sizes.

After fitting:

We write updated b_j back into the DB.

Optionally, we also store theta_i as global user ability.

2.3 Mapping Rasch b_j → “Elo-like” difficulty for online updates

For the online per-skill Elo module, we treat questions as “opponents” with a rating. We derive this from b_j:

difficulty_elo_j = a * b_j + c


Where:

a = scale factor (e.g., 150–250)

c = shift (e.g., 1500)

We keep these configurable. The goal is just to place question difficulty on roughly the same numeric range as user ratings.

2.4 Optional: question Elo delta

We can optionally maintain a small Elo delta per question for very fast adaptation between batch Rasch runs:

Let R_q_base = difficulty_elo_j (from Rasch).

Maintain delta_q with online Elo updates.

Effective rating used in each interaction:

R_q_effective = R_q_base + delta_q


After each nightly/weekly Rasch refit, we can:

Recompute R_q_base from new b_j.

Reset or shrink delta_q toward 0.

This keeps question difficulty grounded in Rasch, but still responsive in the short term.

3. Data Model (SQL-Level)

This section describes the extra tables relevant to Elo and difficulty. Existing tables like users and questions are assumed.

3.1 Skills & question → skill mapping

Each question can involve multiple skills, with weights that sum to 1. These weights reflect how much each skill contributes to the question.

-- All skills in the taxonomy
CREATE TABLE skills (
    id              INTEGER PRIMARY KEY,
    code            TEXT UNIQUE NOT NULL,  -- e.g. "LR:Flaw", "RC:MainPoint"
    name            TEXT NOT NULL,
    description     TEXT
);

-- Many-to-many mapping: question uses N skills, weights sum to 1 per question
CREATE TABLE question_skills (
    question_id     INTEGER NOT NULL,
    skill_id        INTEGER NOT NULL,
    weight          REAL NOT NULL,        -- e.g. 0.6, 0.4
    PRIMARY KEY (question_id, skill_id),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

3.2 User per-skill Elo ratings
CREATE TABLE user_skill_ratings (
    user_id         INTEGER NOT NULL,
    skill_id        INTEGER NOT NULL,
    rating          REAL NOT NULL,        -- Elo, default 1500
    num_updates     INTEGER NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

3.3 Question difficulty / rating

We support both Rasch difficulty and an Elo-like rating.

On questions table (for Rasch & mapping):

ALTER TABLE questions ADD COLUMN difficulty_level INTEGER;   -- 1..4 from pipeline
ALTER TABLE questions ADD COLUMN difficulty_rasch REAL;      -- b_j from Rasch
ALTER TABLE questions ADD COLUMN difficulty_elo_base REAL;   -- mapped from b_j


Optional question Elo delta (separate table):

CREATE TABLE question_ratings (
    question_id     INTEGER PRIMARY KEY,
    rating_delta    REAL NOT NULL DEFAULT 0.0,
    num_updates     INTEGER NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);


If we want to keep things simpler at first, we can skip question_ratings and just use difficulty_elo_base without an online delta.

3.4 Attempts (simplified)

We assume an existing attempts table with at least:

CREATE TABLE attempts (
    id              INTEGER PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    question_id     INTEGER NOT NULL,
    is_correct      BOOLEAN NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- plus other metadata (time_taken, test_id, etc.)
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

4. Elo Algorithm Details (Per-Skill)
4.1 Single-skill Elo (baseline)

For a single skill with user rating R_u vs question rating R_q:

Expected score:

E = 1 / (1 + 10^((R_q - R_u) / 400))


Actual score:

S = 1 (correct) or 0 (incorrect) or in [0,1] for partial credit


Update:

R_u' = R_u + K * (S - E)
R_q' = R_q - K_q * (S - E)       # symmetric, if updating question rating

4.2 Multi-skill question Elo

Let question j involve skills s1..sk with weights w1..wk, where Σ w_i = 1.

Per user u:

Compute effective user rating vs this question:

R_user_eff = Σ (w_i * R_u,s_i)


Let R_q be the question’s Elo-like difficulty:

either R_q = difficulty_elo_base + rating_delta

or just difficulty_elo_base if not using delta.

Expected score:

E = 1 / (1 + 10^((R_q - R_user_eff) / 400))


Actual score: S (0 or 1, or [0,1]).

Compute delta:

delta = S - E


Update each skill rating proportional to its weight:

R_u,s_i' = R_u,s_i + K_user * w_i * delta


Optionally update question rating delta:

rating_delta' = rating_delta - K_q * delta

4.3 Adaptive K values (step size)

We make K decay with the number of updates to stabilize over time.

For users:

BASE_K_USER = 40
K_user = BASE_K_USER / sqrt(num_updates_skill + 1)


For questions (if we’re updating rating_delta):

BASE_K_QUESTION = 20
K_q = BASE_K_QUESTION / sqrt(num_updates_question + 1)

5. Python Service Interface (Elo Module)

The goal is to expose a clean, testable interface for the online Elo update. Below is a reference implementation that Claude Code can build around.

5.1 Module: elo_service.py

Assume:

ORM: SQLAlchemy (but can be adapted to raw SQL).

Models: UserSkillRating, QuestionSkill, Question, QuestionRating defined as per schema above.

# elo_service.py

import math
from datetime import datetime
from sqlalchemy.orm import Session
from models import (
    UserSkillRating,
    QuestionSkill,
    Question,
    QuestionRating,  # optional, for rating_delta
)

DEFAULT_RATING = 1500.0
BASE_K_USER = 40.0
BASE_K_QUESTION = 20.0


def expected_score(player_rating: float, opponent_rating: float) -> float:
    """Standard Elo expected score."""
    return 1.0 / (1.0 + 10.0 ** ((opponent_rating - player_rating) / 400.0))


def k_from_updates(base_k: float, num_updates: int) -> float:
    """Decay K with more updates for stability."""
    return base_k / math.sqrt(num_updates + 1)


def get_question_effective_rating(db: Session, question_id: int) -> float:
    """
    Compute the effective question rating used for Elo updates.
    Combines Rasch-based base rating with optional Elo delta.
    """
    # 1. Fetch question and its base difficulty (difficulty_elo_base)
    question = db.query(Question).filter(Question.id == question_id).one()

    base = question.difficulty_elo_base
    if base is None:
        # Fallback if not set; can derive from difficulty_level or default
        # Example: map difficulty_level 1..4 to base ratings.
        # This mapping should be implemented in a dedicated helper if needed.
        base = DEFAULT_RATING

    # 2. Optional Elo delta
    q_rating = (
        db.query(QuestionRating)
        .filter(QuestionRating.question_id == question_id)
        .one_or_none()
    )

    if q_rating is None:
        return base

    return base + q_rating.rating_delta


def update_per_skill_elo(
    db: Session,
    user_id: int,
    question_id: int,
    score: float,  # 1.0 correct, 0.0 incorrect, or partial in [0,1]
    update_question_rating: bool = True,
) -> None:
    """
    Update per-skill Elo for a given (user, question, score) event.
    Commits changes to the DB session.

    Steps:
    - Fetch question's skill weights.
    - Ensure user has a UserSkillRating row for each involved skill.
    - Compute effective user rating vs this question.
    - Get effective question difficulty rating.
    - Compute expected score and delta.
    - Update each skill rating.
    - Optionally update question rating_delta.
    """

    # 1. Get skills + weights for this question
    q_skills = (
        db.query(QuestionSkill)
        .filter(QuestionSkill.question_id == question_id)
        .all()
    )
    if not q_skills:
        # Question has no skill tags; skip per-skill updates
        return

    # 2. Fetch or initialize user per-skill ratings
    user_skill_ratings = {}
    for qs in q_skills:
        usr = (
            db.query(UserSkillRating)
            .filter(
                UserSkillRating.user_id == user_id,
                UserSkillRating.skill_id == qs.skill_id,
            )
            .one_or_none()
        )
        if usr is None:
            usr = UserSkillRating(
                user_id=user_id,
                skill_id=qs.skill_id,
                rating=DEFAULT_RATING,
                num_updates=0,
                last_updated_at=datetime.utcnow(),
            )
            db.add(usr)
            db.flush()

        user_skill_ratings[qs.skill_id] = usr

    # 3. Effective user rating for this question
    R_user_eff = 0.0
    for qs in q_skills:
        usr = user_skill_ratings[qs.skill_id]
        R_user_eff += qs.weight * usr.rating

    # 4. Get effective question rating
    R_q = get_question_effective_rating(db, question_id)

    # 5. Expected score + delta
    E = expected_score(R_user_eff, R_q)
    delta = score - E

    # 6. Update each skill rating
    for qs in q_skills:
        usr = user_skill_ratings[qs.skill_id]
        K_user = k_from_updates(BASE_K_USER, usr.num_updates)
        usr.rating += K_user * qs.weight * delta
        usr.num_updates += 1
        usr.last_updated_at = datetime.utcnow()

    # 7. Optionally update question rating delta
    if update_question_rating:
        q_rating = (
            db.query(QuestionRating)
            .filter(QuestionRating.question_id == question_id)
            .one_or_none()
        )

        if q_rating is None:
            q_rating = QuestionRating(
                question_id=question_id,
                rating_delta=0.0,
                num_updates=0,
                last_updated_at=datetime.utcnow(),
            )
            db.add(q_rating)
            db.flush()

        K_q = k_from_updates(BASE_K_QUESTION, q_rating.num_updates)
        q_rating.rating_delta -= K_q * delta
        q_rating.num_updates += 1
        q_rating.last_updated_at = datetime.utcnow()

    db.commit()

6. API Integration
6.1 Logging attempts endpoint

We assume a Flask blueprint for attempts. On each attempt:

Log the attempt row (for Rasch, analytics, etc.).

Call update_per_skill_elo(...) with score = 1.0 or 0.0.

Example:

# routes_attempts.py

from flask import Blueprint, request, jsonify
from db import get_db
from elo_service import update_per_skill_elo

bp = Blueprint("attempts", __name__, url_prefix="/api/attempts")


@bp.post("")
def log_attempt():
    data = request.get_json()
    user_id = data["user_id"]
    question_id = data["question_id"]
    is_correct = data["is_correct"]  # bool

    score = 1.0 if is_correct else 0.0
    db = get_db()

    # 1. Log attempt
    # (Actual model/fields may vary)
    # attempt = Attempt(
    #     user_id=user_id,
    #     question_id=question_id,
    #     is_correct=is_correct,
    # )
    # db.add(attempt)
    # db.commit()

    # 2. Update per-skill Elo
    update_per_skill_elo(
        db,
        user_id=user_id,
        question_id=question_id,
        score=score,
    )

    return jsonify({"status": "ok"}), 201

6.2 Exposing per-skill ratings to the frontend

We’ll want an endpoint like:

GET /api/users/<user_id>/skills → returns per-skill ratings.

Example response shape:

{
  "user_id": 123,
  "skills": [
    {
      "skill_id": 1,
      "skill_code": "LR:Flaw",
      "skill_name": "Logical Reasoning - Flaw",
      "rating_raw": 1532.4,
      "rating_display": 167,
      "percentile": 0.82
    },
    {
      "skill_id": 2,
      "skill_code": "RC:MainPoint",
      "skill_name": "Reading Comp - Main Point",
      "rating_raw": 1450.1,
      "rating_display": 159,
      "percentile": 0.63
    }
  ]
}


rating_display is on a 120–180 (or 100–200) scale; see next section.

7. Display Scaling (Elo → LSAT-like scale)

Internally, do not bound Elo. It should remain unbounded so the math remains sane.

For the frontend, we map either:

Rasch θ (if available per skill), or

per-skill Elo (R_skill)

onto a 120–180 or 100–200 scale.

A simple mapping:

z = (R_skill - μ) / σ
display_score = 150 + 10 * z          # for LSAT-style 120–180
display_score = clamp(display_score, 120, 180)


or

display_score = 150 + 15 * z          # for 100–200
display_score = clamp(display_score, 100, 200)


Where:

μ, σ can be:

initially chosen (e.g., μ=1500, σ=300), and later

periodically recomputed from the population.

7.1 Helper module: scaling.py
# scaling.py

def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def elo_to_lsat_style(
    rating: float,
    mean_rating: float = 1500.0,
    std_rating: float = 300.0,
    min_score: int = 120,
    max_score: int = 180,
    center_score: int = 150,
    scale_per_std: float = 10.0,
) -> float:
    """
    Map an Elo rating to a LSAT-like scale.
    This is for UI only; internal ratings stay unbounded.

    Parameters:
    - rating: Elo rating (per skill).
    - mean_rating, std_rating: calibration parameters.
    - min_score, max_score: bounds on display.
    - center_score: score corresponding to mean_rating (e.g., 150).
    - scale_per_std: points per 1 std dev (e.g., 10).

    Returns:
    - display_score: float within [min_score, max_score].
    """
    if std_rating <= 0:
        # Fallback to center_score to avoid div by zero
        return float(center_score)

    z = (rating - mean_rating) / std_rating
    display = center_score + scale_per_std * z
    return float(clamp(display, min_score, max_score))


The API layer can call elo_to_lsat_style to fill in rating_display for each skill.

8. What Claude Code Should Do with This

Given this context, Claude Code should be able to:

Generate SQL migrations to add:

skills, question_skills, user_skill_ratings, question_ratings (if used).

Additional columns on questions for difficulty.

Implement or refine models in SQLAlchemy (or chosen ORM) to match this schema.

Fill in the Flask routes:

/api/attempts POST (log_attempt).

/api/users/<user_id>/skills GET.

Implement batch Rasch integration points, e.g.,:

Cron job or offline script that:

Reads attempts.

Fits Rasch.

Writes difficulty_rasch and difficulty_elo_base back to questions.

Hook up scaling so that:

The backend returns both rating_raw and rating_display per skill.

Write tests for:

Elo update logic (single skill & multi-skill).

Correct mapping of difficulty levels (1–4) → initial Rasch b → difficulty_elo_base.

Scaling functions (Elo → LSAT-style scores).