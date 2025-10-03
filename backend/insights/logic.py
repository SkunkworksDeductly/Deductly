"""
Business logic for Insights layer
Handles diagnostic assessments and performance analytics
"""
import sqlite3
import json
import os

# Path to data files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'deductly.db')
TAXONOMY_PATH = os.path.join(BASE_DIR, 'data', 'lsat_skills_taxonomy.json')

# Sample data (will be replaced with database queries)
sample_diagnostics = [
    {
        'id': 1,
        'subject': 'Mathematics',
        'topic': 'Algebra',
        'question': 'Solve for x: 2x + 5 = 13',
        'options': ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
        'correct_answer': 'x = 4'
    },
    {
        'id': 2,
        'subject': 'Science',
        'topic': 'Physics',
        'question': 'What is the speed of light in vacuum?',
        'options': ['299,792,458 m/s', '300,000,000 m/s', '299,000,000 m/s', '298,000,000 m/s'],
        'correct_answer': '299,792,458 m/s'
    }
]

def get_db_connection():
    """Create a database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def load_taxonomy():
    """Load the LSAT skills taxonomy"""
    try:
        with open(TAXONOMY_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def get_all_diagnostics():
    """Retrieve all diagnostic questions"""
    # TODO: Replace with database query
    return sample_diagnostics

def get_diagnostic_by_id(diagnostic_id):
    """Retrieve a specific diagnostic by ID"""
    # TODO: Replace with database query
    return next((d for d in sample_diagnostics if d['id'] == diagnostic_id), None)

def validate_diagnostic_answer(question_id, user_answer):
    """Validate a user's answer and return feedback"""
    question = get_diagnostic_by_id(question_id)

    if not question:
        return None

    is_correct = question['correct_answer'] == user_answer

    return {
        'question_id': question_id,
        'is_correct': is_correct,
        'correct_answer': question['correct_answer'] if not is_correct else None,
        'explanation': f"The correct answer is {question['correct_answer']}" if not is_correct else "Correct!"
    }

def get_questions_filtered(subject=None, topic=None, difficulty=None, limit=None):
    """Get questions with optional filtering"""
    questions = sample_diagnostics.copy()

    # Apply filters
    if subject:
        questions = [q for q in questions if q.get('subject', '').lower() == subject.lower()]

    if topic:
        questions = [q for q in questions if q.get('topic', '').lower() == topic.lower()]

    if difficulty:
        questions = [q for q in questions if q.get('difficulty', '').lower() == difficulty.lower()]

    # Apply limit
    if limit and limit > 0:
        questions = questions[:limit]

    return {
        'questions': questions,
        'total': len(questions),
        'filters_applied': {
            'subject': subject,
            'topic': topic,
            'difficulty': difficulty,
            'limit': limit
        }
    }
