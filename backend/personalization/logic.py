"""
Business logic for Personalization layer
Handles personalized study plans and adaptive learning recommendations
"""
import sqlite3
import os
import json
from utils import generate_id, generate_sequential_id
from datetime import datetime, timedelta, date

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
                'video_id': task['video_id'] if 'video_id' in task.keys() else None,
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
    """Generate a 10-week study plan with drill tasks and video lessons based on diagnostic results."""

    # Check if user already has a plan
    if has_study_plan(user_id):
        raise ValueError("User already has a study plan")

    # Get diagnostic results to analyze weak skills
    # For now, we'll create a standard 10-week plan
    # TODO: Analyze diagnostic results and personalize tasks

    total_weeks = 10
    start_date = date.today()

    # Get available videos from database
    conn = get_db_connection()
    cursor = conn.cursor()
    video_rows = cursor.execute("SELECT id, title FROM videos ORDER BY category, difficulty").fetchall()
    videos = {row['id']: row['title'] for row in video_rows}
    video_ids = list(videos.keys())
    conn.close()

    # Define task templates for each week (mix of drills and videos)
    # Weeks 1-3: Focus on fundamentals with easier drills
    # Weeks 4-7: Mixed practice with increasing difficulty
    # Weeks 8-10: Advanced practice and comprehensive review

    week_templates = [
        # Week 1: Fundamentals
        [
            {'type': 'video', 'video_id': video_ids[0] if len(video_ids) > 0 else None, 'minutes': 25},
            {'type': 'drill', 'title': 'Assumption Identification', 'difficulties': ['Easy', 'Medium'], 'skills': ['Assumption'], 'questions': 5, 'time': 100, 'minutes': 15},
            {'type': 'drill', 'title': 'Strengthen Arguments', 'difficulties': ['Easy', 'Medium'], 'skills': ['Strengthen'], 'questions': 5, 'time': 100, 'minutes': 15},
        ],
        # Week 2: Building Skills
        [
            {'type': 'drill', 'title': 'Weaken Arguments', 'difficulties': ['Easy', 'Medium'], 'skills': ['Weaken'], 'questions': 5, 'time': 100, 'minutes': 15},
            {'type': 'video', 'video_id': video_ids[1] if len(video_ids) > 1 else None, 'minutes': 32},
            {'type': 'drill', 'title': 'Parallel Reasoning', 'difficulties': ['Medium'], 'skills': ['Parallel Reasoning'], 'questions': 5, 'time': 100, 'minutes': 18},
        ],
        # Week 3: Mixed Practice
        [
            {'type': 'drill', 'title': 'Inference Questions', 'difficulties': ['Medium'], 'skills': ['Inference'], 'questions': 5, 'time': 100, 'minutes': 18},
            {'type': 'drill', 'title': 'Flaw Detection', 'difficulties': ['Medium'], 'skills': ['Flaw'], 'questions': 5, 'time': 100, 'minutes': 18},
            {'type': 'video', 'video_id': video_ids[2] if len(video_ids) > 2 else None, 'minutes': 30},
        ],
        # Week 4: Increasing Difficulty
        [
            {'type': 'drill', 'title': 'Mixed Fundamentals', 'difficulties': ['Easy', 'Medium'], 'skills': ['Assumption', 'Strengthen', 'Weaken'], 'questions': 5, 'time': 100, 'minutes': 18},
            {'type': 'video', 'video_id': video_ids[3] if len(video_ids) > 3 else None, 'minutes': 34},
            {'type': 'drill', 'title': 'Advanced Assumptions', 'difficulties': ['Medium', 'Hard'], 'skills': ['Assumption'], 'questions': 5, 'time': 100, 'minutes': 20},
        ],
        # Week 5: Advanced Practice
        [
            {'type': 'drill', 'title': 'Complex Weakening', 'difficulties': ['Medium', 'Hard'], 'skills': ['Weaken'], 'questions': 5, 'time': 100, 'minutes': 20},
            {'type': 'drill', 'title': 'Challenging Inference', 'difficulties': ['Hard'], 'skills': ['Inference'], 'questions': 5, 'time': 130, 'minutes': 22},
            {'type': 'video', 'video_id': video_ids[4] if len(video_ids) > 4 else None, 'minutes': 41},
        ],
        # Week 6: Timed Practice
        [
            {'type': 'video', 'video_id': video_ids[5] if len(video_ids) > 5 else None, 'minutes': 37},
            {'type': 'drill', 'title': 'Evaluation Questions', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
            {'type': 'drill', 'title': 'Principle Questions', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
        ],
        # Week 7: Comprehensive Review
        [
            {'type': 'drill', 'title': 'Method of Reasoning', 'difficulties': ['Hard'], 'skills': [], 'questions': 5, 'time': 130, 'minutes': 22},
            {'type': 'video', 'video_id': video_ids[6] if len(video_ids) > 6 else None, 'minutes': 30},
            {'type': 'drill', 'title': 'Mixed Review - Timed', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 70, 'minutes': 12},
        ],
        # Week 8: Test Prep
        [
            {'type': 'drill', 'title': 'Challenging Mixed Set', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
            {'type': 'drill', 'title': 'Advanced Reasoning', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 130, 'minutes': 22},
            {'type': 'video', 'video_id': video_ids[7] if len(video_ids) > 7 else None, 'minutes': 28},
        ],
        # Week 9: Final Review
        [
            {'type': 'drill', 'title': 'Full Skill Review 1', 'difficulties': ['Easy', 'Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 18},
            {'type': 'drill', 'title': 'Full Skill Review 2', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 18},
            {'type': 'drill', 'title': 'Challenge Set', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 130, 'minutes': 22},
        ],
        # Week 10: Final Prep
        [
            {'type': 'drill', 'title': 'Test-Like Conditions 1', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 70, 'minutes': 12},
            {'type': 'drill', 'title': 'Test-Like Conditions 2', 'difficulties': ['Medium', 'Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 70, 'minutes': 12},
            {'type': 'drill', 'title': 'Confidence Builder', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
        ],
    ]

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Generate study plan ID (random alphanumeric)
        study_plan_id = generate_id('sp')  # e.g., sp-m8n3k1

        # Create study plan
        cursor.execute("""
            INSERT INTO study_plans (id, user_id, diagnostic_drill_id, total_weeks, start_date)
            VALUES (?, ?, ?, ?, ?)
        """, (study_plan_id, user_id, diagnostic_drill_id, total_weeks, start_date.isoformat()))

        # Create tasks for each week
        total_tasks = 0
        for week_num, week_tasks in enumerate(week_templates, start=1):
            for task_order, task_template in enumerate(week_tasks, start=1):
                task_type = task_template.get('type', 'drill')
                task_id = generate_id('spt')  # e.g., spt-p7x2k9

                if task_type == 'video':
                    # Video task
                    video_id = task_template.get('video_id')
                    if video_id:  # Only create task if video exists
                        video_title = videos.get(video_id, 'Video Lesson')
                        cursor.execute("""
                            INSERT INTO study_plan_tasks (
                                id, study_plan_id, week_number, task_order,
                                task_type, title, estimated_minutes, task_config, video_id
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            task_id,
                            study_plan_id,
                            week_num,
                            task_order,
                            'video',
                            video_title,
                            task_template['minutes'],
                            json.dumps({}),  # Empty config for videos
                            video_id
                        ))
                        total_tasks += 1
                else:
                    # Drill task
                    task_config = {
                        'question_count': task_template['questions'],
                        'difficulties': task_template['difficulties'],
                        'skills': task_template['skills'],
                        'time_percentage': task_template['time'],
                        'drill_type': 'practice'
                    }

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
                    total_tasks += 1

        conn.commit()

        return {
            'study_plan_id': study_plan_id,
            'user_id': user_id,
            'total_weeks': total_weeks,
            'total_tasks': total_tasks,
            'start_date': start_date.isoformat(),
            'message': 'Study plan generated successfully'
        }
