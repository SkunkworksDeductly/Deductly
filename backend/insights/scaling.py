"""
Display scaling functions for converting between internal Elo ratings
and user-facing LSAT-style scores.

Internal Elo ratings are centered around 1500 with a typical range of ~900-2100.
Display scores are scaled to LSAT-style 120-180 range.
"""


def elo_to_display(
    rating: float,
    mean: float = 1500.0,
    std: float = 300.0,
    center: int = 150,
    scale_per_std: float = 10.0,
    min_score: int = 120,
    max_score: int = 180,
) -> int:
    """
    Convert internal Elo rating to LSAT-style display score.

    Args:
        rating: Internal Elo rating (typically 900-2100)
        mean: Population mean for z-score calculation (default 1500)
        std: Population standard deviation (default 300)
        center: Display score center point (default 150)
        scale_per_std: Display points per standard deviation (default 10)
        min_score: Minimum display score (default 120)
        max_score: Maximum display score (default 180)

    Returns:
        Integer display score clamped to [min_score, max_score]

    Examples:
        >>> elo_to_display(1500)  # Average
        150
        >>> elo_to_display(1800)  # +1 std
        160
        >>> elo_to_display(1200)  # -1 std
        140
    """
    if std <= 0:
        return center

    z = (rating - mean) / std
    display = center + scale_per_std * z
    return int(max(min_score, min(max_score, round(display))))


def display_to_elo(
    display_score: int,
    mean: float = 1500.0,
    std: float = 300.0,
    center: int = 150,
    scale_per_std: float = 10.0,
) -> float:
    """
    Convert display score back to internal Elo rating.

    Useful for setting target scores or interpreting user goals.

    Args:
        display_score: LSAT-style score (120-180)
        mean: Population mean for conversion (default 1500)
        std: Population standard deviation (default 300)
        center: Display score center point (default 150)
        scale_per_std: Display points per standard deviation (default 10)

    Returns:
        Float Elo rating

    Examples:
        >>> display_to_elo(150)  # Average
        1500.0
        >>> display_to_elo(160)  # +1 std
        1800.0
        >>> display_to_elo(140)  # -1 std
        1200.0
    """
    z = (display_score - center) / scale_per_std
    return mean + z * std


# 4-tier rating system with colors
# Designed for achievability within a 30-question diagnostic
# Colors aligned with app design system (sage/terracotta palette)
RATING_TIERS = {
    'strong': {
        'threshold': 1750,
        'label': 'Strong',
        'color': '#3D7A68',      # Deep sage - mastery
        'bg_color': '#E8F0ED',   # Deep sage background
    },
    'proficient': {
        'threshold': 1600,
        'label': 'Proficient',
        'color': '#81B29A',      # Sage - competent
        'bg_color': '#EBF5F1',   # Sage-soft background
    },
    'developing': {
        'threshold': 1400,
        'label': 'Developing',
        'color': '#C9A962',      # Warm gold - progressing
        'bg_color': '#F7F3E8',   # Warm gold background
    },
    'emerging': {
        'threshold': 0,
        'label': 'Emerging',
        'color': '#E07A5F',      # Terracotta - needs work
        'bg_color': '#F8EBE8',   # Terracotta-soft background
    },
}


def get_rating_tier(rating: float) -> str:
    """
    Get a human-readable tier label for an Elo rating.

    Args:
        rating: Internal Elo rating

    Returns:
        String tier label
    """
    if rating >= 1750:
        return "Strong"
    elif rating >= 1600:
        return "Proficient"
    elif rating >= 1400:
        return "Developing"
    else:
        return "Emerging"


def get_rating_tier_info(rating: float) -> dict:
    """
    Get full tier information including colors for an Elo rating.

    Args:
        rating: Internal Elo rating

    Returns:
        Dict with label, color, and bg_color
    """
    if rating >= 1750:
        tier = RATING_TIERS['strong']
    elif rating >= 1600:
        tier = RATING_TIERS['proficient']
    elif rating >= 1400:
        tier = RATING_TIERS['developing']
    else:
        tier = RATING_TIERS['emerging']

    return {
        'label': tier['label'],
        'color': tier['color'],
        'bg_color': tier['bg_color'],
    }


def format_rating_for_display(
    rating: float,
    include_raw: bool = False,
    include_colors: bool = True
) -> dict:
    """
    Format a rating for user display with all relevant info.

    Args:
        rating: Internal Elo rating
        include_raw: Whether to include raw Elo in output
        include_colors: Whether to include tier colors in output

    Returns:
        Dict with display_score, tier, colors, and optionally raw_rating
    """
    tier_info = get_rating_tier_info(rating)

    result = {
        "display_score": elo_to_display(rating),
        "tier": tier_info['label'],
    }

    if include_colors:
        result["tier_color"] = tier_info['color']
        result["tier_bg_color"] = tier_info['bg_color']

    if include_raw:
        result["raw_rating"] = round(rating, 1)

    return result
