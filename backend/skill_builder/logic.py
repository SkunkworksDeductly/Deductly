"""
Business logic for Skill Builder layer
Handles drill practice sessions and skill development
"""
import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from .skills import ALLOWED_SKILLS

# Path to data files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'deductly.db')

# Drill configuration constraints
ALLOWED_QUESTION_COUNTS = {5, 10, 15, 25}
ALLOWED_DIFFICULTIES = {'Easy', 'Medium', 'Hard', 'Challenging'}
TIMING_MULTIPLIERS = {
    70: 0.7,
    100: 1.0,
    130: 1.3,
}
SECONDS_PER_QUESTION = 90


class DrillConfigurationError(ValueError):
    """Raised when drill configuration data is invalid."""


class QuestionAvailabilityError(LookupError):
    """Raised when the datastore cannot satisfy the requested drill."""


def get_db_connection():
    """Create a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_drill_session(payload: dict) -> dict:
    """
    Generate a drill session using LSAT questions stored in SQLite.

    Payload contract:
        question_count: 5 | 10 | 15 | 25 (default 5)
        difficulties: list of difficulty strings from ALLOWED_DIFFICULTIES (default ['Medium'])
        skills: list of LSAT skill names (default empty for any skill)
        time_percentage: 70 | 100 | 130 | 'untimed' (default 100)
    """
    config = _parse_drill_config(payload or {})

    questions = _fetch_questions(
        config['difficulties'], config['skills'], config['question_count']
    )
    time_limit_seconds, time_label = _compute_time_limit(
        config['question_count'], config['time_percentage']
    )

    session_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    return {
        'session_id': session_id,
        'config': config,
        'questions': questions,
        'time_limit_seconds': time_limit_seconds,
        'time_limit_label': time_label,
        'created_at': created_at,
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


def _parse_drill_config(payload: dict) -> dict:
    """Validate and normalize drill configuration inputs."""
    try:
        question_count = int(payload.get('question_count', 5))
    except (TypeError, ValueError) as exc:
        raise DrillConfigurationError('question_count must be an integer') from exc

    if question_count not in ALLOWED_QUESTION_COUNTS:
        raise DrillConfigurationError(
            f'question_count must be one of {sorted(ALLOWED_QUESTION_COUNTS)}'
        )

    raw_difficulties = payload.get('difficulties')
    if raw_difficulties is None:
        difficulties = ['Medium']
    elif isinstance(raw_difficulties, list):
        seen = set()
        difficulties = []
        for diff in raw_difficulties:
            if diff is None:
                continue
            normalized = str(diff).strip()
            if not normalized:
                continue
            if normalized not in seen:
                seen.add(normalized)
                difficulties.append(normalized)
    else:
        raise DrillConfigurationError('difficulties must be an array of strings')

    if not difficulties:
        raise DrillConfigurationError('difficulties must include at least one value')

    invalid = [d for d in difficulties if d not in ALLOWED_DIFFICULTIES]
    if invalid:
        raise DrillConfigurationError(
            f'difficulties contain invalid values: {invalid}; '
            f'allowed values are {sorted(ALLOWED_DIFFICULTIES)}'
        )

    raw_skills = payload.get('skills')
    if raw_skills is None:
        skills: List[str] = []
    elif isinstance(raw_skills, list):
        seen_skills = set()
        skills = []
        for skill in raw_skills:
            if skill is None:
                continue
            normalized_skill = str(skill).strip()
            if not normalized_skill:
                continue
            if normalized_skill not in seen_skills:
                seen_skills.add(normalized_skill)
                skills.append(normalized_skill)
    else:
        raise DrillConfigurationError('skills must be an array of strings')

    invalid_skills = [s for s in skills if s not in ALLOWED_SKILLS]
    if invalid_skills:
        raise DrillConfigurationError(
            f'skills contain invalid values: {invalid_skills}; '
            f'allowed values are {sorted(ALLOWED_SKILLS)}'
        )

    time_percentage = payload.get('time_percentage', 100)
    if isinstance(time_percentage, str) and time_percentage.lower() == 'untimed':
        normalized_time = 'untimed'
    else:
        try:
            normalized_time = int(time_percentage)
        except (TypeError, ValueError) as exc:
            raise DrillConfigurationError(
                'time_percentage must be 70, 100, 130, or "untimed"'
            ) from exc
        if normalized_time not in TIMING_MULTIPLIERS:
            raise DrillConfigurationError('time_percentage must be 70, 100, or 130')

    return {
        'question_count': question_count,
        'difficulties': difficulties,
        'skills': skills,
        'time_percentage': normalized_time,
    }


def _fetch_questions(
    difficulties: List[str], skills: List[str], question_count: int
) -> List[dict]:
    """Pull questions from SQLite for the requested difficulty band."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        filters = ['domain = ?']
        params: List[object] = ['lsat']

        if difficulties:
            diff_placeholders = ','.join('?' for _ in difficulties)
            filters.append(f'difficulty_level IN ({diff_placeholders})')
            params.extend(difficulties)

        if skills:
            skill_placeholders = ','.join('?' for _ in skills)
            filters.append(f'question_type IN ({skill_placeholders})')
            params.extend(skills)

        where_clause = ' AND '.join(filters)

        targeted_query = f"""
            SELECT id, question_text, answer_choices, correct_answer,
                   difficulty_level, question_type, passage_text
            FROM questions
            WHERE {where_clause}
            ORDER BY RANDOM()
            LIMIT ?
        """
        rows = list(
            cursor.execute(targeted_query, [*params, question_count]).fetchall()
        )

        if len(rows) < question_count:
            remaining = question_count - len(rows)
            selected_ids = [row['id'] for row in rows]

            fallback_query = """
                SELECT id, question_text, answer_choices, correct_answer,
                       difficulty_level, question_type, passage_text
                FROM questions
                WHERE domain = ?
            """
            fallback_params: List[object] = ['lsat']
            if selected_ids:
                id_placeholders = ','.join('?' for _ in selected_ids)
                fallback_query += f" AND id NOT IN ({id_placeholders})"
                fallback_params.extend(selected_ids)

            fallback_query += """
                ORDER BY RANDOM()
                LIMIT ?
            """
            fallback_params.append(remaining)

            rows.extend(cursor.execute(fallback_query, fallback_params).fetchall())

        if len(rows) < question_count:
            raise QuestionAvailabilityError(
                f'Only {len(rows)} total questions available; requested {question_count}'
            )

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


def _compute_time_limit(
    question_count: int, time_percentage: Optional[int]
) -> Tuple[Optional[int], str]:
    """Return time limit in seconds plus a human-readable label."""
    if time_percentage == 'untimed':
        return None, 'untimed'

    multiplier = TIMING_MULTIPLIERS[time_percentage]
    total_seconds = int(question_count * SECONDS_PER_QUESTION * multiplier)
    return total_seconds, _format_duration(total_seconds)


def _format_duration(total_seconds: int) -> str:
    """Format seconds as Xm Ys."""
    minutes, seconds = divmod(total_seconds, 60)
    if minutes and seconds:
        return f'{minutes}m {seconds}s'
    if minutes:
        return f'{minutes}m'
    return f'{seconds}s'


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
