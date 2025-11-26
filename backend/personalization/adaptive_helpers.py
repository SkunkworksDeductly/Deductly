"""
Helper functions for adaptive study plan system
Includes feature engineering, reward calculation, phase allocation, etc.
"""
import numpy as np
import json
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from db import get_db_connection


# ============================================================================
# SKILL MAPPING UTILITIES
# ============================================================================

def skill_id_to_index(skill_id: str) -> int:
    """
    Map skill_id (e.g., 'LR-03') to index 0-34.

    LR-01 to LR-18: indices 0-17
    RC-01 to RC-17: indices 18-34

    Args:
        skill_id: Skill identifier (e.g., 'LR-03', 'RC-05')

    Returns:
        index: Integer index 0-34
    """
    if skill_id.startswith('LR'):
        num = int(skill_id.split('-')[1])
        return num - 1  # LR-01 -> 0, LR-02 -> 1, ..., LR-18 -> 17
    elif skill_id.startswith('RC'):
        num = int(skill_id.split('-')[1])
        return 18 + num - 1  # RC-01 -> 18, RC-02 -> 19, ..., RC-17 -> 34
    else:
        raise ValueError(f"Unknown skill_id format: {skill_id}")


def index_to_skill_id(index: int) -> str:
    """
    Map index 0-34 to skill_id.

    Args:
        index: Integer index 0-34

    Returns:
        skill_id: Skill identifier (e.g., 'LR-03')
    """
    if 0 <= index <= 17:
        return f"LR-{index + 1:02d}"
    elif 18 <= index <= 34:
        return f"RC-{index - 17:02d}"
    else:
        raise ValueError(f"Index {index} out of range [0, 34]")


def get_skill_indices(skill_ids: List[str]) -> List[int]:
    """
    Convert list of skill_ids to list of indices.

    Args:
        skill_ids: List of skill identifiers

    Returns:
        indices: List of integer indices
    """
    return [skill_id_to_index(sid) for sid in skill_ids]


# ============================================================================
# MASTERY VECTOR UTILITIES
# ============================================================================

