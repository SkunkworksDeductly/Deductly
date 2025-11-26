"""
Insert LSAT questions into v1.db database
"""
import sqlite3
import json
import sys
import os
import secrets
import string

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from skill_builder.skills import QUESTION_TYPE_TO_SKILL_MAP


def generate_id(prefix):
    """Generate a unique ID with a prefix"""
    # Generate 6 random alphanumeric characters
    random_part = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    return f"{prefix}-{random_part}"


def main():
    # Connect to v1.db database
    db_path = os.path.join(os.path.dirname(__file__), 'data', 'v1.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Load LSAT questions from JSON file
    questions_file = os.path.join(os.path.dirname(__file__), 'data', 'lsat_questions.json')
    with open(questions_file, 'r') as f:
        questions_data = json.load(f)

    print(f"Loading {len(questions_data)} questions from {questions_file}")
    print(f"Inserting into database: {db_path}\n")

    inserted_count = 0
    skipped_count = 0
    mapping_count = 0

    # Insert questions and create question_skills associations
    for q in questions_data:
        try:
            # Prepare answer choices as JSON string
            answer_choices = json.dumps(q['options'])

            # Generate question ID (random alphanumeric)
            question_id = generate_id('q')  # e.g., q-a3f2b9

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
            inserted_count += 1

            # Get the skill_id for this question type
            skill_id_str = QUESTION_TYPE_TO_SKILL_MAP.get(q['question_type'])

            if skill_id_str:
                # Find the skill ID in the database
                cursor.execute('SELECT id FROM skills WHERE skill_id = ?', (skill_id_str,))
                result = cursor.fetchone()

                if result:
                    skill_id = result[0]
                    # Generate question_skill ID (random alphanumeric)
                    qs_id = generate_id('qs')  # e.g., qs-k4m2p1
                    # Insert into question_skills junction table
                    cursor.execute('''
                        INSERT OR IGNORE INTO question_skills (id, question_id, skill_id)
                        VALUES (?, ?, ?)
                    ''', (qs_id, question_id, skill_id))
                    mapping_count += 1
                else:
                    print(f"Warning: Skill ID '{skill_id_str}' not found for question type '{q['question_type']}'")
            else:
                print(f"Warning: No mapping found for question type '{q['question_type']}'")

        except Exception as e:
            print(f"Error inserting question: {e}")
            print(f"Question URL: {q.get('url', 'N/A')}")
            skipped_count += 1
            continue

    # Commit the transaction
    conn.commit()

    print("\n" + "="*60)
    print("INSERTION SUMMARY")
    print("="*60)

    # Verify insertion
    cursor.execute('SELECT COUNT(*) FROM questions WHERE domain = "lsat"')
    total_questions = cursor.fetchone()[0]
    print(f"Total LSAT questions in database: {total_questions}")
    print(f"Questions inserted in this run: {inserted_count}")
    print(f"Questions skipped due to errors: {skipped_count}")

    cursor.execute('SELECT COUNT(*) FROM question_skills')
    total_mappings = cursor.fetchone()[0]
    print(f"Total question-skill mappings: {total_mappings}")
    print(f"Mappings created in this run: {mapping_count}")

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
        ORDER BY difficulty_level
    ''')
    print("\nQuestions by difficulty:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")

    conn.close()
    print("\n" + "="*60)
    print("Questions inserted successfully!")
    print("="*60)


if __name__ == "__main__":
    main()
