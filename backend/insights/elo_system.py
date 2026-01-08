import math
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Dict, Optional

# --- Parameters ---
DEFAULT_RATING = 1500.0
BASE_K_USER = 40.0
BASE_K_QUESTION = 20.0
ELO_SCALE = 400.0
DELTA_BOUND = 100.0

# --- Data Structures (Simulating Database Models) ---

@dataclass
class Skill:
    id: int
    name: str

@dataclass
class UserSkillRating:
    user_id: int
    skill_id: int
    rating: float = DEFAULT_RATING
    num_updates: int = 0
    last_updated_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class QuestionSkill:
    skill_id: int
    weight: float

@dataclass
class Question:
    id: int
    difficulty_elo_base: float
    skills: List[QuestionSkill]

@dataclass
class QuestionRating:
    question_id: int
    rating_delta: float = 0.0
    num_updates: int = 0
    last_updated_at: datetime = field(default_factory=datetime.utcnow)

# --- Core Logic ---

def expected_score(user_rating: float, question_difficulty: float) -> float:
    """Probability of correct response given user rating and question difficulty."""
    return 1.0 / (1.0 + 10.0 ** ((question_difficulty - user_rating) / ELO_SCALE))

def adaptive_k(base_k: float, num_updates: int) -> float:
    """K-factor that decays with experience."""
    return base_k / math.sqrt(num_updates + 1)

def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))

def get_question_effective_difficulty(question: Question, question_rating: Optional[QuestionRating]) -> float:
    """Returns D_q_base + delta_q for a question."""
    base = question.difficulty_elo_base
    delta = question_rating.rating_delta if question_rating else 0.0
    return base + delta

def update_elo(
    user_ratings: Dict[int, UserSkillRating],
    question: Question,
    question_rating: Optional[QuestionRating],
    is_correct: bool,
    update_question: bool = False,
) -> dict:
    """
    Update per-skill Elo ratings after a response.
    
    Args:
        user_ratings: Dict mapping skill_id to UserSkillRating objects.
        question: The Question object.
        question_rating: The QuestionRating object (can be None).
        is_correct: Whether the user answered correctly.
        update_question: Whether to update the question difficulty.
        
    Returns:
        Dict with debugging info.
    """
    score = 1.0 if is_correct else 0.0
    result = {'actual': int(is_correct), 'skill_updates': []}
    
    # 1. Get skill weights for this question
    q_skills = question.skills
    
    if not q_skills:
        return result
    
    # 2. Ensure user ratings exist for all skills (in a real app, we'd fetch/create)
    # Here we assume they are passed in correctly populated or created before call
    
    # 3. Compute effective user rating
    # R_u_eff = Σ(w_i × R_u,skill_i)
    R_u_eff = sum(qs.weight * user_ratings[qs.skill_id].rating for qs in q_skills)
    result['user_effective_rating'] = R_u_eff
    
    # 4. Get question difficulty
    D_q = get_question_effective_difficulty(question, question_rating)
    result['question_difficulty'] = D_q
    
    # 5. Expected score and delta
    P = expected_score(R_u_eff, D_q)
    result['expected_prob'] = P
    delta = score - P
    result['delta'] = delta
    
    # 6. Update each skill rating
    now = datetime.utcnow()
    for qs in q_skills:
        usr = user_ratings[qs.skill_id]
        old_rating = usr.rating
        
        # K_u = BASE_K_USER / sqrt(num_updates + 1)
        K = adaptive_k(BASE_K_USER, usr.num_updates)
        
        # R_u,skill' = R_u,skill + K_u × w_skill × (S - P)
        update_amount = K * qs.weight * delta
        usr.rating += update_amount
        usr.num_updates += 1
        usr.last_updated_at = now
        
        result['skill_updates'].append({
            'skill_id': qs.skill_id,
            'old': old_rating,
            'new': usr.rating,
            'weight': qs.weight,
            'k_factor': K,
            'update_amount': update_amount
        })
    
    # 7. Update question difficulty (optional)
    if update_question:
        if question_rating is None:
            # Create if not exists (simulated)
            question_rating = QuestionRating(question_id=question.id)
        
        K_q = adaptive_k(BASE_K_QUESTION, question_rating.num_updates)
        
        # D_q' = D_q - K_q × (S - P)
        # Note: We update the delta, not the base.
        # new_delta = old_delta - K_q * delta
        new_delta = question_rating.rating_delta - K_q * delta
        
        question_rating.rating_delta = clamp(new_delta, -DELTA_BOUND, DELTA_BOUND)
        question_rating.num_updates += 1
        question_rating.last_updated_at = now
        
        result['question_update'] = {
            'k_factor': K_q,
            'new_delta': question_rating.rating_delta
        }
        
    return result