def get_mastery_vector(user_id: str, timestamp: Optional[datetime] = None) -> np.ndarray:
    """
    Retrieve mastery vector for a user at a specific point in time.

    Args:
        user_id: User identifier
        timestamp: Point in time (None = current mastery)

    Returns:
        mastery_vector: 35-dimensional numpy array
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        if timestamp is None:
            # Get current mastery
            row = cursor.execute(
                "SELECT mastery_vector FROM user_abilities WHERE user_id = ?",
                (user_id,)
            ).fetchone()

            if row and row['mastery_vector']:
                return np.array(json.loads(row['mastery_vector']))
            else:
                # Default initialization: assume moderate mastery
                return np.full(35, 0.3)
        else:
            # Get historical mastery from history table
            row = cursor.execute(
                """SELECT mastery_vector FROM mastery_vector_history
                   WHERE user_id = ? AND timestamp <= ?
                   ORDER BY timestamp DESC LIMIT 1""",
                (user_id, timestamp)
            ).fetchone()

            if row and row['mastery_vector']:
                return np.array(json.loads(row['mastery_vector']))
            else:
                # Fallback to default
                return np.full(35, 0.3)


def store_mastery_snapshot(user_id: str, mastery_vector: np.ndarray,
                           trigger_event: str, theta_scalar: Optional[float] = None):
    """
    Store a snapshot of mastery vector in history table.

    Args:
        user_id: User identifier
        mastery_vector: 35-dimensional mastery vector
        trigger_event: Event that triggered snapshot (e.g., 'week_1_end', 'diagnostic')
        theta_scalar: Optional overall ability score
    """
    from utils import generate_id

    with get_db_connection() as conn:
        cursor = conn.cursor()

        snapshot_id = generate_id('mvh')

        cursor.execute(
            """INSERT INTO mastery_vector_history
               (id, user_id, mastery_vector, theta_scalar, trigger_event)
               VALUES (?, ?, ?, ?, ?)""",
            (snapshot_id, user_id, json.dumps(mastery_vector.tolist()),
             theta_scalar, trigger_event)
        )
        conn.commit()


# ============================================================================
# FEATURE ENGINEERING
# ============================================================================

def construct_features(module: Dict, mastery_vector: np.ndarray,
                      phase: str, week_number: int) -> np.ndarray:
    """
    Construct feature vector φ(module, context) for bandit.

    Feature breakdown:
    - [0:35]: Current mastery for all 35 skills
    - [35:40]: Mastery gaps for module's target skills (1 - mastery)
    - [40:43]: Difficulty one-hot encoding (foundation=100, intermediate=010, advanced=001)
    - [43]: Phase match indicator (1 if module matches current phase)
    - [44]: Week number normalized (week/10)
    - [45:50]: Skill interaction terms (products of related skill masteries)
    - [50:100]: Padding to fixed dimension

    Args:
        module: Module dictionary from library
        mastery_vector: Current 35-dim mastery vector
        phase: Current phase ('foundation', 'practice', 'mastery')
        week_number: Current week (1-10)

    Returns:
        features: 100-dimensional feature vector
    """
    features = []

    # 1. Current mastery (35 dims)
    features.extend(mastery_vector.tolist())

    # 2. Mastery gaps for target skills (up to 5, pad with 0)
    target_skills = module['target_skills']
    for i in range(5):
        if i < len(target_skills):
            skill_idx = skill_id_to_index(target_skills[i])
            gap = 1.0 - mastery_vector[skill_idx]
            features.append(gap)
        else:
            features.append(0.0)

    # 3. Difficulty encoding (one-hot)
    difficulty_map = {'foundation': 0, 'intermediate': 1, 'advanced': 2}
    diff_idx = difficulty_map.get(module['difficulty_level'], 0)
    diff_onehot = [0.0, 0.0, 0.0]
    diff_onehot[diff_idx] = 1.0
    features.extend(diff_onehot)

    # 4. Phase match (binary)
    phase_match = 1.0 if phase in module['phase_suitability'] else 0.0
    features.append(phase_match)

    # 5. Week number (normalized)
    features.append(week_number / 10.0)

    # 6. Skill interaction terms (products of target skill masteries)
    # Take up to 3 target skills and compute pairwise products
    interaction_count = 0
    for i in range(min(3, len(target_skills))):
        for j in range(i + 1, min(3, len(target_skills))):
            idx_i = skill_id_to_index(target_skills[i])
            idx_j = skill_id_to_index(target_skills[j])
            features.append(mastery_vector[idx_i] * mastery_vector[idx_j])
            interaction_count += 1

    # Pad interaction terms to 5
    while interaction_count < 5:
        features.append(0.0)
        interaction_count += 1

    # Total so far: 35 + 5 + 3 + 1 + 1 + 5 = 50
    # Pad to 100 dimensions
    while len(features) < 100:
        features.append(0.0)

    return np.array(features[:100])


# ============================================================================
# REWARD CALCULATION
# ============================================================================

def compute_module_reward(module_id: str, user_id: str,
                         week_start: datetime, week_end: datetime) -> float:
    """
    Compute reward for a completed module.

    Reward is the weighted average improvement in mastery for target skills:
    reward = Σᵢ wᵢ * (m_after[i] - m_before[i]) / num_target_skills

    where wᵢ = 1.0 for target skills, 0.5 for secondary skills

    Args:
        module_id: Module identifier
        user_id: User identifier
        week_start: Start timestamp of week
        week_end: End timestamp of week

    Returns:
        reward: Float in range [-0.2, 0.5] (clipped)
    """
    # Load module library to get target/secondary skills
    module = get_module_by_id(module_id)
    if not module:
        return 0.0

    target_skills = module['target_skills']
    secondary_skills = module.get('secondary_skills', [])

    # Get mastery vectors
    mastery_before = get_mastery_vector(user_id, timestamp=week_start)
    mastery_after = get_mastery_vector(user_id, timestamp=week_end)

    # Calculate weighted improvement
    total_improvement = 0.0
    weight_sum = 0.0

    for skill_id in target_skills:
        skill_idx = skill_id_to_index(skill_id)
        improvement = mastery_after[skill_idx] - mastery_before[skill_idx]
        total_improvement += improvement * 1.0  # Weight = 1.0
        weight_sum += 1.0

    for skill_id in secondary_skills:
        skill_idx = skill_id_to_index(skill_id)
        improvement = mastery_after[skill_idx] - mastery_before[skill_idx]
        total_improvement += improvement * 0.5  # Weight = 0.5
        weight_sum += 0.5

    # Average improvement
    if weight_sum > 0:
        avg_improvement = total_improvement / weight_sum
    else:
        avg_improvement = 0.0

    # Clip to reasonable range
    reward = np.clip(avg_improvement, -0.2, 0.5)

    # Optional: penalize incomplete modules
    completion_rate = get_module_completion_rate(module_id, user_id, week_start, week_end)
    if completion_rate < 0.5:
        reward *= 0.5  # Reduce reward if user didn't engage

    return float(reward)


def get_module_completion_rate(module_id: str, user_id: str,
                               week_start: datetime, week_end: datetime) -> float:
    """
    Calculate what fraction of module tasks were completed.

    Args:
        module_id: Module identifier
        user_id: User identifier
        week_start: Start of week
        week_end: End of week

    Returns:
        completion_rate: Float in [0, 1]
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Get all tasks for this module in the time range
        rows = cursor.execute(
            """SELECT COUNT(*) as total,
                      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
               FROM study_plan_tasks
               WHERE module_id = ? AND created_at >= ? AND created_at <= ?""",
            (module_id, week_start, week_end)
        ).fetchone()

        if rows and rows['total'] > 0:
            return rows['completed'] / rows['total']
        else:
            return 0.0


