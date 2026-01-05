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
    QuestionRating,
    update_elo,
    DEFAULT_RATING,
    ELO_SCALE
)




skill_taxonomy = [('LR-01', 'Identify Conclusion'), ('LR-02', 'Identify Premises'), ('LR-03', 'Identify Assumptions'), ('LR-04', 'Strengthen Argument'), ('LR-05', 'Weaken Argument'), ('LR-06', 'Identify Flaw'), ('LR-07', 'Necessary Conditions'), ('LR-08', 'Sufficient Conditions'), ('LR-09', 'Conditional Logic'), ('LR-10', 'Must Be True/Inference'), ('LR-11', 'Resolve Paradox'), ('LR-12', 'Parallel Reasoning'), ('LR-13', 'Parallel Flaw'), ('LR-14', 'Method of Reasoning'), ('LR-15', 'Role of Statement'), ('LR-16', 'Principle - Identify'), ('LR-17', 'Principle - Apply'), ('LR-18', 'Evaluate Argument'), ('RC-01', 'Main Point/Primary Purpose'), ('RC-02', 'Passage Structure/Organization'), ('RC-03', "Author's Attitude/Tone"), ('RC-04', "Author's Purpose"), ('RC-05', 'Specific Detail Retrieval'), ('RC-06', 'Explicit Information'), ('RC-07', 'Inference'), ('RC-08', 'Must Be True'), ('RC-09', 'Strengthen/Support'), ('RC-10', 'Weaken/Challenge'), ('RC-11', 'Analogous Reasoning'), ('RC-12', 'Function of Paragraph/Section'), ('RC-13', 'Comparative Analysis'), ('RC-14', 'Point of Agreement/Disagreement'), ('RC-15', 'Identify Argument'), ('RC-16', 'Evaluate Evidence'), ('RC-17', 'Vocabulary in Context')]


