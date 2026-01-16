"""
Clear user data from database.
Run this script to reset a user's question history, abilities (theta), and Elo ratings.

Usage:
    python -m db.clear_user_data [user_id]

If no user_id provided, clears all users' data.

my user id = 4W8fcp0e1CX4K4MZAk8dzEQaYSI2
"""
import sys
from db.connection import get_db_cursor


def clear_user_data(user_id: str = None):
    """Clear user data from all tracking tables."""
    with get_db_cursor() as cursor:
        if user_id:
            # Clear specific user
            cursor.execute('DELETE FROM user_question_history WHERE user_id = %s', (user_id,))
            print(f'Deleted {cursor.rowcount} rows from user_question_history')

            cursor.execute('DELETE FROM user_abilities WHERE user_id = %s', (user_id,))
            print(f'Deleted {cursor.rowcount} rows from user_abilities')

            cursor.execute('DELETE FROM user_elo_ratings WHERE user_id = %s', (user_id,))
            print(f'Deleted {cursor.rowcount} rows from user_elo_ratings')

            cursor.execute('DELETE FROM adaptive_diagnostic_sessions WHERE user_id = %s', (user_id,))
            print(f'Deleted {cursor.rowcount} rows from adaptive_diagnostic_sessions')
        else:
            # Clear all users
            cursor.execute('DELETE FROM user_question_history')
            print(f'Deleted {cursor.rowcount} rows from user_question_history')

            cursor.execute('DELETE FROM user_abilities')
            print(f'Deleted {cursor.rowcount} rows from user_abilities')

            cursor.execute('DELETE FROM user_elo_ratings')
            print(f'Deleted {cursor.rowcount} rows from user_elo_ratings')

            cursor.execute('DELETE FROM adaptive_diagnostic_sessions')
            print(f'Deleted {cursor.rowcount} rows from adaptive_diagnostic_sessions')

    print('Done! User data cleared.')


if __name__ == '__main__':
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    if user_id:
        print(f'Clearing data for user: {user_id}')
    else:
        print('Clearing data for ALL users')
    clear_user_data(user_id)
