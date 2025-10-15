"""
Study plan templates for LSAT preparation.
10-week progressive study plan with 30 drill tasks.
"""

STUDY_PLAN_WEEKS = 10
TASKS_PER_WEEK = 3

WEEK_TEMPLATES = [
    # Week 1: Fundamentals
    [
        {'title': 'Assumption Identification', 'difficulties': ['Easy', 'Medium'], 'skills': ['Assumption'], 'questions': 5, 'time': 100, 'minutes': 15},
        {'title': 'Strengthen Arguments', 'difficulties': ['Easy', 'Medium'], 'skills': ['Strengthen'], 'questions': 5, 'time': 100, 'minutes': 15},
        {'title': 'Weaken Arguments', 'difficulties': ['Easy', 'Medium'], 'skills': ['Weaken'], 'questions': 5, 'time': 100, 'minutes': 15},
    ],
    # Week 2: Building Skills
    [
        {'title': 'Parallel Reasoning', 'difficulties': ['Medium'], 'skills': ['Parallel Reasoning'], 'questions': 5, 'time': 100, 'minutes': 18},
        {'title': 'Inference Questions', 'difficulties': ['Medium'], 'skills': ['Inference'], 'questions': 5, 'time': 100, 'minutes': 18},
        {'title': 'Flaw Detection', 'difficulties': ['Medium'], 'skills': ['Flaw'], 'questions': 5, 'time': 100, 'minutes': 18},
    ],
    # Week 3: Mixed Practice
    [
        {'title': 'Mixed Fundamentals', 'difficulties': ['Easy', 'Medium'], 'skills': ['Assumption', 'Strengthen', 'Weaken'], 'questions': 5, 'time': 100, 'minutes': 18},
        {'title': 'Reasoning Patterns', 'difficulties': ['Medium'], 'skills': ['Parallel Reasoning', 'Flaw'], 'questions': 5, 'time': 100, 'minutes': 18},
        {'title': 'Conditional Logic', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
    ],
    # Week 4: Increasing Difficulty
    [
        {'title': 'Advanced Assumptions', 'difficulties': ['Medium', 'Hard'], 'skills': ['Assumption'], 'questions': 5, 'time': 100, 'minutes': 20},
        {'title': 'Complex Weakening', 'difficulties': ['Medium', 'Hard'], 'skills': ['Weaken'], 'questions': 5, 'time': 100, 'minutes': 20},
        {'title': 'Challenging Inference', 'difficulties': ['Hard'], 'skills': ['Inference'], 'questions': 5, 'time': 130, 'minutes': 22},
    ],
    # Week 5: Advanced Practice
    [
        {'title': 'Evaluation Questions', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
        {'title': 'Principle Questions', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
        {'title': 'Method of Reasoning', 'difficulties': ['Hard'], 'skills': [], 'questions': 5, 'time': 130, 'minutes': 22},
    ],
    # Week 6: Timed Practice
    [
        {'title': 'Mixed Review - Timed', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 70, 'minutes': 12},
        {'title': 'Challenging Mixed Set', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
        {'title': 'Advanced Reasoning', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 130, 'minutes': 22},
    ],
    # Week 7: Comprehensive Review
    [
        {'title': 'Full Skill Review 1', 'difficulties': ['Easy', 'Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 18},
        {'title': 'Full Skill Review 2', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 18},
        {'title': 'Challenge Set', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 130, 'minutes': 22},
    ],
    # Week 8: Test Prep
    [
        {'title': 'Test-Like Conditions 1', 'difficulties': ['Medium', 'Hard'], 'skills': [], 'questions': 5, 'time': 70, 'minutes': 12},
        {'title': 'Test-Like Conditions 2', 'difficulties': ['Medium', 'Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 70, 'minutes': 12},
        {'title': 'Advanced Mixed Practice', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
    ],
    # Week 9: Final Review
    [
        {'title': 'Comprehensive Review 1', 'difficulties': ['Easy', 'Medium', 'Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 18},
        {'title': 'Comprehensive Review 2', 'difficulties': ['Medium', 'Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 18},
        {'title': 'Peak Performance Set', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 130, 'minutes': 22},
    ],
    # Week 10: Final Prep
    [
        {'title': 'Final Timed Practice 1', 'difficulties': ['Medium', 'Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 70, 'minutes': 12},
        {'title': 'Final Timed Practice 2', 'difficulties': ['Medium', 'Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 70, 'minutes': 12},
        {'title': 'Confidence Builder', 'difficulties': ['Hard', 'Challenging'], 'skills': [], 'questions': 5, 'time': 100, 'minutes': 20},
    ],
]
