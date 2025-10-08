"""
Shared mappings for Skill Builder question taxonomy.
"""

QUESTION_TYPE_TO_SKILL_MAP = {
    'Assumption': 'LR-03',  # Identify Assumptions
    'Weaken the Argument': 'LR-05',  # Weaken Argument
    'Weaken': 'LR-05',  # Weaken Argument
    'Find the flaw in the Argument': 'LR-06',  # Identify Flaw
    'Flaw in the Reasoning': 'LR-06',  # Identify Flaw
    'Inference': 'LR-10',  # Must Be True/Inference
    'Cannot be Inferred': 'LR-10',  # Must Be True/Inference
    'Parallel flaw in the argument': 'LR-13',  # Parallel Flaw
    'Method of Reasoning': 'LR-14',  # Method of Reasoning
    'Method of Reasoning (MoR)': 'LR-14',  # Method of Reasoning
    'Point at Issue': 'LR-16',  # Point of Agreement/Disagreement
    'Role Play': 'LR-15',  # Role of Statement
    'Justify the Conclusion (JTC)': 'LR-08',  # Sufficient Conditions
    'Strengthen': 'LR-04',  # Strengthen Argument
    'Principle': 'LR-16',  # Principle - Identify
    'Principal': 'LR-17',  # Principle - Apply
    'Parallel Reasoning': 'LR-12',  # Parallel Reasoning
    'Resolve the Paradox': 'LR-11',  # Resolve Paradox
    'Evaluate the Argument': 'LR-18',  # Evaluate Argument
    'Main Point': 'LR-01',  # Main Point/Primary Purpose
}

ALLOWED_SKILLS = set(QUESTION_TYPE_TO_SKILL_MAP.keys())