# ============================================================================
# PHASE ALLOCATION
# ============================================================================

def allocate_phases(total_weeks: int, mastery_vector: np.ndarray) -> Tuple[int, int, int]:
    """
    Dynamically allocate weeks to phases based on initial skill level.

    Returns (N1, N2, N3) where:
    - N1 = weeks for Foundation phase
    - N2 = weeks for Practice phase
    - N3 = weeks for Mastery phase

    Args:
        total_weeks: Total study plan duration (e.g., 10)
        mastery_vector: Initial 35-dim mastery vector

    Returns:
        phase_allocation: Tuple (N1, N2, N3)
    """
    avg_mastery = np.mean(mastery_vector)
    skill_variance = np.var(mastery_vector)

    # Default allocation based on total weeks
    if total_weeks == 10:
        base_allocation = (3, 4, 3)  # Foundation, Practice, Mastery
    elif total_weeks == 12:
        base_allocation = (4, 5, 3)
    elif total_weeks == 8:
        base_allocation = (2, 4, 2)
    else:
        # Generic allocation
        N1 = max(2, total_weeks // 4)
        N2 = max(3, total_weeks // 2)
        N3 = max(2, total_weeks - N1 - N2)
        base_allocation = (N1, N2, N3)

    N1, N2, N3 = base_allocation

    # Adjust based on initial mastery
    if avg_mastery < 0.25:
        # Beginner: extend foundation
        N1 = min(N1 + 1, total_weeks - 4)
        N3 = max(2, N3 - 1)
    elif avg_mastery > 0.5:
        # Advanced: shorten foundation, extend mastery
        N1 = max(2, N1 - 1)
        N3 = min(N3 + 1, total_weeks - 4)

    # Adjust based on skill variance
    if skill_variance > 0.05:
        # High variance (uneven skills): need more focused practice
        N2 = min(N2 + 1, total_weeks - N1 - 2)
        N3 = max(2, N3 - 1)

    # Ensure valid allocation
    while N1 + N2 + N3 != total_weeks:
        if N1 + N2 + N3 < total_weeks:
            N2 += 1  # Add to practice phase
        else:
            N2 = max(3, N2 - 1)  # Remove from practice

    return (N1, N2, N3)


# ============================================================================
# MODULE LIBRARY UTILITIES
# ============================================================================

def load_module_library() -> List[Dict]:
    """
    Load module library from JSON file.

    Returns:
        modules: List of module dictionaries
    """
    import os

    # Get path to modules_library.json
    current_dir = os.path.dirname(__file__)
    data_dir = os.path.join(current_dir, '..', 'data')
    library_path = os.path.join(data_dir, 'modules_library.json')

    with open(library_path, 'r') as f:
        data = json.load(f)

    return data['modules']


def get_module_by_id(module_id: str) -> Optional[Dict]:
    """
    Get module by ID from library.

    Args:
        module_id: Module identifier

    Returns:
        module: Module dictionary or None if not found
    """
    modules = load_module_library()

    for module in modules:
        if module['module_id'] == module_id:
            return module

    return None


def filter_modules_by_phase(modules: List[Dict], phase: str) -> List[Dict]:
    """
    Filter modules suitable for a given phase.

    Args:
        modules: List of module dictionaries
        phase: Phase name ('foundation', 'practice', 'mastery')

    Returns:
        filtered_modules: Modules suitable for this phase
    """
    return [m for m in modules if phase in m['phase_suitability']]


def check_prerequisites(module: Dict, completed_modules: set) -> bool:
    """
    Check if all prerequisites for a module are satisfied.

    Args:
        module: Module dictionary
        completed_modules: Set of completed module IDs

    Returns:
        satisfied: True if all prerequisites are met
    """
    prerequisites = module.get('prerequisites', [])
    return all(prereq in completed_modules for prereq in prerequisites)


# ============================================================================
# WEEK/TIME UTILITIES
# ============================================================================

def get_week_start_time(study_plan_id: str, week_number: int) -> datetime:
    """
    Get start timestamp for a given week in study plan.

    Args:
        study_plan_id: Study plan identifier
        week_number: Week number (1-indexed)

    Returns:
        start_time: Datetime of week start
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        row = cursor.execute(
            "SELECT start_date FROM study_plans WHERE id = ?",
            (study_plan_id,)
        ).fetchone()

        if row:
            start_date = datetime.strptime(row['start_date'], '%Y-%m-%d')
            week_start = start_date + timedelta(weeks=week_number - 1)
            return week_start
        else:
            return datetime.now()


def get_current_phase(study_plan_id: str) -> str:
    """
    Get current phase for study plan.

    Args:
        study_plan_id: Study plan identifier

    Returns:
        phase: 'foundation', 'practice', or 'mastery'
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        row = cursor.execute(
            "SELECT current_phase FROM study_plans WHERE id = ?",
            (study_plan_id,)
        ).fetchone()

        if row and row['current_phase']:
            return row['current_phase']
        else:
            return 'foundation'


def update_study_plan_phase(study_plan_id: str, new_phase: str):
    """
    Update current phase of study plan.

    Args:
        study_plan_id: Study plan identifier
        new_phase: New phase name
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE study_plans SET current_phase = ? WHERE id = ?",
            (new_phase, study_plan_id)
        )
        conn.commit()


# ============================================================================
# COMPLETED MODULES TRACKING
# ============================================================================

def get_completed_modules(user_id: str) -> set:
    """
    Get set of module IDs that user has completed.

    Args:
        user_id: User identifier

    Returns:
        completed_modules: Set of module IDs
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        rows = cursor.execute(
            """SELECT DISTINCT module_id FROM module_completions
               WHERE user_id = ? AND completion_rate >= 0.8""",
            (user_id,)
        ).fetchall()

        return {row['module_id'] for row in rows if row['module_id']}


def log_module_completion(user_id: str, module_id: str, study_plan_id: str,
                          week_number: int, reward: float,
                          mastery_before: np.ndarray, mastery_after: np.ndarray,
                          completion_rate: float):
    """
    Log completion of a module.

    Args:
        user_id: User identifier
        module_id: Module identifier
        study_plan_id: Study plan identifier
        week_number: Week number
        reward: Computed reward
        mastery_before: Mastery vector before module
        mastery_after: Mastery vector after module
        completion_rate: Fraction of tasks completed (0-1)
    """
    from utils import generate_id

    with get_db_connection() as conn:
        cursor = conn.cursor()

        completion_id = generate_id('mc')

        cursor.execute(
            """INSERT INTO module_completions
               (id, user_id, module_id, study_plan_id, week_number,
                completed_at, completion_rate, reward,
                mastery_before, mastery_after)
               VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)""",
            (completion_id, user_id, module_id, study_plan_id, week_number,
             completion_rate, reward,
             json.dumps(mastery_before.tolist()),
             json.dumps(mastery_after.tolist()))
        )
        conn.commit()


if __name__ == "__main__":
    # Test helper functions
    print("Testing adaptive helper functions...")

    # Test skill mapping
    print("\n1. Skill ID mapping:")
    print(f"   LR-01 -> {skill_id_to_index('LR-01')} (expected: 0)")
    print(f"   LR-18 -> {skill_id_to_index('LR-18')} (expected: 17)")
    print(f"   RC-01 -> {skill_id_to_index('RC-01')} (expected: 18)")
    print(f"   RC-17 -> {skill_id_to_index('RC-17')} (expected: 34)")
    print(f"   Index 0 -> {index_to_skill_id(0)} (expected: LR-01)")
    print(f"   Index 34 -> {index_to_skill_id(34)} (expected: RC-17)")

    # Test phase allocation
    print("\n2. Phase allocation:")
    mastery_beginner = np.full(35, 0.2)
    mastery_intermediate = np.full(35, 0.5)
    mastery_advanced = np.full(35, 0.7)

    print(f"   Beginner (10 weeks): {allocate_phases(10, mastery_beginner)}")
    print(f"   Intermediate (10 weeks): {allocate_phases(10, mastery_intermediate)}")
    print(f"   Advanced (10 weeks): {allocate_phases(10, mastery_advanced)}")

    # Test module loading
    print("\n3. Module library:")
    try:
        modules = load_module_library()
        print(f"   Loaded {len(modules)} modules")
        print(f"   First module: {modules[0]['module_id']}")

        # Test filtering
        foundation_modules = filter_modules_by_phase(modules, 'foundation')
        print(f"   Foundation modules: {len(foundation_modules)}")

        # Test get by ID
        module = get_module_by_id('LR-ASSUMPTIONS-101')
        if module:
            print(f"   Retrieved module: {module['module_name']}")
    except Exception as e:
        print(f"   Error loading modules: {e}")

    # Test feature construction
    print("\n4. Feature construction:")
    mastery_vector = np.random.rand(35) * 0.5 + 0.25  # Random mastery 0.25-0.75

    try:
        module = get_module_by_id('LR-ASSUMPTIONS-101')
        if module:
            features = construct_features(module, mastery_vector, 'foundation', 3)
            print(f"   Feature dimension: {len(features)} (expected: 100)")
            print(f"   Feature range: [{features.min():.3f}, {features.max():.3f}]")
            print(f"   First 5 features (mastery): {features[:5]}")
    except Exception as e:
        print(f"   Error constructing features: {e}")

    print("\n✓ Helper function tests completed!")
