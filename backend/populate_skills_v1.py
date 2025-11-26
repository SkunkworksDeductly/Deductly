"""
Populate skills table in v1.db database from LSAT skills taxonomy
"""
import sqlite3
import json
import os
import secrets
import string


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

    # Load skills taxonomy from JSON file
    taxonomy_file = os.path.join(os.path.dirname(__file__), 'data', 'lsat_skills_taxonomy.json')
    with open(taxonomy_file, 'r') as f:
        taxonomy = json.load(f)

    print(f"Loading skills from {taxonomy_file}")
    print(f"Inserting into database: {db_path}\n")

    inserted_count = 0

    # Insert Logical Reasoning skills
    if 'logical_reasoning_skills' in taxonomy:
        lr_skills = taxonomy['logical_reasoning_skills']
        print(f"Inserting {len(lr_skills)} Logical Reasoning skills...")

        for skill in lr_skills:
            skill_db_id = generate_id('skill')  # Primary key

            cursor.execute('''
                INSERT INTO skills (
                    id,
                    skill_id,
                    skill_name,
                    domain,
                    sub_domain,
                    category,
                    description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                skill_db_id,
                skill['skill_id'],
                skill['skill_name'],
                'lsat',
                'lr',
                skill.get('category', ''),
                skill.get('description', '')
            ))
            inserted_count += 1

    # Insert Reading Comprehension skills if they exist
    if 'reading_comprehension_skills' in taxonomy:
        rc_skills = taxonomy['reading_comprehension_skills']
        print(f"Inserting {len(rc_skills)} Reading Comprehension skills...")

        for skill in rc_skills:
            skill_db_id = generate_id('skill')  # Primary key

            cursor.execute('''
                INSERT INTO skills (
                    id,
                    skill_id,
                    skill_name,
                    domain,
                    sub_domain,
                    category,
                    description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                skill_db_id,
                skill['skill_id'],
                skill['skill_name'],
                'lsat',
                'rc',
                skill.get('category', ''),
                skill.get('description', '')
            ))
            inserted_count += 1

    # Commit the transaction
    conn.commit()

    print("\n" + "="*60)
    print("INSERTION SUMMARY")
    print("="*60)

    # Verify insertion
    cursor.execute('SELECT COUNT(*) FROM skills')
    total_skills = cursor.fetchone()[0]
    print(f"Total skills in database: {total_skills}")
    print(f"Skills inserted in this run: {inserted_count}")

    # Show breakdown by domain and sub_domain
    cursor.execute('''
        SELECT sub_domain, COUNT(*)
        FROM skills
        GROUP BY sub_domain
        ORDER BY sub_domain
    ''')
    print("\nSkills by sub-domain:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")

    # Show breakdown by category
    cursor.execute('''
        SELECT category, COUNT(*)
        FROM skills
        WHERE sub_domain = 'lr'
        GROUP BY category
        ORDER BY COUNT(*) DESC
    ''')
    print("\nLogical Reasoning skills by category:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")

    conn.close()
    print("\n" + "="*60)
    print("Skills populated successfully!")
    print("="*60)


if __name__ == "__main__":
    main()
