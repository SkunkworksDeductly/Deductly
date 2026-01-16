"""
Unit tests for the Elo rating system.
Tests core algorithm functions, worked example validation, and edge cases.
"""
import pytest
import math
from .elo_system import (
    expected_score,
    adaptive_k,
    clamp,
    update_elo,
    get_question_effective_difficulty,
    UserSkillRating,
    Question,
    QuestionSkill,
    QuestionRating,
    DEFAULT_RATING,
    BASE_K_USER,
    BASE_K_QUESTION,
    ELO_SCALE,
    DELTA_BOUND,
)
from .scaling import (
    elo_to_display,
    display_to_elo,
    get_rating_tier,
    format_rating_for_display,
)


class TestExpectedScore:
    """Tests for the expected_score function."""

    def test_equal_ratings_gives_50_percent(self):
        """When user and question have equal ratings, expected score is 0.5."""
        assert expected_score(1500.0, 1500.0) == pytest.approx(0.5)

    def test_higher_user_rating_increases_probability(self):
        """Higher user rating increases probability of correct answer."""
        p = expected_score(1600.0, 1500.0)
        assert p > 0.5
        assert p < 1.0

    def test_lower_user_rating_decreases_probability(self):
        """Lower user rating decreases probability of correct answer."""
        p = expected_score(1400.0, 1500.0)
        assert p < 0.5
        assert p > 0.0

    def test_400_point_difference_gives_10_to_1_odds(self):
        """400 point difference gives approximately 10:1 odds."""
        # User 400 points higher: ~91% chance
        p_high = expected_score(1900.0, 1500.0)
        assert p_high == pytest.approx(1.0 / (1.0 + 0.1), rel=0.01)  # ~0.909

        # User 400 points lower: ~9% chance
        p_low = expected_score(1100.0, 1500.0)
        assert p_low == pytest.approx(1.0 / (1.0 + 10.0), rel=0.01)  # ~0.091

    def test_symmetry(self):
        """Probability from opposite perspectives sums to 1."""
        p_user = expected_score(1600.0, 1400.0)
        p_question = expected_score(1400.0, 1600.0)
        assert p_user + p_question == pytest.approx(1.0)


class TestAdaptiveK:
    """Tests for the adaptive_k function."""

    def test_first_update_uses_base_k(self):
        """First update (num_updates=0) uses BASE_K."""
        k = adaptive_k(BASE_K_USER, 0)
        assert k == pytest.approx(BASE_K_USER)

    def test_k_decays_with_updates(self):
        """K-factor decays as num_updates increases."""
        k0 = adaptive_k(BASE_K_USER, 0)
        k10 = adaptive_k(BASE_K_USER, 10)
        k100 = adaptive_k(BASE_K_USER, 100)
        assert k0 > k10 > k100

    def test_k_decay_formula(self):
        """K-factor follows sqrt decay formula."""
        k = adaptive_k(40.0, 15)
        expected = 40.0 / math.sqrt(16)  # 40 / 4 = 10
        assert k == pytest.approx(expected)


class TestClamp:
    """Tests for the clamp function."""

    def test_within_bounds_unchanged(self):
        """Values within bounds are unchanged."""
        assert clamp(50.0, 0.0, 100.0) == 50.0

    def test_below_lower_bound(self):
        """Values below lower bound are clamped up."""
        assert clamp(-10.0, 0.0, 100.0) == 0.0

    def test_above_upper_bound(self):
        """Values above upper bound are clamped down."""
        assert clamp(150.0, 0.0, 100.0) == 100.0


