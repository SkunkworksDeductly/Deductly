"""
PostgreSQL Schema Migration Script
Converts SQLite schema to PostgreSQL for Deductly database
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection parameters
# These will be set after RDS is created
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'deductly')
DB_USER = os.getenv('DB_USER', 'deductly_admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')

def create_postgresql_schema():
    """Create PostgreSQL schema (converted from SQLite)"""

    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    conn.autocommit = True
    cursor = conn.cursor()

    print("Creating PostgreSQL schema...")

    # Drop existing tables if they exist (for clean migration)
    cursor.execute("""
        DROP TABLE IF EXISTS question_skills CASCADE;
        DROP TABLE IF EXISTS questions CASCADE;
        DROP TABLE IF EXISTS skills CASCADE;
    """)

    # Create skills table
    cursor.execute("""
        CREATE TABLE skills (
            id VARCHAR(50) PRIMARY KEY,
            skill_id VARCHAR(20) UNIQUE NOT NULL,
            skill_name VARCHAR(255) NOT NULL,
            domain VARCHAR(50) NOT NULL,
            sub_domain VARCHAR(50) NOT NULL,
            category VARCHAR(100),
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("✓ Created skills table")

    # Create questions table
    cursor.execute("""
        CREATE TABLE questions (
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
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("✓ Created questions table")

    # Create question_skills junction table
    cursor.execute("""
        CREATE TABLE question_skills (
            id VARCHAR(50) PRIMARY KEY,
            question_id VARCHAR(50) NOT NULL,
            skill_id VARCHAR(50) NOT NULL,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
            UNIQUE(question_id, skill_id)
        );
    """)
    print("✓ Created question_skills table")

    # Create indexes (same as SQLite)
    print("Creating indexes...")
    cursor.execute("CREATE INDEX idx_skills_domain ON skills(domain);")
    cursor.execute("CREATE INDEX idx_skills_sub_domain ON skills(sub_domain);")
    cursor.execute("CREATE INDEX idx_skills_domain_sub_domain ON skills(domain, sub_domain);")
    cursor.execute("CREATE INDEX idx_questions_domain ON questions(domain);")
    cursor.execute("CREATE INDEX idx_questions_sub_domain ON questions(sub_domain);")
    cursor.execute("CREATE INDEX idx_question_skills_question_id ON question_skills(question_id);")
    cursor.execute("CREATE INDEX idx_question_skills_skill_id ON question_skills(skill_id);")
    print("✓ Created all indexes")

    cursor.close()
    conn.close()

    print("\n✅ PostgreSQL schema created successfully!")
    print(f"Database: {DB_NAME} on {DB_HOST}")

if __name__ == '__main__':
    print("="*60)
    print("PostgreSQL Schema Migration for Deductly")
    print("="*60)
    print(f"\nConnecting to: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    print(f"User: {DB_USER}\n")

    try:
        create_postgresql_schema()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure:")
        print("1. RDS database is available")
        print("2. Security group allows your IP")
        print("3. Database credentials are correct in .env")
        print("4. psycopg2 is installed: pip install psycopg2-binary")
