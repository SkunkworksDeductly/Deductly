#!/usr/bin/env python3
"""
Initialize item difficulty parameters (b-values and Elo) for all questions.

Mapping (Option A - expanded range to match theta bounds):
  easy       → b = -1.5, elo = 1200
  medium     → b =  0.0, elo = 1500
  hard       → b =  1.5, elo = 1800
  challenging → b =  3.0, elo = 2100

Elo is always derived from b: elo = 1500 + (b * 200)

Run from backend directory: python3 db/init_item_difficulties.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import get_db_cursor
from utils import generate_id


# Difficulty level to b-value mapping
DIFFICULTY_TO_B = {
    'easy': -1.5,
    'medium': 0.0,
    'hard': 1.5,
    'challenging': 3.0,
}

# Default for unknown categories
DEFAULT_B = 0.0


def b_to_elo(b_value: float) -> float:
    """Convert IRT b-parameter to Elo rating. b=0 -> 1500, 200 points per unit."""
    return 1500.0 + (b_value * 200.0)


def init_item_difficulties():
    """Initialize b-values and Elo for all questions."""

    print("=" * 60)
    print("Initializing Item Difficulties")
    print("=" * 60)

    # Fetch all questions with their difficulty levels
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT id, difficulty_level, b, difficulty_elo_base
            FROM questions
        """)
        questions = cursor.fetchall()

    print(f"\nFound {len(questions)} questions to process\n")

    # Track statistics
    stats = {level: 0 for level in DIFFICULTY_TO_B}
    stats['unknown'] = 0
    updated_count = 0

    for q in questions:
        q_id = q['id']
        difficulty_level = (q['difficulty_level'] or '').lower().strip()

        # Get b-value from mapping
        if difficulty_level in DIFFICULTY_TO_B:
            b_value = DIFFICULTY_TO_B[difficulty_level]
            stats[difficulty_level] += 1
        else:
            b_value = DEFAULT_B
            stats['unknown'] += 1
            print(f"  Warning: Unknown difficulty '{q['difficulty_level']}' for {q_id}, using b={DEFAULT_B}")

        # Calculate Elo from b
        elo_value = b_to_elo(b_value)

        # Update questions table
        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE questions
                SET b = %s, difficulty_elo_base = %s
                WHERE id = %s
            """, (b_value, elo_value, q_id))

        # Upsert into item_difficulties table
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id FROM item_difficulties WHERE question_id = %s
            """, (q_id,))
            existing = cursor.fetchone()

            if existing:
                cursor.execute("""
                    UPDATE item_difficulties
                    SET b = %s, last_updated = CURRENT_TIMESTAMP
                    WHERE question_id = %s
                """, (b_value, q_id))
            else:
                new_id = generate_id("ID")
                cursor.execute("""
                    INSERT INTO item_difficulties (id, question_id, b, last_updated)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                """, (new_id, q_id, b_value))

        updated_count += 1

    # Print summary
    print("\n" + "-" * 40)
    print("Summary:")
    print("-" * 40)
    print(f"  Total questions updated: {updated_count}")
    print()
    print("  By difficulty level:")
    for level, b_val in DIFFICULTY_TO_B.items():
        elo_val = b_to_elo(b_val)
        count = stats[level]
        print(f"    {level:12} (b={b_val:+.1f}, elo={elo_val:.0f}): {count}")
    if stats['unknown'] > 0:
        print(f"    {'unknown':12} (b={DEFAULT_B:+.1f}, elo={b_to_elo(DEFAULT_B):.0f}): {stats['unknown']}")

    # Verify
    print("\n" + "-" * 40)
    print("Verification:")
    print("-" * 40)

    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT difficulty_level, b, difficulty_elo_base, COUNT(*) as cnt
            FROM questions
            WHERE b IS NOT NULL
            GROUP BY difficulty_level, b, difficulty_elo_base
            ORDER BY b
        """)
        rows = cursor.fetchall()

        for row in rows:
            print(f"  {row['difficulty_level']:12} → b={row['b']:+.1f}, elo={row['difficulty_elo_base']:.0f} ({row['cnt']} questions)")

        cursor.execute("SELECT COUNT(*) as cnt FROM item_difficulties")
        id_count = cursor.fetchone()['cnt']
        print(f"\n  item_difficulties table: {id_count} entries")

    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    init_item_difficulties()