class TestUpdateElo:
    """Tests for the update_elo function."""

    def test_single_skill_correct_answer_increases_rating(self):
        """Correct answer increases user rating."""
        user_ratings = {
            "LR-01": UserSkillRating(
                user_id="user-1",
                skill_id="LR-01",
                rating=1500.0,
                num_updates=0
            )
        }
        question = Question(
            id="q-1",
            difficulty_elo_base=1500.0,
            skills=[QuestionSkill(skill_id="LR-01", weight=1.0)]
        )

        result = update_elo(user_ratings, question, None, is_correct=True)

        assert user_ratings["LR-01"].rating > 1500.0
        assert result["delta"] > 0

    def test_single_skill_incorrect_answer_decreases_rating(self):
        """Incorrect answer decreases user rating."""
        user_ratings = {
            "LR-01": UserSkillRating(
                user_id="user-1",
                skill_id="LR-01",
                rating=1500.0,
                num_updates=0
            )
        }
        question = Question(
            id="q-1",
            difficulty_elo_base=1500.0,
            skills=[QuestionSkill(skill_id="LR-01", weight=1.0)]
        )

        result = update_elo(user_ratings, question, None, is_correct=False)

        assert user_ratings["LR-01"].rating < 1500.0
        assert result["delta"] < 0

    def test_multi_skill_weighted_update(self):
        """Multi-skill questions distribute updates by weight."""
        user_ratings = {
            "LR-06": UserSkillRating(
                user_id="user-1",
                skill_id="LR-06",
                rating=1500.0,
                num_updates=0
            ),
            "LR-03": UserSkillRating(
                user_id="user-1",
                skill_id="LR-03",
                rating=1500.0,
                num_updates=0
            )
        }
        question = Question(
            id="q-1",
            difficulty_elo_base=1500.0,
            skills=[
                QuestionSkill(skill_id="LR-06", weight=0.7),
                QuestionSkill(skill_id="LR-03", weight=0.3)
            ]
        )

        result = update_elo(user_ratings, question, None, is_correct=True)

        # Both should increase, but LR-06 should increase more
        assert user_ratings["LR-06"].rating > 1500.0
        assert user_ratings["LR-03"].rating > 1500.0
        change_06 = user_ratings["LR-06"].rating - 1500.0
        change_03 = user_ratings["LR-03"].rating - 1500.0
        assert change_06 > change_03

    def test_num_updates_incremented(self):
        """Each update increments num_updates."""
        user_ratings = {
            "LR-01": UserSkillRating(
                user_id="user-1",
                skill_id="LR-01",
                rating=1500.0,
                num_updates=5
            )
        }
        question = Question(
            id="q-1",
            difficulty_elo_base=1500.0,
            skills=[QuestionSkill(skill_id="LR-01", weight=1.0)]
        )

        update_elo(user_ratings, question, None, is_correct=True)

        assert user_ratings["LR-01"].num_updates == 6

    def test_empty_skills_returns_early(self):
        """Questions with no skills don't update anything."""
        user_ratings = {}
        question = Question(id="q-1", difficulty_elo_base=1500.0, skills=[])

        result = update_elo(user_ratings, question, None, is_correct=True)

        assert result["skill_updates"] == []


class TestWorkedExample:
    """
    Validates against the worked example from elo_context_revised.md.

    Setup:
    - Student ratings: Flaw = 1500, Assumption = 1450
    - Question difficulty: D_q = 1520
    - Question skill weights: Flaw = 0.6, Assumption = 0.4
    - Prior updates: Flaw = 10, Assumption = 5
    - Student answers correctly (S = 1)

    Expected:
    - R_u_eff = 1480
    - P ≈ 0.443
    - Flaw' ≈ 1504
    - Assumption' ≈ 1454
    """

    def test_worked_example(self):
        """Full validation of worked example calculations."""
        user_ratings = {
            "LR-06": UserSkillRating(
                user_id="user-123",
                skill_id="LR-06",
                rating=1500.0,
                num_updates=10
            ),
            "LR-03": UserSkillRating(
                user_id="user-123",
                skill_id="LR-03",
                rating=1450.0,
                num_updates=5
            )
        }
        question = Question(
            id="q-999",
            difficulty_elo_base=1520.0,
            skills=[
                QuestionSkill(skill_id="LR-06", weight=0.6),
                QuestionSkill(skill_id="LR-03", weight=0.4)
            ]
        )

        result = update_elo(
            user_ratings, question, None,
            is_correct=True, update_question=False
        )

        # Check effective user rating
        assert result["user_effective_rating"] == pytest.approx(1480.0)

        # Check expected probability (~0.443)
        assert result["expected_prob"] == pytest.approx(0.443, rel=0.01)

        # Check delta (surprise factor ~0.557)
        assert result["delta"] == pytest.approx(0.557, rel=0.01)

        # Check final ratings
        assert user_ratings["LR-06"].rating == pytest.approx(1504.0, rel=0.01)
        assert user_ratings["LR-03"].rating == pytest.approx(1454.0, rel=0.01)


