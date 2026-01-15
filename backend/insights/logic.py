"""
Business logic stubs for the Insights layer.
These helpers back the ability estimation (IRT) and skill mastery (CDM) routes.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List
from utils import generate_id, generate_sequential_id
import os
import json
import torch
from db import get_db_connection, get_db_cursor, execute_query
from .irt_implementation import rasch_online_update_theta_torch
from .glmm_implementation import RaschFrozenSkillGLMM, micro_update_one
from .elo_system import (
    UserSkillRating,
    Question,
    QuestionSkill,
    update_elo,
    DEFAULT_RATING,
    ELO_SCALE
)


# --- IRT Adaptive Variance Parameters ---
THETA_MIN = -3.5          # Hard floor for ability estimate
THETA_MAX = 3.5           # Hard ceiling for ability estimate
VAR_INIT = 1.0            # Starting prior variance for new users
VAR_FLOOR = 0.15          # Minimum variance (SD≈0.39, allows continued learning)
VARIANCE_SCALE = 30       # Controls decay rate of variance
N_CAP = 150               # Cap on effective sample size (prevents over-shrinking)


# Skill Taxonomy v2.1 - Updated from lsat_lr_skill_taxonomy_v2.txt and lsat_rc_skill_taxonomy_v2.txt
skill_taxonomy = [
    # LOGICAL REASONING - Domain I: Structural Decomposition
    ('S_01', 'Main Conclusion ID'),
    ('S_02', 'Role Identification'),
    ('S_03', 'Disagreement Isolation'),
    ('S_04', 'Intermediate Conclusion Recognition'),
    # LOGICAL REASONING - Domain II: Formal & Deductive Logic
    ('FL_01', 'Conditional Translation'),
    ('FL_02', 'Contrapositive Operations'),
    ('FL_03', 'Chain/Transitive Deduction'),
    ('FL_04', 'Quantifier Scope'),
    ('FL_05', 'Quantifier Intersection'),
    ('FL_06', 'Modal Precision'),
    ('FL_07', 'Conditional Fallacies'),
    # LOGICAL REASONING - Domain III: Rhetorical & Inductive Evaluation
    ('RH_01', 'Causality vs. Correlation'),
    ('RH_02', 'Alternative Explanations'),
    ('RH_03', 'Sufficiency Gaps'),
    ('RH_04', 'Necessity Gaps'),
    ('RH_05', 'Sampling Validity'),
    ('RH_06', 'Ad Hominem / Source Attacks'),
    ('RH_07', 'Evidential Weight Assessment'),
    ('RH_08', 'Scope Shift Recognition'),
    # LOGICAL REASONING - Domain IV: Systemic Abstraction
    ('ABS_01', 'Structural Matching'),
    ('ABS_02', 'Flaw Matching'),
    ('ABS_03', 'Principle Application'),
    # READING COMPREHENSION - Domain I: Macro-Structural
    ('RC_01', 'Global Thesis ID'),
    ('RC_02', 'Authorial Purpose'),
    ('RC_03', 'Passage Architecture'),
    # READING COMPREHENSION - Domain II: Micro-Syntactic
    ('RC_04', 'Detail Retrieval'),
    ('RC_05', 'Logical Function'),
    # READING COMPREHENSION - Domain III: Inferential Synthesis
    ('RC_06', 'Viewpoint Tracking'),
    ('RC_07', 'Inference'),
    ('RC_08', 'Tone/Attitude'),
    ('RC_09', 'Analogy/Application'),
    ('RC_10', 'New Info Impact'),
    # READING COMPREHENSION - Domain IV: Comparative Dynamics
    ('RC_11', 'Comparative Relationship'),
    ('RC_12', 'Cross-Reference / Agreement'),
]


def transform_response_payload(responses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    response_vals = []
    qid_list = []
    for item in responses:
        qid_list.append(item["question_id"])
        response_vals.append(1 if item["is_correct"] else 0)
    return qid_list, torch.tensor(response_vals, dtype=torch.float32)


def get_user_response_count(user_id: str) -> int:
    """
    Get the total number of questions a user has answered.
    Counts from user_question_history table.
    """
    query = "SELECT COUNT(*) as count FROM user_question_history WHERE user_id = %s"
    with get_db_cursor() as cursor:
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        return row['count'] if row else 0


def compute_adaptive_prior_var(n_responses: int) -> float:
    """
    Compute adaptive prior variance based on number of responses.

    Formula: prior_var = max(VAR_FLOOR, VAR_INIT / (1 + effective_n / VARIANCE_SCALE))

    This allows:
    - Rapid calibration for new users (high variance)
    - Increasing stability as evidence accumulates
    - Continued responsiveness via VAR_FLOOR (never fully "locked in")
    """
    effective_n = min(n_responses, N_CAP)
    computed_var = VAR_INIT / (1.0 + effective_n / VARIANCE_SCALE)
    return max(VAR_FLOOR, computed_var)


def clamp_theta(theta: float) -> float:
    """Clamp theta to reasonable bounds."""
    return max(THETA_MIN, min(THETA_MAX, theta))


def prepare_ability_estimation(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Placeholder for orchestrating an IRT ability estimation run."""
    user_id = payload.get('user_id', 'demo-user')
    responses = payload.get('responses', [])

    return {
        'user_id': user_id,
        'model': 'irt-placeholder',
        'ability_theta': 0.63,
        'standard_error': 0.19,
        'evidence_ingested': len(responses),
        'raw_inputs_echo': responses,
        'metadata': {
            'message': 'Using placeholder IRT outputs.',
            'calibration_set': 'demo-calibration-a'
        }
    }


