"""
Adaptive Study Plan Generator using Contextual Bandit + Hierarchical Planning

Main entry points:
- generate_adaptive_study_plan(): Create initial plan from diagnostic
- trigger_weekly_adaptation(): Update plan after each week
"""
import numpy as np
import json
from datetime import datetime, date, timedelta
from typing import List, Dict, Tuple, Optional
import uuid

from db import get_db_connection
from utils import generate_id
from personalization.bandit import BayesianLinearBandit
from personalization.adaptive_helpers import (
    get_mastery_vector,
    store_mastery_snapshot,
    construct_features,
    compute_module_reward,
    allocate_phases,
    load_module_library,
    get_module_by_id,
    filter_modules_by_phase,
    check_prerequisites,
    get_week_start_time,
    get_current_phase,
    update_study_plan_phase,
    get_completed_modules,
    log_module_completion,
    get_module_completion_rate,
    skill_id_to_index
)


# ============================================================================
# BANDIT MODEL PERSISTENCE
# ============================================================================

def save_bandit_model(user_id: str, bandit: BayesianLinearBandit):
    """
    Save bandit model to database.

    Args:
        user_id: User identifier
        bandit: BayesianLinearBandit instance
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        model_data = bandit.to_dict()

        # Check if model exists
        existing = cursor.execute(
            "SELECT user_id FROM bandit_models WHERE user_id = ?",
            (user_id,)
        ).fetchone()

        if existing:
            # Update
            cursor.execute(
                """UPDATE bandit_models
                   SET mu_vector = ?, sigma_matrix = ?, dimension = ?,
                       noise_variance = ?, num_updates = ?, last_updated = CURRENT_TIMESTAMP
                   WHERE user_id = ?""",
                (json.dumps(model_data['mu']),
                 json.dumps(model_data['Sigma']),
                 model_data['dimension'],
                 model_data['sigma_sq'],
                 model_data['num_updates'],
                 user_id)
            )
        else:
            # Insert
            cursor.execute(
                """INSERT INTO bandit_models
                   (user_id, mu_vector, sigma_matrix, dimension, noise_variance, num_updates)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (user_id,
                 json.dumps(model_data['mu']),
                 json.dumps(model_data['Sigma']),
                 model_data['dimension'],
                 model_data['sigma_sq'],
                 model_data['num_updates'])
            )

        conn.commit()


