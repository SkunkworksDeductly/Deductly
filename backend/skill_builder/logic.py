"""
Business logic for Skill Builder layer
Handles drill practice sessions and skill development
"""
import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone

# Path to data files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'deductly.db')

# Drill configuration defaults
SECONDS_PER_QUESTION = 90
TIMING_MULTIPLIERS = {70: 0.7, 100: 1.0, 130: 1.3}

def get_db_connection():
    """Create a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_drill_session(payload):
    """Generate a drill session using LSAT questions from SQLite."""
    question_count = payload.get('question_count', 5)
    difficulties = payload.get('difficulties', ['Medium'])
    skills = payload.get('skills', [])
    time_percentage = payload.get('time_percentage', 100)

    questions = _fetch_questions(difficulties, skills, question_count)
    time_limit_seconds = _compute_time_limit(question_count, time_percentage)

    return {
        'session_id': str(uuid.uuid4()),
        'question_count': question_count,
        'difficulties': difficulties,
        'skills': skills,
        'questions': questions,
        'time_limit_seconds': time_limit_seconds,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }


def submit_drill_answers(session_id, answers):
    """Process drill answers and calculate score."""
    total_questions = len(answers)
    correct_answers = sum(1 for answer in answers if answer.get('is_correct', False))
    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0

    return {
        'session_id': session_id,
        'total_questions': total_questions,
        'correct_answers': correct_answers,
        'score': score,
        'feedback': 'Great job!' if score >= 80 else 'Keep practicing!',
        'submitted_at': datetime.now().isoformat()
    }


def _fetch_questions(difficulties, skills, question_count):
    """Pull questions from SQLite for the requested filters."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

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

        where_clause = ' AND '.join(filters)
        query = f"""
            SELECT id, question_text, answer_choices, correct_answer,
                   difficulty_level, question_type, passage_text
            FROM questions
            WHERE {where_clause}
            ORDER BY RANDOM()
            LIMIT ?
        """

        rows = cursor.execute(query, [*params, question_count]).fetchall()

        # Fallback if not enough questions found
        if len(rows) < question_count:
            remaining = question_count - len(rows)
            selected_ids = [row['id'] for row in rows]

            if selected_ids:
                id_placeholders = ','.join('?' * len(selected_ids))
                fallback_query = f"""
                    SELECT id, question_text, answer_choices, correct_answer,
                           difficulty_level, question_type, passage_text
                    FROM questions
                    WHERE domain = ? AND id NOT IN ({id_placeholders})
                    ORDER BY RANDOM()
                    LIMIT ?
                """
                fallback_rows = cursor.execute(
                    fallback_query, ['lsat', *selected_ids, remaining]
                ).fetchall()
            else:
                fallback_query = """
                    SELECT id, question_text, answer_choices, correct_answer,
                           difficulty_level, question_type, passage_text
                    FROM questions
                    WHERE domain = ?
                    ORDER BY RANDOM()
                    LIMIT ?
                """
                fallback_rows = cursor.execute(fallback_query, ['lsat', remaining]).fetchall()

            rows.extend(fallback_rows)

    questions = []
    for row in rows:
        try:
            choices = json.loads(row['answer_choices']) if row['answer_choices'] else []
        except json.JSONDecodeError:
            choices = []

        questions.append({
            'id': row['id'],
            'question_text': row['question_text'],
            'answer_choices': choices,
            'correct_answer': row['correct_answer'],
            'difficulty_level': row['difficulty_level'],
            'question_type': row['question_type'],
            'passage_text': row['passage_text'],
        })

    return questions


def _compute_time_limit(question_count, time_percentage):
    """Calculate time limit in seconds."""
    if time_percentage == 'untimed':
        return None

    multiplier = TIMING_MULTIPLIERS.get(time_percentage, 1.0)
    return int(question_count * SECONDS_PER_QUESTION * multiplier)


def get_skill_progression(user_id, subject):
    """Track skill progression for a user in a specific subject."""
    # TODO: Implement skill tracking logic
    # This would analyze drill performance over time
    pass


def get_weak_areas(user_id):
    """Identify weak areas for targeted practice."""
    # TODO: Implement weakness detection algorithm
    # This would analyze performance data to identify topics needing improvement
    pass
