"""
Diagnostic Evaluation Module

Analyzes completed diagnostic sessions and returns:
- Cognitive fingerprint (skill interaction patterns)
- Strengths (minimum 3)
- Weaknesses (minimum 3, prioritized)
- Theta estimate (placeholder)
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import json

from db.connection import execute_query, get_db_cursor
from insights.logic import fetch_user_elo_ratings, skill_taxonomy

from .adaptive_diagnostic_logic import get_diagnostic_session
from .adaptive_diagnostic_config import (
    DIAGNOSTIC_SEQUENCE,
    QUESTION_TYPE_SKILLS,
)


# =============================================================================
# CONSTANTS
# =============================================================================

# Skill taxonomy organized by domain
SKILL_DOMAINS = {
    'structural': {
        'name': 'Structural Decomposition',
        'skills': ['S_01', 'S_02', 'S_03', 'S_04'],
    },
    'formal_logic': {
        'name': 'Formal & Deductive Logic',
        'skills': ['FL_01', 'FL_02', 'FL_03', 'FL_04', 'FL_05', 'FL_06', 'FL_07'],
    },
    'rhetorical': {
        'name': 'Rhetorical & Inductive Evaluation',
        'skills': ['RH_01', 'RH_02', 'RH_03', 'RH_04', 'RH_05', 'RH_06', 'RH_07', 'RH_08'],
    },
    'abstraction': {
        'name': 'Systemic Abstraction',
        'skills': ['ABS_01', 'ABS_02', 'ABS_03'],
    }
}

# Skill names mapping
SKILL_NAMES = {
    'S_01': 'Main Conclusion ID',
    'S_02': 'Role Identification',
    'S_03': 'Disagreement Isolation',
    'S_04': 'Intermediate Conclusion Recognition',
    'FL_01': 'Conditional Translation',
    'FL_02': 'Contrapositive Operations',
    'FL_03': 'Chain/Transitive Deduction',
    'FL_04': 'Quantifier Scope',
    'FL_05': 'Quantifier Intersection',
    'FL_06': 'Modal Precision',
    'FL_07': 'Conditional Fallacies',
    'RH_01': 'Causality vs. Correlation',
    'RH_02': 'Alternative Explanations',
    'RH_03': 'Sufficiency Gaps',
    'RH_04': 'Necessity Gaps',
    'RH_05': 'Sampling Validity',
    'RH_06': 'Ad Hominem / Source Attacks',
    'RH_07': 'Evidential Weight Assessment',
    'RH_08': 'Scope Shift Recognition',
    'ABS_01': 'Structural Matching',
    'ABS_02': 'Flaw Matching',
    'ABS_03': 'Principle Application',
}

# Proficiency thresholds
PROFICIENCY_THRESHOLDS = {
    'mastery': 0.85,
    'proficient': 0.70,
    'developing': 0.50,
    'weak': 0.0,
}

# Skill impact levels
SKILL_IMPACT = {
    'critical': ['S_01', 'FL_01', 'FL_07', 'RH_03', 'RH_04'],
    'high': ['FL_02', 'FL_03', 'FL_04', 'RH_01', 'RH_07', 'RH_08'],
    'moderate': ['S_02', 'S_03', 'S_04', 'FL_05', 'FL_06', 'RH_02', 'RH_05', 'RH_06',
                 'ABS_01', 'ABS_02', 'ABS_03'],
}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class CognitivePattern:
    """A detected behavioral pattern from diagnostic performance."""
    pattern_id: str
    description: str
    evidence: str
    affected_skills: List[str]
    affected_question_types: List[str]


@dataclass
class ReasoningTendency:
    """A tendency in how the user approaches problems."""
    tendency: str
    context: str
    trap_pattern: Optional[str] = None


@dataclass
class CognitiveFingerprint:
    """Captures skill interactions and contextual patterns."""
    primary_patterns: List[CognitivePattern]
    interaction_summary: str
    reasoning_tendencies: List[ReasoningTendency]


@dataclass
class SkillStrength:
    """A skill where the user demonstrates strength."""
    skill_id: str
    skill_name: str
    confidence_rank: int
    evidence: str
    elo_rating: float
    accuracy: float


@dataclass
class SkillWeakness:
    """A skill requiring improvement."""
    skill_id: str
    skill_name: str
    priority_rank: int
    priority_label: str
    impact_score: int
    diagnostic_pattern: str
    root_cause: str
    context: str
    trap_pattern: Optional[str] = None


@dataclass
class PerformanceMetrics:
    """Aggregated performance data from diagnostic session."""
    by_question_type: Dict[str, Dict[str, Any]]
    by_skill: Dict[str, Dict[str, Any]]
    overall_accuracy: float
    total_questions: int
    correct_count: int


@dataclass
class TrapAnalysis:
    """Analysis of wrong answer patterns for a question type."""
    question_type: str
    trap_counts: Dict[str, int]  # trap_type -> count
    total_wrong: int


@dataclass
class DiagnosticMatch:
    """A matched diagnostic pattern."""
    pattern_id: str
    root_cause: str
    confidence: str  # 'high', 'medium', 'low'
    notes: str


@dataclass
class EvaluationResult:
    """Complete evaluation result for a diagnostic session."""
    user_id: str
    session_id: str
    theta_estimate: float
    cognitive_fingerprint: CognitiveFingerprint
    strengths: List[SkillStrength]
    weaknesses: List[SkillWeakness]
    evaluated_at: datetime
    diagnostic_patterns_applied: List[str]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'theta_estimate': self.theta_estimate,
            'cognitive_fingerprint': {
                'primary_patterns': [asdict(p) for p in self.cognitive_fingerprint.primary_patterns],
                'interaction_summary': self.cognitive_fingerprint.interaction_summary,
                'reasoning_tendencies': [asdict(t) for t in self.cognitive_fingerprint.reasoning_tendencies],
            },
            'strengths': [asdict(s) for s in self.strengths],
            'weaknesses': [asdict(w) for w in self.weaknesses],
            'evaluated_at': self.evaluated_at.isoformat(),
            'diagnostic_patterns_applied': self.diagnostic_patterns_applied,
        }


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def evaluate_diagnostic(session_id: str, user_id: str) -> EvaluationResult:
    """
    Evaluate a completed diagnostic session and return comprehensive analysis.

    Args:
        session_id: The diagnostic session ID
        user_id: The user ID

    Returns:
        EvaluationResult with theta_estimate, cognitive_fingerprint,
        at least 3 strengths, and at least 3 weaknesses

    Raises:
        ValueError: If session not found or not completed
    """
    # 1. Fetch session data
    session_data = _fetch_session_data(session_id, user_id)

    # 2. Compute performance metrics
    metrics = _compute_performance_metrics(session_data)

    # 3. Analyze trap patterns (key anchor for cognitive fingerprint)
    trap_analysis = _analyze_trap_patterns(session_data)

    # 4. Apply diagnostic patterns
    diagnostic_matches = _apply_diagnostic_patterns(metrics, trap_analysis)

    # 5. Build cognitive fingerprint
    fingerprint = _build_cognitive_fingerprint(metrics, diagnostic_matches, trap_analysis)

    # 6. Identify strengths and weaknesses
    strengths = _identify_strengths(metrics, session_data)
    weaknesses = _identify_weaknesses(metrics, diagnostic_matches, trap_analysis)

    # 7. Get theta estimate (placeholder for now)
    theta_estimate = _get_theta_estimate(user_id)

    return EvaluationResult(
        user_id=user_id,
        session_id=session_id,
        theta_estimate=theta_estimate,
        cognitive_fingerprint=fingerprint,
        strengths=strengths,
        weaknesses=weaknesses,
        evaluated_at=datetime.utcnow(),
        diagnostic_patterns_applied=[m.pattern_id for m in diagnostic_matches],
    )


# =============================================================================
# HELPER FUNCTIONS (STUBS TO BE IMPLEMENTED)
# =============================================================================

def _fetch_session_data(session_id: str, user_id: str) -> Dict[str, Any]:
    """
    Fetch completed diagnostic session data.

    Returns session data including user_answers, question details, and ELO data.
    """
    # Get session from database
    session = get_diagnostic_session(session_id, user_id)

    if not session:
        raise ValueError(f"Session {session_id} not found for user {user_id}")

    if session['status'] not in ('completed', 'answering_complete'):
        raise ValueError(f"Session {session_id} is not completed (status: {session['status']})")

    # Get question details for all questions in session
    question_ids = session['selected_question_ids']
    if not question_ids:
        raise ValueError(f"Session {session_id} has no questions")

    # Fetch question metadata
    placeholders = ','.join(['%s'] * len(question_ids))
    query = f"""
        SELECT id, question_type, difficulty_level, 
               COALESCE(difficulty_elo_base, 1500.0) as difficulty_elo
        FROM questions
        WHERE id IN ({placeholders})
    """
    question_rows = execute_query(query, tuple(question_ids))
    questions_by_id = {row['id']: row for row in question_rows}

    # Fetch skill mappings for questions
    skill_query = f"""
        SELECT qs.question_id, s.skill_id as taxonomy_id, qs.skill_type
        FROM question_skills qs
        JOIN skills s ON qs.skill_id = s.id
        WHERE qs.question_id IN ({placeholders})
    """
    skill_rows = execute_query(skill_query, tuple(question_ids))

    # Build skill mapping: question_id -> list of (taxonomy_id, skill_type)
    question_skills = {}
    for row in skill_rows:
        qid = row['question_id']
        if qid not in question_skills:
            question_skills[qid] = []
        question_skills[qid].append({
            'taxonomy_id': row['taxonomy_id'],
            'skill_type': row['skill_type'],
        })

    # Get user's current ELO ratings
    user_elo_ratings = fetch_user_elo_ratings(user_id)

    # Build enriched session data
    enriched_answers = {}
    user_answers = session.get('user_answers', {})

    for pos_str, answer_data in user_answers.items():
        qid = answer_data['question_id']
        question_meta = questions_by_id.get(qid, {})

        enriched_answers[pos_str] = {
            **answer_data,
            'question_type': question_meta.get('question_type', 'Unknown'),
            'difficulty_level': question_meta.get('difficulty_level', 'Medium'),
            'difficulty_elo': question_meta.get('difficulty_elo', 1500.0),
            'skills': question_skills.get(qid, []),
        }

    return {
        'session_id': session_id,
        'user_id': user_id,
        'status': session['status'],
        'user_answers': enriched_answers,
        'selected_question_ids': question_ids,
        'user_elo_ratings': {
            sid: {'rating': r.rating, 'num_updates': r.num_updates}
            for sid, r in user_elo_ratings.items()
        },
        'total_questions': len(user_answers),
    }


def _compute_performance_metrics(session_data: Dict[str, Any]) -> PerformanceMetrics:
    """
    Calculate performance metrics by question type and skill.
    """
    user_answers = session_data.get('user_answers', {})

    # Aggregate by question type
    by_question_type: Dict[str, Dict[str, Any]] = {}

    # Aggregate by skill
    by_skill: Dict[str, Dict[str, Any]] = {}

    total_correct = 0
    total_questions = 0

    for pos_str, answer_data in user_answers.items():
        is_correct = answer_data.get('is_correct', False)
        question_type = answer_data.get('question_type', 'Unknown')
        skills = answer_data.get('skills', [])

        total_questions += 1
        if is_correct:
            total_correct += 1

        # Aggregate by question type
        if question_type not in by_question_type:
            by_question_type[question_type] = {
                'correct': 0,
                'total': 0,
                'questions': [],
            }
        by_question_type[question_type]['total'] += 1
        if is_correct:
            by_question_type[question_type]['correct'] += 1
        by_question_type[question_type]['questions'].append({
            'question_id': answer_data.get('question_id'),
            'is_correct': is_correct,
            'answer': answer_data.get('answer'),
            'correct_answer': answer_data.get('correct_answer'),
        })

        # Aggregate by skill (using QUESTION_TYPE_SKILLS mapping)
        # Each question type maps to specific skills
        mapped_skills = QUESTION_TYPE_SKILLS.get(question_type, [])
        for skill_id in mapped_skills:
            if skill_id not in by_skill:
                by_skill[skill_id] = {
                    'correct': 0,
                    'total': 0,
                    'question_types': set(),
                }
            by_skill[skill_id]['total'] += 1
            if is_correct:
                by_skill[skill_id]['correct'] += 1
            by_skill[skill_id]['question_types'].add(question_type)

    # Calculate accuracy for each question type
    for qt_data in by_question_type.values():
        qt_data['accuracy'] = qt_data['correct'] / qt_data['total'] if qt_data['total'] > 0 else 0.0

    # Calculate accuracy for each skill and convert sets to lists
    for skill_data in by_skill.values():
        skill_data['accuracy'] = skill_data['correct'] / skill_data['total'] if skill_data['total'] > 0 else 0.0
        skill_data['question_types'] = list(skill_data['question_types'])

    overall_accuracy = total_correct / total_questions if total_questions > 0 else 0.0

    return PerformanceMetrics(
        by_question_type=by_question_type,
        by_skill=by_skill,
        overall_accuracy=overall_accuracy,
        total_questions=total_questions,
        correct_count=total_correct,
    )


def _analyze_trap_patterns(session_data: Dict[str, Any]) -> Dict[str, TrapAnalysis]:
    """
    Analyze wrong answer patterns to detect reasoning tendencies.

    This is the key anchor for building cognitive fingerprint.
    Since trap_types metadata may not be in the database, we infer trap patterns
    from the question type and answer patterns.
    """
    user_answers = session_data.get('user_answers', {})

    # Aggregate trap patterns by question type
    trap_analysis: Dict[str, TrapAnalysis] = {}

    for pos_str, answer_data in user_answers.items():
        if answer_data.get('is_correct', False):
            continue  # Only analyze wrong answers

        question_type = answer_data.get('question_type', 'Unknown')
        user_answer = answer_data.get('answer', '')
        correct_answer = answer_data.get('correct_answer', '')

        if question_type not in trap_analysis:
            trap_analysis[question_type] = TrapAnalysis(
                question_type=question_type,
                trap_counts={},
                total_wrong=0,
            )

        trap_analysis[question_type].total_wrong += 1

        # Infer trap pattern based on question type
        # These are heuristic inferences since we don't have explicit trap metadata
        inferred_trap = _infer_trap_type(question_type, user_answer, correct_answer, answer_data)

        if inferred_trap:
            if inferred_trap not in trap_analysis[question_type].trap_counts:
                trap_analysis[question_type].trap_counts[inferred_trap] = 0
            trap_analysis[question_type].trap_counts[inferred_trap] += 1

    return trap_analysis


def _infer_trap_type(
    question_type: str,
    user_answer: str,
    correct_answer: str,
    answer_data: Dict[str, Any]
) -> Optional[str]:
    """
    Infer the likely trap type based on question type and answer pattern.

    This is a heuristic approach - in future, trap_types should be stored
    in the database for more accurate analysis.
    """
    # Question-type specific trap inference rules
    # Based on diagnostic_patterns_v2.txt trap analysis tables

    if question_type == 'Necessary Assumption':
        # Common trap: selecting answers that are too strong (sufficient instead of necessary)
        return 'too_strong_answer'

    elif question_type == 'Sufficient Assumption':
        # Common trap: selecting answers that are too weak (necessary but not sufficient)
        return 'too_weak_answer'

    elif question_type == 'Strengthen':
        # Could be direction confusion or irrelevant answer
        return 'strengthening_gap_miss'

    elif question_type == 'Weaken':
        # Could be direction confusion (picked strengthen) or irrelevant
        return 'weakening_gap_miss'

    elif question_type == 'Main Point':
        # Common traps: intermediate conclusion, premise as conclusion
        return 'conclusion_confusion'

    elif question_type == 'Must Be True':
        # Common traps: possible but not certain, exceeds scope
        return 'inference_overreach'

    elif question_type == 'Most Strongly Supported':
        # Common trap: plausible but not supported, overstates support
        return 'support_miscalibration'

    elif question_type == 'Flaw in Reasoning':
        # Common trap: wrong flaw type, describes technique not flaw
        return 'flaw_misidentification'

    elif question_type == 'Parallel Reasoning':
        # Common trap: matches content not structure
        return 'surface_matching'

    elif question_type == 'Parallel Flaw':
        # Common trap: different flaw type
        return 'flaw_type_mismatch'

    elif question_type == 'Role of a Statement':
        # Common trap: misidentifies role
        return 'role_confusion'

    elif question_type == 'Method of Reasoning':
        # Common trap: wrong method, confuses with flaw
        return 'method_confusion'

    elif question_type == 'Resolve the Paradox':
        # Common trap: only explains one fact, doesn't resolve
        return 'incomplete_resolution'

    elif question_type == 'Principle (Application)':
        # Common trap: violates principle, conditions not met
        return 'principle_misapplication'

    else:
        return 'unspecified_error'


def _apply_diagnostic_patterns(
    metrics: PerformanceMetrics,
    trap_analysis: Dict[str, TrapAnalysis]
) -> List[DiagnosticMatch]:
    """
    Apply diagnostic patterns from diagnostic_patterns_v2.txt.
    Returns list of matched diagnostic patterns.
    """
    matches: List[DiagnosticMatch] = []

    # Helper to get accuracy for a question type
    def get_qt_accuracy(qt: str) -> float:
        return metrics.by_question_type.get(qt, {}).get('accuracy', 1.0)

    def get_skill_accuracy(skill_id: str) -> float:
        return metrics.by_skill.get(skill_id, {}).get('accuracy', 1.0)

    # ==========================================================================
    # INDIVIDUAL DIAGNOSTIC PATTERNS (DIAG-S*, DIAG-FL*, DIAG-RH*, DIAG-ABS*)
    # ==========================================================================

    # DIAG-S01: Main Conclusion Identification Failure
    if get_qt_accuracy('Main Point') < 0.50:
        role_accuracy = get_qt_accuracy('Role of a Statement')
        if role_accuracy < 0.50:
            confidence = 'high'
            notes = 'Role of Statement also weak - S_01 is core foundational issue'
        else:
            confidence = 'medium'
            notes = 'May be S_04 (intermediate conclusion confusion)'
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-S01',
            root_cause='S_01',
            confidence=confidence,
            notes=notes,
        ))

    # DIAG-S02: Intermediate Conclusion Confusion
    # Detected via trap analysis for Main Point
    if 'Main Point' in trap_analysis:
        if trap_analysis['Main Point'].trap_counts.get('conclusion_confusion', 0) > 0:
            matches.append(DiagnosticMatch(
                pattern_id='DIAG-S02',
                root_cause='S_04',
                confidence='medium',
                notes='Picking intermediate conclusions on Main Point questions',
            ))

    # DIAG-FL01: Core Conditional Logic Failure
    mbt_accuracy = get_qt_accuracy('Must Be True')
    sa_accuracy = get_qt_accuracy('Sufficient Assumption')
    if mbt_accuracy < 0.50 and sa_accuracy < 0.50:
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-FL01',
            root_cause='FL_01/FL_02',
            confidence='high',
            notes='Both Must Be True and Sufficient Assumption weak - conditional logic foundation issue',
        ))

    # DIAG-FL02: Chain Deduction Failure
    # Inferred if MBT weak but simple conditionals might be OK
    if mbt_accuracy < 0.60 and sa_accuracy >= 0.60:
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-FL02',
            root_cause='FL_03',
            confidence='medium',
            notes='May struggle with multi-step conditional chains',
        ))

    # DIAG-FL05: Necessary vs. Sufficient Confusion
    na_accuracy = get_qt_accuracy('Necessary Assumption')
    if na_accuracy < 0.50 and sa_accuracy < 0.50:
        # Check trap patterns for confirmation
        na_traps = trap_analysis.get('Necessary Assumption', TrapAnalysis('', {}, 0))
        sa_traps = trap_analysis.get('Sufficient Assumption', TrapAnalysis('', {}, 0))
        if na_traps.trap_counts.get('too_strong_answer', 0) > 0 or sa_traps.trap_counts.get('too_weak_answer', 0) > 0:
            matches.append(DiagnosticMatch(
                pattern_id='DIAG-FL05',
                root_cause='FL_07',
                confidence='high',
                notes='Confusing necessary vs. sufficient conditions - picking too strong on NA, too weak on SA',
            ))

    # DIAG-RH01: Causality vs. Correlation Confusion
    flaw_accuracy = get_qt_accuracy('Flaw in Reasoning')
    weaken_accuracy = get_qt_accuracy('Weaken')
    if flaw_accuracy < 0.50 and weaken_accuracy < 0.50:
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-RH01',
            root_cause='RH_01/RH_02',
            confidence='medium',
            notes='Weak on both Flaw and Weaken - may struggle with causal reasoning',
        ))

    # DIAG-RH02: Gap Analysis Failure (Sufficiency)
    strengthen_accuracy = get_qt_accuracy('Strengthen')
    if strengthen_accuracy < 0.50 and sa_accuracy < 0.50:
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-RH02',
            root_cause='RH_03',
            confidence='high',
            notes='Weak on both Strengthen and Sufficient Assumption - gap identification issue',
        ))

    # DIAG-RH03: Gap Analysis Failure (Necessity)
    if na_accuracy < 0.50 and weaken_accuracy < 0.50:
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-RH03',
            root_cause='RH_04',
            confidence='high',
            notes='Weak on both Necessary Assumption and Weaken - necessity gap identification issue',
        ))

    # DIAG-RH04: Evidential Weight Comparison Failure
    mss_accuracy = get_qt_accuracy('Most Strongly Supported')
    if sa_accuracy >= 0.70 and na_accuracy >= 0.70 and strengthen_accuracy < 0.50 and mss_accuracy < 0.50:
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-RH04',
            root_cause='RH_07',
            confidence='high',
            notes='Pass assumption questions but fail probabilistic ones - evidential weight comparison issue',
        ))

    # DIAG-ABS01: Structural Matching Failure
    parallel_accuracy = get_qt_accuracy('Parallel Reasoning')
    if parallel_accuracy < 0.50 and mbt_accuracy >= 0.60:
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-ABS01',
            root_cause='ABS_01',
            confidence='medium',
            notes='FL skills OK but Parallel Reasoning weak - abstraction/structural matching issue',
        ))

    # DIAG-ABS02: Flaw Matching Failure
    parallel_flaw_accuracy = get_qt_accuracy('Parallel Flaw')
    if parallel_flaw_accuracy < 0.50 and flaw_accuracy >= 0.60:
        matches.append(DiagnosticMatch(
            pattern_id='DIAG-ABS02',
            root_cause='ABS_02',
            confidence='medium',
            notes='Can identify flaws but not match them - flaw abstraction issue',
        ))

    # ==========================================================================
    # CROSS-PATTERN DIAGNOSTICS
    # ==========================================================================

    # CROSS01: Everything is Weak
    weak_qt_count = sum(1 for qt_data in metrics.by_question_type.values() if qt_data.get('accuracy', 1.0) < 0.50)
    if weak_qt_count >= 5:
        if get_qt_accuracy('Main Point') < 0.50:
            matches.append(DiagnosticMatch(
                pattern_id='CROSS01-EVERYTHING_WEAK',
                root_cause='S_01',
                confidence='high',
                notes='5+ question types weak with Main Point failure - foundational S_01 issue',
            ))
        else:
            matches.append(DiagnosticMatch(
                pattern_id='CROSS01-EVERYTHING_WEAK',
                root_cause='multiple',
                confidence='medium',
                notes='5+ question types weak - may be timing, focus, or multiple skill gaps',
            ))

    # CROSS02: Prove vs. Support
    if mbt_accuracy >= 0.70 and sa_accuracy >= 0.70 and strengthen_accuracy < 0.60 and mss_accuracy < 0.60:
        matches.append(DiagnosticMatch(
            pattern_id='CROSS02-PROVE_VS_SUPPORT',
            root_cause='RH_07/FL_06',
            confidence='high',
            notes='Strong with certainty-based questions, weak with probabilistic - prove vs. support distinction',
        ))

    # CROSS03: Structure vs. Content
    method_accuracy = get_qt_accuracy('Method of Reasoning')
    role_accuracy = get_qt_accuracy('Role of a Statement')
    content_avg = (mbt_accuracy + strengthen_accuracy + weaken_accuracy + sa_accuracy + na_accuracy) / 5
    structure_avg = (method_accuracy + role_accuracy + parallel_accuracy) / 3
    if content_avg >= 0.60 and structure_avg < 0.50:
        matches.append(DiagnosticMatch(
            pattern_id='CROSS03-STRUCTURE_VS_CONTENT',
            root_cause='ABS_01/S_02',
            confidence='high',
            notes='Good at evaluating arguments but struggles describing structure',
        ))

    return matches


def _build_cognitive_fingerprint(
    metrics: PerformanceMetrics,
    diagnostic_matches: List[DiagnosticMatch],
    trap_analysis: Dict[str, TrapAnalysis]
) -> CognitiveFingerprint:
    """
    Build cognitive fingerprint from patterns and trap analysis.
    Synthesizes diagnostic matches into user-interpretable cognitive patterns.
    """
    primary_patterns: List[CognitivePattern] = []
    reasoning_tendencies: List[ReasoningTendency] = []

    # Pattern definitions with user-facing descriptions
    PATTERN_DEFINITIONS = {
        'DIAG-S01': {
            'pattern_id': 'CONCLUSION_CONFUSION',
            'description': 'Identifies support relationships but misses the final claim',
            'affected_skills': ['S_01', 'S_04'],
            'affected_question_types': ['Main Point', 'Role of a Statement'],
        },
        'DIAG-FL01': {
            'pattern_id': 'CONDITIONAL_SENSITIVITY',
            'description': 'Formal logic rules are a bottleneck across question types',
            'affected_skills': ['FL_01', 'FL_02', 'FL_03'],
            'affected_question_types': ['Must Be True', 'Sufficient Assumption', 'Parallel Reasoning'],
        },
        'DIAG-FL05': {
            'pattern_id': 'NEC_SUFF_CONFUSION',
            'description': "Confuses what's required vs. what would guarantee it",
            'affected_skills': ['FL_07', 'RH_03', 'RH_04'],
            'affected_question_types': ['Necessary Assumption', 'Sufficient Assumption'],
        },
        'DIAG-RH01': {
            'pattern_id': 'CAUSAL_SENSITIVITY',
            'description': 'Struggles to distinguish causation from correlation',
            'affected_skills': ['RH_01', 'RH_02'],
            'affected_question_types': ['Flaw in Reasoning', 'Weaken', 'Strengthen'],
        },
        'DIAG-RH02': {
            'pattern_id': 'GAP_BLINDNESS',
            'description': 'Difficulty identifying what arguments assume',
            'affected_skills': ['RH_03', 'RH_04'],
            'affected_question_types': ['Strengthen', 'Sufficient Assumption', 'Necessary Assumption'],
        },
        'DIAG-ABS01': {
            'pattern_id': 'ABSTRACTION_GAP',
            'description': 'Matches on content rather than logical structure',
            'affected_skills': ['ABS_01', 'ABS_02'],
            'affected_question_types': ['Parallel Reasoning', 'Parallel Flaw'],
        },
        'CROSS02-PROVE_VS_SUPPORT': {
            'pattern_id': 'PROVE_VS_SUPPORT',
            'description': 'Strong with certainty-based logic, struggles with probabilistic reasoning',
            'affected_skills': ['RH_07', 'FL_06'],
            'affected_question_types': ['Strengthen', 'Most Strongly Supported'],
        },
        'CROSS03-STRUCTURE_VS_CONTENT': {
            'pattern_id': 'STRUCTURE_VS_CONTENT',
            'description': 'Good at evaluating arguments, but difficulty describing HOW they work',
            'affected_skills': ['S_02', 'ABS_01'],
            'affected_question_types': ['Method of Reasoning', 'Role of a Statement', 'Parallel Reasoning'],
        },
    }

    # Convert diagnostic matches to cognitive patterns
    for match in diagnostic_matches:
        if match.pattern_id in PATTERN_DEFINITIONS:
            defn = PATTERN_DEFINITIONS[match.pattern_id]
            primary_patterns.append(CognitivePattern(
                pattern_id=defn['pattern_id'],
                description=defn['description'],
                evidence=match.notes,
                affected_skills=defn['affected_skills'],
                affected_question_types=defn['affected_question_types'],
            ))

    # Limit to 2-4 primary patterns
    primary_patterns = primary_patterns[:4]

    # Extract reasoning tendencies from trap analysis
    TENDENCY_MAPPINGS = {
        'too_strong_answer': {
            'tendency': 'Selects answers that are too strong',
            'context': 'Assumption and inference questions',
        },
        'too_weak_answer': {
            'tendency': 'Selects answers that are too weak',
            'context': 'Sufficient Assumption questions',
        },
        'surface_matching': {
            'tendency': 'Matches on content rather than logical structure',
            'context': 'Parallel Reasoning and Parallel Flaw questions',
        },
        'inference_overreach': {
            'tendency': 'Draws conclusions beyond what the evidence supports',
            'context': 'Must Be True and inference questions',
        },
        'conclusion_confusion': {
            'tendency': 'Confuses intermediate conclusions with main points',
            'context': 'Main Point and structural questions',
        },
    }

    # Collect tendencies from trap analysis
    for qt, analysis in trap_analysis.items():
        for trap_type, count in analysis.trap_counts.items():
            if trap_type in TENDENCY_MAPPINGS and count > 0:
                mapping = TENDENCY_MAPPINGS[trap_type]
                # Avoid duplicates
                if not any(t.tendency == mapping['tendency'] for t in reasoning_tendencies):
                    reasoning_tendencies.append(ReasoningTendency(
                        tendency=mapping['tendency'],
                        context=mapping['context'],
                        trap_pattern=trap_type,
                    ))

    # Build interaction summary
    if primary_patterns:
        pattern_descriptions = [p.description for p in primary_patterns[:2]]
        if len(primary_patterns) > 2:
            interaction_summary = f"Primary patterns: {pattern_descriptions[0]}. Additionally, {pattern_descriptions[1].lower()}."
        else:
            interaction_summary = pattern_descriptions[0] if pattern_descriptions else "No clear patterns detected."
    else:
        if metrics.overall_accuracy >= 0.70:
            interaction_summary = "Strong overall performance with no significant skill gaps detected."
        else:
            interaction_summary = "Performance below proficiency threshold across multiple areas - foundational skills may need review."

    return CognitiveFingerprint(
        primary_patterns=primary_patterns,
        interaction_summary=interaction_summary,
        reasoning_tendencies=reasoning_tendencies[:4],  # Limit to 4
    )


def _identify_strengths(
    metrics: PerformanceMetrics,
    session_data: Dict[str, Any]
) -> List[SkillStrength]:
    """
    Identify user's strengths. Always returns at least 3.
    """
    user_elo_ratings = session_data.get('user_elo_ratings', {})

    # Build list of all skills with their performance data
    skill_performance: List[Tuple[str, float, float]] = []  # (skill_id, accuracy, elo)

    for skill_id in SKILL_NAMES.keys():
        skill_data = metrics.by_skill.get(skill_id, {})
        accuracy = skill_data.get('accuracy', 0.0)
        total = skill_data.get('total', 0)

        # Get ELO rating if available
        elo_data = user_elo_ratings.get(skill_id, {})
        elo_rating = elo_data.get('rating', 1500.0) if isinstance(elo_data, dict) else 1500.0

        # Only include if we have some data for this skill
        if total > 0:
            skill_performance.append((skill_id, accuracy, elo_rating))

    # If we don't have enough skill data, use ELO-based fallback
    if len(skill_performance) < 3:
        for skill_id in SKILL_NAMES.keys():
            if skill_id not in [sp[0] for sp in skill_performance]:
                elo_data = user_elo_ratings.get(skill_id, {})
                elo_rating = elo_data.get('rating', 1500.0) if isinstance(elo_data, dict) else 1500.0
                skill_performance.append((skill_id, 0.5, elo_rating))  # Default accuracy

    # Sort by accuracy (desc), then by ELO (desc)
    skill_performance.sort(key=lambda x: (x[1], x[2]), reverse=True)

    # Take top skills as strengths
    strengths: List[SkillStrength] = []
    for rank, (skill_id, accuracy, elo_rating) in enumerate(skill_performance[:max(3, len(skill_performance))], 1):
        # Determine evidence based on accuracy
        if accuracy >= 0.85:
            evidence = f"Excellent performance ({int(accuracy * 100)}% accuracy)"
        elif accuracy >= 0.70:
            evidence = f"Strong performance ({int(accuracy * 100)}% accuracy)"
        else:
            evidence = f"Best relative performance among skills"

        strengths.append(SkillStrength(
            skill_id=skill_id,
            skill_name=SKILL_NAMES.get(skill_id, skill_id),
            confidence_rank=rank,
            evidence=evidence,
            elo_rating=elo_rating,
            accuracy=accuracy,
        ))

        if len(strengths) >= 3:
            break

    return strengths


def _identify_weaknesses(
    metrics: PerformanceMetrics,
    diagnostic_matches: List[DiagnosticMatch],
    trap_analysis: Dict[str, TrapAnalysis]
) -> List[SkillWeakness]:
    """
    Identify user's weaknesses. Always returns at least 3, prioritized.
    """
    weaknesses: List[SkillWeakness] = []
    seen_skills: set = set()

    # Helper to get priority label and impact score
    def get_priority_info(skill_id: str) -> Tuple[str, int]:
        if skill_id in SKILL_IMPACT['critical']:
            return '🚨 CRITICAL', 8
        elif skill_id in SKILL_IMPACT['high']:
            return '⚠️ HIGH', 5
        else:
            return '📝 MODERATE', 3

    # Helper to get trap pattern for a skill
    def get_trap_for_skill(skill_id: str) -> Optional[str]:
        # Find question types for this skill
        for qt, skills in QUESTION_TYPE_SKILLS.items():
            if skill_id in skills and qt in trap_analysis:
                traps = trap_analysis[qt].trap_counts
                if traps:
                    return max(traps.keys(), key=lambda t: traps.get(t, 0))
        return None

    # First, add weaknesses from diagnostic matches (prioritized)
    for match in diagnostic_matches:
        # Parse root_cause which may be single skill or multiple (e.g., "FL_01/FL_02")
        root_causes = match.root_cause.replace('/', ',').split(',')

        for root_cause in root_causes:
            root_cause = root_cause.strip()
            if root_cause in SKILL_NAMES and root_cause not in seen_skills:
                priority_label, impact_score = get_priority_info(root_cause)
                trap_pattern = get_trap_for_skill(root_cause)

                # Get context from diagnostic notes
                context = match.notes

                weaknesses.append(SkillWeakness(
                    skill_id=root_cause,
                    skill_name=SKILL_NAMES.get(root_cause, root_cause),
                    priority_rank=len(weaknesses) + 1,
                    priority_label=priority_label,
                    impact_score=impact_score,
                    diagnostic_pattern=match.pattern_id,
                    root_cause=match.notes,
                    context=context,
                    trap_pattern=trap_pattern,
                ))
                seen_skills.add(root_cause)

    # If we don't have enough from diagnostic matches, add skills with lowest accuracy
    if len(weaknesses) < 3:
        # Get skills sorted by accuracy (ascending)
        skill_accuracies = []
        for skill_id, skill_data in metrics.by_skill.items():
            if skill_id not in seen_skills:
                skill_accuracies.append((skill_id, skill_data.get('accuracy', 1.0)))

        skill_accuracies.sort(key=lambda x: x[1])

        for skill_id, accuracy in skill_accuracies:
            if len(weaknesses) >= 3:
                break

            if accuracy < 0.85:  # Only add if below mastery
                priority_label, impact_score = get_priority_info(skill_id)
                trap_pattern = get_trap_for_skill(skill_id)

                weaknesses.append(SkillWeakness(
                    skill_id=skill_id,
                    skill_name=SKILL_NAMES.get(skill_id, skill_id),
                    priority_rank=len(weaknesses) + 1,
                    priority_label=priority_label,
                    impact_score=impact_score,
                    diagnostic_pattern='INFERRED',
                    root_cause=f"Below proficiency threshold ({int(accuracy * 100)}% accuracy)",
                    context=f"Performance on {skill_id} related questions",
                    trap_pattern=trap_pattern,
                ))
                seen_skills.add(skill_id)

    # Re-rank by priority (CRITICAL > HIGH > MODERATE)
    priority_order = {'🚨 CRITICAL': 0, '⚠️ HIGH': 1, '📝 MODERATE': 2}
    weaknesses.sort(key=lambda w: (priority_order.get(w.priority_label, 3), -w.impact_score))

    # Update priority ranks after sorting
    for i, weakness in enumerate(weaknesses):
        weakness.priority_rank = i + 1

    return weaknesses[:max(3, len(weaknesses))]


def _get_theta_estimate(user_id: str) -> float:
    """
    Get Rasch ability estimate for user. Placeholder for now.
    """
    # TODO: Integrate with actual IRT/Rasch system
    return 0.0
