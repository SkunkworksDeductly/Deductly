#!/usr/bin/env python3
"""
Populate the modules table from modules_library.json

This script reads the modules library JSON file and inserts all modules
into the database to satisfy foreign key constraints.
"""
import json
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.connection import get_db_connection


def populate_modules():
    """
    Read modules from modules_library.json and insert into database.
    """
    # Load modules library
    library_path = os.path.join(
        os.path.dirname(__file__),
        'data',
        'modules_library.json'
    )

    if not os.path.exists(library_path):
        print(f"Error: Module library not found at {library_path}")
        return False

    with open(library_path, 'r') as f:
        data = json.load(f)

    modules = data.get('modules', [])

    if not modules:
        print("Warning: No modules found in library")
        return False

    print(f"Found {len(modules)} modules in library")

    # Connect to database
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing modules (optional - be careful in production!)
    cursor.execute("DELETE FROM modules")
    print("Cleared existing modules")

    # Insert each module
    inserted = 0
    for module in modules:
        try:
            cursor.execute(
                """INSERT INTO modules
                   (module_id, module_name, module_type, target_skills,
                    secondary_skills, difficulty_level, phase_suitability,
                    prerequisites, estimated_minutes, tasks, learning_objectives)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    module['module_id'],
                    module['module_name'],
                    module['module_type'],
                    json.dumps(module['target_skills']),
                    json.dumps(module.get('secondary_skills', [])),
                    module['difficulty_level'],
                    json.dumps(module['phase_suitability']),
                    json.dumps(module.get('prerequisites', [])),
                    module['estimated_minutes'],
                    json.dumps(module['tasks']),
                    json.dumps(module.get('learning_objectives', []))
                )
            )
            inserted += 1
        except Exception as e:
            print(f"Error inserting module {module['module_id']}: {e}")
            conn.rollback()
            return False

    conn.commit()
    print(f"Successfully inserted {inserted} modules into database")

    # Verify insertion
    cursor.execute("SELECT COUNT(*) as count FROM modules")
    count = cursor.fetchone()['count']
    print(f"Database now contains {count} modules")

    return True


if __name__ == '__main__':
    success = populate_modules()
    sys.exit(0 if success else 1)