def get_item_difficulties(question_ids) -> torch.Tensor:
    """Fetch item difficulties for the given question IDs."""
    #placeholders = ','.join('?' for _ in question_ids)
    difficulties = []
    for q in question_ids:
        query = "SELECT b FROM item_difficulties WHERE question_id = %s"
        with get_db_cursor() as cursor:
            cursor.execute(query, (q,))
            row = cursor.fetchone()
            if row:
                difficulties.append(row['b'])
            else:
                difficulties.append(0.0)  # Default difficulty if not found
    
    return torch.tensor(difficulties, dtype=torch.float32)

def fetch_current_ability(model_name: str, user_id: str) -> Dict[str, Any]:
    """Retrieve the latest overall ability score, creating a new record if none exists."""
    query = "SELECT theta_scalar FROM user_abilities WHERE user_id = %s"
    with get_db_cursor() as cursor:
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        if row:
            theta = row['theta_scalar']
        else:
            # No ability record found, create a new one with theta = 0.0
            new_id = generate_id("UA")
            theta = 0.0
            cursor.execute(
                """INSERT INTO user_abilities (id, user_id, theta_scalar, mastery_vector, last_updated)
                   VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)""",
                (new_id, user_id, theta, json.dumps([0.0] * len(skill_taxonomy)))
            )

    return {
        'user_id': user_id,
        'model': model_name,
        'ability_theta': theta,
        'standard_error': 0.21,
        'last_updated': datetime.utcnow().isoformat() + 'Z',
        'metadata': {
            'message': 'Placeholder ability record.',
            'source': 'synthetic-run-001'
        }
    }


def fetch_ability_history(user_id: str) -> Dict[str, Any]:
    """Placeholder for retrieving historical overall ability scores."""
    now = datetime.utcnow()
    history: List[Dict[str, Any]] = [
        {
            'timestamp': (now - timedelta(days=idx * 7)).isoformat() + 'Z',
            'ability_theta': 0.45 + 0.05 * idx,
            'standard_error': 0.25 - 0.02 * idx
        }
        for idx in range(4)
    ]

    return {
        'user_id': user_id,
        'model': 'irt-placeholder',
        'history': history,
        'metadata': {
            'message': 'Placeholder ability history.',
            'bucket': 'weekly'
        }
    }


