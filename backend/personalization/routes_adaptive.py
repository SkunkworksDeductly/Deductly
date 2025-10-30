"""
Adaptive Personalization Routes
Uses contextual bandit + hierarchical planning for study plan generation
"""
from flask import Blueprint, jsonify, request
import firebase_admin
from firebase_admin import auth as firebase_auth

# Import adaptive planner functions
from personalization.adaptive_planner import (
    generate_adaptive_study_plan,
    trigger_weekly_adaptation
)

# Import existing functions that are still needed
from personalization.logic import (
    get_all_study_plans,
    get_study_plan_by_id,
    create_personalized_plan,
    update_plan_progress,
    create_diagnostic_session,
    has_completed_diagnostic,
    has_study_plan,
    get_user_study_plan,
    mark_task_completed,
    link_drill_to_task
)

personalization_bp = Blueprint('personalization', __name__, url_prefix='/api/personalization')


# ============================================================================
# LEGACY ROUTES (unchanged)
# ============================================================================

@personalization_bp.route('/study-plans', methods=['GET'])
def study_plans():
    """Get all study plans"""
    return jsonify(get_all_study_plans())


@personalization_bp.route('/study-plans/<int:plan_id>', methods=['GET'])
def study_plan(plan_id):
    """Get specific study plan by ID"""
    result = get_study_plan_by_id(plan_id)
    if result:
        return jsonify(result)
    return jsonify({'error': 'Study plan not found'}), 404


@personalization_bp.route('/study-plans', methods=['POST'])
def create_plan():
    """Create a personalized study plan"""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    subject = data.get('subject')
    level = data.get('level')
    goals = data.get('goals', [])

    result = create_personalized_plan(user_id, subject, level, goals)
    return jsonify(result), 201


@personalization_bp.route('/study-plans/<int:plan_id>/progress', methods=['PUT'])
def update_progress(plan_id):
    """Update progress for a study plan"""
    data = request.get_json() or {}
    progress = data.get('progress')

    result = update_plan_progress(plan_id, progress)
    if result is None:
        return jsonify({'error': 'Study plan not found'}), 404

    return jsonify(result)


@personalization_bp.route('/diagnostic', methods=['POST'])
def create_diagnostic():
    """Generate a 5-question LSAT diagnostic session."""
    data = request.get_json() or {}
    user_id = data.get('user_id', 'anonymous')
    result = create_diagnostic_session(user_id)
    return jsonify(result), 201


# ============================================================================
# AUTH HELPER
# ============================================================================

def get_user_id_from_token():
    """Extract user_id from Firebase auth token in request headers."""
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        print(f"[AUTH DEBUG] No Bearer token found. Header: {auth_header[:50] if auth_header else 'empty'}")
        return None

    token = auth_header.split('Bearer ')[1]

    try:
        if not firebase_admin._apps:
            print("[AUTH DEBUG] Firebase not initialized")
            return None

        decoded_token = firebase_auth.verify_id_token(token)
        print(f"[AUTH DEBUG] Token verified successfully for uid: {decoded_token['uid']}")
        return decoded_token['uid']
    except Exception as e:
        print(f"[AUTH DEBUG] Token verification failed: {type(e).__name__}: {str(e)}")
        return None


# ============================================================================
# ADAPTIVE STUDY PLAN ROUTES
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
    """
    Generate adaptive study plan from diagnostic using contextual bandit.

    This uses the new adaptive planning algorithm instead of fixed templates.
    """
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

    # Get optional parameters
    data = request.get_json() or {}
    total_weeks = data.get('total_weeks', 10)
    target_test_date = data.get('target_test_date')  # ISO format date string

    # Parse target_test_date if provided
    from datetime import date
    if target_test_date:
        try:
            target_test_date = date.fromisoformat(target_test_date)
        except ValueError:
            target_test_date = None

    # Get latest diagnostic drill_id
    # TODO: Fetch actual diagnostic_drill_id from database
    diagnostic_drill_id = None

    try:
        # Generate adaptive study plan
        result = generate_adaptive_study_plan(
            user_id=user_id,
            diagnostic_drill_id=diagnostic_drill_id,
            total_weeks=total_weeks,
            target_test_date=target_test_date
        )

        return jsonify({
            **result,
            'adaptive': True,
            'algorithm': 'Thompson Sampling + Hierarchical Planning'
        }), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error generating adaptive study plan: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to generate study plan'}), 500


@personalization_bp.route('/study-plan/adapt', methods=['POST'])
def adapt_study_plan():
    """
    Trigger weekly adaptation: update bandit and replan future weeks.

    Should be called when a user completes a week of study.
    """
    # Extract user_id from Firebase auth token
    user_id = get_user_id_from_token()

    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    # Get parameters
    data = request.get_json() or {}
    completed_week = data.get('completed_week')

    if not completed_week:
        return jsonify({'error': 'completed_week is required'}), 400

    try:
        completed_week = int(completed_week)
    except ValueError:
        return jsonify({'error': 'completed_week must be an integer'}), 400

    # Get user's study plan
    from db import get_db_connection
    with get_db_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute(
            "SELECT id FROM study_plans WHERE user_id = ?",
            (user_id,)
        ).fetchone()

        if not row:
            return jsonify({'error': 'No study plan found for user'}), 404

        study_plan_id = row['id']

    try:
        # Trigger adaptation
        result = trigger_weekly_adaptation(
            user_id=user_id,
            study_plan_id=study_plan_id,
            completed_week=completed_week
        )

        return jsonify(result), 200

    except Exception as e:
        print(f"Error adapting study plan: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@personalization_bp.route('/bandit/status', methods=['GET'])
def get_bandit_status():
    """
    Get status of user's bandit model (for debugging/analytics).

    Returns exploration rate, number of updates, etc.
    """
    # Extract user_id from Firebase auth token
    user_id = get_user_id_from_token()

    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    try:
        from personalization.adaptive_planner import load_bandit_model

        bandit = load_bandit_model(user_id)

        return jsonify({
            'user_id': user_id,
            'num_updates': bandit.num_updates,
            'exploration_rate': bandit.get_exploration_rate(),
            'dimension': bandit.d,
            'noise_variance': bandit.sigma_sq,
            'has_learned': bandit.num_updates > 0
        }), 200

    except Exception as e:
        print(f"Error getting bandit status: {e}")
        return jsonify({'error': str(e)}), 500


@personalization_bp.route('/module-library', methods=['GET'])
def get_module_library():
    """
    Get the full module library (for debugging/preview).

    Optional query params:
    - phase: Filter by phase (foundation, practice, mastery)
    - difficulty: Filter by difficulty level
    """
    try:
        from personalization.adaptive_helpers import load_module_library, filter_modules_by_phase

        modules = load_module_library()

        # Apply filters
        phase = request.args.get('phase')
        difficulty = request.args.get('difficulty')

        if phase:
            modules = filter_modules_by_phase(modules, phase)

        if difficulty:
            modules = [m for m in modules if m['difficulty_level'] == difficulty]

        return jsonify({
            'total_modules': len(modules),
            'modules': modules
        }), 200

    except Exception as e:
        print(f"Error loading module library: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# TASK MANAGEMENT ROUTES (unchanged)
# ============================================================================

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
