"""
Adaptive Diagnostic Logic

Core functions for the question-by-question adaptive LR diagnostic.
Selects questions based on user's current Elo rating and updates Elo after each answer.
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Set

from db.connection import get_db_cursor, execute_query
from utils.id_generator import generate_id
from insights.logic import (
    fetch_user_elo_ratings,
    elo_online_update,
    fetch_question_elo_data,
)
from insights.elo_system import DEFAULT_RATING

from .adaptive_diagnostic_config import (
    DIAGNOSTIC_SEQUENCE,
    QUESTION_TYPE_SKILLS,
    DEFAULT_ELO,
    get_tier_for_position,
)


# Cache for taxonomy_id -> database_id mapping
_skill_id_cache: Dict[str, str] = {}


def _get_skill_db_id(taxonomy_id: str) -> Optional[str]:
    """
    Convert a taxonomy skill ID (e.g., 'S_01') to a database ID (e.g., 'skill-xyz').

    Args:
        taxonomy_id: The taxonomy skill ID like 'S_01', 'FL_03', etc.

    Returns:
        The database ID, or None if not found
    """
    global _skill_id_cache

    if not _skill_id_cache:
        # Populate cache on first call
        query = "SELECT id, skill_id FROM skills"
        rows = execute_query(query)
        for row in rows:
            _skill_id_cache[row['skill_id']] = row['id']

    return _skill_id_cache.get(taxonomy_id)


def _get_taxonomy_skill_ids(db_ids: List[str]) -> Dict[str, str]:
    """
    Get mapping of database IDs to taxonomy IDs.

    Args:
        db_ids: List of database skill IDs

    Returns:
        Dict mapping db_id -> taxonomy_id
    """
    if not db_ids:
        return {}

    placeholders = ','.join(['%s'] * len(db_ids))
    query = f"SELECT id, skill_id FROM skills WHERE id IN ({placeholders})"
    rows = execute_query(query, tuple(db_ids))

    return {row['id']: row['skill_id'] for row in rows}


def get_user_effective_elo(user_id: str, question_type: str) -> float:
    """
    Compute the effective Elo rating for question selection.

    Averages the user's Elo ratings across the primary skills for the given question type.
    If user has no ratings, returns DEFAULT_ELO.

    Args:
        user_id: The user ID
        question_type: The question type (e.g., 'Must Be True', 'Weaken')

    Returns:
        The effective Elo rating to use for question selection
    """
    taxonomy_skill_ids = QUESTION_TYPE_SKILLS.get(question_type, [])

    if not taxonomy_skill_ids:
        return DEFAULT_ELO

    # Convert taxonomy IDs to database IDs
    db_skill_ids = []
    for tax_id in taxonomy_skill_ids:
        db_id = _get_skill_db_id(tax_id)
        if db_id:
            db_skill_ids.append(db_id)

    if not db_skill_ids:
        return DEFAULT_ELO

    # Fetch user's Elo ratings
    user_ratings = fetch_user_elo_ratings(user_id)

    # Calculate average Elo across the relevant skills
    total_elo = 0.0
    count = 0

    for db_id in db_skill_ids:
        if db_id in user_ratings:
            total_elo += user_ratings[db_id].rating
            count += 1
        else:
            # Use default for skills without ratings
            total_elo += DEFAULT_ELO
            count += 1

    return total_elo / count if count > 0 else DEFAULT_ELO


def select_question_for_slot(
    question_type: str,
    target_elo: float,
    exclude_ids: Set[str]
) -> Optional[Dict[str, Any]]:
    """
    Select a question of the given type closest to the target Elo.

    Args:
        question_type: The question type to select
        target_elo: The target difficulty (user's effective Elo)
        exclude_ids: Set of question IDs to exclude (already used)

    Returns:
        Question dict with id, question_text, answer_choices, etc., or None if no questions available
    """
    with get_db_cursor() as cursor:
        # Build exclusion clause
        exclude_clause = ""
        params = [question_type.lower(), 'lsat']

        if exclude_ids:
            placeholders = ','.join(['%s'] * len(exclude_ids))
            exclude_clause = f"AND id NOT IN ({placeholders})"
            params.extend(list(exclude_ids))

        params.append(target_elo)

        # Query for question closest to target Elo
        # COALESCE handles NULL difficulty_elo_base by using 1500 as default
        query = f"""
            SELECT id, question_text, answer_choices, correct_answer,
                   difficulty_level, question_type, passage_text,
                   COALESCE(difficulty_elo_base, 1500.0) as difficulty_elo_base
            FROM questions
            WHERE LOWER(question_type) = %s
              AND LOWER(domain) = %s
              {exclude_clause}
            ORDER BY ABS(COALESCE(difficulty_elo_base, 1500.0) - %s)
            LIMIT 1
        """

        cursor.execute(query, params)
        row = cursor.fetchone()

        if not row:
            return None

        # Parse answer_choices from JSON if needed
        answer_choices = row['answer_choices']
        if isinstance(answer_choices, str):
            try:
                answer_choices = json.loads(answer_choices)
            except json.JSONDecodeError:
                answer_choices = []

        return {
            'id': row['id'],
            'question_text': row['question_text'],
            'answer_choices': answer_choices,
            'correct_answer': row['correct_answer'],
            'difficulty_level': row['difficulty_level'],
            'question_type': row['question_type'],
            'passage_text': row['passage_text'],
            'difficulty_elo_base': row['difficulty_elo_base'],
        }


def create_adaptive_diagnostic_session(user_id: str) -> Dict[str, Any]:
    """
    Create a new adaptive diagnostic session.

    1. Creates session record in database
    2. Initializes Elo snapshots
    3. Selects first question based on user's current Elo

    Args:
        user_id: The user ID

    Returns:
        Dict with session_id, first question, and progress info
    """
    session_id = generate_id("ads")

    # Get first question type from sequence
    first_question_type = DIAGNOSTIC_SEQUENCE[0]

    # Get user's effective Elo for this question type
    target_elo = get_user_effective_elo(user_id, first_question_type)

    # Select first question
    first_question = select_question_for_slot(first_question_type, target_elo, set())

    if not first_question:
        raise ValueError(f"No questions available for type: {first_question_type}")

    # Initialize session data
    selected_question_ids = [first_question['id']]
    user_answers = {}

    # Capture initial Elo snapshot
    user_ratings = fetch_user_elo_ratings(user_id)
    elo_snapshots = {
        skill_id: [rating.rating]
        for skill_id, rating in user_ratings.items()
    }

    # Insert session record
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO adaptive_diagnostic_sessions
            (id, user_id, diagnostic_type, status, current_position,
             selected_question_ids, user_answers, elo_snapshots, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            session_id,
            user_id,
            'lr',
            'in_progress',
            0,
            json.dumps(selected_question_ids),
            json.dumps(user_answers),
            json.dumps(elo_snapshots),
        ))

    return {
        'session_id': session_id,
        'question': first_question,
        'progress': {
            'current': 1,
            'total': len(DIAGNOSTIC_SEQUENCE),
            'tier': get_tier_for_position(0),
        },
        'target_elo': target_elo,
    }


def get_diagnostic_session(session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the current state of a diagnostic session.

    Args:
        session_id: The session ID
        user_id: The user ID (for verification)

    Returns:
        Session state dict, or None if not found
    """
    query = """
        SELECT id, user_id, diagnostic_type, status, current_position,
               selected_question_ids, user_answers, elo_snapshots,
               created_at, updated_at, completed_at, drill_id
        FROM adaptive_diagnostic_sessions
        WHERE id = %s AND user_id = %s
    """

    rows = execute_query(query, (session_id, user_id))

    if not rows:
        return None

    row = rows[0]

    selected_question_ids = json.loads(row['selected_question_ids'] or '[]')
    user_answers = json.loads(row['user_answers'] or '{}')

    result = {
        'session_id': row['id'],
        'user_id': row['user_id'],
        'diagnostic_type': row['diagnostic_type'],
        'status': row['status'],
        'current_position': row['current_position'],
        'selected_question_ids': selected_question_ids,
        'user_answers': user_answers,
        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
        'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None,
        'completed_at': row['completed_at'].isoformat() if row['completed_at'] else None,
        'drill_id': row['drill_id'],
        'progress': {
            'current': row['current_position'] + 1,
            'total': len(DIAGNOSTIC_SEQUENCE),
            'tier': get_tier_for_position(row['current_position']),
        },
    }

    # If in progress, include current question
    if row['status'] == 'in_progress' and row['current_position'] < len(DIAGNOSTIC_SEQUENCE):
        current_question_id = selected_question_ids[row['current_position']] if row['current_position'] < len(selected_question_ids) else None

        if current_question_id:
            # Fetch current question
            q_query = """
                SELECT id, question_text, answer_choices, correct_answer,
                       difficulty_level, question_type, passage_text,
                       COALESCE(difficulty_elo_base, 1500.0) as difficulty_elo_base
                FROM questions WHERE id = %s
            """
            q_rows = execute_query(q_query, (current_question_id,))

            if q_rows:
                q_row = q_rows[0]
                answer_choices = q_row['answer_choices']
                if isinstance(answer_choices, str):
                    try:
                        answer_choices = json.loads(answer_choices)
                    except json.JSONDecodeError:
                        answer_choices = []

                result['current_question'] = {
                    'id': q_row['id'],
                    'question_text': q_row['question_text'],
                    'answer_choices': answer_choices,
                    'correct_answer': q_row['correct_answer'],
                    'difficulty_level': q_row['difficulty_level'],
                    'question_type': q_row['question_type'],
                    'passage_text': q_row['passage_text'],
                    'difficulty_elo_base': q_row['difficulty_elo_base'],
                }

    return result


def process_answer(
    session_id: str,
    user_id: str,
    answer: str
) -> Dict[str, Any]:
    """
    Process the user's answer for the current question.

    1. Scores the answer
    2. Updates Elo ratings via elo_online_update
    3. Advances position
    4. Selects next question (if not complete)
    5. Persists state

    Args:
        session_id: The session ID
        user_id: The user ID
        answer: The user's answer (e.g., 'A', 'B', 'C', 'D', 'E')

    Returns:
        Dict with is_correct, correct_answer, next_question (if any), progress, elo_changes
    """
    # Fetch current session
    session = get_diagnostic_session(session_id, user_id)

    if not session:
        raise ValueError(f"Session {session_id} not found for user {user_id}")

    if session['status'] != 'in_progress':
        raise ValueError(f"Session {session_id} is not in progress")

    current_position = session['current_position']
    selected_question_ids = session['selected_question_ids']
    user_answers = session['user_answers']

    if current_position >= len(DIAGNOSTIC_SEQUENCE):
        raise ValueError("Diagnostic already complete")

    # Get current question
    current_question_id = selected_question_ids[current_position]

    # Fetch correct answer
    q_query = "SELECT correct_answer FROM questions WHERE id = %s"
    q_rows = execute_query(q_query, (current_question_id,))

    if not q_rows:
        raise ValueError(f"Question {current_question_id} not found")

    correct_answer = q_rows[0]['correct_answer']
    is_correct = answer.upper() == correct_answer.upper()

    # Get Elo ratings before update
    ratings_before = fetch_user_elo_ratings(user_id)
    elo_before = {sid: r.rating for sid, r in ratings_before.items()}

    # Update Elo ratings
    elo_result = elo_online_update(user_id, [{
        'question_id': current_question_id,
        'is_correct': is_correct,
    }])

    # Get Elo ratings after update
    ratings_after = fetch_user_elo_ratings(user_id)
    elo_after = {sid: r.rating for sid, r in ratings_after.items()}

    # Calculate Elo changes
    elo_changes = {}
    # Get taxonomy IDs for changed skills
    changed_db_ids = list(set(elo_before.keys()) | set(elo_after.keys()))
    tax_id_map = _get_taxonomy_skill_ids(changed_db_ids)

    for db_id in changed_db_ids:
        before = elo_before.get(db_id, DEFAULT_ELO)
        after = elo_after.get(db_id, DEFAULT_ELO)
        if before != after:
            tax_id = tax_id_map.get(db_id, db_id)
            elo_changes[tax_id] = {
                'before': round(before, 1),
                'after': round(after, 1),
                'change': round(after - before, 1),
            }

    # Record answer
    user_answers[str(current_position)] = {
        'question_id': current_question_id,
        'answer': answer.upper(),
        'correct_answer': correct_answer,
        'is_correct': is_correct,
        'elo_changes': elo_changes,
    }

    # Advance position
    next_position = current_position + 1
    is_complete = next_position >= len(DIAGNOSTIC_SEQUENCE)

    result = {
        'is_correct': is_correct,
        'correct_answer': correct_answer,
        'elo_changes': elo_changes,
        'progress': {
            'current': next_position + (0 if is_complete else 1),
            'total': len(DIAGNOSTIC_SEQUENCE),
            'tier': get_tier_for_position(next_position) if not is_complete else 'complete',
        },
        'is_complete': is_complete,
    }

    if not is_complete:
        # Select next question
        next_question_type = DIAGNOSTIC_SEQUENCE[next_position]
        target_elo = get_user_effective_elo(user_id, next_question_type)

        # Exclude already selected questions
        exclude_ids = set(selected_question_ids)

        next_question = select_question_for_slot(next_question_type, target_elo, exclude_ids)

        if not next_question:
            # Fallback: try without exclusions
            next_question = select_question_for_slot(next_question_type, target_elo, set())

        if next_question:
            selected_question_ids.append(next_question['id'])
            result['next_question'] = next_question
            result['target_elo'] = target_elo
        else:
            # No questions available - mark as complete
            is_complete = True
            result['is_complete'] = True
            result['error'] = f"No questions available for type: {next_question_type}"

    # Update session in database
    with get_db_cursor() as cursor:
        if is_complete:
            cursor.execute("""
                UPDATE adaptive_diagnostic_sessions
                SET current_position = %s,
                    selected_question_ids = %s,
                    user_answers = %s,
                    status = 'answering_complete',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND user_id = %s
            """, (
                next_position,
                json.dumps(selected_question_ids),
                json.dumps(user_answers),
                session_id,
                user_id,
            ))
        else:
            cursor.execute("""
                UPDATE adaptive_diagnostic_sessions
                SET current_position = %s,
                    selected_question_ids = %s,
                    user_answers = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND user_id = %s
            """, (
                next_position,
                json.dumps(selected_question_ids),
                json.dumps(user_answers),
                session_id,
                user_id,
            ))

    return result


def complete_diagnostic(session_id: str, user_id: str) -> Dict[str, Any]:
    """
    Finalize the diagnostic session.

    1. Creates a drill record from session data
    2. Creates drill_results record
    3. Updates IRT theta (batch update)
    4. Marks session as completed

    Args:
        session_id: The session ID
        user_id: The user ID

    Returns:
        Dict with drill_id and summary
    """
    # Fetch session
    session = get_diagnostic_session(session_id, user_id)

    if not session:
        raise ValueError(f"Session {session_id} not found for user {user_id}")

    if session['status'] not in ('answering_complete', 'in_progress'):
        if session['status'] == 'completed':
            return {
                'drill_id': session['drill_id'],
                'message': 'Diagnostic already completed',
            }
        raise ValueError(f"Session {session_id} cannot be completed (status: {session['status']})")

    selected_question_ids = session['selected_question_ids']
    user_answers = session['user_answers']

    # Calculate summary
    total_questions = len(user_answers)
    correct_answers = sum(1 for a in user_answers.values() if a.get('is_correct'))
    score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0

    # Calculate skill performance
    skill_performance = {}
    for answer_data in user_answers.values():
        question_id = answer_data['question_id']
        is_correct = answer_data.get('is_correct', False)

        # Get question type
        q_query = "SELECT question_type FROM questions WHERE id = %s"
        q_rows = execute_query(q_query, (question_id,))

        if q_rows:
            q_type = q_rows[0]['question_type']
            if q_type not in skill_performance:
                skill_performance[q_type] = {'correct': 0, 'total': 0}
            skill_performance[q_type]['total'] += 1
            if is_correct:
                skill_performance[q_type]['correct'] += 1

    # Create drill record
    drill_id = generate_id("dr")
    pk_id = generate_id("dr")

    with get_db_cursor() as cursor:
        # Insert drill
        cursor.execute("""
            INSERT INTO drills
            (id, drill_id, user_id, question_count, timing, difficulty, skills,
             drill_type, question_ids, status, created_at, completed_at, user_answers)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, %s)
        """, (
            pk_id,
            drill_id,
            user_id,
            total_questions,
            None,  # Untimed
            json.dumps(['Mixed']),
            json.dumps([]),
            'adaptive_diagnostic',
            json.dumps(selected_question_ids),
            'completed',
            json.dumps({str(i): a['answer'] for i, a in enumerate(user_answers.values())}),
        ))

        # Insert drill results
        results_id = generate_id("dres")
        question_results = [
            {
                'question_id': a['question_id'],
                'user_answer': a['answer'],
                'correct_answer': a['correct_answer'],
                'is_correct': a['is_correct'],
            }
            for a in user_answers.values()
        ]

        cursor.execute("""
            INSERT INTO drill_results
            (id, drill_id, user_id, total_questions, correct_answers,
             incorrect_answers, skipped_questions, score_percentage,
             question_results, skill_performance, completed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, (
            results_id,
            drill_id,
            user_id,
            total_questions,
            correct_answers,
            total_questions - correct_answers,
            0,
            score_percentage,
            json.dumps(question_results),
            json.dumps(skill_performance),
        ))

        # Update session
        cursor.execute("""
            UPDATE adaptive_diagnostic_sessions
            SET status = 'completed',
                completed_at = CURRENT_TIMESTAMP,
                drill_id = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
        """, (drill_id, session_id, user_id))

    # Trigger IRT update (batch)
    try:
        from insights.logic import irt_online_update
        evidence = [
            {'question_id': a['question_id'], 'is_correct': a['is_correct']}
            for a in user_answers.values()
        ]
        irt_online_update(user_id, evidence)
    except Exception as e:
        # Log but don't fail
        print(f"IRT update failed: {e}")

    return {
        'drill_id': drill_id,
        'summary': {
            'total_questions': total_questions,
            'correct_answers': correct_answers,
            'score_percentage': round(score_percentage, 1),
            'skill_performance': skill_performance,
        },
    }


def check_existing_session(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Check if user has an in-progress adaptive diagnostic session.

    Args:
        user_id: The user ID

    Returns:
        Session info if exists, None otherwise
    """
    query = """
        SELECT id, current_position, created_at
        FROM adaptive_diagnostic_sessions
        WHERE user_id = %s AND status = 'in_progress'
        ORDER BY created_at DESC
        LIMIT 1
    """

    rows = execute_query(query, (user_id,))

    if not rows:
        return None

    row = rows[0]
    return {
        'session_id': row['id'],
        'current_position': row['current_position'],
        'progress': {
            'current': row['current_position'] + 1,
            'total': len(DIAGNOSTIC_SEQUENCE),
        },
        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
    }
