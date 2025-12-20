"""
Curriculum logic for video lessons
"""
import json
from datetime import datetime
from db import get_db_connection, get_db_cursor

def get_all_videos():
    """Get all videos from the curriculum."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM videos
        ORDER BY category, difficulty, title
    ''')

    videos = []
    for row in cursor.fetchall():
        video = dict(row)
        # Parse JSON fields
        if video.get('skill_ids'):
            try:
                video['skill_ids'] = json.loads(video['skill_ids'])
            except:
                video['skill_ids'] = []
        else:
            video['skill_ids'] = []

        if video.get('key_topics'):
            try:
                video['key_topics'] = json.loads(video['key_topics'])
            except:
                video['key_topics'] = []
        else:
            video['key_topics'] = []

        videos.append(video)

    conn.close()
    return videos

def get_video_by_id(video_id, user_id=None):
    """Get a specific video by ID with optional user completion status."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM videos WHERE id = %s', (video_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return None

    video = dict(row)

    # Parse JSON fields
    if video.get('skill_ids'):
        try:
            video['skill_ids'] = json.loads(video['skill_ids'])
        except:
            video['skill_ids'] = []
    else:
        video['skill_ids'] = []

    if video.get('key_topics'):
        try:
            video['key_topics'] = json.loads(video['key_topics'])
        except:
            video['key_topics'] = []
    else:
        video['key_topics'] = []

    # Check if user has completed this video (via study plan tasks)
    video['is_completed'] = False
    if user_id:
        cursor.execute('''
            SELECT completed_at FROM study_plan_tasks
            WHERE video_id = %s AND status = 'completed'
            AND study_plan_id IN (SELECT id FROM study_plans WHERE user_id = %s)
            LIMIT 1
        ''', (video_id, user_id))
        completed = cursor.fetchone()
        if completed:
            video['is_completed'] = True

    conn.close()
    return video

def get_related_videos(video_id, limit=5):
    """Get related videos based on category."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get the category of the current video
    cursor.execute('SELECT category FROM videos WHERE id = %s', (video_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return []

    category = row['category']

    # Get other videos in the same category
    cursor.execute('''
        SELECT * FROM videos
        WHERE category = %s AND id != %s
        ORDER BY difficulty, title
        LIMIT %s
    ''', (category, video_id, limit))

    videos = []
    for row in cursor.fetchall():
        video = dict(row)
        # Parse JSON fields
        if video.get('skill_ids'):
            try:
                video['skill_ids'] = json.loads(video['skill_ids'])
            except:
                video['skill_ids'] = []
        else:
            video['skill_ids'] = []

        videos.append(video)

    conn.close()
    return videos

def mark_video_complete(video_id, user_id):
    """
    Mark a video as complete by updating the study_plan_tasks table.
    Finds any incomplete task with this video_id for the user's study plan.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Find and mark task as complete
        cursor.execute('''
            UPDATE study_plan_tasks
            SET status = 'completed', completed_at = %s
            WHERE video_id = %s
            AND study_plan_id IN (
                SELECT id FROM study_plans WHERE user_id = %s
            )
            AND status != 'completed'
        ''', (datetime.utcnow().isoformat(), video_id, user_id))

        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success
    except Exception as e:
        print(f"Error marking video complete: {e}")
        conn.close()
        return False

def mark_video_incomplete(video_id, user_id):
    """
    Mark a video as incomplete by updating the study_plan_tasks table.
    Finds any completed task with this video_id for the user's study plan.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Find and mark task as incomplete
        cursor.execute('''
            UPDATE study_plan_tasks
            SET status = 'pending', completed_at = NULL
            WHERE video_id = %s
            AND study_plan_id IN (
                SELECT id FROM study_plans WHERE user_id = %s
            )
            AND status = 'completed'
        ''', (video_id, user_id))

        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success
    except Exception as e:
        print(f"Error marking video incomplete: {e}")
        conn.close()
        return False
