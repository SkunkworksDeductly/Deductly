from flask import Blueprint, jsonify, request, current_app
from .logic import (
    create_drill_session, submit_drill_answers, start_drill,
    get_user_drill_history, get_drill_by_id, get_drill_result,
    save_drill_progress
)
from .curriculum_logic import (
    get_all_videos, get_video_by_id, get_related_videos, mark_video_complete, mark_video_incomplete
)
import firebase_admin
from firebase_admin import auth as firebase_auth
import requests

skill_builder_bp = Blueprint('skill_builder', __name__, url_prefix='/api/skill-builder')

def get_user_id_from_token():
    """Extract user_id from Firebase auth token in request headers."""
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split('Bearer ')[1]

    try:
        if not firebase_admin._apps:
            return None

        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception:
        return None


def _update_insights(user_id, answers):
    """
    Update user ability estimates and skill mastery via insights endpoints.

    Args:
        user_id: The user's unique identifier
        answers: List of answer dictionaries with question_id and is_correct fields
    """
    # Transform answers into the format expected by insights endpoints
    new_evidence = [
        {
            'question_id': answer.get('question_id'),
            'is_correct': answer.get('is_correct', False)
        }
        for answer in answers
        if answer.get('question_id') is not None
    ]

    # Skip if no valid evidence
    if not new_evidence:
        print(f"No valid evidence to update insights for user {user_id}")
        return

    # Get the base URL from the app config or construct it
    # Since we're in the same Flask app, we can use localhost
    base_url = 'http://localhost:5001/api/insights'

    try:
        # Update IRT ability estimates
        irt_response = requests.post(
            f'{base_url}/online/irt/update/{user_id}',
            json={'new_evidence': new_evidence},
            timeout=5
        )
        if irt_response.status_code == 200:
            print(f"Successfully updated IRT estimates for user {user_id}")
        else:
            print(f"Failed to update IRT estimates: {irt_response.status_code} - {irt_response.text}")
    except Exception as e:
        print(f"Error updating IRT estimates for user {user_id}: {e}")

    try:
        # Update GLMM skill mastery
        glmm_response = requests.post(
            f'{base_url}/online/glmm/update/{user_id}',
            json={'new_evidence': new_evidence},
            timeout=5
        )
        if glmm_response.status_code == 200:
            print(f"Successfully updated GLMM mastery for user {user_id}")
        else:
            print(f"Failed to update GLMM mastery: {glmm_response.status_code} - {glmm_response.text}")
    except Exception as e:
        print(f"Error updating GLMM mastery for user {user_id}: {e}")


@skill_builder_bp.route('/drill', methods=['POST'])
def drill():
    """Create a drill session backed by LSAT question inventory."""
    payload = request.get_json() or {}

    # Extract user_id from Firebase auth token or fallback to payload
    user_id = get_user_id_from_token()
    if not user_id:
        user_id = payload.get('user_id', 'anonymous')

    payload['user_id'] = user_id
    result = create_drill_session(payload)
    return jsonify(result)

@skill_builder_bp.route('/drill/<drill_id>/start', methods=['POST'])
def start_drill_endpoint(drill_id):
    """Mark a drill as started."""
    result = start_drill(drill_id)

    if not result:
        return jsonify({'error': 'Drill not found or already started'}), 404

    return jsonify(result)

@skill_builder_bp.route('/drill/submit', methods=['POST'])
def submit():
    """Submit drill answers and get feedback"""
    data = request.get_json()
    drill_id = data.get('session_id') or data.get('drill_id')

    # Extract user_id from Firebase auth token or fallback to payload
    user_id = get_user_id_from_token()
    if not user_id:
        user_id = data.get('user_id', 'anonymous')

    answers = data.get('answers', [])
    time_taken = data.get('time_taken')

    if not drill_id:
        return jsonify({'error': 'drill_id or session_id is required'}), 400

    try:
        result = submit_drill_answers(drill_id, user_id, answers, time_taken)

        # Call insights endpoints to update user estimates and mastery
        _update_insights(user_id, answers)

        return jsonify(result)
    except Exception as e:
        print(f"Error submitting drill: {e}")
        return jsonify({'error': str(e)}), 500

