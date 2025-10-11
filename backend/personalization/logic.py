"""
Business logic for Personalization layer
Handles personalized study plans and adaptive learning recommendations
"""
import sqlite3
import os
from datetime import datetime, timedelta

from skill_builder.logic import create_drill_session

# Path to data files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'deductly.db')

# Sample data (will be replaced with database queries)
sample_study_plans = [
    {
        'id': 1,
        'subject': 'Mathematics',
        'level': 'Beginner',
        'topics': ['Basic Arithmetic', 'Simple Algebra', 'Geometry Basics'],
        'duration': '4 weeks',
        'progress': 25
    },
    {
        'id': 2,
        'subject': 'Science',
        'level': 'Intermediate',
        'topics': ['Physics Fundamentals', 'Chemistry Basics', 'Biology Introduction'],
        'duration': '6 weeks',
        'progress': 60
    }
]

def get_db_connection():
    """Create a database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_all_study_plans():
    """Retrieve all study plans"""
    # TODO: Replace with database query
    return sample_study_plans

def get_study_plan_by_id(plan_id):
    """Retrieve a specific study plan by ID"""
    # TODO: Replace with database query
    return next((p for p in sample_study_plans if p['id'] == plan_id), None)

def create_personalized_plan(user_id, subject, level, goals):
    """Create a personalized study plan based on user profile"""
    # TODO: Implement AI-driven personalization logic
    # For now, return a sample plan

    # Determine duration based on level
    duration_map = {
        'Beginner': '4 weeks',
        'Intermediate': '6 weeks',
        'Advanced': '8 weeks'
    }

    new_plan = {
        'id': len(sample_study_plans) + 1,
        'user_id': user_id,
        'subject': subject,
        'level': level,
        'topics': goals if goals else [f'{subject} Fundamentals'],
        'duration': duration_map.get(level, '6 weeks'),
        'progress': 0,
        'created_at': datetime.now().isoformat(),
        'estimated_completion': (datetime.now() + timedelta(weeks=6)).isoformat()
    }

    sample_study_plans.append(new_plan)
    return new_plan

def update_plan_progress(plan_id, progress):
    """Update the progress of a study plan"""
    plan = get_study_plan_by_id(plan_id)

    if not plan:
        return None

    # Update progress
    plan['progress'] = min(max(progress, 0), 100)
    plan['updated_at'] = datetime.now().isoformat()

    return plan

def get_recommendations(user_id):
    """Get personalized recommendations for a user"""
    # TODO: Implement recommendation algorithm
    # This would analyze user performance and suggest topics/resources
    pass


def create_diagnostic_session():
    """Create a standardized diagnostic drill of 5 LSAT questions."""
    payload = {
        'question_count': 5,
        'difficulties': ['Easy', 'Medium', 'Hard', 'Challenging'],
        'skills': [],
        'time_percentage': 'untimed'
    }
    return create_drill_session(payload)
