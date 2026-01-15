#!/usr/bin/env python3
"""
Migration script: Insert practice questions into PostgreSQL.
Run from backend directory: python3 db/migrate_questions.py
"""
import sys
import os
import json
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import get_db_cursor
from utils import generate_id

# Path to practice questions file
QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), 'claude_questions_gen1.txt')


def parse_questions_file(filepath: str) -> list:
    """Parse multiple JSON objects from the practice questions file."""
    with open(filepath, 'r') as f:
        content = f.read()

    # Find all JSON objects (assuming they're separated by newlines between closing/opening braces)
    # Use regex to find JSON blocks
    json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'

    # Alternative: split by empty lines and parse each block
    blocks = re.split(r'\n\s*\n', content.strip())

    questions = []
    for block in blocks:
        block = block.strip()
        if block.startswith('{'):
            try:
                q = json.loads(block)
                questions.append(q)
            except json.JSONDecodeError as e:
                print(f"Warning: Failed to parse JSON block: {e}")
                continue

    return questions


def get_correct_answer_letter(options: list) -> str:
    """Determine the correct answer letter (A, B, C, D, E) from options."""
    letters = ['A', 'B', 'C', 'D', 'E']
    for i, opt in enumerate(options):
        if opt.get('is_correct', False):
            return letters[i] if i < len(letters) else '?'
    return '?'


def format_answer_choices(options: list) -> str:
    """Format options as JSON array of {text, letter} for storage."""
    letters = ['A', 'B', 'C', 'D', 'E']
    choices = []
    for i, opt in enumerate(options):
        choices.append({
            'letter': letters[i] if i < len(letters) else '?',
            'text': opt['text']
        })
    return json.dumps(choices)


def get_skill_id_mapping() -> dict:
    """Fetch skill_id -> id mapping from database."""
    mapping = {}
    with get_db_cursor() as cursor:
        cursor.execute("SELECT id, skill_id FROM skills")
        rows = cursor.fetchall()
        for row in rows:
            mapping[row['skill_id']] = row['id']
    return mapping


def insert_question(question: dict, skill_mapping: dict) -> str:
    """Insert a question and its skill mappings. Returns the question id."""

    # Generate question ID
    q_id = generate_id("q")

    # Extract fields
    question_text = question['stem']
    answer_choices = format_answer_choices(question['options'])
    correct_answer = get_correct_answer_letter(question['options'])
    passage_text = question.get('stimulus', '')

    metadata = question.get('metadata', {})
    difficulty_level = metadata.get('difficulty', 'MEDIUM')
    question_type = metadata.get('question_type', 'Unknown')
    domain = 'LSAT'
    sub_domain = 'LR'  # All questions in this file are LR

    # Insert into questions table
    insert_q_sql = """
        INSERT INTO questions (
            id, question_text, answer_choices, correct_answer,
            difficulty_level, question_type, domain, sub_domain, passage_text
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    with get_db_cursor() as cursor:
        cursor.execute(insert_q_sql, (
            q_id, question_text, answer_choices, correct_answer,
            difficulty_level, question_type, domain, sub_domain, passage_text
        ))

    # Insert skill mappings
    primary_skill_id = metadata.get('primary_skill_id')
    secondary_skills = metadata.get('secondary_skills', [])

    skills_to_insert = []

    if primary_skill_id and primary_skill_id in skill_mapping:
        skills_to_insert.append((primary_skill_id, 'primary', 1.0))

    for sec_skill in secondary_skills:
        if sec_skill in skill_mapping:
            skills_to_insert.append((sec_skill, 'secondary', 0.5))

    insert_qs_sql = """
        INSERT INTO question_skills (id, question_id, skill_id, skill_type, weight)
        VALUES (%s, %s, %s, %s, %s)
    """

    with get_db_cursor() as cursor:
        for skill_id_str, skill_type, weight in skills_to_insert:
            qs_id = generate_id("qs")
            db_skill_id = skill_mapping[skill_id_str]
            cursor.execute(insert_qs_sql, (qs_id, q_id, db_skill_id, skill_type, weight))

    return q_id, question_type, len(skills_to_insert)


def verify_insertions():
    """Verify questions and skill mappings were inserted."""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as count FROM questions")
        q_count = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM question_skills")
        qs_count = cursor.fetchone()['count']

        print(f"\nVerification:")
        print(f"  Questions: {q_count}")
        print(f"  Question-Skill mappings: {qs_count}")

        # Show questions with their skills
        cursor.execute("""
            SELECT q.id, q.question_type, q.difficulty_level,
                   COUNT(qs.id) as skill_count
            FROM questions q
            LEFT JOIN question_skills qs ON q.id = qs.question_id
            GROUP BY q.id, q.question_type, q.difficulty_level
        """)
        rows = cursor.fetchall()

        print("\n  Questions inserted:")
        for row in rows:
            print(f"    {row['id']}: {row['question_type']} ({row['difficulty_level']}) - {row['skill_count']} skills")


def main():
    print("=" * 50)
    print("Practice Questions Migration")
    print("=" * 50)

    # Step 1: Parse questions file
    print("\n[1/4] Parsing practice_questions.txt...")
    questions = parse_questions_file(QUESTIONS_FILE)
    print(f"  Found {len(questions)} questions")

    # Step 2: Get skill mapping
    print("\n[2/4] Loading skill mappings...")
    skill_mapping = get_skill_id_mapping()
    print(f"  Loaded {len(skill_mapping)} skills")

    # Step 3: Insert questions
    print("\n[3/4] Inserting questions...")
    for i, q in enumerate(questions, 1):
        q_id, q_type, skill_count = insert_question(q, skill_mapping)
        print(f"  [{i}] {q_type}: {q_id} ({skill_count} skills)")

    # Step 4: Verify
    print("\n[4/4] Verifying...")
    verify_insertions()

    print("\n" + "=" * 50)
    print("Migration complete!")
    print("=" * 50)


if __name__ == "__main__":
    main()
