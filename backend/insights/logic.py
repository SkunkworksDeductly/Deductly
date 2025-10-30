"""
Business logic stubs for the Insights layer.
These helpers back the ability estimation (IRT) and skill mastery (CDM) routes.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List
from utils import generate_id, generate_sequential_id
import os
import json
import sqlite3
import torch
from db import get_db_connection, get_db_cursor, execute_query
from .irt_implementation import rasch_online_update_theta_torch
from .glmm_implementation import RaschFrozenSkillGLMM, micro_update_one


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
        query = f"SELECT b FROM item_difficulties WHERE question_id = ?"
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
    query = "SELECT theta_scalar FROM user_abilities WHERE user_id = ?"
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
                   VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)""",
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
    query = "SELECT mastery_vector FROM user_abilities WHERE user_id = ?"
    with get_db_cursor() as cursor:
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()

    if row and row[0]:
        try:
            mastery_vec = json.loads(row[0])
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
        cursor.execute("""UPDATE user_abilities SET theta_scalar = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?;""", (new_theta, user_id))
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
        WHERE qs.question_id = ?
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
    query = "SELECT mastery_vector FROM user_abilities WHERE user_id = ?"

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
        cursor.execute("SELECT id FROM user_abilities WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()

        if row:
            # Update existing record
            cursor.execute(
                """UPDATE user_abilities
                   SET mastery_vector = ?, last_updated = CURRENT_TIMESTAMP
                   WHERE user_id = ?""",
                (mastery_json, user_id)
            )
        else:
            # Insert new record with default theta
            new_id = generate_id("UA")
            cursor.execute(
                """INSERT INTO user_abilities (id, user_id, theta_scalar, mastery_vector, last_updated)
                   VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)""",
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
