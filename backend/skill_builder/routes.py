from flask import Blueprint, jsonify, request
from .logic import (
    create_drill_session,
    submit_drill_answers,
    generate_drill_questions
)

skill_builder_bp = Blueprint('skill_builder', __name__, url_prefix='/api/skill-builder')

@skill_builder_bp.route('/drill', methods=['POST'])
def drill():
    """Create a drill session (legacy endpoint)"""
    data = request.get_json()
    subject = data.get('subject', 'General')
    difficulty = data.get('difficulty', 'Medium')

    result = create_drill_session(subject, difficulty)
    return jsonify(result)

@skill_builder_bp.route('/drill/submit', methods=['POST'])
def submit():
    """Submit drill answers and get feedback"""
    data = request.get_json()
    session_id = data.get('session_id')
    answers = data.get('answers', [])

    result = submit_drill_answers(session_id, answers)
    return jsonify(result)

@skill_builder_bp.route('/drills/generate', methods=['POST'])
def generate():
    """Generate a customized drill session"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        subject = data.get('subject', 'General')
        difficulty = data.get('difficulty', 'Medium')
        question_count = data.get('question_count', 5)
        topics = data.get('topics', [])

        # Validate inputs
        if question_count < 1 or question_count > 50:
            return jsonify({'error': 'question_count must be between 1 and 50'}), 400

        valid_difficulties = ['Easy', 'Medium', 'Hard']
        if difficulty not in valid_difficulties:
            return jsonify({'error': f'difficulty must be one of: {valid_difficulties}'}), 400

        result = generate_drill_questions(subject, difficulty, question_count, topics)
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