def prepare_skill_mastery_estimation(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Placeholder for orchestrating a CDM-based skill mastery estimation run."""
    user_id = payload.get('user_id', 'demo-user')
    evidence = payload.get('evidence', [])
    skills = payload.get('skills', ['logic-games', 'logical-reasoning', 'reading-comprehension'])

    return {
        'user_id': user_id,
        'model': 'cdm-placeholder',
        'skills': [
            {
                'skill_id': skill,
                'mastery_probability': 0.4 + 0.1 * idx,
                'supporting_evidence': len(evidence)
            }
            for idx, skill in enumerate(skills)
        ],
        'metadata': {
            'message': 'Using placeholder CDM outputs.',
            'calibration_set': 'demo-skill-calibration-a'
        },
        'raw_inputs_echo': evidence
    }


def fetch_skill_mastery(user_id: str) -> Dict[str, Any]:
    """Retrieve the latest per-skill mastery profile for a user.

    Returns a stable structure even when no data exists yet.
    """
    query = "SELECT mastery_vector FROM user_abilities WHERE user_id = %s"
    with get_db_cursor() as cursor:
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()

    if row and row['mastery_vector']:
        try:
            mastery_vec = json.loads(row['mastery_vector'])
        except Exception:
            mastery_vec = []
    else:
        mastery_vec = []

    n_skills = len(skill_taxonomy)
    # Ensure vector length matches skill taxonomy
    if not isinstance(mastery_vec, list) or len(mastery_vec) != n_skills:
        mastery_vec = [0.0] * n_skills

    set_skills: List[Dict[str, Any]] = []
    for idx, (tax_id, tax_name) in enumerate(skill_taxonomy):
        set_skills.append({
            'skill_id': tax_id,
            'skill_name': tax_name,
            'mastery_probability': float(mastery_vec[idx]) if idx < len(mastery_vec) else 0.0
        })

    return {
        'user_id': user_id,
        'model': 'glmm',
        'skills': set_skills,
        'last_updated': datetime.utcnow().isoformat() + 'Z',
    }


def fetch_skill_mastery_history(user_id: str) -> Dict[str, Any]:
    """Placeholder for retrieving historical per-skill mastery snapshots."""
    now = datetime.utcnow()
    snapshots: List[Dict[str, Any]] = []
    for idx in range(3):
        snapshots.append({
            'timestamp': (now - timedelta(days=idx * 14)).isoformat() + 'Z',
            'skills': [
                {'skill_id': 'logic-games', 'mastery_probability': 0.5 + 0.03 * idx},
                {'skill_id': 'logical-reasoning', 'mastery_probability': 0.46 + 0.02 * idx},
                {'skill_id': 'reading-comprehension', 'mastery_probability': 0.6 + 0.025 * idx}
            ]
        })

    return {
        'user_id': user_id,
        'model': 'cdm-placeholder',
        'history': snapshots,
        'metadata': {
            'message': 'Placeholder mastery history.',
            'bucket': 'biweekly'
        }
    }


def irt_online_update(user_id: str, new_evidence: List[Dict[str, Any]]) -> dict:
    """
    Perform an online IRT update for the given user with new evidence.

    Uses adaptive prior variance that shrinks with accumulated evidence,
    while maintaining a floor to allow for continued learning improvement.
    """
    qids, responses = transform_response_payload(new_evidence)

    # Get current state
    theta0 = fetch_current_ability("irt", user_id)['ability_theta']
    prior_mean = theta0
    b = get_item_difficulties(qids)

    # Compute adaptive prior variance based on user's history
    n_responses = get_user_response_count(user_id)
    prior_var = compute_adaptive_prior_var(n_responses)

    # Perform MAP update
    new_theta = rasch_online_update_theta_torch(responses, b, theta0, prior_mean, prior_var)

    # Clamp to reasonable bounds
    new_theta = clamp_theta(new_theta)

    # Persist
    with get_db_cursor() as cursor:
        cursor.execute(
            """UPDATE user_abilities
               SET theta_scalar = %s, last_updated = CURRENT_TIMESTAMP
               WHERE user_id = %s;""",
            (new_theta, user_id)
        )

    return {
        "message": "Successfully updated user ability theta.",
        "theta_old": theta0,
        "theta_new": new_theta,
        "prior_var": prior_var,
        "n_responses": n_responses
    }


def get_skill_vector_for_question(question_id: str) -> torch.Tensor:
    """
    Get the Q-matrix row (skill loading vector) for a given question.
    Returns a tensor of shape (n_skills,) where each element indicates
    whether the question tests that skill.
    """
    # Query the question_skills table to find which skills this question tests
    # NOTE: We need s.skill_id (e.g., 'LR-10') not qs.skill_id (e.g., 'skill-prvcxu')
    query = """
        SELECT s.skill_id
        FROM question_skills qs
        JOIN skills s ON qs.skill_id = s.id
        WHERE qs.question_id = %s
    """

    with get_db_cursor() as cursor:
        cursor.execute(query, (question_id,))
        rows = cursor.fetchall()

    # Initialize skill vector with zeros
    n_skills = len(skill_taxonomy)
    skill_vector = [0.0] * n_skills

    # Get skill IDs that this question tests (e.g., 'LR-10', 'RC-05')
    question_skill_ids = [row['skill_id'] for row in rows]

    # Mark the skills that are tested by this question
    # Match against the skill_taxonomy using exact skill_id match
    for skill_id in question_skill_ids:
        # Find the index of this skill in the taxonomy
        for idx, (tax_id, _) in enumerate(skill_taxonomy):
            if skill_id == tax_id:
                skill_vector[idx] = 1.0
                break

    # Normalize the skill vector (L1 normalization)
    total = sum(skill_vector)
    if total > 0:
        skill_vector = [val / total for val in skill_vector]

    return torch.tensor(skill_vector, dtype=torch.float32)


def get_current_mastery_vector(user_id: str) -> List[float]:
    """
    Fetch the current mastery vector for a user from the database.
    If the user doesn't have a mastery vector yet, initialize with zeros.
    """
    query = "SELECT mastery_vector FROM user_abilities WHERE user_id = %s"

    with get_db_cursor() as cursor:
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()

    if row and row['mastery_vector']:
        # Parse the JSON string to get the list of floats
        mastery_vec = json.loads(row['mastery_vector'])
    else:
        # Initialize with zeros if no mastery vector exists
        n_skills = len(skill_taxonomy)
        mastery_vec = [0.0] * n_skills

    return mastery_vec


def persist_mastery_vector(user_id: str, mastery_vector: List[float]) -> None:
    """
    Persist the updated mastery vector to the database.
    """
    mastery_json = json.dumps(mastery_vector)

    with get_db_cursor() as cursor:
        # Check if user already has a record
        cursor.execute("SELECT id FROM user_abilities WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()

        if row:
            # Update existing record
            cursor.execute(
                """UPDATE user_abilities
                   SET mastery_vector = %s, last_updated = CURRENT_TIMESTAMP
                   WHERE user_id = %s""",
                (mastery_json, user_id)
            )
        else:
            # Insert new record with default theta
            new_id = generate_id("UA")
            cursor.execute(
                """INSERT INTO user_abilities (id, user_id, theta_scalar, mastery_vector, last_updated)
                   VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)""",
                (new_id, user_id, 0.0, mastery_json)
            )


def glmm_online_update(user_id: str, responses: List[Dict[str, Any]]) -> str:
    """
    Perform GLMM online updates for a user based on new question responses.

    Args:
        user_id: The user's unique identifier
        responses: List of dictionaries with keys:
            - 'question_id': The question ID
            - 'is_correct': 0 for incorrect, 1 for correct

    Returns:
        Success message string
    """
    # Get the current mastery vector for the user
    current_mastery = get_current_mastery_vector(user_id)

    # Get the user's current theta (Rasch ability)
    try:
        theta_u = fetch_current_ability("glmm", user_id)['ability_theta']
    except ValueError:
        # If no ability found, use default value
        theta_u = 0.0

    # Create a mock model to hold the user's mastery vector
    # We only need one user (this user) for online updates
    n_skills = len(skill_taxonomy)
    model = RaschFrozenSkillGLMM(
        n_users=1,
        n_skills=n_skills,
        prior_gamma_sd=0.8,
        mastery_activation="tanh"
    )

    # Set the user's current mastery vector in the model
    # Convert from activated mastery (tanh output) back to gamma space
    current_mastery_tensor = torch.tensor(current_mastery, dtype=torch.float32)
    # Use arctanh to get back to gamma space (inverse of tanh)
    gamma_values = torch.arctanh(torch.clamp(current_mastery_tensor, -0.999, 0.999))
    model.gamma_user.weight.data[0] = gamma_values

    # Process each response with micro-updates
    for response in responses:
        question_id = response['question_id']
        y = 1 if response['is_correct'] else 0

        # Get the skill vector for this question
        s_vec = get_skill_vector_for_question(question_id)

        # Get the item difficulty for this question
        b_i = get_item_difficulties([question_id])[0].item()

        # Perform micro-update
        micro_update_one(
            model=model,
            user_idx=0,  # We only have one user in this model
            theta_u=theta_u,
            b_i=b_i,
            y=y,
            s_vec=s_vec,
            lr=0.1,
            lam_row=1.0,
            steps=2,
            device="cpu"
        )

    # Extract the updated mastery vector
    updated_mastery = model.get_user_mastery(0).tolist()

    # Persist the updated mastery vector to the database
    persist_mastery_vector(user_id, updated_mastery)

    return "Successfully updated user skill mastery vector."


# --- Elo System Integration ---

def irt_b_to_elo(b_value: float) -> float:
    """
    Convert IRT b-parameter to Elo rating.
    Mapping: b=0 -> 1500, b=1 -> 1700, b=-1 -> 1300 (approx 200 points per unit b)
    """
    return 1500.0 + (b_value * 200.0)


def update_item_difficulty(question_id: str, new_b: float) -> Dict[str, Any]:
    """
    Update item difficulty (b-value) for a question.
    Automatically syncs Elo rating derived from b.

    Updates both:
    - questions table (b, difficulty_elo_base)
    - item_difficulties table (b)

    Args:
        question_id: The question ID
        new_b: New b-value (item difficulty parameter)

    Returns:
        Dict with old and new values
    """
    new_elo = irt_b_to_elo(new_b)

    with get_db_cursor() as cursor:
        # Get current values
        cursor.execute(
            "SELECT b, difficulty_elo_base FROM questions WHERE id = %s",
            (question_id,)
        )
        row = cursor.fetchone()
        old_b = row['b'] if row else None
        old_elo = row['difficulty_elo_base'] if row else None

        # Update questions table
        cursor.execute("""
            UPDATE questions
            SET b = %s, difficulty_elo_base = %s
            WHERE id = %s
        """, (new_b, new_elo, question_id))

        # Upsert item_difficulties table
        cursor.execute(
            "SELECT id FROM item_difficulties WHERE question_id = %s",
            (question_id,)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE item_difficulties
                SET b = %s, last_updated = CURRENT_TIMESTAMP
                WHERE question_id = %s
            """, (new_b, question_id))
        else:
            new_id = generate_id("ID")
            cursor.execute("""
                INSERT INTO item_difficulties (id, question_id, b, last_updated)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            """, (new_id, question_id, new_b))

    return {
        "question_id": question_id,
        "old_b": old_b,
        "new_b": new_b,
        "old_elo": old_elo,
        "new_elo": new_elo
    }


