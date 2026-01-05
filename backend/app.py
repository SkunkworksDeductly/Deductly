from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
from firebase_admin import auth as firebase_auth
from uuid import uuid4

# Import blueprints from each layer
from insights.routes import insights_bp
# Use adaptive routes (includes all legacy routes + adaptive features)
from personalization.routes_adaptive import personalization_bp
from skill_builder.routes import skill_builder_bp

# Load .env from parent directory (root of project)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    try:
        # Try to find credentials file in order of preference:
        # 1. Render secret file (set via FIREBASE_CREDENTIALS_PATH env var)
        # 2. Local development file
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH') or os.path.join(os.path.dirname(__file__), 'firebase-credentials.json')

        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Warning: Firebase Admin SDK initialization failed: {e}")

app = Flask(__name__)
# CORS: allow localhost dev origins plus Chrome extension pages.
# Note: Some browsers send Origin: null for extension pages; include 'null' to be safe.
CORS(
    app,
    origins=[
        'http://localhost:5173',
        'http://localhost:5174',
        'https://nikhilanand1998.github.io',
        'chrome-extension://*',
        'null'
    ],
    allow_headers=['Content-Type', 'Authorization'],
    expose_headers=['Content-Type', 'Authorization'],
    supports_credentials=True
)

# Register blueprints for each layer
app.register_blueprint(insights_bp)
app.register_blueprint(personalization_bp)
app.register_blueprint(skill_builder_bp)

@app.route('/')
def home():
    return jsonify({
        'message': 'Welcome to Deductly - Education Tech Platform',
        'version': '2.0.0',
        'architecture': 'Three-layer (Insights, Personalization, Skill Builder)',
        'endpoints': {
            'insights': '/api/insights/*',
            'personalization': '/api/personalization/*',
            'skill_builder': '/api/skill-builder/*'
        }
    })

# Legacy endpoint compatibility (redirect to new structure)
@app.route('/api/diagnostics', methods=['GET'])
def legacy_diagnostics():
    """Legacy endpoint - redirects to /api/insights/diagnostics"""
    from insights.logic import get_all_diagnostics
    return jsonify(get_all_diagnostics())

@app.route('/api/diagnostics/<int:diagnostic_id>', methods=['GET'])
def legacy_diagnostic(diagnostic_id):
    """Legacy endpoint - redirects to /api/insights/diagnostics/<id>"""
    from insights.logic import get_diagnostic_by_id
    result = get_diagnostic_by_id(diagnostic_id)
    if result:
        return jsonify(result)
    return jsonify({'error': 'Diagnostic not found'}), 404

@app.route('/api/study-plans', methods=['GET'])
def legacy_study_plans():
    """Legacy endpoint - redirects to /api/personalization/study-plans"""
    from personalization.logic import get_all_study_plans
    return jsonify(get_all_study_plans())

@app.route('/api/study-plans/<int:plan_id>', methods=['GET'])
def legacy_study_plan(plan_id):
    """Legacy endpoint - redirects to /api/personalization/study-plans/<id>"""
    from personalization.logic import get_study_plan_by_id
    result = get_study_plan_by_id(plan_id)
    if result:
        return jsonify(result)
    return jsonify({'error': 'Study plan not found'}), 404

@app.route('/api/drill', methods=['POST'])
def legacy_drill():
    """Legacy endpoint - redirects to /api/skill-builder/drill"""
    from flask import request
    from skill_builder.logic import create_drill_session
    data = request.get_json()
    subject = data.get('subject', 'General')
    difficulty = data.get('difficulty', 'Medium')
    return jsonify(create_drill_session(subject, difficulty))

@app.route('/api/drill/submit', methods=['POST'])
def legacy_drill_submit():
    """Legacy endpoint - redirects to /api/skill-builder/drill/submit"""
    from flask import request
    from skill_builder.logic import submit_drill_answers
    data = request.get_json()
    drill_id = data.get('session_id') or data.get('drill_id')
    user_id = data.get('user_id', 'anonymous')
    answers = data.get('answers', [])
    time_taken = data.get('time_taken')
    return jsonify(submit_drill_answers(drill_id, user_id, answers, time_taken))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

# -----------------------------------------------
# Attempts logging endpoint for Extension (DEV)
# -----------------------------------------------

@app.route('/api/question_attempts', methods=['POST'])
def log_question_attempt():
    """
    Accepts structured metadata for a single question attempt from the Chrome extension.
    Auth: Firebase ID token in Authorization: Bearer <token>.
    Compliance: No question/passage/answer text accepted or persisted.
    """
    # Auth
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({ 'error': 'Missing Bearer token' }), 401
    token = auth_header.split(' ', 1)[1].strip()

    try:
        decoded = firebase_auth.verify_id_token(token)
        user_uid = decoded.get('uid')
    except Exception as e:
        return jsonify({ 'error': 'Invalid token', 'detail': str(e) }), 401

    # Body
    data = request.get_json(silent=True) or {}

    # Minimal validation: required fields (metadata only)
    required_fields = [
        'source', 'test_code', 'section_code', 'question_code', 'question_uid',
        'user_choice', 'time_spent_sec', 'timestamp_client', 'extension_version'
    ]
    missing = [k for k in required_fields if k not in data]
    if missing:
        return jsonify({ 'error': 'Missing fields', 'fields': missing }), 400

    # Enforce compliance: reject if suspicious text fields present
    forbidden_fields = ['question_text', 'passage_text', 'answers_text', 'answer_text']
    present_forbidden = [k for k in forbidden_fields if k in data]
    if present_forbidden:
        return jsonify({ 'error': 'Forbidden fields present', 'fields': present_forbidden }), 400

    # Construct a sanitized attempt record (not persisted in v1 dev)
    attempt_id = str(uuid4())
    attempt = {
        'attempt_id': attempt_id,
        'user_id': user_uid,
        'source': data.get('source'),
        'test_code': data.get('test_code'),
        'section_code': data.get('section_code'),
        'question_code': data.get('question_code'),
        'question_uid': data.get('question_uid'),
        'user_choice': data.get('user_choice'),
        'time_spent_sec': data.get('time_spent_sec'),
        'timestamp_client': data.get('timestamp_client'),
        'extension_version': data.get('extension_version'),
    }

    # DEV: Print to server logs for visibility
    try:
        print('[attempt]', attempt)
    except Exception:
        pass

    return jsonify({ 'status': 'ok', 'attempt_id': attempt_id }), 200
