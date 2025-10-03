from flask import Blueprint, jsonify, request
from .logic import (
    get_all_study_plans,
    get_study_plan_by_id,
    create_personalized_plan,
    update_plan_progress
)

personalization_bp = Blueprint('personalization', __name__, url_prefix='/api/personalization')

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
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        user_id = data.get('user_id')
        subject = data.get('subject')
        level = data.get('level')
        goals = data.get('goals', [])

        if not all([user_id, subject, level]):
            return jsonify({'error': 'user_id, subject, and level are required'}), 400

        result = create_personalized_plan(user_id, subject, level, goals)
        return jsonify(result), 201

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@personalization_bp.route('/study-plans/<int:plan_id>/progress', methods=['PUT'])
def update_progress(plan_id):
    """Update progress for a study plan"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        progress = data.get('progress')
        if progress is None:
            return jsonify({'error': 'progress is required'}), 400

        result = update_plan_progress(plan_id, progress)
        if result is None:
            return jsonify({'error': 'Study plan not found'}), 404

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