# --- Worked Example ---

if __name__ == "__main__":
    print("--- Deductly Elo System: Worked Example ---\n")
    
    # Setup from context file:
    # - Student has ratings: Flaw = 1500, Assumption = 1450
    # - Question difficulty: D_q = 1520
    # - Question skill weights: Flaw = 0.6, Assumption = 0.4
    # - Student has 10 prior updates on Flaw, 5 on Assumption
    # - Student answers correctly (S = 1)
    
    # Define Skills
    skill_flaw = Skill(id=1, name="Flaw")
    skill_assumption = Skill(id=2, name="Assumption")
    
    # Define User Ratings
    user_id = 123
    user_ratings = {
        skill_flaw.id: UserSkillRating(
            user_id=user_id, 
            skill_id=skill_flaw.id, 
            rating=1500.0, 
            num_updates=10
        ),
        skill_assumption.id: UserSkillRating(
            user_id=user_id, 
            skill_id=skill_assumption.id, 
            rating=1450.0, 
            num_updates=5
        )
    }
    
    # Define Question
    question = Question(
        id=999,
        difficulty_elo_base=1520.0,
        skills=[
            QuestionSkill(skill_id=skill_flaw.id, weight=0.6),
            QuestionSkill(skill_id=skill_assumption.id, weight=0.4)
        ]
    )
    
    # Define Question Rating (starts at 0 delta)
    # Assuming num_q_updates is not specified in the example setup for the START, 
    # but the example calculation uses K_q = 20 / sqrt(num_q_updates + 1).
    # Let's assume 0 previous updates for the question to match a fresh state, 
    # or we can follow the logic if it implies something else.
    # The example says "K_q = 20 / sqrt(num_q_updates + 1)". 
    # Let's assume num_updates=0 for the question initially.
    question_rating = QuestionRating(question_id=question.id, num_updates=0)
    
    print(f"Initial State:")
    print(f"  User Flaw Rating: {user_ratings[skill_flaw.id].rating} (Updates: {user_ratings[skill_flaw.id].num_updates})")
    print(f"  User Assumption Rating: {user_ratings[skill_assumption.id].rating} (Updates: {user_ratings[skill_assumption.id].num_updates})")
    print(f"  Question Base Difficulty: {question.difficulty_elo_base}")
    print(f"  Question Delta: {question_rating.rating_delta}")
    print("-" * 30)
    
    # Perform Update
    print("\nProcessing Correct Answer...\n")
    result = update_elo(
        user_ratings=user_ratings,
        question=question,
        question_rating=question_rating,
        is_correct=True,
        update_question=True
    )
    
    # Output Results
    print("-" * 30)
    print("Results:")
    print(f"  Effective User Rating: {result['user_effective_rating']:.2f} (Expected: 1480)")
    print(f"  Question Difficulty:   {result['question_difficulty']:.2f} (Expected: 1520)")
    print(f"  Expected Probability:  {result['expected_prob']:.3f} (Expected: ~0.443)")
    print(f"  Surprise (Delta):      {result['delta']:.3f} (Expected: ~0.557)")
    print("\nSkill Updates:")
    for update in result['skill_updates']:
        skill_name = "Flaw" if update['skill_id'] == 1 else "Assumption"
        print(f"  {skill_name}:")
        print(f"    Old: {update['old']:.2f}")
        print(f"    New: {update['new']:.2f}")
        print(f"    Change: +{update['update_amount']:.2f}")
        print(f"    K-Factor: {update['k_factor']:.2f}")
        
    print("\nQuestion Update:")
    print(f"  New Delta: {result['question_update']['new_delta']:.3f}")
    print(f"  Effective Difficulty: {question.difficulty_elo_base + result['question_update']['new_delta']:.2f}")
