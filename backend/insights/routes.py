from flask import Blueprint, jsonify, request
from .logic import (
    prepare_ability_estimation,
    fetch_current_ability,
    fetch_ability_history,
    prepare_skill_mastery_estimation,
    fetch_skill_mastery,
    fetch_skill_mastery_history,
    irt_online_update,
    glmm_online_update
)

insights_bp = Blueprint('insights', __name__, url_prefix='/api/insights')



@insights_bp.route('/irt/<user_id>', methods=['GET'])
def get_ability_estimate(user_id):
    """Fetch ability estimate for a specific user using the IRT model."""
    model_name = "irt"
    ability = fetch_current_ability(model_name, user_id)
    return jsonify({
        "model_name": model_name,
        "user_id": user_id,
        "ability_estimate": ability
    })



@insights_bp.route('/glmm/<user_id>', methods=['GET'])
def get_mastery_estimate(user_id):
    """Fetch subskill mastery estimate for a specific user using the GLMM model."""
    mastery = fetch_skill_mastery(user_id)
    return jsonify(mastery)


@insights_bp.route('/models/<string:model_name>/recalibrate', methods=['POST'])
def recalibrate_model(model_name):
    """Stub: trigger recalibration of a specific model."""
    # Placeholder logic for recalibration
    return jsonify({
        "model_name": model_name,
        "status": "recalibration_started"
    })


@insights_bp.route('/online/irt/update/<user_id>', methods=['POST'])
def update_user_estimates(user_id):
    """Stub: perform online update of user estimates given new evidence."""
    payload = request.get_json() or {}

    irt_online_update(user_id, payload.get('new_evidence', []))

    return jsonify({
        "model_name": "irt",
        "user_id": user_id,
        "update_status": "success"
    })


@insights_bp.route('/online/glmm/update/<user_id>', methods=['POST'])
def update_user_mastery(user_id):
    """Stub: perform online update of user mastery given new evidence."""
    payload = request.get_json() or {}
    glmm_online_update(user_id, payload.get('new_evidence', []))
    return jsonify({
        "model_name": "glmm",
        "user_id": user_id,
        "update_status": "success"
    })

# @insights_bp.route('/ability/estimate', methods=['POST'])
# def estimate_overall_ability():
#     """Stub: run an IRT-based ability estimation with the provided evidence."""
#     payload = request.get_json() or {}
#     return jsonify(prepare_ability_estimation(payload))


# @insights_bp.route('/ability/<string:user_id>', methods=['GET'])
# def get_overall_ability(user_id):
#     """Stub: fetch the latest overall ability estimate for a learner."""
#     return jsonify(fetch_current_ability(user_id))


# @insights_bp.route('/ability/<string:user_id>/history', methods=['GET'])
# def get_ability_history(user_id):
#     """Stub: fetch historical IRT ability estimates for a learner."""
#     return jsonify(fetch_ability_history(user_id))


# @insights_bp.route('/mastery/skills', methods=['POST'])
# def estimate_skill_mastery():
#     """Stub: run CDM-based skill mastery inference with the provided evidence."""
#     payload = request.get_json() or {}
#     return jsonify(prepare_skill_mastery_estimation(payload))


# @insights_bp.route('/mastery/<string:user_id>', methods=['GET'])
# def get_skill_mastery(user_id):
#     """Stub: fetch the latest per-skill mastery profile for a learner."""
#     return jsonify(fetch_skill_mastery(user_id))


# @insights_bp.route('/mastery/<string:user_id>/history', methods=['GET'])
# def get_skill_mastery_history(user_id):
#     """Stub: fetch historical per-skill mastery snapshots for a learner."""
#     return jsonify(fetch_skill_mastery_history(user_id))