class TestQuestionRatingUpdate:
    """Tests for question difficulty updates (when enabled)."""

    def test_question_delta_update_on_unexpected_success(self):
        """Question difficulty decreases when user succeeds unexpectedly."""
        user_ratings = {
            "LR-01": UserSkillRating(
                user_id="user-1",
                skill_id="LR-01",
                rating=1400.0,  # Lower than question
                num_updates=0
            )
        }
        question = Question(
            id="q-1",
            difficulty_elo_base=1600.0,  # Hard question
            skills=[QuestionSkill(skill_id="LR-01", weight=1.0)]
        )
        question_rating = QuestionRating(question_id="q-1", rating_delta=0.0)

        result = update_elo(
            user_ratings, question, question_rating,
            is_correct=True, update_question=True
        )

        # Question should become easier (negative delta)
        assert question_rating.rating_delta < 0
        assert "question_update" in result

    def test_question_delta_bounded(self):
        """Question delta is clamped to ±DELTA_BOUND."""
        user_ratings = {
            "LR-01": UserSkillRating(
                user_id="user-1",
                skill_id="LR-01",
                rating=1500.0,
                num_updates=0
            )
        }
        question = Question(
            id="q-1",
            difficulty_elo_base=1500.0,
            skills=[QuestionSkill(skill_id="LR-01", weight=1.0)]
        )
        # Start at the bound
        question_rating = QuestionRating(
            question_id="q-1",
            rating_delta=-DELTA_BOUND,
            num_updates=0
        )

        # Should not go below -DELTA_BOUND even with more failures
        update_elo(
            user_ratings, question, question_rating,
            is_correct=True, update_question=True
        )

        assert question_rating.rating_delta >= -DELTA_BOUND


class TestDisplayScaling:
    """Tests for display score conversion functions."""

    def test_elo_to_display_average(self):
        """Average Elo (1500) maps to center display (150)."""
        assert elo_to_display(1500.0) == 150

    def test_elo_to_display_one_std_above(self):
        """One std above (1800) maps to 160."""
        assert elo_to_display(1800.0) == 160

    def test_elo_to_display_one_std_below(self):
        """One std below (1200) maps to 140."""
        assert elo_to_display(1200.0) == 140

    def test_elo_to_display_clamped_high(self):
        """Extreme high values are clamped to 180."""
        assert elo_to_display(3000.0) == 180

    def test_elo_to_display_clamped_low(self):
        """Extreme low values are clamped to 120."""
        assert elo_to_display(0.0) == 120

    def test_display_to_elo_inverse(self):
        """display_to_elo is the inverse of elo_to_display (within rounding)."""
        for elo in [1200, 1350, 1500, 1650, 1800]:
            display = elo_to_display(float(elo))
            recovered = display_to_elo(display)
            # Allow for rounding error
            assert abs(recovered - elo) < 15

    def test_get_rating_tier(self):
        """Rating tiers are assigned correctly (4-tier system)."""
        assert get_rating_tier(1900) == "Strong"
        assert get_rating_tier(1750) == "Strong"
        assert get_rating_tier(1700) == "Proficient"
        assert get_rating_tier(1600) == "Proficient"
        assert get_rating_tier(1500) == "Developing"
        assert get_rating_tier(1400) == "Developing"
        assert get_rating_tier(1300) == "Emerging"
        assert get_rating_tier(1100) == "Emerging"

    def test_format_rating_for_display(self):
        """Format function returns expected structure with colors."""
        result = format_rating_for_display(1500.0)
        assert "display_score" in result
        assert "tier" in result
        assert "tier_color" in result
        assert "tier_bg_color" in result
        assert result["display_score"] == 150
        assert result["tier"] == "Developing"
        assert result["tier_color"] == "#F59E0B"  # Amber

    def test_format_rating_with_raw(self):
        """Format function includes raw rating when requested."""
        result = format_rating_for_display(1523.4, include_raw=True)
        assert "raw_rating" in result
        assert result["raw_rating"] == 1523.4


class TestEffectiveDifficulty:
    """Tests for question effective difficulty calculation."""

    def test_base_only(self):
        """Without rating delta, effective = base."""
        question = Question(
            id="q-1",
            difficulty_elo_base=1500.0,
            skills=[]
        )
        effective = get_question_effective_difficulty(question, None)
        assert effective == 1500.0

    def test_with_positive_delta(self):
        """Positive delta increases effective difficulty."""
        question = Question(
            id="q-1",
            difficulty_elo_base=1500.0,
            skills=[]
        )
        rating = QuestionRating(question_id="q-1", rating_delta=50.0)
        effective = get_question_effective_difficulty(question, rating)
        assert effective == 1550.0

    def test_with_negative_delta(self):
        """Negative delta decreases effective difficulty."""
        question = Question(
            id="q-1",
            difficulty_elo_base=1500.0,
            skills=[]
        )
        rating = QuestionRating(question_id="q-1", rating_delta=-30.0)
        effective = get_question_effective_difficulty(question, rating)
        assert effective == 1470.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
