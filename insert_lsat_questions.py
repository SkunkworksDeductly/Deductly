import sqlite3
import json

# Connect to database
conn = sqlite3.connect('backend/data/deductly.db')
cursor = conn.cursor()

# Load LSAT questions from JSON file
with open('backend/data/lsat_questions.json', 'r') as f:
    questions_data = json.load(f)

# Insert questions and create question_skills associations
for q in questions_data:
    # Prepare answer choices as JSON string
    answer_choices = json.dumps(q['options'])

    # Insert question
    cursor.execute('''
        INSERT INTO questions (
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
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

    # Get the question ID that was just inserted
    question_id = cursor.lastrowid

    # Map question_type to skill_id based on the taxonomy from lsat_skills_taxonomy.json
    question_type_to_skill_map = {
        'Assumption': 'LR-03',  # Identify Assumptions
        'Weaken the Argument': 'LR-05',  # Weaken Argument
        'Weaken': 'LR-05',  # Weaken Argument
        'Find the flaw in the Argument': 'LR-06',  # Identify Flaw
        'Flaw in the Reasoning': 'LR-06',  # Identify Flaw
        'Inference': 'LR-10',  # Must Be True/Inference
        'Cannot be Inferred': 'LR-10',  # Must Be True/Inference
        'Parallel flaw in the argument': 'LR-13',  # Parallel Flaw
        'Method of Reasoning': 'LR-14',  # Method of Reasoning
        'Method of Reasoning (MoR)': 'LR-14',  # Method of Reasoning
        'Point at Issue': 'LR-16',  # Point of Agreement/Disagreement (closest match)
        'Role Play': 'LR-15',  # Role of Statement
        'Justify the Conclusion (JTC)': 'LR-08',  # Sufficient Conditions
        'Strengthen': 'LR-04',  # Strengthen Argument
        'Principle': 'LR-16',  # Principle - Identify
        'Principal': 'LR-17',  # Principle - Apply
        'Parallel Reasoning': 'LR-12',  # Parallel Reasoning
        'Resolve the Paradox': 'LR-11',  # Resolve Paradox
        'Evaluate the Argument': 'LR-18',  # Evaluate Argument
        'Main Point': 'LR-01',  # Main Point/Primary Purpose (using RC skill)
    }

    # Get the skill_id for this question type
    skill_id_str = question_type_to_skill_map.get(q['question_type'])

    if skill_id_str:
        # Find the skill ID in the database
        cursor.execute('SELECT id FROM skills WHERE skill_id = ?', (skill_id_str,))
        result = cursor.fetchone()

        if result:
            skill_id = result[0]
            # Insert into question_skills junction table
            cursor.execute('''
                INSERT OR IGNORE INTO question_skills (question_id, skill_id)
                VALUES (?, ?)
            ''', (question_id, skill_id))
        else:
            print(f"Warning: Skill ID '{skill_id_str}' not found for question type '{q['question_type']}'")
    else:
        print(f"Warning: No mapping found for question type '{q['question_type']}'")

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
