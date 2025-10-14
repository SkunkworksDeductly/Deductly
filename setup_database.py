import sqlite3
import json
import sys
import os

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from utils.id_generator import generate_sequential_id

# Create database and tables
conn = sqlite3.connect('deductly.db')
cursor = conn.cursor()

# Create tables (SQL schema from above)
cursor.executescript('''
-- Skills table (generalized for multiple test types)
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(50) PRIMARY KEY,
    skill_id VARCHAR(20) UNIQUE NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    sub_domain VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
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
);

CREATE TABLE IF NOT EXISTS question_skills (
    id VARCHAR(50) PRIMARY KEY,
    question_id VARCHAR(50) NOT NULL,
    skill_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(question_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain);
CREATE INDEX IF NOT EXISTS idx_skills_sub_domain ON skills(sub_domain);
CREATE INDEX IF NOT EXISTS idx_skills_domain_sub_domain ON skills(domain, sub_domain);
CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_questions_sub_domain ON questions(sub_domain);
CREATE INDEX IF NOT EXISTS idx_question_skills_question_id ON question_skills(question_id);
CREATE INDEX IF NOT EXISTS idx_question_skills_skill_id ON question_skills(skill_id);
''')

# Load LSAT skills from JSON file
with open('lsat_skills_taxonomy.json', 'r') as f:
    taxonomy = json.load(f)

# Insert Logical Reasoning skills
skill_counter = 1
for skill in taxonomy['logical_reasoning_skills']:
    skill_pk_id = generate_sequential_id('sk', skill_counter)
    cursor.execute('''
        INSERT INTO skills (id, skill_id, skill_name, domain, sub_domain, category, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        skill_pk_id,
        skill['skill_id'],
        skill['skill_name'],
        'lsat',  # domain
        'lr',    # sub_domain
        skill['category'],
        skill['description']
    ))
    skill_counter += 1

# Insert Reading Comprehension skills
for skill in taxonomy['reading_comprehension_skills']:
    skill_pk_id = generate_sequential_id('sk', skill_counter)
    cursor.execute('''
        INSERT INTO skills (id, skill_id, skill_name, domain, sub_domain, category, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        skill_pk_id,
        skill['skill_id'],
        skill['skill_name'],
        'lsat',  # domain
        'rc',    # sub_domain
        skill['category'],
        skill['description']
    ))
    skill_counter += 1

conn.commit()

# Verify insertion
cursor.execute('SELECT COUNT(*) FROM skills WHERE domain = "lsat"')
print(f"Total LSAT skills inserted: {cursor.fetchone()[0]}")

cursor.execute('SELECT domain, sub_domain, COUNT(*) FROM skills GROUP BY domain, sub_domain')
print("\nSkills by domain and sub-domain:")
for row in cursor.fetchall():
    print(f"  {row[0]} - {row[1]}: {row[2]} skills")

conn.close()
print("\nDatabase created successfully: deductly.db")
