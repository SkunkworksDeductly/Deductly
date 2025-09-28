from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Sample data for the education platform
sample_diagnostics = [
    {
        'id': 1,
        'subject': 'Mathematics',
        'topic': 'Algebra',
        'question': 'Solve for x: 2x + 5 = 13',
        'options': ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
        'correct_answer': 'x = 4'
    },
    {
        'id': 2,
        'subject': 'Science',
        'topic': 'Physics',
        'question': 'What is the speed of light in vacuum?',
        'options': ['299,792,458 m/s', '300,000,000 m/s', '299,000,000 m/s', '298,000,000 m/s'],
        'correct_answer': '299,792,458 m/s'
    }
]

sample_study_plans = [
    {
        'id': 1,
        'subject': 'Mathematics',
        'level': 'Beginner',
        'topics': ['Basic Arithmetic', 'Simple Algebra', 'Geometry Basics'],
        'duration': '4 weeks',
        'progress': 25
    },
    {
        'id': 2,
        'subject': 'Science',
        'level': 'Intermediate',
        'topics': ['Physics Fundamentals', 'Chemistry Basics', 'Biology Introduction'],
        'duration': '6 weeks',
        'progress': 60
    }
]

@app.route('/')
def home():
    return jsonify({
        'message': 'Welcome to Deductly - Education Tech Platform',
        'version': '1.0.0'
    })

@app.route('/api/diagnostics', methods=['GET'])
def get_diagnostics():
    return jsonify(sample_diagnostics)

@app.route('/api/diagnostics/<int:diagnostic_id>', methods=['GET'])
def get_diagnostic(diagnostic_id):
    diagnostic = next((d for d in sample_diagnostics if d['id'] == diagnostic_id), None)
    if diagnostic:
        return jsonify(diagnostic)
    return jsonify({'error': 'Diagnostic not found'}), 404

@app.route('/api/study-plans', methods=['GET'])
def get_study_plans():
    return jsonify(sample_study_plans)

@app.route('/api/study-plans/<int:plan_id>', methods=['GET'])
def get_study_plan(plan_id):
    plan = next((p for p in sample_study_plans if p['id'] == plan_id), None)
    if plan:
        return jsonify(plan)
    return jsonify({'error': 'Study plan not found'}), 404

@app.route('/api/drill', methods=['POST'])
def create_drill_session():
    data = request.get_json()
    subject = data.get('subject', 'General')
    difficulty = data.get('difficulty', 'Medium')

    # Sample drill questions based on subject
    drill_questions = [
        {
            'id': 1,
            'question': f'{subject} practice question 1',
            'options': ['Option A', 'Option B', 'Option C', 'Option D'],
            'correct_answer': 'Option A',
            'difficulty': difficulty
        },
        {
            'id': 2,
            'question': f'{subject} practice question 2',
            'options': ['Option A', 'Option B', 'Option C', 'Option D'],
            'correct_answer': 'Option B',
            'difficulty': difficulty
        }
    ]

    return jsonify({
        'session_id': 'drill_001',
        'subject': subject,
        'difficulty': difficulty,
        'questions': drill_questions
    })

@app.route('/api/drill/submit', methods=['POST'])
def submit_drill_answers():
    data = request.get_json()
    session_id = data.get('session_id')
    answers = data.get('answers', [])

    # Calculate score (simplified)
    total_questions = len(answers)
    correct_answers = sum(1 for answer in answers if answer.get('is_correct', False))
    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0

    return jsonify({
        'session_id': session_id,
        'total_questions': total_questions,
        'correct_answers': correct_answers,
        'score': score,
        'feedback': 'Great job!' if score >= 80 else 'Keep practicing!'
    })

@app.route('/api/validate', methods=['POST'])
def validate_answer():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        question_id = data.get('question_id')
        user_answer = data.get('answer')

        if question_id is None or user_answer is None:
            return jsonify({'error': 'question_id and answer are required'}), 400

        # Find the question in sample data (you can extend this to use a database)
        question = next((q for q in sample_diagnostics if q['id'] == question_id), None)

        if not question:
            return jsonify({'error': 'Question not found'}), 404

        is_correct = question['correct_answer'] == user_answer

        return jsonify({
            'question_id': question_id,
            'is_correct': is_correct,
            'correct_answer': question['correct_answer'] if not is_correct else None,
            'explanation': f"The correct answer is {question['correct_answer']}" if not is_correct else "Correct!"
        })

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/questions', methods=['GET'])
def get_questions():
    try:
        # Get query parameters for filtering
        subject = request.args.get('subject')
        topic = request.args.get('topic')
        difficulty = request.args.get('difficulty')
        limit = request.args.get('limit', type=int)

        # Start with all questions (combining diagnostics and any other question sources)
        questions = sample_diagnostics.copy()

        # Apply filters
        if subject:
            questions = [q for q in questions if q.get('subject', '').lower() == subject.lower()]

        if topic:
            questions = [q for q in questions if q.get('topic', '').lower() == topic.lower()]

        if difficulty:
            questions = [q for q in questions if q.get('difficulty', '').lower() == difficulty.lower()]

        # Apply limit
        if limit and limit > 0:
            questions = questions[:limit]

        return jsonify({
            'questions': questions,
            'total': len(questions),
            'filters_applied': {
                'subject': subject,
                'topic': topic,
                'difficulty': difficulty,
                'limit': limit
            }
        })

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/drills/generate', methods=['POST'])
def generate_drill():
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

        # Generate drill questions (this could be enhanced with a real question database)
        import uuid
        session_id = str(uuid.uuid4())

        drill_questions = []
        for i in range(question_count):
            topic = topics[i % len(topics)] if topics else f"{subject} Topic"
            drill_questions.append({
                'id': i + 1,
                'question': f"{subject} {difficulty} question {i + 1}: What is the {topic} concept?",
                'options': [
                    f"Option A for {topic}",
                    f"Option B for {topic}",
                    f"Option C for {topic}",
                    f"Option D for {topic}"
                ],
                'correct_answer': f"Option A for {topic}",
                'difficulty': difficulty,
                'subject': subject,
                'topic': topic
            })

        return jsonify({
            'session_id': session_id,
            'subject': subject,
            'difficulty': difficulty,
            'question_count': question_count,
            'topics': topics,
            'questions': drill_questions,
            'estimated_duration': f"{question_count * 2} minutes",
            'created_at': os.environ.get('CREATED_AT', 'now')
        })

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)