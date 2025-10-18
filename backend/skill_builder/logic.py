"""
Business logic for Skill Builder layer
Handles drill practice sessions and skill development
"""
import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone

# Import ID generator
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.id_generator import generate_id

# Path to data files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'deductly.db')

# Drill configuration defaults
SECONDS_PER_QUESTION = 90
TIMING_MULTIPLIERS = {70: 0.7, 100: 1.0, 130: 1.3}

# Query constants
QUESTION_SELECT_FIELDS = [
    'id', 'question_text', 'answer_choices', 'correct_answer',
    'difficulty_level', 'question_type', 'passage_text'
]

def get_db_connection():
    """Create a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_drill_session(payload):
    """Generate a drill session using LSAT questions from SQLite and save to DB."""
    user_id = payload.get('user_id', 'anonymous')
    question_count = payload.get('question_count', 5)
    difficulties = payload.get('difficulties', ['Medium'])
    skills = payload.get('skills', [])
    time_percentage = payload.get('time_percentage', 100)
    drill_type = payload.get('drill_type', 'practice')

    questions = _fetch_questions(difficulties, skills, question_count)
    time_limit_seconds = _compute_time_limit(question_count, time_percentage)

    # Save drill to database
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Generate drill IDs (random alphanumeric)
        pk_id = generate_id('dr')  # e.g., dr-a3f2b9
        drill_id = str(uuid.uuid4())  # Keep drill_id as UUID for external references

        # Extract question IDs for storage
        question_ids = [q['id'] for q in questions]

        cursor.execute("""
            INSERT INTO drills (
                id, drill_id, user_id, question_count, timing,
                difficulty, skills, drill_type, question_ids, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pk_id,
            drill_id,
            user_id,
            question_count,
            time_limit_seconds,
            json.dumps(difficulties) if isinstance(difficulties, list) else difficulties,
            json.dumps(skills),
            drill_type,
            json.dumps(question_ids),
            'generated'
        ))
        conn.commit()

    return {
        'drill_id': drill_id,
        'session_id': drill_id,  # Keep for backwards compatibility
        'question_count': question_count,
        'difficulties': difficulties,
        'skills': skills,
        'questions': questions,
        'time_limit_seconds': time_limit_seconds,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }


