"""
Initialize v1.db database with schema
"""
import sqlite3
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.schema import create_all_tables

def main():
    # Path to the new database
    db_path = os.path.join(os.path.dirname(__file__), 'data', 'v1.db')

    # Ensure data directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    # Connect to database (creates file if it doesn't exist)
    print(f"Creating database at: {db_path}")
    conn = sqlite3.connect(db_path)

    try:
        # Create all tables
        print("Creating tables...")
        create_all_tables(conn)
        print(f"\nDatabase v1.db initialized successfully at {db_path}")

    except Exception as e:
        print(f"Error initializing database: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
