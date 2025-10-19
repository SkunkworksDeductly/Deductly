import sqlite3
import sys
import os

# Create connection to existing database
db_path = os.path.join('backend', 'data', 'deductly.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Adding curriculum tables to existing database...")

# Create videos table
cursor.execute('''
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20),
    duration_seconds INTEGER NOT NULL,
    video_url TEXT,
    thumbnail_url TEXT,
    skill_ids TEXT,
    key_topics TEXT
)
''')

# Check if video_id column exists in study_plan_tasks
cursor.execute("PRAGMA table_info(study_plan_tasks)")
columns = [col[1] for col in cursor.fetchall()]

if 'video_id' not in columns:
    print("Adding video_id column to study_plan_tasks table...")
    cursor.execute('''
        ALTER TABLE study_plan_tasks
        ADD COLUMN video_id VARCHAR(50) REFERENCES videos(id)
    ''')
    print("Column added successfully!")
else:
    print("video_id column already exists in study_plan_tasks table.")

# Create index for better query performance
cursor.execute('''
    CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category)
''')

cursor.execute('''
    CREATE INDEX IF NOT EXISTS idx_videos_difficulty ON videos(difficulty)
''')

conn.commit()

# Verify tables were created
cursor.execute("""
    SELECT name FROM sqlite_master
    WHERE type='table' AND name = 'videos'
""")
if cursor.fetchone():
    print("\n✓ Videos table created successfully!")

# Check study_plan_tasks structure
cursor.execute("PRAGMA table_info(study_plan_tasks)")
columns = cursor.fetchall()
video_id_col = [col for col in columns if col[1] == 'video_id']
if video_id_col:
    print("✓ video_id column added to study_plan_tasks!")

conn.close()
print("\nDatabase updated successfully!")
