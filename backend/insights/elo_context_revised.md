# Deductly – Per-Skill Elo Rating System

## 1. Core Algorithm

This section defines the complete rating system. All tunable parameters are consolidated in Section 2.

### 1.1 Fundamental Equations

**Expected probability of correct response:**

```
P(correct) = 1 / (1 + 10^((D_q - R_u) / 400))
```

Where:
- `R_u` = user's effective rating (for multi-skill questions, this is the weighted average across involved skills)
- `D_q` = question's difficulty rating

**User rating update (per skill):**

```
R_u,skill' = R_u,skill + K_u × w_skill × (S - P)
```

Where:
- `S` = actual score (1 if correct, 0 if incorrect)
- `P` = predicted probability from above
- `K_u` = user's adaptive K-factor
- `w_skill` = weight of this skill for the question (weights sum to 1)

**Question difficulty update (optional):**

```
D_q' = D_q - K_q × (S - P)
```

Note the negative sign: if a student succeeds unexpectedly (`S > P`), the question's difficulty decreases.

### 1.2 Adaptive K-Factors

K-factors decay with experience to stabilize ratings over time:

```
K_u = BASE_K_USER / sqrt(num_updates + 1)
K_q = BASE_K_QUESTION / sqrt(num_updates + 1)
```

### 1.3 Multi-Skill Questions

When a question involves multiple skills with weights `w_1, w_2, ..., w_n` (summing to 1):

1. Compute effective user rating: `R_u_eff = Σ(w_i × R_u,skill_i)`
2. Use `R_u_eff` in the expected score formula
3. Distribute rating updates proportionally: each skill receives `K_u × w_i × (S - P)`

### 1.4 Worked Example

**Setup:**
- Student has ratings: `Flaw = 1500`, `Assumption = 1450`
- Question difficulty: `D_q = 1520`
- Question skill weights: `Flaw = 0.6`, `Assumption = 0.4`
- Student has 10 prior updates on Flaw, 5 on Assumption
- Student answers correctly (`S = 1`)

**Step 1: Effective user rating**
```
R_u_eff = 0.6 × 1500 + 0.4 × 1450 = 900 + 580 = 1480
```

**Step 2: Expected probability**
```
P = 1 / (1 + 10^((1520 - 1480) / 400))
P = 1 / (1 + 10^(0.1))
P = 1 / (1 + 1.259)
P ≈ 0.443
```

The student had about a 44% chance of getting this right.

**Step 3: Surprise factor**
```
delta = S - P = 1 - 0.443 = 0.557
```

The student outperformed expectations by 0.557.

**Step 4: K-factors**
```
K_Flaw = 40 / sqrt(10 + 1) = 40 / 3.317 ≈ 12.06
K_Assumption = 40 / sqrt(5 + 1) = 40 / 2.449 ≈ 16.33
```

**Step 5: Rating updates**
```
Flaw' = 1500 + 12.06 × 0.6 × 0.557 = 1500 + 4.03 ≈ 1504
Assumption' = 1450 + 16.33 × 0.4 × 0.557 = 1450 + 3.64 ≈ 1454
```

**Step 6: Question difficulty update** (if enabled)
```
K_q = 20 / sqrt(num_q_updates + 1)
D_q' = 1520 - K_q × 0.557
```

---

## 2. Parameters Reference

All tunable values in one place for easy adjustment:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `DEFAULT_RATING` | 1500 | Starting rating for new users/skills |
| `BASE_K_USER` | 40 | Maximum K-factor for user updates |
| `BASE_K_QUESTION` | 20 | Maximum K-factor for question updates |
| `ELO_SCALE` | 400 | Denominator in expected score formula |
| `RASCH_TO_ELO_SCALE` | 200 | Multiplier when converting Rasch b to Elo |
| `RASCH_TO_ELO_SHIFT` | 1500 | Offset when converting Rasch b to Elo |

**Initial difficulty mapping (Rasch b values):**

| Pipeline Level | Rasch b | Elo Equivalent |
|----------------|---------|----------------|
| Level 1 (easiest) | -1.5 | 1200 |
| Level 2 | -0.5 | 1400 |
| Level 3 | +0.5 | 1600 |
| Level 4 (hardest) | +1.5 | 1800 |

**Display scaling (internal Elo → LSAT-style):**

| Parameter | Value |
|-----------|-------|
| `DISPLAY_MEAN` | 1500 |
| `DISPLAY_STD` | 300 |
| `DISPLAY_CENTER` | 150 |
| `DISPLAY_SCALE_PER_STD` | 10 |
| `DISPLAY_MIN` | 120 |
| `DISPLAY_MAX` | 180 |

