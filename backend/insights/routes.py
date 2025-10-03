from flask import Blueprint, jsonify, request
from .logic import (
    get_all_diagnostics,
    get_diagnostic_by_id,
    validate_diagnostic_answer,
    get_questions_filtered
)

insights_bp = Blueprint('insights', __name__, url_prefix='/api/insights')

@insights_bp.route('/diagnostics', methods=['GET'])
def diagnostics():
    """Get all diagnostic questions"""
    return jsonify(get_all_diagnostics())

@insights_bp.route('/diagnostics/<int:diagnostic_id>', methods=['GET'])
def diagnostic(diagnostic_id):
    """Get specific diagnostic by ID"""
    result = get_diagnostic_by_id(diagnostic_id)
    if result:
        return jsonify(result)
    return jsonify({'error': 'Diagnostic not found'}), 404

@insights_bp.route('/validate', methods=['POST'])
def validate():
    """Validate a user's answer to a diagnostic question"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        question_id = data.get('question_id')
        user_answer = data.get('answer')

        if question_id is None or user_answer is None:
            return jsonify({'error': 'question_id and answer are required'}), 400

        result = validate_diagnostic_answer(question_id, user_answer)
        if result is None:
            return jsonify({'error': 'Question not found'}), 404

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@insights_bp.route('/questions', methods=['GET'])
def questions():
    """Get questions with optional filtering"""
    try:
        subject = request.args.get('subject')
        topic = request.args.get('topic')
        difficulty = request.args.get('difficulty')
        limit = request.args.get('limit', type=int)

        result = get_questions_filtered(subject, topic, difficulty, limit)
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
