import json
import sqlite3
from pathlib import Path

import pytest

from skill_builder import logic
from skill_builder.skills import ALLOWED_SKILLS


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Provision a throwaway SQLite database for each test."""
    db_path = tmp_path / "deductly.db"
    _initialise_schema(db_path)
    _seed_questions(db_path)

    monkeypatch.setattr(logic, "DB_PATH", str(db_path))
    yield


def _initialise_schema(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.executescript(
        """
        CREATE TABLE questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        """
    )
    conn.commit()
    conn.close()


def _seed_questions(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    base_question = {
        "question_text": "Sample question {idx}",
        "options": ["A", "B", "C", "D"],
        "correct_answer": "A",
        "domain": "lsat",
        "sub_domain": "lr",
        "source_url": "http://example.com",
        "passage_text": "",
    }

    seeds = [
        ("Assumption", "Easy"),
        ("Assumption", "Medium"),
        ("Assumption", "Medium"),
        ("Strengthen", "Easy"),
        ("Strengthen", "Medium"),
        ("Strengthen", "Medium"),
        ("Weaken the Argument", "Easy"),
        ("Weaken the Argument", "Hard"),
        ("Inference", "Hard"),
        ("Inference", "Challenging"),
    ]
    for idx, (skill, difficulty) in enumerate(seeds, start=1):
        payload = (
            base_question["question_text"].format(idx=idx),
            json.dumps(base_question["options"]),
            base_question["correct_answer"],
            difficulty,
            skill,
            base_question["domain"],
            base_question["sub_domain"],
            base_question["source_url"],
            base_question["passage_text"],
        )
        cursor.execute(
            """
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            payload,
        )

    conn.commit()
    conn.close()


def test_create_drill_session_valid():
    payload = {
        "question_count": 5,
        "difficulties": ["Medium", "Hard", "Medium"],
        "time_percentage": 100,
    }

    result = logic.create_drill_session(payload)

    assert result["config"]["question_count"] == 5
    # Duplicates should be removed while preserving order
    assert result["config"]["difficulties"] == ["Medium", "Hard"]
    assert result["config"]["skills"] == []
    assert result["config"]["time_percentage"] == 100
    assert len(result["questions"]) == 5
    assert result["time_limit_seconds"] == 5 * 90  # 450 seconds
    assert result["time_limit_label"] == "7m 30s"
    for question in result["questions"]:
        assert question["difficulty_level"] in {"Medium", "Hard"}
        assert isinstance(question["answer_choices"], list)
        assert question["question_type"] in ALLOWED_SKILLS


def test_create_drill_session_untimed():
    payload = {
        "question_count": 5,
        "difficulties": ["Easy"],
        "time_percentage": "untimed",
    }

    result = logic.create_drill_session(payload)

    assert result["time_limit_seconds"] is None
    assert result["time_limit_label"] == "untimed"
    assert result["config"]["time_percentage"] == "untimed"
    assert result["config"]["skills"] == []


def test_create_drill_session_invalid_difficulty():
    payload = {
        "question_count": 5,
        "difficulties": ["Impossible"],
        "time_percentage": 100,
    }

    with pytest.raises(logic.DrillConfigurationError):
        logic.create_drill_session(payload)


def test_create_drill_session_insufficient_questions():
    payload = {
        "question_count": 15,
        "difficulties": ["Challenging"],
        "time_percentage": 100,
    }

    with pytest.raises(logic.QuestionAvailabilityError):
        logic.create_drill_session(payload)


def test_create_drill_session_by_skill():
    payload = {
        "question_count": 5,
        "difficulties": ["Easy", "Medium"],
        "skills": ["Assumption", "Strengthen"],
        "time_percentage": 100,
    }

    result = logic.create_drill_session(payload)

    assert result["config"]["skills"] == ["Assumption", "Strengthen"]
    assert len(result["questions"]) == 5
    for question in result["questions"]:
        assert question["question_type"] in {"Assumption", "Strengthen"}


def test_create_drill_session_skill_fallback():
    payload = {
        "question_count": 5,
        "difficulties": ["Easy"],
        "skills": ["Weaken the Argument"],
        "time_percentage": 100,
    }

    result = logic.create_drill_session(payload)

    assert len(result["questions"]) == 5
    # At least one question should match the requested skill, but others may fill in.
    skill_matches = [q for q in result["questions"] if q["question_type"] == "Weaken the Argument"]
    assert skill_matches, "Expected at least one Weaken the Argument question"
    assert len({q["id"] for q in result["questions"]}) == 5


def test_create_drill_session_invalid_skill():
    payload = {
        "question_count": 5,
        "difficulties": ["Easy"],
        "skills": ["Made Up Skill"],
        "time_percentage": 100,
    }

    with pytest.raises(logic.DrillConfigurationError):
        logic.create_drill_session(payload)