---

## 3. System Architecture

### 3.1 Two-Layer Difficulty Model

Question difficulty operates on two timescales:

**Batch layer (Rasch IRT):** A nightly/weekly job fits a Rasch model to all response data, producing stable difficulty estimates (`b_j`) grounded in psychometric theory. This is the source of truth.

**Online layer (Elo delta):** Between batch runs, we maintain a small adjustment (`delta_q`) that responds to immediate feedback. This gets reset or shrunk toward zero after each Rasch refit.

```
D_q_effective = D_q_base + delta_q

Where:
  D_q_base = RASCH_TO_ELO_SCALE × b_j + RASCH_TO_ELO_SHIFT
  delta_q = online Elo adjustment (starts at 0, bounded to ±100)
```

**Rationale:** Pure online Elo is noisy and can drift. Pure batch IRT is slow to adapt. The hybrid captures the best of both: stability from IRT, responsiveness from Elo.

### 3.2 Rating Bounds and Edge Cases

**Internal ratings:** Unbounded. The math works cleanly without artificial floors/ceilings.

**Online delta bounds:** Clamp `delta_q` to ±100 to prevent runaway drift between batch refits.

**Display scores:** Clamped to 120-180 for user-facing output.

**Extreme ratings:** When a user's rating exceeds ±3σ from the population mean:
- Continue updating normally (don't artificially cap)
- Consider surfacing a "you've mastered this skill" or "focus here" message in the UI
- Log for review—may indicate a content gap (no questions at that difficulty level)

### 3.3 Update Timing

Updates are **synchronous**: each response triggers an immediate rating update before the next question is selected. This ensures the adaptive question selection always uses the freshest estimate.

---

## 4. Data Model

### 4.1 Schema

```sql
-- Skill taxonomy
CREATE TABLE skills (
    id              INTEGER PRIMARY KEY,
    code            TEXT UNIQUE NOT NULL,  -- e.g., "LR:Flaw", "RC:MainPoint"
    name            TEXT NOT NULL,
    description     TEXT
);

-- Question-to-skill mapping (weights sum to 1 per question)
CREATE TABLE question_skills (
    question_id     INTEGER NOT NULL,
    skill_id        INTEGER NOT NULL,
    weight          REAL NOT NULL CHECK (weight > 0 AND weight <= 1),
    PRIMARY KEY (question_id, skill_id),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

-- User per-skill ratings
CREATE TABLE user_skill_ratings (
    user_id         INTEGER NOT NULL,
    skill_id        INTEGER NOT NULL,
    rating          REAL NOT NULL DEFAULT 1500.0,
    num_updates     INTEGER NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

-- Question difficulty columns (add to existing questions table)
ALTER TABLE questions ADD COLUMN difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 4);
ALTER TABLE questions ADD COLUMN difficulty_rasch REAL;      -- b_j from batch Rasch
ALTER TABLE questions ADD COLUMN difficulty_elo_base REAL;   -- mapped from b_j

-- Online question rating adjustments
CREATE TABLE question_ratings (
    question_id     INTEGER PRIMARY KEY,
    rating_delta    REAL NOT NULL DEFAULT 0.0 CHECK (rating_delta BETWEEN -100 AND 100),
    num_updates     INTEGER NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Response log (assumed to exist)
CREATE TABLE attempts (
    id              INTEGER PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    question_id     INTEGER NOT NULL,
    is_correct      BOOLEAN NOT NULL,
    time_taken_ms   INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

### 4.2 Indexes for Performance

```sql
CREATE INDEX idx_attempts_user ON attempts(user_id, created_at DESC);
CREATE INDEX idx_attempts_question ON attempts(question_id);
CREATE INDEX idx_user_skill_ratings_user ON user_skill_ratings(user_id);
CREATE INDEX idx_question_skills_question ON question_skills(question_id);
```

---

## 5. Implementation

### 5.1 Core Module: `elo_service.py`

```python
import math
from datetime import datetime
from sqlalchemy.orm import Session
from models import UserSkillRating, QuestionSkill, Question, QuestionRating

# Parameters (import from config in production)
DEFAULT_RATING = 1500.0
BASE_K_USER = 40.0
BASE_K_QUESTION = 20.0
ELO_SCALE = 400.0
DELTA_BOUND = 100.0


def expected_score(user_rating: float, question_difficulty: float) -> float:
    """Probability of correct response given user rating and question difficulty."""
    return 1.0 / (1.0 + 10.0 ** ((question_difficulty - user_rating) / ELO_SCALE))


def adaptive_k(base_k: float, num_updates: int) -> float:
    """K-factor that decays with experience."""
    return base_k / math.sqrt(num_updates + 1)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def get_question_effective_difficulty(db: Session, question_id: int) -> float:
    """Returns D_q_base + delta_q for a question."""
    question = db.query(Question).filter(Question.id == question_id).one()
    
    base = question.difficulty_elo_base
    if base is None:
        # Fallback: use level mapping if Rasch hasn't run yet
        level_to_elo = {1: 1200, 2: 1400, 3: 1600, 4: 1800}
        base = level_to_elo.get(question.difficulty_level, DEFAULT_RATING)
    
    q_rating = (
        db.query(QuestionRating)
        .filter(QuestionRating.question_id == question_id)
        .one_or_none()
    )
    
    delta = q_rating.rating_delta if q_rating else 0.0
    return base + delta


def update_elo(
    db: Session,
    user_id: int,
    question_id: int,
    is_correct: bool,
    update_question: bool = True,
) -> dict:
    """
    Update per-skill Elo ratings after a response.
    
    Returns dict with debugging info:
    {
        'user_effective_rating': float,
        'question_difficulty': float,
        'expected_prob': float,
        'actual': int,
        'skill_updates': [{'skill_id': int, 'old': float, 'new': float}, ...]
    }
    """
    score = 1.0 if is_correct else 0.0
    result = {'actual': int(is_correct), 'skill_updates': []}
    
    # 1. Get skill weights for this question
    q_skills = (
        db.query(QuestionSkill)
        .filter(QuestionSkill.question_id == question_id)
        .all()
    )
    
    if not q_skills:
        return result  # No skills tagged; skip update
    
    # 2. Fetch or create user skill ratings
    user_ratings = {}
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
            )
            db.add(usr)
            db.flush()
        user_ratings[qs.skill_id] = usr
    
    # 3. Compute effective user rating
    R_u_eff = sum(qs.weight * user_ratings[qs.skill_id].rating for qs in q_skills)
    result['user_effective_rating'] = R_u_eff
    
    # 4. Get question difficulty
    D_q = get_question_effective_difficulty(db, question_id)
    result['question_difficulty'] = D_q
    
    # 5. Expected score and delta
    P = expected_score(R_u_eff, D_q)
    result['expected_prob'] = P
    delta = score - P
    
    # 6. Update each skill rating
    now = datetime.utcnow()
    for qs in q_skills:
        usr = user_ratings[qs.skill_id]
        old_rating = usr.rating
        K = adaptive_k(BASE_K_USER, usr.num_updates)
        
        usr.rating += K * qs.weight * delta
        usr.num_updates += 1
        usr.last_updated_at = now
        
        result['skill_updates'].append({
            'skill_id': qs.skill_id,
            'old': old_rating,
            'new': usr.rating,
        })
    
    # 7. Update question difficulty (optional)
    if update_question:
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
            )
            db.add(q_rating)
            db.flush()
        
        K_q = adaptive_k(BASE_K_QUESTION, q_rating.num_updates)
        new_delta = q_rating.rating_delta - K_q * delta
        q_rating.rating_delta = clamp(new_delta, -DELTA_BOUND, DELTA_BOUND)
        q_rating.num_updates += 1
        q_rating.last_updated_at = now
    
    db.commit()
    return result
