"""
Experiment demonstrating micro_update_one for real-time mastery vector updates.

This script shows how to:
1. Initialize a simple GLMM model
2. Use micro_update_one to update a user's mastery vector based on 5 new responses
3. Track how the mastery estimates change after each response
"""

import torch
from glmm_implementation import RaschFrozenSkillGLMM, micro_update_one, predict_one


def main():
    print("=" * 70)
    print("GLMM Micro-Update Experiment: 5 New Responses")
    print("=" * 70)

    # ========================================================================
    # 1. Setup: Define model parameters
    # ========================================================================
    n_users = 10
    n_skills = 5  # e.g., 5 LSAT skills
    device = "cpu"

    print(f"\nModel Configuration:")
    print(f"  - Number of users: {n_users}")
    print(f"  - Number of skills: {n_skills}")
    print(f"  - Device: {device}")

    # ========================================================================
    # 2. Initialize the GLMM model
    # ========================================================================
    model = RaschFrozenSkillGLMM(
        n_users=n_users,
        n_skills=n_skills,
        prior_gamma_sd=0.8,
        mastery_activation="tanh"
    ).to(device)

    print(f"\nModel initialized with zero mastery vectors")

    # ========================================================================
    # 3. Define test user and their initial mastery
    # ========================================================================
    user_idx = 0  # We'll track user 0

    # Get initial mastery (should be ~0 since we initialized with zeros)
    initial_mastery = model.get_user_mastery(user_idx)
    print(f"\nUser {user_idx} - Initial Mastery Vector:")
    print(f"  {initial_mastery.numpy()}")

    # ========================================================================
    # 4. Define 5 new responses
    # ========================================================================
    # Each response consists of:
    # - theta_u: user's Rasch ability (fixed, e.g., from prior diagnostic)
    # - b_i: question difficulty (fixed, from Rasch calibration)
    # - s_vec: skill vector for the question (which skills it tests)
    # - y: response correctness (0 or 1)

    print("\n" + "=" * 70)
    print("Simulating 5 New Responses")
    print("=" * 70)

    # Assume this user has moderate ability
    theta_u = 0.5

    # Define 5 questions with varying properties
    responses = [
        {
            "question_id": 1,
            "b_i": 0.3,  # Easy question
            "s_vec": torch.tensor([1.0, 0.0, 0.0, 0.0, 0.0]),  # Tests skill 0 only
            "y": 1,  # Correct
            "description": "Easy question on Skill 0 - Correct"
        },
        {
            "question_id": 2,
            "b_i": 0.8,  # Hard question
            "s_vec": torch.tensor([0.0, 1.0, 0.0, 0.0, 0.0]),  # Tests skill 1 only
            "y": 0,  # Incorrect
            "description": "Hard question on Skill 1 - Incorrect"
        },
        {
            "question_id": 3,
            "b_i": 0.5,  # Medium question
            "s_vec": torch.tensor([0.5, 0.5, 0.0, 0.0, 0.0]),  # Tests skills 0 and 1
            "y": 1,  # Correct
            "description": "Medium question on Skills 0,1 - Correct"
        },
        {
            "question_id": 4,
            "b_i": 0.4,  # Medium-easy question
            "s_vec": torch.tensor([0.0, 0.0, 1.0, 0.0, 0.0]),  # Tests skill 2 only
            "y": 1,  # Correct
            "description": "Medium question on Skill 2 - Correct"
        },
        {
            "question_id": 5,
            "b_i": 0.6,  # Medium-hard question
            "s_vec": torch.tensor([0.0, 0.0, 0.0, 1.0, 0.0]),  # Tests skill 3 only
            "y": 0,  # Incorrect
            "description": "Medium-hard question on Skill 3 - Incorrect"
        }
    ]

    # ========================================================================
    # 5. Process each response and track mastery changes
    # ========================================================================
    print(f"\nUser ability (theta_u): {theta_u}")
    print("\nProcessing responses...\n")

    for i, resp in enumerate(responses, 1):
        print(f"Response {i}: {resp['description']}")
        print(f"  Question difficulty (b_i): {resp['b_i']}")
        print(f"  Skill vector: {resp['s_vec'].numpy()}")

        # Get prediction before update
        prob_before = predict_one(
            model=model,
            user_idx=user_idx,
            theta_u=theta_u,
            b_i=resp['b_i'],
            s_vec=resp['s_vec'],
            device=device
        )
        print(f"  Predicted probability (before update): {prob_before:.4f}")
        print(f"  Actual response: {'Correct' if resp['y'] == 1 else 'Incorrect'}")

        # Get mastery before update
        mastery_before = model.get_user_mastery(user_idx).clone()

        # Perform micro-update
        micro_update_one(
            model=model,
            user_idx=user_idx,
            theta_u=theta_u,
            b_i=resp['b_i'],
            y=resp['y'],
            s_vec=resp['s_vec'],
            lr=0.1,          # Learning rate
            lam_row=1.0,     # Regularization strength
            steps=2,         # Number of gradient steps
            device=device
        )

        # Get mastery after update
        mastery_after = model.get_user_mastery(user_idx)

        # Show the change
        mastery_change = mastery_after - mastery_before
        print(f"  Mastery change: {mastery_change.numpy()}")
        print(f"  Updated mastery: {mastery_after.numpy()}\n")

    # ========================================================================
    # 6. Summary
    # ========================================================================
    print("=" * 70)
    print("Summary")
    print("=" * 70)

    final_mastery = model.get_user_mastery(user_idx)

    print(f"\nInitial Mastery: {initial_mastery.numpy()}")
    print(f"Final Mastery:   {final_mastery.numpy()}")
    print(f"Total Change:    {(final_mastery - initial_mastery).numpy()}")

    print("\nInterpretation:")
    print("  - Skill 0: Got 1 easy question correct + partial credit in Q3")
    print("    → Positive mastery increase")
    print("  - Skill 1: Got 1 hard question wrong + partial credit in Q3")
    print("    → Likely negative or small mastery change")
    print("  - Skill 2: Got 1 medium question correct")
    print("    → Positive mastery increase")
    print("  - Skill 3: Got 1 medium-hard question wrong")
    print("    → Negative mastery change")
    print("  - Skill 4: No questions attempted")
    print("    → Slight drift toward prior (zero) due to regularization")

    print("\n" + "=" * 70)
    print("Experiment Complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