def submit_drill_answers(drill_id, user_id, answers, time_taken=None):
    """Process drill answers, calculate score, and save results to DB."""
    # Calculate metrics
    total_questions = len(answers)
    correct_answers = sum(1 for answer in answers if answer.get('is_correct', False))
    incorrect_answers = sum(1 for answer in answers if not answer.get('is_correct', False) and answer.get('user_answer'))
    skipped_questions = sum(1 for answer in answers if not answer.get('user_answer'))
    score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0

    # Calculate skill-level performance
    skill_performance = {}
    for answer in answers:
        question_skills = answer.get('skills', [])
        is_correct = answer.get('is_correct', False)

        for skill in question_skills:
            if skill not in skill_performance:
                skill_performance[skill] = {'correct': 0, 'total': 0}
            skill_performance[skill]['total'] += 1
            if is_correct:
                skill_performance[skill]['correct'] += 1

    # Save results to database
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Generate drill result ID (random alphanumeric)
        result_id = generate_id('dres')  # e.g., dres-k4m2p1

        # Insert drill results
        cursor.execute("""
            INSERT INTO drill_results (
                id, drill_id, user_id, total_questions, correct_answers,
                incorrect_answers, skipped_questions, score_percentage,
                time_taken, question_results, skill_performance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            result_id,
            drill_id,
            user_id,
            total_questions,
            correct_answers,
            incorrect_answers,
            skipped_questions,
            score_percentage,
            time_taken,
            json.dumps(answers),
            json.dumps(skill_performance)
        ))

        # Update drill status to completed
        cursor.execute("""
            UPDATE drills
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE drill_id = ?
        """, (drill_id,))

        conn.commit()

    return {
        'drill_id': drill_id,
        'session_id': drill_id,  # Keep for backwards compatibility
        'total_questions': total_questions,
        'correct_answers': correct_answers,
        'incorrect_answers': incorrect_answers,
        'skipped_questions': skipped_questions,
        'score': score_percentage,
        'skill_performance': skill_performance,
        'feedback': 'Great job!' if score_percentage >= 80 else 'Keep practicing!',
        'submitted_at': datetime.now(timezone.utc).isoformat()
    }


def _build_question_query(where_filters, exclude_ids=None):
    """Build a parameterized question query with optional ID exclusion."""
    fields = ', '.join(QUESTION_SELECT_FIELDS)
    where_clause = ' AND '.join(where_filters)

    if exclude_ids:
        id_placeholders = ','.join('?' * len(exclude_ids))
        where_clause = f"{where_clause} AND id NOT IN ({id_placeholders})"

    return f"""
        SELECT {fields}
        FROM questions
        WHERE {where_clause}
        ORDER BY RANDOM()
        LIMIT ?
    """


def _transform_question_row(row):
    """Transform a SQLite row into a structured question dict."""
    try:
        choices = json.loads(row['answer_choices']) if row['answer_choices'] else []
    except json.JSONDecodeError:
        choices = []

    return {
        'id': row['id'],
        'question_text': row['question_text'],
        'answer_choices': choices,
        'correct_answer': row['correct_answer'],
        'difficulty_level': row['difficulty_level'],
        'question_type': row['question_type'],
        'passage_text': row['passage_text'],
    }


def _fetch_questions(difficulties, skills, question_count):
    """Pull questions from SQLite for the requested filters."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Build primary query filters
        filters = ['domain = ?']
        params = ['lsat']

        if difficulties:
            placeholders = ','.join('?' * len(difficulties))
            filters.append(f'difficulty_level IN ({placeholders})')
            params.extend(difficulties)

        if skills:
            placeholders = ','.join('?' * len(skills))
            filters.append(f'question_type IN ({placeholders})')
            params.extend(skills)

        # Execute primary query
        query = _build_question_query(filters)
        rows = cursor.execute(query, [*params, question_count]).fetchall()

        # Fallback if not enough questions found
        if len(rows) < question_count:
            remaining = question_count - len(rows)
            selected_ids = [row['id'] for row in rows]

            # Build fallback query with ID exclusion
            fallback_query = _build_question_query(['domain = ?'], exclude_ids=selected_ids)
            fallback_params = ['lsat']
            if selected_ids:
                fallback_params.extend(selected_ids)
            fallback_params.append(remaining)

            fallback_rows = cursor.execute(fallback_query, fallback_params).fetchall()
            rows.extend(fallback_rows)

    return [_transform_question_row(row) for row in rows]


def _compute_time_limit(question_count, time_percentage):
    """Calculate time limit in seconds."""
    if time_percentage == 'untimed':
        return None

    multiplier = TIMING_MULTIPLIERS.get(time_percentage, 1.0)
    return int(question_count * SECONDS_PER_QUESTION * multiplier)


def start_drill(drill_id):
    """Mark a drill as started and set the started_at timestamp."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE drills
            SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
            WHERE drill_id = ? AND status = 'generated'
        """, (drill_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return None

        return {'drill_id': drill_id, 'status': 'in_progress', 'started_at': datetime.now(timezone.utc).isoformat()}


def get_user_drill_history(user_id, limit=50):
    """Retrieve drill history for a user."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute("""
            SELECT d.drill_id, d.question_count, d.timing, d.difficulty,
                   d.skills, d.drill_type, d.status, d.created_at, d.completed_at,
                   dr.score_percentage, dr.correct_answers, dr.total_questions
            FROM drills d
            LEFT JOIN drill_results dr ON d.drill_id = dr.drill_id
            WHERE d.user_id = ?
            ORDER BY d.created_at DESC
            LIMIT ?
        """, (user_id, limit)).fetchall()

        drills = []
        for row in rows:
            drill = {
                'drill_id': row['drill_id'],
                'question_count': row['question_count'],
                'timing': row['timing'],
                'difficulty': json.loads(row['difficulty']) if row['difficulty'] else None,
                'skills': json.loads(row['skills']) if row['skills'] else [],
                'drill_type': row['drill_type'],
                'status': row['status'],
                'created_at': row['created_at'],
                'completed_at': row['completed_at'],
            }
            # Add result info if completed
            if row['score_percentage'] is not None:
                drill['score_percentage'] = row['score_percentage']
                drill['correct_answers'] = row['correct_answers']
                drill['total_questions'] = row['total_questions']

            drills.append(drill)

        return drills


def get_drill_by_id(drill_id, include_questions=False):
    """Retrieve a specific drill by ID, optionally with full question data."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute("""
            SELECT drill_id, user_id, question_count, timing, difficulty,
                   skills, drill_type, question_ids, status, created_at, completed_at,
                   current_question_index, user_answers, user_highlights
            FROM drills
            WHERE drill_id = ?
        """, (drill_id,)).fetchone()

        if not row:
            return None

        drill_data = {
            'drill_id': row['drill_id'],
            'user_id': row['user_id'],
            'question_count': row['question_count'],
            'timing': row['timing'],
            'difficulty': json.loads(row['difficulty']) if row['difficulty'] else None,
            'skills': json.loads(row['skills']) if row['skills'] else [],
            'drill_type': row['drill_type'],
            'question_ids': json.loads(row['question_ids']) if row['question_ids'] else [],
            'status': row['status'],
            'created_at': row['created_at'],
            'completed_at': row['completed_at'],
            'current_question_index': row['current_question_index'] or 0,
            'user_answers': json.loads(row['user_answers']) if row['user_answers'] else {},
            'user_highlights': json.loads(row['user_highlights']) if row['user_highlights'] else {},
        }

        # Include full question data if requested
        if include_questions and drill_data['question_ids']:
            question_ids = drill_data['question_ids']
            placeholders = ','.join('?' * len(question_ids))
            fields = ', '.join(QUESTION_SELECT_FIELDS)

            question_rows = cursor.execute(f"""
                SELECT {fields}
                FROM questions
                WHERE id IN ({placeholders})
            """, question_ids).fetchall()

            # Maintain original order
            questions_by_id = {row['id']: _transform_question_row(row) for row in question_rows}
            drill_data['questions'] = [questions_by_id[qid] for qid in question_ids if qid in questions_by_id]

        return drill_data


def get_drill_result(drill_id, user_id):
    """Retrieve results for a specific drill."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute("""
            SELECT dr.*, d.question_count, d.timing, d.difficulty, d.skills, d.drill_type
            FROM drill_results dr
            JOIN drills d ON dr.drill_id = d.drill_id
            WHERE dr.drill_id = ? AND dr.user_id = ?
        """, (drill_id, user_id)).fetchone()

        if not row:
            return None

        return {
            'drill_id': row['drill_id'],
            'user_id': row['user_id'],
            'total_questions': row['total_questions'],
            'correct_answers': row['correct_answers'],
            'incorrect_answers': row['incorrect_answers'],
            'skipped_questions': row['skipped_questions'],
            'score_percentage': row['score_percentage'],
            'time_taken': row['time_taken'],
            'question_results': json.loads(row['question_results']) if row['question_results'] else [],
            'skill_performance': json.loads(row['skill_performance']) if row['skill_performance'] else {},
            'completed_at': row['completed_at'],
            'drill_config': {
                'question_count': row['question_count'],
                'timing': row['timing'],
                'difficulty': json.loads(row['difficulty']) if row['difficulty'] else None,
                'skills': json.loads(row['skills']) if row['skills'] else [],
                'drill_type': row['drill_type'],
            }
        }


def get_skill_progression(user_id, subject):
    """Track skill progression for a user in a specific subject."""
    # TODO: Implement skill tracking logic
    # This would analyze drill performance over time
    pass


def save_drill_progress(drill_id, user_id, current_question_index, user_answers, user_highlights=None):
    """Save partial progress for a drill (for resuming later)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Update drill with current progress
        cursor.execute("""
            UPDATE drills
            SET current_question_index = ?,
                user_answers = ?,
                user_highlights = ?,
                status = CASE
                    WHEN status = 'generated' THEN 'in_progress'
                    ELSE status
                END
            WHERE drill_id = ? AND user_id = ?
        """, (
            current_question_index,
            json.dumps(user_answers),
            json.dumps(user_highlights) if user_highlights else None,
            drill_id,
            user_id
        ))

        conn.commit()
        return cursor.rowcount > 0


def get_weak_areas(user_id):
    """Identify weak areas for targeted practice."""
    # TODO: Implement weakness detection algorithm
    # This would analyze performance data to identify topics needing improvement
    pass
