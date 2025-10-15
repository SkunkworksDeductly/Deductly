"""
Database Migration Script: Integer IDs → Prefixed String IDs

This script migrates all database tables from auto-incrementing integer IDs
to prefixed string IDs (e.g., sk-1, q-2, dr-3).

IMPORTANT: This script creates a backup before making changes.
"""
import sqlite3
import shutil
import os
from datetime import datetime

# Paths
DB_PATH = 'backend/data/deductly.db'
BACKUP_DIR = 'backend/data/backups'

# ID prefix mapping
ID_PREFIXES = {
    'skills': 'sk',
    'questions': 'q',
    'question_skills': 'qs',
    'drills': 'dr',
    'drill_results': 'dres'
}


def backup_database():
    """Create a backup of the database."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(BACKUP_DIR, f'deductly_backup_{timestamp}.db')
    shutil.copy2(DB_PATH, backup_path)
    print(f"✓ Database backed up to: {backup_path}")
    return backup_path


def create_new_tables(conn):
    """Create new tables with VARCHAR IDs."""
    cursor = conn.cursor()

    print("\nCreating new tables with VARCHAR IDs...")

    # Skills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS skills_new (
            id VARCHAR(50) PRIMARY KEY,
            skill_id VARCHAR(20) UNIQUE NOT NULL,
            skill_name VARCHAR(255) NOT NULL,
            domain VARCHAR(50) NOT NULL,
            sub_domain VARCHAR(50) NOT NULL,
            category VARCHAR(100),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Questions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions_new (
            id VARCHAR(50) PRIMARY KEY,
            question_text TEXT NOT NULL,
            answer_choices TEXT,
            correct_answer VARCHAR(10),
            difficulty_level VARCHAR(20),
            question_type VARCHAR(100),
            domain VARCHAR(50) NOT NULL,
            sub_domain VARCHAR(50) NOT NULL,
            source_url TEXT,
            passage_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Question_skills junction table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS question_skills_new (
            id VARCHAR(50) PRIMARY KEY,
            question_id VARCHAR(50) NOT NULL,
            skill_id VARCHAR(50) NOT NULL,
            FOREIGN KEY (question_id) REFERENCES questions_new(id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skills_new(id) ON DELETE CASCADE,
            UNIQUE(question_id, skill_id)
        )
    ''')

    # Drills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drills_new (
            id VARCHAR(50) PRIMARY KEY,
            drill_id VARCHAR(50) UNIQUE NOT NULL,
            user_id VARCHAR(100) NOT NULL,
            question_count INTEGER NOT NULL,
            timing INTEGER,
            difficulty VARCHAR(20),
            skills TEXT,
            drill_type VARCHAR(50),
            question_ids TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'generated',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            current_question_index INTEGER DEFAULT 0,
            user_answers TEXT
        )
    ''')

    # Drill_results table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drill_results_new (
            id VARCHAR(50) PRIMARY KEY,
            drill_id VARCHAR(50) NOT NULL,
            user_id VARCHAR(100) NOT NULL,
            total_questions INTEGER NOT NULL,
            correct_answers INTEGER NOT NULL DEFAULT 0,
            incorrect_answers INTEGER NOT NULL DEFAULT 0,
            skipped_questions INTEGER NOT NULL DEFAULT 0,
            score_percentage DECIMAL(5,2),
            time_taken INTEGER,
            question_results TEXT,
            skill_performance TEXT,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (drill_id) REFERENCES drills_new(drill_id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    print("✓ New tables created")


def migrate_data(conn):
    """Migrate data from old tables to new tables with transformed IDs."""
    cursor = conn.cursor()

    print("\nMigrating data...")

    # Migrate skills
    print("  Migrating skills...")
    cursor.execute("SELECT * FROM skills")
    skills = cursor.fetchall()
    skill_id_map = {}  # old_id -> new_id

    for skill in skills:
        old_id = skill[0]
        new_id = f"{ID_PREFIXES['skills']}-{old_id}"
        skill_id_map[old_id] = new_id

        cursor.execute('''
            INSERT INTO skills_new (id, skill_id, skill_name, domain, sub_domain, category, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (new_id, skill[1], skill[2], skill[3], skill[4], skill[5], skill[6], skill[7]))

    print(f"    ✓ Migrated {len(skills)} skills")

    # Migrate questions
    print("  Migrating questions...")
    cursor.execute("SELECT * FROM questions")
    questions = cursor.fetchall()
    question_id_map = {}  # old_id -> new_id

    for question in questions:
        old_id = question[0]
        new_id = f"{ID_PREFIXES['questions']}-{old_id}"
        question_id_map[old_id] = new_id

        cursor.execute('''
            INSERT INTO questions_new (id, question_text, answer_choices, correct_answer, difficulty_level,
                                       question_type, domain, sub_domain, source_url, passage_text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (new_id, question[1], question[2], question[3], question[4], question[5], question[6],
              question[7], question[8], question[9], question[10]))

    print(f"    ✓ Migrated {len(questions)} questions")

    # Migrate question_skills
    print("  Migrating question_skills...")
    cursor.execute("SELECT * FROM question_skills")
    question_skills = cursor.fetchall()
    qs_id_map = {}  # old_id -> new_id

    for qs in question_skills:
        old_id = qs[0]
        new_id = f"{ID_PREFIXES['question_skills']}-{old_id}"
        qs_id_map[old_id] = new_id

        old_question_id = qs[1]
        old_skill_id = qs[2]
        new_question_id = question_id_map.get(old_question_id)
        new_skill_id = skill_id_map.get(old_skill_id)

        if new_question_id and new_skill_id:
            cursor.execute('''
                INSERT INTO question_skills_new (id, question_id, skill_id)
                VALUES (?, ?, ?)
            ''', (new_id, new_question_id, new_skill_id))

    print(f"    ✓ Migrated {len(question_skills)} question_skills")

    # Migrate drills (update question_ids JSON)
    print("  Migrating drills...")
    cursor.execute("SELECT * FROM drills")
    drills = cursor.fetchall()
    drill_id_map = {}  # old drill_id -> new drill_id

    import json

    for drill in drills:
        old_id = drill[0]
        new_id = f"{ID_PREFIXES['drills']}-{old_id}"
        drill_id_map[drill[1]] = drill[1]  # Keep drill_id (UUID) as is

        # Transform question_ids in JSON
        question_ids_json = drill[8]
        if question_ids_json:
            old_question_ids = json.loads(question_ids_json)
            new_question_ids = [question_id_map.get(qid, qid) for qid in old_question_ids]
            question_ids_json = json.dumps(new_question_ids)

        # Transform user_answers JSON if present (column 14)
        user_answers_json = drill[13] if len(drill) > 13 else None
        if user_answers_json:
            user_answers = json.loads(user_answers_json)
            # Transform question IDs in user_answers keys
            new_user_answers = {}
            for key, value in user_answers.items():
                # Keys might be question IDs, transform them
                try:
                    old_q_id = int(key)
                    new_key = question_id_map.get(old_q_id, key)
                    new_user_answers[new_key] = value
                except ValueError:
                    # Not an integer, keep as is
                    new_user_answers[key] = value
            user_answers_json = json.dumps(new_user_answers)

        cursor.execute('''
            INSERT INTO drills_new (id, drill_id, user_id, question_count, timing, difficulty, skills,
                                    drill_type, question_ids, status, created_at, started_at, completed_at,
                                    current_question_index, user_answers)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (new_id, drill[1], drill[2], drill[3], drill[4], drill[5], drill[6], drill[7], question_ids_json,
              drill[9], drill[10], drill[11], drill[12], drill[13] if len(drill) > 13 else 0,
              user_answers_json if len(drill) > 14 else None))

    print(f"    ✓ Migrated {len(drills)} drills")

    # Migrate drill_results
    print("  Migrating drill_results...")
    cursor.execute("SELECT * FROM drill_results")
    drill_results = cursor.fetchall()

    for dr in drill_results:
        old_id = dr[0]
        new_id = f"{ID_PREFIXES['drill_results']}-{old_id}"

        # Transform question_results JSON if present
        question_results_json = dr[9] if len(dr) > 9 else None
        if question_results_json:
            question_results = json.loads(question_results_json)
            # Transform question IDs in results
            for result in question_results:
                if 'question_id' in result:
                    old_q_id = result['question_id']
                    if isinstance(old_q_id, int):
                        result['question_id'] = question_id_map.get(old_q_id, old_q_id)
            question_results_json = json.dumps(question_results)

        cursor.execute('''
            INSERT INTO drill_results_new (id, drill_id, user_id, total_questions, correct_answers,
                                          incorrect_answers, skipped_questions, score_percentage, time_taken,
                                          question_results, skill_performance, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (new_id, dr[1], dr[2], dr[3], dr[4], dr[5], dr[6], dr[7], dr[8],
              question_results_json, dr[10] if len(dr) > 10 else None, dr[11] if len(dr) > 11 else None))

    print(f"    ✓ Migrated {len(drill_results)} drill_results")

    conn.commit()


def swap_tables(conn):
    """Drop old tables and rename new tables."""
    cursor = conn.cursor()

    print("\nSwapping tables...")

    tables = ['skills', 'questions', 'question_skills', 'drills', 'drill_results']

    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")
        cursor.execute(f"ALTER TABLE {table}_new RENAME TO {table}")

    conn.commit()
    print("✓ Tables swapped")


def create_indexes(conn):
    """Recreate indexes on new tables."""
    cursor = conn.cursor()

    print("\nCreating indexes...")

    cursor.executescript('''
        CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain);
        CREATE INDEX IF NOT EXISTS idx_skills_sub_domain ON skills(sub_domain);
        CREATE INDEX IF NOT EXISTS idx_skills_domain_sub_domain ON skills(domain, sub_domain);
        CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
        CREATE INDEX IF NOT EXISTS idx_questions_sub_domain ON questions(sub_domain);
        CREATE INDEX IF NOT EXISTS idx_question_skills_question_id ON question_skills(question_id);
        CREATE INDEX IF NOT EXISTS idx_question_skills_skill_id ON question_skills(skill_id);
        CREATE INDEX IF NOT EXISTS idx_drills_user_id ON drills(user_id);
        CREATE INDEX IF NOT EXISTS idx_drills_status ON drills(status);
        CREATE INDEX IF NOT EXISTS idx_drills_created_at ON drills(created_at);
        CREATE INDEX IF NOT EXISTS idx_drills_user_status ON drills(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_drill_results_drill_id ON drill_results(drill_id);
        CREATE INDEX IF NOT EXISTS idx_drill_results_user_id ON drill_results(user_id);
        CREATE INDEX IF NOT EXISTS idx_drill_results_completed_at ON drill_results(completed_at);
        CREATE INDEX IF NOT EXISTS idx_drill_results_user_drill ON drill_results(user_id, drill_id);
    ''')

    conn.commit()
    print("✓ Indexes created")


def verify_migration(conn):
    """Verify that migration was successful."""
    cursor = conn.cursor()

    print("\nVerifying migration...")

    tables = ['skills', 'questions', 'question_skills', 'drills', 'drill_results']
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count} rows")

    print("\n✓ Migration verification complete")


def main():
    """Run the migration."""
    print("="* 60)
    print("DATABASE MIGRATION: Integer IDs → Prefixed String IDs")
    print("="* 60)

    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    # Step 1: Backup
    backup_path = backup_database()

    # Step 2: Connect and migrate
    try:
        conn = sqlite3.connect(DB_PATH)

        # Step 3: Create new tables
        create_new_tables(conn)

        # Step 4: Migrate data
        migrate_data(conn)

        # Step 5: Swap tables
        swap_tables(conn)

        # Step 6: Create indexes
        create_indexes(conn)

        # Step 7: Verify
        verify_migration(conn)

        conn.close()

        print("\n" + "="* 60)
        print("✓ MIGRATION COMPLETED SUCCESSFULLY")
        print("="* 60)
        print(f"\nBackup location: {backup_path}")
        print("You can now test the application with the new string IDs.")

    except Exception as e:
        print(f"\n✗ Error during migration: {e}")
        print(f"Backup is available at: {backup_path}")
        print("You can restore from backup if needed.")
        raise


if __name__ == '__main__':
    main()
