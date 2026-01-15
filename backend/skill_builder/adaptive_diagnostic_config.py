"""
Configuration for Adaptive LR Diagnostic

Defines the question type sequence and skill mappings for the 30-question
adaptive diagnostic test.
"""

# Default Elo rating for new users
DEFAULT_ELO = 1500.0

# Question type sequence (30 questions total)
# Easier tier (9 questions): structural skills
# Medium tier (17 questions): gap analysis and flaw detection
# Harder tier (4 questions): abstraction and parallel reasoning
DIAGNOSTIC_SEQUENCE = [
    # Easier (9 questions)
    'Role of a Statement',
    'Must Be True',
    'Role of a Statement',
    'Main Point',
    'Must Be True',
    'Role of a Statement',
    'Main Point',
    'Must Be True',
    'Role of a Statement',
    # Medium (17 questions)
    'Weaken',
    'Sufficient Assumption',
    'Flaw in Reasoning',
    'Necessary Assumption',
    'Most Strongly Supported',
    'Weaken',
    'Sufficient Assumption',
    'Flaw in Reasoning',
    'Necessary Assumption',
    'Strengthen',
    'Weaken',
    'Sufficient Assumption',
    'Flaw in Reasoning',
    'Necessary Assumption',
    'Most Strongly Supported',
    'Strengthen',
    'Resolve the Paradox',
    # Harder (4 questions)
    'Parallel Reasoning',
    'Method of Reasoning',
    'Parallel Reasoning',
    'Principle (Application)',
]

# Map question type to primary skill IDs for Elo lookup
# When selecting a question of a given type, we average the user's Elo
# across these skills to determine the target difficulty
QUESTION_TYPE_SKILLS = {
    'Main Point': ['S_01'],
    'Role of a Statement': ['S_02', 'S_04'],
    'Must Be True': ['FL_03', 'FL_05', 'FL_06'],
    'Most Strongly Supported': ['RH_07', 'FL_06'],
    'Strengthen': ['RH_03', 'RH_07'],
    'Weaken': ['RH_04', 'RH_02'],
    'Sufficient Assumption': ['RH_03', 'FL_03'],
    'Necessary Assumption': ['RH_04'],
    'Flaw in Reasoning': ['RH_01', 'FL_07'],
    'Resolve the Paradox': ['RH_02', 'RH_07'],
    'Method of Reasoning': ['S_01', 'ABS_01'],
    'Principle (Application)': ['FL_01', 'ABS_03'],
    'Parallel Reasoning': ['ABS_01', 'FL_01', 'FL_02', 'FL_03'],
}

# Question type counts (for reference)
QUESTION_TYPE_COUNTS = {
    'Role of a Statement': 4,
    'Must Be True': 3,
    'Main Point': 2,
    'Weaken': 3,
    'Sufficient Assumption': 3,
    'Flaw in Reasoning': 3,
    'Necessary Assumption': 3,
    'Most Strongly Supported': 2,
    'Strengthen': 2,
    'Resolve the Paradox': 1,
    'Parallel Reasoning': 2,
    'Method of Reasoning': 1,
    'Principle (Application)': 1,
}

# Tier boundaries for progress display
TIER_EASIER_END = 9   # Questions 1-9 (indices 0-8)
TIER_MEDIUM_END = 26  # Questions 10-26 (indices 9-25)
TIER_HARDER_END = 30  # Questions 27-30 (indices 26-29)


def get_tier_for_position(position: int) -> str:
    """
    Get the difficulty tier for a given question position (0-indexed).

    Args:
        position: 0-indexed position in the diagnostic sequence

    Returns:
        'easier', 'medium', or 'harder'
    """
    if position < TIER_EASIER_END:
        return 'easier'
    elif position < TIER_MEDIUM_END:
        return 'medium'
    else:
        return 'harder'