@skill_builder_bp.route('/drills/generate', methods=['POST'])
def generate():
    """Alias for drill creation to support legacy clients."""
    payload = request.get_json() or {}
    result = create_drill_session(payload)
    return jsonify(result)

@skill_builder_bp.route('/drills/history', methods=['GET'])
def drill_history():
    """Get drill history for a user."""
    # Extract user_id from Firebase auth token or fallback to query param
    user_id = get_user_id_from_token()
    if not user_id:
        user_id = request.args.get('user_id', 'anonymous')

    limit = request.args.get('limit', 50, type=int)

    drills = get_user_drill_history(user_id, limit)
    return jsonify({
        'drills': drills,
        'count': len(drills)
    })

@skill_builder_bp.route('/drills/<drill_id>', methods=['GET'])
def get_drill(drill_id):
    """Get a specific drill by ID."""
    include_questions = request.args.get('include_questions', 'false').lower() == 'true'
    drill = get_drill_by_id(drill_id, include_questions=include_questions)

    if not drill:
        return jsonify({'error': 'Drill not found'}), 404

    return jsonify(drill)

@skill_builder_bp.route('/drills/<drill_id>/results', methods=['GET'])
def drill_results(drill_id):
    """Get results for a specific drill."""
    # Extract user_id from Firebase auth token or fallback to query param
    user_id = get_user_id_from_token()
    if not user_id:
        user_id = request.args.get('user_id', 'anonymous')

    result = get_drill_result(drill_id, user_id)

    if not result:
        return jsonify({'error': 'Drill results not found'}), 404

    return jsonify(result)

@skill_builder_bp.route('/drills/<drill_id>/progress', methods=['POST'])
def save_progress(drill_id):
    """Save partial progress for a drill."""
    # Extract user_id from Firebase auth token or fallback to payload
    user_id = get_user_id_from_token()
    data = request.get_json() or {}

    if not user_id:
        user_id = data.get('user_id', 'anonymous')

    current_question_index = data.get('current_question_index', 0)
    user_answers = data.get('user_answers', {})
    user_highlights = data.get('user_highlights', None)

    success = save_drill_progress(drill_id, user_id, current_question_index, user_answers, user_highlights)

    if not success:
        return jsonify({'error': 'Failed to save progress'}), 404

    return jsonify({
        'message': 'Progress saved successfully',
        'drill_id': drill_id,
        'current_question_index': current_question_index
    })

# Curriculum / Video Routes

@skill_builder_bp.route('/curriculum/videos', methods=['GET'])
def get_videos():
    """Get all videos in the curriculum."""
    videos = get_all_videos()
    return jsonify({
        'videos': videos,
        'count': len(videos)
    })

@skill_builder_bp.route('/curriculum/videos/<video_id>', methods=['GET'])
def get_video(video_id):
    """Get a specific video by ID with user completion status."""
    user_id = get_user_id_from_token()

    video = get_video_by_id(video_id, user_id)

    if not video:
        return jsonify({'error': 'Video not found'}), 404

    # Get related videos
    related_videos = get_related_videos(video_id, limit=5)

    return jsonify({
        'video': video,
        'related_videos': related_videos
    })

@skill_builder_bp.route('/curriculum/videos/<video_id>/complete', methods=['POST'])
def complete_video(video_id):
    """Mark a video as complete for the current user."""
    user_id = get_user_id_from_token()

    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    success = mark_video_complete(video_id, user_id)

    if not success:
        return jsonify({'error': 'Failed to mark video as complete. Make sure this video is in your study plan.'}), 400

    return jsonify({
        'message': 'Video marked as complete',
        'video_id': video_id
    })

@skill_builder_bp.route('/curriculum/videos/<video_id>/incomplete', methods=['POST'])
def incomplete_video(video_id):
    """Mark a video as incomplete for the current user."""
    user_id = get_user_id_from_token()

    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    success = mark_video_incomplete(video_id, user_id)

    if not success:
        return jsonify({'error': 'Failed to mark video as incomplete. Make sure this video is in your study plan.'}), 400

    return jsonify({
        'message': 'Video marked as incomplete',
        'video_id': video_id
    })
