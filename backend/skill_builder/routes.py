from flask import Blueprint, jsonify, request
from .logic import create_drill_session, submit_drill_answers

skill_builder_bp = Blueprint('skill_builder', __name__, url_prefix='/api/skill-builder')

@skill_builder_bp.route('/drill', methods=['POST'])
def drill():
    """Create a drill session backed by LSAT question inventory."""
    payload = request.get_json() or {}
    result = create_drill_session(payload)
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
    """Alias for drill creation to support legacy clients."""
    payload = request.get_json() or {}
    result = create_drill_session(payload)
    return jsonify(result)