def load_bandit_model(user_id: str) -> BayesianLinearBandit:
    """
    Load bandit model from database.

    Args:
        user_id: User identifier

    Returns:
        bandit: BayesianLinearBandit instance (new if not found)
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        row = cursor.execute(
            "SELECT * FROM bandit_models WHERE user_id = ?",
            (user_id,)
        ).fetchone()

        if row:
            # Restore from database
            model_data = {
                'dimension': row['dimension'],
                'mu': json.loads(row['mu_vector']),
                'Sigma': json.loads(row['sigma_matrix']),
                'sigma_sq': row['noise_variance'],
                'num_updates': row['num_updates']
            }
            return BayesianLinearBandit.from_dict(model_data)
        else:
            # Create new bandit with prior
            return BayesianLinearBandit(
                dimension=100,
                prior_mean=np.zeros(100),
                prior_cov=np.eye(100) * 1.0,
                noise_variance=0.1
            )


# ============================================================================
# MODULE SELECTION FOR WEEKLY PLANNING
# ============================================================================

def select_modules_for_week(
    week_number: int,
    phase: str,
    mastery_vector: np.ndarray,
    bandit_model: BayesianLinearBandit,
    module_library: List[Dict],
    completed_modules: set,
    time_budget: int = 300
) -> List[Dict]:
    """
    Select K modules for a given week using Thompson Sampling.

    Args:
        week_number: Week number (1-indexed)
        phase: Current phase ('foundation', 'practice', 'mastery')
        mastery_vector: Current 35-dim mastery vector
        bandit_model: BayesianLinearBandit instance
        module_library: List of all modules
        completed_modules: Set of already-completed module IDs
        time_budget: Max minutes per week (default 300 = 5 hours)

    Returns:
        selected_modules: List of selected module dicts
    """
    # Sample parameters from posterior for Thompson Sampling
    theta_sample = bandit_model.sample_parameters()

    # Filter candidate modules
    candidates = [
        m for m in module_library
        if phase in m['phase_suitability']
        and m['module_id'] not in completed_modules
        and check_prerequisites(m, completed_modules)
    ]

    if len(candidates) == 0:
        # No suitable modules - return empty
        return []

    # Score each candidate module
    scores = []
    for module in candidates:
        context_features = construct_features(module, mastery_vector, phase, week_number)
        expected_reward = np.dot(theta_sample, context_features)
        scores.append((module, expected_reward))

    # Sort by score (descending)
    scores.sort(key=lambda x: x[1], reverse=True)

    # Greedy selection with constraints
    selected = []
    total_time = 0
    covered_skills = set()

    for module, score in scores:
        # Check time budget
        if total_time + module['estimated_minutes'] > time_budget:
            continue

        # Check diversity (avoid too much skill overlap)
        module_skills = set(module['target_skills'])
        if len(module_skills & covered_skills) > 0.7 * len(module_skills):
            # Too much overlap with already selected modules
            if len(selected) >= 2:  # Only enforce after 2 modules selected
                continue

        # Add module
        selected.append(module)
        total_time += module['estimated_minutes']
        covered_skills.update(module_skills)

        # Stop if we have enough modules (3-5)
        if len(selected) >= 5:
            break

    # Ensure at least 2 modules per week
    if len(selected) < 2 and len(candidates) >= 2:
        # Fallback: pick top 2 by score regardless of diversity
        selected = [m for m, s in scores[:2]]

    # Add diagnostic module every 3 weeks
    if week_number % 3 == 0:
        diagnostic_module = get_diagnostic_module(phase, covered_skills)
        if diagnostic_module:
            selected.append(diagnostic_module)

    return selected


def get_diagnostic_module(phase: str, covered_skills: set) -> Optional[Dict]:
    """
    Get appropriate diagnostic module for phase.

    Args:
        phase: Current phase
        covered_skills: Skills covered this week

    Returns:
        diagnostic_module: Diagnostic module or None
    """
    module_library = load_module_library()

    # Map phases to diagnostic modules
    diagnostic_map = {
        'foundation': 'DIAGNOSTIC-WEEK-3',
        'practice': 'DIAGNOSTIC-WEEK-6',
        'mastery': 'DIAGNOSTIC-WEEK-9'
    }

    diagnostic_id = diagnostic_map.get(phase)
    if diagnostic_id:
        return get_module_by_id(diagnostic_id)

    return None


# ============================================================================
# TASK INSERTION
# ============================================================================

def insert_module_tasks(study_plan_id: str, week_number: int,
                       module_order: int, module: Dict):
    """
    Insert tasks from a module into study_plan_tasks table.

    Args:
        study_plan_id: Study plan identifier
        week_number: Week number (1-indexed)
        module_order: Order of this module within the week (0-indexed)
        module: Module dictionary from library
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        task_order_base = module_order * 10  # Leave space between modules

        for task_idx, task in enumerate(module['tasks']):
            task_id = generate_id('spt')

            cursor.execute(
                """INSERT INTO study_plan_tasks
                   (id, study_plan_id, week_number, task_order,
                    task_type, title, estimated_minutes, task_config,
                    status, module_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    task_id,
                    study_plan_id,
                    week_number,
                    task_order_base + task_idx,
                    task['task_type'],
                    task['title'],
                    task['estimated_minutes'],
                    json.dumps(task.get('task_config', {})),
                    'pending',
                    module['module_id']
                )
            )

        conn.commit()


def delete_tasks_for_week(study_plan_id: str, week_number: int):
    """
    Delete all tasks for a specific week in the study plan.

    Args:
        study_plan_id: Study plan identifier
        week_number: Week number (1-indexed)
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """DELETE FROM study_plan_tasks
               WHERE study_plan_id = ? AND week_number = ?""",
            (study_plan_id, week_number)
        )
        conn.commit()


# ============================================================================
# MAIN PLANNING FUNCTIONS
# ============================================================================