def fetch_user_elo_ratings(user_id: str) -> Dict[str, UserSkillRating]:
    """
    Fetch all skill ratings for a user.
    Returns a dict mapping skill_id (str, e.g., 'LR-01') -> UserSkillRating.
    """
    ratings = {}
    query = "SELECT skill_id, rating, num_updates FROM user_elo_ratings WHERE user_id = %s"

    with get_db_cursor() as cursor:
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        for row in rows:
            skill_id = row['skill_id']
            ratings[skill_id] = UserSkillRating(
                user_id=user_id,
                skill_id=skill_id,
                rating=row['rating'],
                num_updates=row['num_updates']
            )

    return ratings


def fetch_skill_names() -> Dict[str, str]:
    """
    Fetch all skill names from the database.
    Returns a dict mapping skill id (e.g., 'skill-j5y9by') -> skill_name (e.g., 'Main Conclusion ID').
    """
    query = "SELECT id, skill_name FROM skills"
    skill_names = {}

    with get_db_cursor() as cursor:
        cursor.execute(query)
        rows = cursor.fetchall()

        for row in rows:
            skill_names[row['id']] = row['skill_name']

    return skill_names


def fetch_question_elo_data(question_id: str):
    """
    Fetch Question object for Elo calculations.
    Returns (Question, None) - QuestionRating is not used since question updates are disabled.
    """
    query_q = "SELECT b, difficulty_elo_base FROM questions WHERE id = %s"
    query_s = "SELECT skill_id, skill_type, weight FROM question_skills WHERE question_id = %s"

    with get_db_cursor() as cursor:
        cursor.execute(query_q, (question_id,))
        row_q = cursor.fetchone()

        if not row_q:
            raise ValueError(f"Question {question_id} not found")

        # Determine base difficulty from Rasch b-value or explicit Elo base
        if row_q['difficulty_elo_base'] is not None:
            base_diff = row_q['difficulty_elo_base']
        elif row_q['b'] is not None:
            base_diff = irt_b_to_elo(row_q['b'])
        else:
            base_diff = 1500.0  # Default

        # Fetch skills for this question
        cursor.execute(query_s, (question_id,))
        rows_s = cursor.fetchall()

        q_skills = []

        # Apply weight heuristic if weights look like defaults (all 1.0)
        # Heuristic: Primary skills share 70%, Secondary skills share 30%
        use_heuristic = not rows_s or all(r['weight'] == 1.0 or r['weight'] is None for r in rows_s)

        if use_heuristic and rows_s:
            primaries = [r for r in rows_s if r['skill_type'] == 'primary']
            secondaries = [r for r in rows_s if r['skill_type'] == 'secondary']

            if primaries and secondaries:
                # Both types: 70% to primaries, 30% to secondaries
                w_p = 0.7 / len(primaries)
                w_s = 0.3 / len(secondaries)
                for r in primaries:
                    q_skills.append(QuestionSkill(skill_id=r['skill_id'], weight=w_p))
                for r in secondaries:
                    q_skills.append(QuestionSkill(skill_id=r['skill_id'], weight=w_s))
            elif primaries:
                # Only primaries: split evenly
                w = 1.0 / len(primaries)
                for r in primaries:
                    q_skills.append(QuestionSkill(skill_id=r['skill_id'], weight=w))
            elif secondaries:
                # Only secondaries: split evenly
                w = 1.0 / len(secondaries)
                for r in secondaries:
                    q_skills.append(QuestionSkill(skill_id=r['skill_id'], weight=w))
        else:
            # Use explicit weights from database
            for r in rows_s:
                q_skills.append(QuestionSkill(
                    skill_id=r['skill_id'],
                    weight=r['weight'] if r['weight'] else 1.0
                ))

        # Normalize weights to ensure they sum to 1.0
        if q_skills:
            total_weight = sum(qs.weight for qs in q_skills)
            if total_weight > 0:
                for qs in q_skills:
                    qs.weight /= total_weight

        # Create Question object with string ID
        q_obj = Question(
            id=question_id,
            difficulty_elo_base=base_diff,
            skills=q_skills
        )

        # QuestionRating is not used (question updates disabled - Rasch IRT handles difficulty)
        return q_obj, None