```

### 5.2 Display Scaling: `scaling.py`

```python
def elo_to_display(
    rating: float,
    mean: float = 1500.0,
    std: float = 300.0,
    center: int = 150,
    scale_per_std: float = 10.0,
    min_score: int = 120,
    max_score: int = 180,
) -> int:
    """Convert internal Elo to LSAT-style display score."""
    if std <= 0:
        return center
    
    z = (rating - mean) / std
    display = center + scale_per_std * z
    return int(max(min_score, min(max_score, round(display))))


def display_to_elo(
    display_score: int,
    mean: float = 1500.0,
    std: float = 300.0,
    center: int = 150,
    scale_per_std: float = 10.0,
) -> float:
    """Inverse: convert display score back to Elo (for setting targets, etc.)."""
    z = (display_score - center) / scale_per_std
    return mean + z * std
```

### 5.3 API Routes

```python
# routes.py
from flask import Blueprint, request, jsonify
from db import get_db
from elo_service import update_elo
from scaling import elo_to_display
from models import UserSkillRating, Skill

bp = Blueprint("api", __name__, url_prefix="/api")


@bp.post("/attempts")
def log_attempt():
    """Record an attempt and update ratings."""
    data = request.get_json()
    db = get_db()
    
    result = update_elo(
        db,
        user_id=data["user_id"],
        question_id=data["question_id"],
        is_correct=data["is_correct"],
    )
    
    return jsonify({"status": "ok", "debug": result}), 201