def transform_response_payload(responses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    response_vals = []
    qid_list = []
    for item in responses:
        qid_list.append(item["question_id"])
        response_vals.append(1 if item["is_correct"] else 0)
    return qid_list, torch.tensor(response_vals, dtype=torch.float32)




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


def irt_online_update(user_id: str, new_evidence: List[Dict[str, Any]]) -> None:
    """Perform an online IRT update for the given user with new evidence."""
    # ASSUMES NO ITEM DUPLICATES IN EACH PAYLOAD, UPDATE b TENSOR TO FIX IF NEEDED
    prior_var = 1.0  # HAVE NOT YET IMPLEMENTED VAR UPDATES
    qids, responses = transform_response_payload(new_evidence)

    theta0 = fetch_current_ability("irt", user_id)['ability_theta']
    prior_mean = theta0
    b = get_item_difficulties(qids)
    new_theta = rasch_online_update_theta_torch(responses, b, theta0, prior_mean, prior_var)
    with get_db_cursor() as cursor:
        cursor.execute("""UPDATE user_abilities SET theta_scalar = %s, last_updated = CURRENT_TIMESTAMP WHERE user_id = %s;""", (new_theta, user_id))
    return "Successfully updated user ability theta."


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


def fetch_user_elo_ratings(user_id: str) -> Dict[int, UserSkillRating]:
    """
    Fetch all skill ratings for a user.
    Returns a dict mapping skill_id (int) -> UserSkillRating.
    """
    ratings = {}
    query = "SELECT skill_id, rating, num_updates FROM user_elo_ratings WHERE user_id = %s"
    
    with get_db_cursor() as cursor:
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        
        for row in rows:
            # skill_id in DB is string (e.g., 'LR-01'), but Elo system uses int IDs if possible.
            # However, our system uses string IDs. We need to map or adapt.
            # The elo_system.py uses int IDs in the dataclasses. 
            # Let's assume we can hash the string ID to int or just use the string if the dataclass allows.
            # Checking elo_system.py: `skill_id: int`. 
            # We should probably map our string IDs to ints or modify elo_system to accept strings.
            # For now, let's assume we map string IDs to a stable hash or index.
            # Actually, `skill_taxonomy` is a list of tuples. We can use the index in `skill_taxonomy` + 1 as the ID.
            
            skill_str_id = row['skill_id']
            skill_int_id = _get_skill_int_id(skill_str_id)
            
            ratings[skill_int_id] = UserSkillRating(
                user_id=user_id, # This expects int in dataclass but we pass str? 
                # elo_system.py: `user_id: int`. We need to be careful.
                # Let's override/ignore the type hint or fix elo_system.
                # Python doesn't enforce types at runtime, so passing str is fine if logic doesn't do math on it.
                skill_id=skill_int_id,
                rating=row['rating'],
                num_updates=row['num_updates']
            )
            # Fix user_id type mismatch in object if needed, but likely fine.
            ratings[skill_int_id].user_id = user_id 

    return ratings


def _get_skill_int_id(skill_str_id: str) -> int:
    """Helper to map string skill ID to int index."""
    for idx, (tax_id, _) in enumerate(skill_taxonomy):
        if tax_id == skill_str_id:
            return idx + 1
    return 0 # Unknown


def _get_skill_str_id(skill_int_id: int) -> str:
    """Helper to map int skill ID back to string."""
    if 1 <= skill_int_id <= len(skill_taxonomy):
        return skill_taxonomy[skill_int_id - 1][0]
    return "UNKNOWN"


def fetch_question_elo_data(question_id: str):
    """
    Fetch Question object and its QuestionRating.
    """
    # 1. Fetch Question Details (Difficulty, Skills)
    # We need to join with question_skills
    query_q = "SELECT b, difficulty_elo_base FROM questions WHERE id = %s"
    query_s = "SELECT skill_id, skill_type, weight FROM question_skills WHERE question_id = %s"
    
    with get_db_cursor() as cursor:
        cursor.execute(query_q, (question_id,))
        row_q = cursor.fetchone()
        
        if not row_q:
            raise ValueError(f"Question {question_id} not found")
            
        # Determine base difficulty
        if row_q['difficulty_elo_base'] is not None:
            base_diff = row_q['difficulty_elo_base']
        elif row_q['b'] is not None:
            base_diff = irt_b_to_elo(row_q['b'])
        else:
            base_diff = 1500.0 # Default
            
        # Fetch skills
        cursor.execute(query_s, (question_id,))
        rows_s = cursor.fetchall()
        
        q_skills = []
        
        # If no weights stored, apply heuristic
        # Heuristic: Primary sum = 0.7, Secondary sum = 0.3
        primaries = [r for r in rows_s if r['skill_type'] == 'primary']
        secondaries = [r for r in rows_s if r['skill_type'] == 'secondary']
        
        # If we have weights in DB, use them. If all weights are 1.0 (default) or NULL, apply heuristic?
        # Let's assume if 'weight' column exists and is populated, we use it.
        # But since we are just adding the column, it might be default 1.0.
        # Let's apply heuristic if weights look like defaults (all 1.0) or if we want to enforce it.
        # For safety, let's calculate weights if they seem unset.
        
        use_heuristic = True
        if rows_s and any(r['weight'] != 1.0 for r in rows_s):
            use_heuristic = False
            
        if use_heuristic:
            w_p = 0.7 / len(primaries) if primaries else 0
            w_s = 0.3 / len(secondaries) if secondaries else 0
            
            for r in primaries:
                q_skills.append(QuestionSkill(skill_id=_get_skill_int_id(r['skill_id']), weight=w_p))
            for r in secondaries:
                q_skills.append(QuestionSkill(skill_id=_get_skill_int_id(r['skill_id']), weight=w_s))
                
            # If no primaries but secondaries, or vice versa, normalize?
            # If only primaries, w_p = 1.0 / len.
            if not secondaries and primaries:
                for qs in q_skills: qs.weight = 1.0 / len(primaries)
            elif not primaries and secondaries:
                for qs in q_skills: qs.weight = 1.0 / len(secondaries)
                
        else:
            for r in rows_s:
                q_skills.append(QuestionSkill(
                    skill_id=_get_skill_int_id(r['skill_id']), 
                    weight=r['weight']
                ))

        # Create Question object
        # Question ID in dataclass is int, we have str. 
        # We'll use a hash or just 0 since we don't strictly need it for the math, 
        # but let's try to be consistent.
        q_obj = Question(
            id=hash(question_id) % 1000000, # Mock int ID
            difficulty_elo_base=base_diff,
            skills=q_skills
        )
        
        # 2. Fetch Question Rating (Delta)
        query_qr = "SELECT rating_delta, num_updates FROM question_elo_ratings WHERE question_id = %s"
        cursor.execute(query_qr, (question_id,))
        row_qr = cursor.fetchone()
        
        qr_obj = None
        if row_qr:
            qr_obj = QuestionRating(
                question_id=q_obj.id,
                rating_delta=row_qr['rating_delta'],
                num_updates=row_qr['num_updates']
            )
            
        return q_obj, qr_obj


def persist_user_elo_rating(rating: UserSkillRating) -> None:
    """Upsert user skill rating."""
    skill_str_id = _get_skill_str_id(rating.skill_id)
    
    query = """
        INSERT INTO user_elo_ratings (id, user_id, skill_id, rating, num_updates, last_updated)
        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
            rating = excluded.rating,
            num_updates = excluded.num_updates,
            last_updated = CURRENT_TIMESTAMP
    """
    # Generate ID if inserting
    # We can't easily know if it's insert or update without checking, 
    # but ON CONFLICT handles the data. The 'id' field is required for insert.
    # We can generate a deterministic ID or random.
    rec_id = generate_id("UER")
    
    with get_db_cursor() as cursor:
        cursor.execute(query, (
            rec_id, 
            rating.user_id, 
            skill_str_id, 
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