def generate_adaptive_study_plan(
    user_id: str,
    diagnostic_drill_id: Optional[str] = None,
    total_weeks: int = 10,
    target_test_date: Optional[date] = None
) -> Dict:
    """
    Generate an adaptive study plan using hierarchical planning + contextual bandit.

    This is the main entry point for creating a new study plan.

    Args:
        user_id: User identifier
        diagnostic_drill_id: Reference to diagnostic drill (optional)
        total_weeks: Study plan duration (default 10)
        target_test_date: Target test date (optional)

    Returns:
        result: Dictionary with study plan details
    """
    # 1. Get initial mastery vector from diagnostic
    mastery_vector = get_mastery_vector(user_id)

    # 2. Determine phase allocation
    N1, N2, N3 = allocate_phases(total_weeks, mastery_vector)
    phase_allocation = [N1, N2, N3]

    print(f"[Adaptive Planner] Phase allocation: Foundation={N1}, Practice={N2}, Mastery={N3}")

    # 3. Initialize bandit model
    bandit_model = BayesianLinearBandit(
        dimension=100,
        prior_mean=np.zeros(100),
        prior_cov=np.eye(100) * 1.0,
        noise_variance=0.1
    )
    save_bandit_model(user_id, bandit_model)

    # 4. Create study plan record
    study_plan_id = generate_id('sp')
    start_date = target_test_date - timedelta(weeks=total_weeks) if target_test_date else date.today()

    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """INSERT INTO study_plans
               (id, user_id, diagnostic_drill_id, title, total_weeks,
                start_date, phase_allocation, current_phase, adaptation_enabled)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (study_plan_id, user_id, diagnostic_drill_id,
             "Adaptive LSAT Study Plan", total_weeks, start_date.isoformat(),
             json.dumps(phase_allocation), "foundation", 1)
        )
        conn.commit()

    # 5. Load module library
    module_library = load_module_library()

    # 6. Plan all weeks
    completed_modules = set()
    total_tasks = 0

    for week_num in range(1, total_weeks + 1):
        # Determine current phase
        if week_num <= N1:
            phase = "foundation"
        elif week_num <= N1 + N2:
            phase = "practice"
        else:
            phase = "mastery"

        # Select modules for this week
        selected_modules = select_modules_for_week(
            week_number=week_num,
            phase=phase,
            mastery_vector=mastery_vector,
            bandit_model=bandit_model,
            module_library=module_library,
            completed_modules=completed_modules,
            time_budget=300
        )

        print(f"[Adaptive Planner] Week {week_num} ({phase}): {len(selected_modules)} modules selected")

        # Insert tasks for selected modules
        for module_order, module in enumerate(selected_modules):
            insert_module_tasks(study_plan_id, week_num, module_order, module)
            total_tasks += len(module['tasks'])

        # Optimistically update completed set
        completed_modules.update(m['module_id'] for m in selected_modules)

    # 7. Store initial mastery snapshot
    store_mastery_snapshot(user_id, mastery_vector, trigger_event='study_plan_init')

    print(f"[Adaptive Planner] Study plan created: {total_tasks} tasks over {total_weeks} weeks")

    return {
        'study_plan_id': study_plan_id,
        'user_id': user_id,
        'total_weeks': total_weeks,
        'total_tasks': total_tasks,
        'start_date': start_date.isoformat(),
        'phase_allocation': phase_allocation,
        'message': 'Adaptive study plan generated successfully'
    }


def trigger_weekly_adaptation(user_id: str, study_plan_id: str, completed_week: int) -> Dict:
    """
    Trigger weekly adaptation: update bandit and replan future weeks.

    Called at the end of each week to adapt the study plan based on performance.

    Args:
        user_id: User identifier
        study_plan_id: Study plan identifier
        completed_week: Week number just completed (1-indexed)

    Returns:
        result: Dictionary with adaptation results
    """
    print(f"[Weekly Adaptation] Starting for user {user_id}, week {completed_week}")

    # 1. Verify week is complete
    if not is_week_complete(study_plan_id, completed_week):
        return {
            'status': 'error',
            'message': f'Week {completed_week} is not yet complete'
        }

    # 2. Get modules from completed week
    modules = get_modules_for_week(study_plan_id, completed_week)

    if len(modules) == 0:
        print(f"[Weekly Adaptation] No modules found for week {completed_week}")
        return {
            'status': 'error',
            'message': 'No modules found for this week'
        }

    # 3. Compute rewards for each module
    week_start = get_week_start_time(study_plan_id, completed_week)
    week_end = datetime.now()

    rewards = []
    features_list = []
    phase = get_current_phase(study_plan_id)

    for module in modules:
        # Calculate reward
        reward = compute_module_reward(
            module_id=module['module_id'],
            user_id=user_id,
            week_start=week_start,
            week_end=week_end
        )

        # Get context features (as they were at week start)
        mastery_at_start = get_mastery_vector(user_id, timestamp=week_start)
        context_features = construct_features(
            module=module,
            mastery_vector=mastery_at_start,
            phase=phase,
            week_number=completed_week
        )

        rewards.append(reward)
        features_list.append(context_features)

        # Log module completion
        mastery_at_end = get_mastery_vector(user_id, timestamp=week_end)
        completion_rate = get_module_completion_rate(
            module['module_id'], user_id, week_start, week_end
        )

        log_module_completion(
            user_id=user_id,
            module_id=module['module_id'],
            study_plan_id=study_plan_id,
            week_number=completed_week,
            reward=reward,
            mastery_before=mastery_at_start,
            mastery_after=mastery_at_end,
            completion_rate=completion_rate
        )

    print(f"[Weekly Adaptation] Computed rewards: {rewards}")

    # 4. Update bandit model
    bandit_model = load_bandit_model(user_id)
    bandit_model.update(features_list, rewards)
    save_bandit_model(user_id, bandit_model)

    print(f"[Weekly Adaptation] Bandit updated ({bandit_model.num_updates} total updates)")

    # 5. Store mastery snapshot
    current_mastery = get_mastery_vector(user_id)
    store_mastery_snapshot(user_id, current_mastery,
                          trigger_event=f'week_{completed_week}_end')

    # 6. Replan future weeks
    replan_future_weeks(user_id, completed_week, study_plan_id)

    # 7. Check if phase transition needed
    with get_db_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute(
            "SELECT phase_allocation FROM study_plans WHERE id = ?",
            (study_plan_id,)
        ).fetchone()

        N1, N2, N3 = json.loads(row['phase_allocation'])

        if completed_week == N1:
            update_study_plan_phase(study_plan_id, "practice")
            print(f"[Weekly Adaptation] Phase transition: foundation → practice")
        elif completed_week == N1 + N2:
            update_study_plan_phase(study_plan_id, "mastery")
            print(f"[Weekly Adaptation] Phase transition: practice → mastery")

    return {
        'status': 'success',
        'week_completed': completed_week,
        'rewards': rewards,
        'avg_reward': float(np.mean(rewards)),
        'num_modules': len(modules),
        'next_phase': get_current_phase(study_plan_id),
        'exploration_rate': bandit_model.get_exploration_rate()
    }


def replan_future_weeks(user_id: str, current_week: int, study_plan_id: str):
    """
    Replan all weeks after current_week based on updated bandit model.

    Args:
        user_id: User identifier
        current_week: Just-completed week number
        study_plan_id: Study plan identifier
    """
    print(f"[Replanning] Starting for weeks {current_week + 1}+")

    # Load study plan metadata
    with get_db_connection() as conn:
        cursor = conn.cursor()
        plan_row = cursor.execute(
            "SELECT * FROM study_plans WHERE id = ?",
            (study_plan_id,)
        ).fetchone()

        total_weeks = plan_row['total_weeks']
        phase_allocation = json.loads(plan_row['phase_allocation'])

    N1, N2, N3 = phase_allocation

    # Load updated bandit model
    bandit_model = load_bandit_model(user_id)

    # Load module library
    module_library = load_module_library()

    # Get completed modules
    completed_modules = get_completed_modules(user_id)

    # Get current mastery
    mastery_vector = get_mastery_vector(user_id)

    # Replan each future week
    for week_num in range(current_week + 1, total_weeks + 1):
        # Determine phase
        if week_num <= N1:
            phase = "foundation"
        elif week_num <= N1 + N2:
            phase = "practice"
        else:
            phase = "mastery"

        # Select modules for this week
        selected_modules = select_modules_for_week(
            week_number=week_num,
            phase=phase,
            mastery_vector=mastery_vector,
            bandit_model=bandit_model,
            module_library=module_library,
            completed_modules=completed_modules
        )

        # Remove old tasks for this week
        delete_tasks_for_week(study_plan_id, week_num)

        # Create new tasks from selected modules
        for module_order, module in enumerate(selected_modules):
            insert_module_tasks(study_plan_id, week_num, module_order, module)

        # Optimistically update completed_modules
        completed_modules.update(m['module_id'] for m in selected_modules)

    print(f"[Replanning] Completed for weeks {current_week + 1} to {total_weeks}")


# ============================================================================
# HELPER QUERY FUNCTIONS
# ============================================================================

def is_week_complete(study_plan_id: str, week_number: int) -> bool:
    """
    Check if all tasks in a week are completed.

    Args:
        study_plan_id: Study plan identifier
        week_number: Week number (1-indexed)

    Returns:
        complete: True if all tasks are completed
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        row = cursor.execute(
            """SELECT COUNT(*) as total,
                      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
               FROM study_plan_tasks
               WHERE study_plan_id = ? AND week_number = ?""",
            (study_plan_id, week_number)
        ).fetchone()

        if row and row['total'] > 0:
            return row['completed'] == row['total']

        return False


def get_modules_for_week(study_plan_id: str, week_number: int) -> List[Dict]:
    """
    Get all modules assigned to a specific week.

    Args:
        study_plan_id: Study plan identifier
        week_number: Week number (1-indexed)

    Returns:
        modules: List of module dictionaries
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        rows = cursor.execute(
            """SELECT DISTINCT module_id FROM study_plan_tasks
               WHERE study_plan_id = ? AND week_number = ? AND module_id IS NOT NULL""",
            (study_plan_id, week_number)
        ).fetchall()

        module_ids = [row['module_id'] for row in rows]

    # Load full module definitions
    modules = []
    for module_id in module_ids:
        module = get_module_by_id(module_id)
        if module:
            modules.append(module)

    return modules


if __name__ == "__main__":
    # Test the adaptive planner
    print("Testing Adaptive Planner...")
    print("\nNote: This requires a database connection to run fully.")
    print("The main functions are:")
    print("  - generate_adaptive_study_plan(user_id, ...)")
    print("  - trigger_weekly_adaptation(user_id, study_plan_id, week)")
    print("\n✓ Adaptive planner module loaded successfully")
