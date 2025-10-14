import sqlite3
import json
import sys
import os

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from backend.skill_builder.skills import QUESTION_TYPE_TO_SKILL_MAP
from utils.id_generator import generate_id

# Connect to database
conn = sqlite3.connect('backend/data/deductly.db')
cursor = conn.cursor()

# Load LSAT questions from JSON file
with open('backend/data/lsat_questions.json', 'r') as f:
    questions_data = json.load(f)

# Insert questions and create question_skills associations
question_counter = 1
for q in questions_data:
    # Prepare answer choices as JSON string
    answer_choices = json.dumps(q['options'])

    # Generate question ID
    question_id = generate_id('q', conn)

    # Insert question
    cursor.execute('''
        INSERT INTO questions (
            id,
            question_text,
            answer_choices,
            correct_answer,
            difficulty_level,
            question_type,
            domain,
            sub_domain,
            source_url,
            passage_text
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        question_id,
        q['question_text'],
        answer_choices,
        q['correct_answer'],
        q['difficulty'],
        q['question_type'],
        'lsat',
        'lr',  # All these questions are Logical Reasoning
        q['url'],
        q.get('passage', '')  # Some questions may not have passages
    ))

    # Get the skill_id for this question type
    skill_id_str = QUESTION_TYPE_TO_SKILL_MAP.get(q['question_type'])

    if skill_id_str:
        # Find the skill ID in the database
        cursor.execute('SELECT id FROM skills WHERE skill_id = ?', (skill_id_str,))
        result = cursor.fetchone()

        if result:
            skill_id = result[0]
            # Generate question_skill ID
            qs_id = generate_id('qs', conn)
            # Insert into question_skills junction table
            cursor.execute('''
                INSERT OR IGNORE INTO question_skills (id, question_id, skill_id)
                VALUES (?, ?, ?)
            ''', (qs_id, question_id, skill_id))
        else:
            print(f"Warning: Skill ID '{skill_id_str}' not found for question type '{q['question_type']}'")
    else:
        print(f"Warning: No mapping found for question type '{q['question_type']}'")

    question_counter += 1

# Commit the transaction
conn.commit()

# Verify insertion
cursor.execute('SELECT COUNT(*) FROM questions WHERE domain = "lsat"')
total_questions = cursor.fetchone()[0]
print(f"\nTotal LSAT questions inserted: {total_questions}")

cursor.execute('SELECT COUNT(*) FROM question_skills')
total_mappings = cursor.fetchone()[0]
print(f"Total question-skill mappings created: {total_mappings}")

# Show breakdown by question type
cursor.execute('''
    SELECT question_type, COUNT(*)
    FROM questions
    WHERE domain = "lsat"
    GROUP BY question_type
    ORDER BY COUNT(*) DESC
''')
print("\nQuestions by type:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Show breakdown by difficulty
cursor.execute('''
    SELECT difficulty_level, COUNT(*)
    FROM questions
    WHERE domain = "lsat"
    GROUP BY difficulty_level
''')
print("\nQuestions by difficulty:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
print("\nQuestions inserted successfully!")
