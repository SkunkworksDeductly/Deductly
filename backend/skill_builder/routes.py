from flask import Blueprint, jsonify, request
from .logic import (
    create_drill_session, submit_drill_answers, start_drill,
    get_user_drill_history, get_drill_by_id, get_drill_result,
    save_drill_progress
)
import firebase_admin
from firebase_admin import auth as firebase_auth

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
