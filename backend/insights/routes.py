from flask import Blueprint, jsonify, request
from .logic import (
    prepare_ability_estimation,
    fetch_current_ability,
    fetch_ability_history,
    prepare_skill_mastery_estimation,
    fetch_skill_mastery,
    fetch_skill_mastery_history
)

insights_bp = Blueprint('insights', __name__, url_prefix='/api/insights')


@insights_bp.route('/ability/estimate', methods=['POST'])
def estimate_overall_ability():
    """Stub: run an IRT-based ability estimation with the provided evidence."""
    payload = request.get_json() or {}
    return jsonify(prepare_ability_estimation(payload))


@insights_bp.route('/ability/<string:user_id>', methods=['GET'])
def get_overall_ability(user_id):
    """Stub: fetch the latest overall ability estimate for a learner."""
    return jsonify(fetch_current_ability(user_id))


@insights_bp.route('/ability/<string:user_id>/history', methods=['GET'])
def get_ability_history(user_id):
    """Stub: fetch historical IRT ability estimates for a learner."""
    return jsonify(fetch_ability_history(user_id))


@insights_bp.route('/mastery/skills', methods=['POST'])
def estimate_skill_mastery():
    """Stub: run CDM-based skill mastery inference with the provided evidence."""
    payload = request.get_json() or {}
    return jsonify(prepare_skill_mastery_estimation(payload))


@insights_bp.route('/mastery/<string:user_id>', methods=['GET'])
def get_skill_mastery(user_id):
    """Stub: fetch the latest per-skill mastery profile for a learner."""
    return jsonify(fetch_skill_mastery(user_id))


@insights_bp.route('/mastery/<string:user_id>/history', methods=['GET'])
def get_skill_mastery_history(user_id):
    """Stub: fetch historical per-skill mastery snapshots for a learner."""
    return jsonify(fetch_skill_mastery_history(user_id))
