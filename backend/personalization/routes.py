from flask import Blueprint, jsonify, request
from .logic import (
    create_diagnostic_session,
    has_completed_diagnostic,
    has_study_plan,
    get_user_study_plan,
    generate_study_plan_from_diagnostic,
    mark_task_completed,
    link_drill_to_task
)
from middleware.auth import get_user_id_from_token

personalization_bp = Blueprint('personalization', __name__, url_prefix='/api/personalization')

@personalization_bp.route('/diagnostic', methods=['POST'])
def create_diagnostic():
    """Generate a 5-question LSAT diagnostic session."""
    data = request.get_json() or {}
    user_id = data.get('user_id', 'anonymous')
    result = create_diagnostic_session(user_id)
    return jsonify(result), 201


# ============================================================================
# STUDY PLAN ROUTES
# ============================================================================

@personalization_bp.route('/study-plan', methods=['GET'])
def get_study_plan():
    """Get user's study plan with all tasks."""
    # Extract user_id from Firebase auth token
    user_id = get_user_id_from_token()

    if not user_id:
        auth_header = request.headers.get('Authorization', '')
        return jsonify({
            'error': 'Authentication required',
            'message': 'Valid Firebase authentication token required',
            'has_auth_header': bool(auth_header),
            'is_bearer_token': auth_header.startswith('Bearer ') if auth_header else False
        }), 401

    # Check if user has completed diagnostic
    if not has_completed_diagnostic(user_id):
        return jsonify({
            'has_diagnostic': False,
            'has_study_plan': False,
            'message': 'Please complete a diagnostic test first'
        }), 200

    # Check if user has study plan
    if not has_study_plan(user_id):
        return jsonify({
            'has_diagnostic': True,
            'has_study_plan': False,
            'message': 'Generate your study plan to get started'
        }), 200

    # Get study plan
    plan = get_user_study_plan(user_id)

    if not plan:
        return jsonify({'error': 'Study plan not found'}), 404

    return jsonify({
        'has_diagnostic': True,
        'has_study_plan': True,
        **plan
    }), 200


@personalization_bp.route('/study-plan/generate', methods=['POST'])
def generate_plan():
    """Generate study plan from latest diagnostic."""
    # Extract user_id from Firebase auth token
    user_id = get_user_id_from_token()

    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    # Check if user has completed diagnostic
    if not has_completed_diagnostic(user_id):
        return jsonify({'error': 'Please complete a diagnostic test first'}), 400

    # Check if user already has a study plan
    if has_study_plan(user_id):
        return jsonify({'error': 'You already have a study plan'}), 400

    # Get latest diagnostic drill_id
    # For now, we'll pass None and the function will create a standard plan
    # TODO: Fetch actual diagnostic_drill_id from database
    diagnostic_drill_id = None

    try:
        result = generate_study_plan_from_diagnostic(user_id, diagnostic_drill_id)
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error generating study plan: {e}")
        return jsonify({'error': 'Failed to generate study plan'}), 500


@personalization_bp.route('/study-plan/task/<task_id>/link-drill', methods=['POST'])
def link_task_drill(task_id):
    """Link a drill to a task and mark it as in_progress."""
    # Extract user_id from Firebase auth token
    user_id = get_user_id_from_token()

    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    data = request.get_json() or {}
    drill_id = data.get('drill_id')

    if not drill_id:
        return jsonify({'error': 'drill_id is required'}), 400

    try:
        success = link_drill_to_task(task_id, drill_id)

        if success:
            return jsonify({'message': 'Drill linked to task', 'task_id': task_id}), 200
        else:
            return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        print(f"Error linking drill to task: {e}")
        return jsonify({'error': 'Failed to link drill'}), 500


@personalization_bp.route('/study-plan/task/<task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Mark a task as completed."""
    # Extract user_id from Firebase auth token
    user_id = get_user_id_from_token()

    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    data = request.get_json() or {}
    drill_id = data.get('drill_id')

    if not drill_id:
        return jsonify({'error': 'drill_id is required'}), 400

    try:
        success = mark_task_completed(task_id, drill_id)

        if success:
            return jsonify({'message': 'Task marked as completed', 'task_id': task_id}), 200
        else:
            return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        print(f"Error completing task: {e}")
        return jsonify({'error': 'Failed to complete task'}), 500