@bp.get("/users/<int:user_id>/skills")
def get_user_skills(user_id: int):
    """Return user's per-skill ratings."""
    db = get_db()
    
    ratings = (
        db.query(UserSkillRating, Skill)
        .join(Skill, UserSkillRating.skill_id == Skill.id)
        .filter(UserSkillRating.user_id == user_id)
        .all()
    )
    
    skills = []
    for usr, skill in ratings:
        skills.append({
            "skill_id": skill.id,
            "skill_code": skill.code,
            "skill_name": skill.name,
            "rating_raw": round(usr.rating, 1),
            "rating_display": elo_to_display(usr.rating),
            "num_updates": usr.num_updates,
        })
    
    return jsonify({"user_id": user_id, "skills": skills})
```

---

## 6. Batch Rasch Integration

The online Elo system works alongside periodic batch IRT fits.

### 6.1 Workflow

1. **Nightly job** reads all attempts and fits a Rasch model
2. **Update questions:** Write new `difficulty_rasch` (b_j) and `difficulty_elo_base` values
3. **Reset deltas:** Set `rating_delta = 0` for all questions (or shrink by 50%)
4. **Optionally:** Recalibrate display scaling parameters (μ, σ) from population

### 6.2 Rasch → Elo Mapping

```python
def rasch_to_elo(b: float, scale: float = 200.0, shift: float = 1500.0) -> float:
    """Convert Rasch difficulty parameter to Elo-scale rating."""
    return scale * b + shift
```

With default parameters:
- b = -1.5 → Elo 1200
- b = 0 → Elo 1500
- b = +1.5 → Elo 1800

---

## 7. Monitoring and Alerts

### 7.1 Metrics to Track

- **Rating distribution:** Mean and std of user ratings per skill (detect drift)
- **Question stability:** How much questions move between batch refits
- **Prediction accuracy:** Compare predicted P(correct) to actual outcomes (calibration)
- **Update magnitude:** Average |delta| per response (should stabilize over time)

### 7.2 Alert Conditions

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Question delta hits bound | \|delta\| = 100 | Review question content; may indicate bad initial estimate |
| User rating > 3σ from mean | Rating > 2400 or < 600 | Check for content gaps at extremes |
| Calibration drift | Brier score increases >10% | Investigate; may need parameter tuning |
| Skill has <50 responses | After 2 weeks | Ensure questions are tagged; may need content |

---

## 8. Design Rationale

*This section explains why, separate from what.*

**Why Elo over pure IRT online?** IRT requires iterative fitting across all parameters simultaneously. Elo updates are O(1) per response—essential for real-time adaptive selection. We get IRT's rigor through the batch layer.

**Why per-skill ratings instead of global ability?** LSAT skills are meaningfully distinct. Someone strong at Logical Reasoning flaw questions may struggle with Reading Comprehension inference questions. Per-skill tracking enables targeted practice recommendations.

**Why decay K with updates?** Early responses carry more signal about true ability. As we accumulate data, we want ratings to stabilize. The sqrt decay is a common choice that balances responsiveness with stability.

**Why bound the online delta but not internal ratings?** The delta is a short-term correction that gets reset. Letting it grow unbounded could cause wild oscillations. Internal ratings, by contrast, represent our best long-term estimate and should be free to find their level.

**Why symmetric updates (question difficulty changes too)?** New questions need calibration. If a question is harder than our LLM estimated, student failures will push its difficulty up. This self-corrects initial estimation errors without waiting for the batch job.

---

## 9. Implementation Checklist

For Claude Code or manual implementation:

- [ ] Create database migrations for new tables and columns
- [ ] Implement SQLAlchemy models matching schema
- [ ] Implement `elo_service.py` with core update logic
- [ ] Implement `scaling.py` for display conversion
- [ ] Create API routes for attempts and skill retrieval
- [ ] Write unit tests for:
  - [ ] Expected score calculation
  - [ ] Single-skill update
  - [ ] Multi-skill weighted update
  - [ ] K-factor decay
  - [ ] Delta bounding
  - [ ] Display scaling (both directions)
- [ ] Set up batch Rasch job (separate task)
- [ ] Add monitoring/logging for alert conditions
- [ ] Load test to verify O(1) update performance
