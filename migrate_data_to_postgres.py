"""
Data Migration Script: SQLite to PostgreSQL
Exports data from SQLite and imports into PostgreSQL
"""
import sqlite3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# SQLite database path
SQLITE_DB = os.path.join(os.path.dirname(__file__), 'backend', 'data', 'deductly.db')

# PostgreSQL connection parameters
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'deductly')
DB_USER = os.getenv('DB_USER', 'deductly_admin')
DB_PASSWORD = os.getenv('DB_PASSWORD')

def migrate_data():
    """Migrate data from SQLite to PostgreSQL"""

    print("="*60)
    print("Data Migration: SQLite → PostgreSQL")
    print("="*60)

    # Connect to SQLite
    print(f"\n📂 Reading from SQLite: {SQLITE_DB}")
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    # Connect to PostgreSQL
    print(f"🐘 Connecting to PostgreSQL: {DB_HOST}/{DB_NAME}")
    pg_conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    pg_cursor = pg_conn.cursor()

    # Migrate skills table
    print("\n1. Migrating skills...")
    sqlite_cursor.execute("SELECT * FROM skills")
    skills = sqlite_cursor.fetchall()

    for skill in skills:
        pg_cursor.execute("""
            INSERT INTO skills (id, skill_id, skill_name, domain, sub_domain, category, description, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            skill['id'], skill['skill_id'], skill['skill_name'],
            skill['domain'], skill['sub_domain'], skill['category'],
            skill['description'], skill['created_at']
        ))

    pg_conn.commit()
    print(f"   ✓ Migrated {len(skills)} skills")

    # Migrate questions table
    print("2. Migrating questions...")
    sqlite_cursor.execute("SELECT * FROM questions")
    questions = sqlite_cursor.fetchall()

    for question in questions:
        pg_cursor.execute("""
            INSERT INTO questions (id, question_text, answer_choices, correct_answer,
                                 difficulty_level, question_type, domain, sub_domain,
                                 source_url, passage_text, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            question['id'], question['question_text'], question['answer_choices'],
            question['correct_answer'], question['difficulty_level'], question['question_type'],
            question['domain'], question['sub_domain'], question['source_url'],
            question['passage_text'], question['created_at']
        ))

    pg_conn.commit()
    print(f"   ✓ Migrated {len(questions)} questions")

    # Migrate question_skills junction table
    print("3. Migrating question_skills...")
    sqlite_cursor.execute("SELECT * FROM question_skills")
    question_skills = sqlite_cursor.fetchall()

    for qs in question_skills:
        pg_cursor.execute("""
            INSERT INTO question_skills (id, question_id, skill_id)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (qs['id'], qs['question_id'], qs['skill_id']))

    pg_conn.commit()
    print(f"   ✓ Migrated {len(question_skills)} question-skill mappings")

    # Verify migration
    print("\n" + "="*60)
    print("Verification")
    print("="*60)

    pg_cursor.execute("SELECT COUNT(*) FROM skills")
    skills_count = pg_cursor.fetchone()[0]
    print(f"Skills in PostgreSQL: {skills_count}")

    pg_cursor.execute("SELECT COUNT(*) FROM questions")
    questions_count = pg_cursor.fetchone()[0]
    print(f"Questions in PostgreSQL: {questions_count}")

    pg_cursor.execute("SELECT COUNT(*) FROM question_skills")
    qs_count = pg_cursor.fetchone()[0]
    print(f"Question-Skills in PostgreSQL: {qs_count}")

    # Close connections
    sqlite_cursor.close()
    sqlite_conn.close()
    pg_cursor.close()
    pg_conn.close()

    print("\n✅ Data migration completed successfully!")

if __name__ == '__main__':
    try:
        migrate_data()
    except FileNotFoundError:
        print(f"❌ Error: SQLite database not found at {SQLITE_DB}")
        print("Make sure you have the deductly.db file in backend/data/")
    except psycopg2.Error as e:
        print(f"❌ PostgreSQL Error: {e}")
        print("\nMake sure:")
        print("1. Schema migration was run first (migrate_schema_to_postgres.py)")
        print("2. PostgreSQL connection details are correct in .env")
        print("3. Security group allows connections from your IP")
    except Exception as e:
        print(f"❌ Error: {e}")
