"""
Business logic for Personalization layer
Handles personalized study plans and adaptive learning recommendations
"""
import sqlite3
import os
import json
from datetime import datetime, timedelta, date

from skill_builder.logic import create_drill_session
from config.study_plan_templates import WEEK_TEMPLATES, STUDY_PLAN_WEEKS, TASKS_PER_WEEK

# Import ID generator
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.id_generator import generate_id

# Path to data files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'deductly.db')

def get_db_connection():
    """Create a database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_diagnostic_session(user_id='anonymous'):
    """Create a standardized diagnostic drill of 5 LSAT questions."""
    payload = {
        'user_id': user_id,
        'question_count': 5,
        'difficulties': ['Easy', 'Medium', 'Hard', 'Challenging'],
        'skills': [],
        'time_percentage': 'untimed',
        'drill_type': 'diagnostic'
    }
    return create_drill_session(payload)


# ============================================================================
# STUDY PLAN FUNCTIONS
# ============================================================================

def has_completed_diagnostic(user_id):
    """Check if user has completed a diagnostic test."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute("""
            SELECT COUNT(*) FROM drill_results dr
            JOIN drills d ON dr.drill_id = d.drill_id
            WHERE d.user_id = ? AND d.drill_type = 'diagnostic'
        """, (user_id,)).fetchone()
        return row[0] > 0


def has_study_plan(user_id):
    """Check if user already has a study plan."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute("""
            SELECT COUNT(*) FROM study_plans WHERE user_id = ?
        """, (user_id,)).fetchone()
        return row[0] > 0


def get_user_study_plan(user_id):
    """Get user's study plan with all tasks grouped by week."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Get study plan
        plan_row = cursor.execute("""
            SELECT * FROM study_plans WHERE user_id = ?
        """, (user_id,)).fetchone()

        if not plan_row:
            return None

        # Get all tasks
        task_rows = cursor.execute("""
            SELECT * FROM study_plan_tasks
            WHERE study_plan_id = ?
            ORDER BY week_number ASC, task_order ASC
        """, (plan_row['id'],)).fetchall()

        # Calculate progress
        total_tasks = len(task_rows)
        completed_tasks = sum(1 for t in task_rows if t['status'] == 'completed')

        # Group tasks by week
        weeks = {}
        for task in task_rows:
            week_num = task['week_number']
            if week_num not in weeks:
                weeks[week_num] = []

            weeks[week_num].append({
                'id': task['id'],
                'task_type': task['task_type'],
                'title': task['title'],
                'estimated_minutes': task['estimated_minutes'],
                'task_config': json.loads(task['task_config']) if task['task_config'] else {},
                'status': task['status'],
                'drill_id': task['drill_id'],
                'completed_at': task['completed_at'],
                'task_order': task['task_order']
            })

        # Format weeks with date ranges
        weeks_list = []
        start_date = datetime.strptime(plan_row['start_date'], '%Y-%m-%d').date()

        for week_num in sorted(weeks.keys()):
            week_start = start_date + timedelta(weeks=week_num - 1)
            week_end = week_start + timedelta(days=6)

            week_tasks = weeks[week_num]
            completed_count = sum(1 for t in week_tasks if t['status'] == 'completed')

            weeks_list.append({
                'week_number': week_num,
                'start_date': week_start.isoformat(),
                'end_date': week_end.isoformat(),
                'tasks': week_tasks,
                'completed_tasks': completed_count,
                'total_tasks': len(week_tasks)
            })

        return {
            'study_plan': {
                'id': plan_row['id'],
                'user_id': plan_row['user_id'],
                'title': plan_row['title'],
                'total_weeks': plan_row['total_weeks'],
                'start_date': plan_row['start_date'],
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'created_at': plan_row['created_at']
            },
            'weeks': weeks_list
        }


def link_drill_to_task(task_id, drill_id):
    """Link a drill_id to a task and mark it as in_progress."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE study_plan_tasks
            SET drill_id = ?, status = 'in_progress'
            WHERE id = ?
        """, (drill_id, task_id))
        conn.commit()
        return cursor.rowcount > 0


def mark_task_completed(task_id, drill_id):
    """Mark a task as completed after drill submission."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE study_plan_tasks
            SET status = 'completed', drill_id = ?, completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (drill_id, task_id))
        conn.commit()
        return cursor.rowcount > 0


def generate_study_plan_from_diagnostic(user_id, diagnostic_drill_id):
    """Generate a 10-week study plan with 30 drill tasks based on diagnostic results."""

    # Check if user already has a plan
    if has_study_plan(user_id):
        raise ValueError("User already has a study plan")

    # Get diagnostic results to analyze weak skills
    # For now, we'll create a standard 10-week plan
    # TODO: Analyze diagnostic results and personalize tasks

    start_date = date.today()

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Generate study plan ID (random alphanumeric)
        study_plan_id = generate_id('sp')  # e.g., sp-m8n3k1

        # Create study plan
        cursor.execute("""
            INSERT INTO study_plans (id, user_id, diagnostic_drill_id, total_weeks, start_date)
            VALUES (?, ?, ?, ?, ?)
        """, (study_plan_id, user_id, diagnostic_drill_id, STUDY_PLAN_WEEKS, start_date.isoformat()))

        # Create tasks for each week
        for week_num, week_tasks in enumerate(WEEK_TEMPLATES, start=1):
            for task_order, task_template in enumerate(week_tasks, start=1):
                task_config = {
                    'question_count': task_template['questions'],
                    'difficulties': task_template['difficulties'],
                    'skills': task_template['skills'],
                    'time_percentage': task_template['time'],
                    'drill_type': 'practice'
                }

                # Generate task ID (random alphanumeric)
                task_id = generate_id('spt')  # e.g., spt-p7x2k9

                cursor.execute("""
                    INSERT INTO study_plan_tasks (
                        id, study_plan_id, week_number, task_order,
                        task_type, title, estimated_minutes, task_config
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    task_id,
                    study_plan_id,
                    week_num,
                    task_order,
                    'drill',
                    task_template['title'],
                    task_template['minutes'],
                    json.dumps(task_config)
                ))

        conn.commit()

        return {
            'study_plan_id': study_plan_id,
            'user_id': user_id,
            'total_weeks': STUDY_PLAN_WEEKS,
            'total_tasks': STUDY_PLAN_WEEKS * TASKS_PER_WEEK,
            'start_date': start_date.isoformat(),
            'message': 'Study plan generated successfully'
        }
