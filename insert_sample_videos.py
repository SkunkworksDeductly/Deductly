import sqlite3
import json
import os
import sys

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from utils.id_generator import generate_sequential_id

# Database path
db_path = os.path.join('backend', 'data', 'deductly.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Inserting sample videos...")

# Sample videos data
sample_videos = [
    {
        "title": "Introduction to Logical Reasoning",
        "description": "Master the fundamentals of LSAT Logical Reasoning. This comprehensive lesson covers argument structure, common question types, and essential strategies for success.",
        "instructor": "Sarah Johnson",
        "category": "Logical Reasoning",
        "difficulty": "Beginner",
        "duration_seconds": 1475,  # 24:35
        "video_url": None,
        "thumbnail_url": None,
        "skill_ids": json.dumps(["LR-001", "LR-002", "LR-003"]),
        "key_topics": json.dumps([
            "Identifying argument structure",
            "Understanding premises and conclusions",
            "Common logical reasoning question types",
            "Effective time management strategies"
        ])
    },
    {
        "title": "Advanced Python for Data Analysis",
        "description": "Deep dive into Python libraries like Pandas and NumPy for advanced data analysis and visualization techniques.",
        "instructor": "Michael Chen",
        "category": "Logical Reasoning",
        "difficulty": "Advanced",
        "duration_seconds": 2722,  # 45:22
        "video_url": None,
        "thumbnail_url": None,
        "skill_ids": json.dumps(["LR-008", "LR-009"]),
        "key_topics": json.dumps([
            "Core concepts and fundamentals",
            "Practical examples and demonstrations",
            "Best practices and common patterns",
            "Real-world applications and use cases"
        ])
    },
    {
        "title": "Reading Comprehension Strategies",
        "description": "Learn effective strategies for tackling LSAT Reading Comprehension passages with confidence and accuracy.",
        "instructor": "Emma Rodriguez",
        "category": "Reading Comprehension",
        "difficulty": "Intermediate",
        "duration_seconds": 1918,  # 31:58
        "video_url": None,
        "thumbnail_url": None,
        "skill_ids": json.dumps(["RC-001", "RC-002"]),
        "key_topics": json.dumps([
            "Active reading techniques",
            "Passage mapping and annotation",
            "Question type identification",
            "Eliminating wrong answer choices"
        ])
    },
    {
        "title": "Assumption Questions Mastery",
        "description": "Master one of the most common LSAT question types: assumption questions. Learn to identify necessary and sufficient assumptions.",
        "instructor": "David Park",
        "category": "Logical Reasoning",
        "difficulty": "Intermediate",
        "duration_seconds": 2036,  # 33:56
        "video_url": None,
        "thumbnail_url": None,
        "skill_ids": json.dumps(["LR-004", "LR-005"]),
        "key_topics": json.dumps([
            "Necessary vs. sufficient assumptions",
            "Gap analysis in arguments",
            "Common assumption patterns",
            "Elimination strategies"
        ])
    },
    {
        "title": "Weakening and Strengthening Arguments",
        "description": "Develop skills to effectively weaken and strengthen arguments in LSAT Logical Reasoning questions.",
        "instructor": "Rachel Kim",
        "category": "Logical Reasoning",
        "difficulty": "Advanced",
        "duration_seconds": 2475,  # 41:15
        "video_url": None,
        "thumbnail_url": None,
        "skill_ids": json.dumps(["LR-006", "LR-007"]),
        "key_topics": json.dumps([
            "Identifying argument vulnerabilities",
            "Impact of new evidence",
            "Scope and relevance",
            "Advanced reasoning patterns"
        ])
    },
    {
        "title": "Comparative Reading Passages",
        "description": "Navigate dual passages with ease. Learn strategies specific to LSAT comparative reading questions.",
        "instructor": "James Wilson",
        "category": "Reading Comprehension",
        "difficulty": "Advanced",
        "duration_seconds": 2190,  # 36:30
        "video_url": None,
        "thumbnail_url": None,
        "skill_ids": json.dumps(["RC-003", "RC-004"]),
        "key_topics": json.dumps([
            "Comparing and contrasting passages",
            "Tracking multiple perspectives",
            "Synthesis questions",
            "Time management for dual passages"
        ])
    },
    {
        "title": "Analytical Reasoning: Logic Games Basics",
        "description": "Introduction to LSAT Logic Games. Learn fundamental setup strategies and diagramming techniques.",
        "instructor": "Sophie Martinez",
        "category": "Analytical Reasoning",
        "difficulty": "Beginner",
        "duration_seconds": 1770,  # 29:30
        "video_url": None,
        "thumbnail_url": None,
        "skill_ids": json.dumps(["AR-001", "AR-002"]),
        "key_topics": json.dumps([
            "Game setup and diagramming",
            "Rule representation",
            "Making inferences",
            "Common game types"
        ])
    },
    {
        "title": "Parallel Reasoning Questions",
        "description": "Master parallel reasoning questions by understanding argument structure and logical patterns.",
        "instructor": "Alex Turner",
        "category": "Logical Reasoning",
        "difficulty": "Advanced",
        "duration_seconds": 1695,  # 28:15
        "video_url": None,
        "thumbnail_url": None,
        "skill_ids": json.dumps(["LR-010", "LR-011"]),
        "key_topics": json.dumps([
            "Abstracting argument structure",
            "Pattern matching",
            "Avoiding content traps",
            "Efficient elimination"
        ])
    }
]

# Insert videos
video_counter = 1
for video_data in sample_videos:
    video_id = generate_sequential_id('vid', video_counter)
    cursor.execute('''
        INSERT INTO videos (id, title, description, instructor, category, difficulty,
                          duration_seconds, video_url, thumbnail_url, skill_ids, key_topics)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        video_id,
        video_data['title'],
        video_data['description'],
        video_data['instructor'],
        video_data['category'],
        video_data['difficulty'],
        video_data['duration_seconds'],
        video_data['video_url'],
        video_data['thumbnail_url'],
        video_data['skill_ids'],
        video_data['key_topics']
    ))
    video_counter += 1
    print(f"  ✓ Inserted: {video_data['title']}")

conn.commit()

# Verify insertion
cursor.execute('SELECT COUNT(*) FROM videos')
total_videos = cursor.fetchone()[0]
print(f"\nTotal videos in database: {total_videos}")

cursor.execute('SELECT category, COUNT(*) FROM videos GROUP BY category')
print("\nVideos by category:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} videos")

conn.close()
print("\nSample videos inserted successfully!")