def persist_user_elo_rating(rating: UserSkillRating) -> None:
    """Upsert user skill rating."""
    query = """
        INSERT INTO user_elo_ratings (id, user_id, skill_id, rating, num_updates, last_updated)
        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
            rating = excluded.rating,
            num_updates = excluded.num_updates,
            last_updated = CURRENT_TIMESTAMP
    """
    rec_id = generate_id("UER")

    with get_db_cursor() as cursor:
        cursor.execute(query, (
            rec_id,
            rating.user_id,
            rating.skill_id,  # Now using string ID directly
            rating.rating,
            rating.num_updates
        ))


def elo_online_update(user_id: str, new_evidence: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Process new evidence and update user Elo ratings.
    """
    # 1. Fetch all user ratings (so we have them for the update)
    user_ratings = fetch_user_elo_ratings(user_id)
    
    # Initialize missing ratings if necessary
    # We need to know which skills are involved in the new evidence to ensure we have ratings for them.
    # But we don't know the skills until we fetch the questions.
    # We will handle initialization inside the loop or pre-fetch.
    
    updates_log = []
    
    for item in new_evidence:
        qid = item['question_id']
        is_correct = item['is_correct']
        
        # Fetch question data
        try:
            question, question_rating = fetch_question_elo_data(qid)
        except ValueError:
            continue # Skip unknown questions
            
        # Ensure user has ratings for these skills
        for qs in question.skills:
            if qs.skill_id not in user_ratings:
                user_ratings[qs.skill_id] = UserSkillRating(
                    user_id=user_id,
                    skill_id=qs.skill_id,
                    rating=DEFAULT_RATING,
                    num_updates=0
                )
        
        # Perform Update
        # We do NOT update question ratings per user request
        result = update_elo(
            user_ratings=user_ratings,
            question=question,
            question_rating=question_rating,
            is_correct=is_correct,
            update_question=False 
        )
        
        updates_log.append({
            'question_id': qid,
            'delta': result.get('delta'),
            'skill_updates': result.get('skill_updates')
        })
        
        # Persist changes for this question immediately (or batch at end)
        # The `user_ratings` dict is updated in-place by `update_elo`.
        # We should persist the changed skills.
        for skill_update in result.get('skill_updates', []):
            sid = skill_update['skill_id']
            persist_user_elo_rating(user_ratings[sid])
            
    return {
        "user_id": user_id,
        "updates_processed": len(updates_log),
        "details": updates_log
    }

