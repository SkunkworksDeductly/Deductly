"""
Script to insert LSAT questions into test_study_plan.db
Uses the lsat_questions.json and lsat_skills_taxonomy.json files
"""
import sqlite3
import json
import random
import string
from datetime import datetime

# ============================================================================
# Helper Functions
# ============================================================================

def generate_id(prefix='q'):
    """Generate a random alphanumeric ID with prefix"""
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}-{random_part}"


# Question type to skill_id mapping
# Based on the LSAT skills taxonomy for Logical Reasoning
QUESTION_TYPE_TO_SKILL_MAP = {
    "Assumption": "LR-03",
    "Weaken the Argument": "LR-05",
    "Find the flaw in the Argument": "LR-06",
    "Flaw in the Reasoning": "LR-06",
    "Inference": "LR-10",
    "Parallel flaw in the argument": "LR-13",
    "Method of Reasoning": "LR-14",
    "Method of Reasoning (MoR)": "LR-14",
    "Point at Issue": "LR-15",
    "Role Play": "LR-15",
    "Strengthen": "LR-04",
    "Justify the Conclusion (JTC)": "LR-03",
    "Main Point": "RC-01",
    "Evaluate the Argument": "LR-18",
    "Cannot be Inferred": "LR-10",
    "Principle": "LR-16",
    "Principal": "LR-16",
    "Resolve the Paradox": "LR-11",
    "Parallel Reasoning": "LR-12"
}


# ============================================================================
# Main Script
# ============================================================================

def main():
    # Paths
    db_path = '../data/test_study_plan.db'
    questions_json_path = '../data/lsat_questions.json'
    skills_json_path = '../data/lsat_skills_taxonomy.json'

    # Connect to database
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Load skills taxonomy
    print(f"Loading skills taxonomy from: {skills_json_path}")
    with open(skills_json_path, 'r') as f:
        skills_data = json.load(f)

    # Insert skills first (if not already present)
    print("\nInserting skills into database...")
    skills_inserted = 0

    for skill_group in ['logical_reasoning_skills', 'reading_comprehension_skills']:
        if skill_group in skills_data:
            for skill in skills_data[skill_group]:
                skill_id_db = generate_id('sk')
                try:
                    cursor.execute('''
                        INSERT OR IGNORE INTO skills (
                            id, skill_id, skill_name, domain, sub_domain, category, description
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        skill_id_db,
                        skill['skill_id'],
                        skill['skill_name'],
                        'lsat',
                        'lr' if 'LR' in skill['skill_id'] else 'rc',
                        skill.get('category', ''),
                        skill.get('description', '')
                    ))
                    if cursor.rowcount > 0:
                        skills_inserted += 1
                except sqlite3.IntegrityError:
                    # Skill already exists
                    pass

    print(f"Skills inserted: {skills_inserted}")

    # Load LSAT questions
    print(f"\nLoading questions from: {questions_json_path}")
    with open(questions_json_path, 'r') as f:
        questions_data = json.load(f)

    print(f"Found {len(questions_data)} questions to insert")

    # Insert questions and create question_skills associations
    questions_inserted = 0
    mappings_created = 0
    warnings = []

    for idx, q in enumerate(questions_data, 1):
        # Prepare answer choices as JSON string
        answer_choices = json.dumps(q['options'])

        # Generate question ID
        question_id = generate_id('q')

        # Insert question
        try:
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
                    passage_text,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                question_id,
                q['question_text'],
                answer_choices,
                q['correct_answer'],
                q.get('difficulty', 'Medium'),
                q.get('question_type', 'Unknown'),
                'lsat',
                'lr',  # All these questions are Logical Reasoning
                q.get('url', ''),
                q.get('passage', ''),
                datetime.now().isoformat()
            ))
            questions_inserted += 1

        except sqlite3.IntegrityError as e:
            warnings.append(f"Question {idx}: Failed to insert - {str(e)}")
            continue

        # Get the skill_id for this question type
        question_type = q.get('question_type', '')
        skill_id_str = QUESTION_TYPE_TO_SKILL_MAP.get(question_type)

        if skill_id_str:
            # Find the skill ID in the database
            cursor.execute('SELECT id FROM skills WHERE skill_id = ?', (skill_id_str,))
            result = cursor.fetchone()

            if result:
                skill_db_id = result[0]
                # Generate question_skill ID
                qs_id = generate_id('qs')

                # Insert into question_skills junction table
                try:
                    cursor.execute('''
                        INSERT OR IGNORE INTO question_skills (id, question_id, skill_id)
                        VALUES (?, ?, ?)
                    ''', (qs_id, question_id, skill_db_id))

                    if cursor.rowcount > 0:
                        mappings_created += 1

                except sqlite3.IntegrityError:
                    pass
            else:
                warnings.append(f"Question {idx} ({question_type}): Skill ID '{skill_id_str}' not found in database")
        else:
            warnings.append(f"Question {idx}: No skill mapping found for question type '{question_type}'")

        # Progress indicator
        if idx % 10 == 0:
            print(f"  Processed {idx}/{len(questions_data)} questions...")

    # Commit the transaction
    conn.commit()

    # ============================================================================
    # Print Results
    # ============================================================================

    print("\n" + "="*70)
    print("INSERTION COMPLETE")
    print("="*70)

    # Verify insertion
    cursor.execute('SELECT COUNT(*) FROM questions WHERE domain = "lsat"')
    total_questions = cursor.fetchone()[0]
    print(f"\nTotal LSAT questions in database: {total_questions}")
    print(f"  New questions inserted: {questions_inserted}")

    cursor.execute('SELECT COUNT(*) FROM question_skills')
    total_mappings = cursor.fetchone()[0]
    print(f"\nTotal question-skill mappings: {total_mappings}")
    print(f"  New mappings created: {mappings_created}")

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
        print(f"  {row[0]:<40} {row[1]:>3}")

    # Show breakdown by difficulty
    cursor.execute('''
        SELECT difficulty_level, COUNT(*)
        FROM questions
        WHERE domain = "lsat"
        GROUP BY difficulty_level
        ORDER BY
            CASE difficulty_level
                WHEN 'Easy' THEN 1
                WHEN 'Medium' THEN 2
                WHEN 'Challenging' THEN 3
                WHEN 'Hard' THEN 4
                ELSE 5
            END
    ''')
    print("\nQuestions by difficulty:")
    for row in cursor.fetchall():
        print(f"  {row[0]:<20} {row[1]:>3}")

    # Show warnings if any
    if warnings:
        print("\n" + "="*70)
        print("WARNINGS")
        print("="*70)
        for warning in warnings[:10]:  # Show first 10 warnings
            print(f"  {warning}")
        if len(warnings) > 10:
            print(f"  ... and {len(warnings) - 10} more warnings")

    conn.close()
    print("\n" + "="*70)
    print("Questions inserted successfully!")
    print("="*70)


if __name__ == "__main__":
    main()
