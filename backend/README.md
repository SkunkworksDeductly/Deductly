# Backend Overview

## Skill Builder Drill API
- **Endpoint**: `POST /api/skill-builder/drill`
- **Purpose**: Generate an LSAT drill with curated questions, respecting learner-selected difficulty mix, size, and pacing.
- **Request Body**:
  ```json
  {
    "question_count": 10,
    "difficulties": ["Medium", "Hard"],
    "time_percentage": 100
  }
  ```
  - `question_count`: One of `5`, `10`, or `15`.
  - `difficulties`: Any non-empty combination drawn from `["Easy", "Medium", "Hard", "Challenging"]`. Duplicates are ignored while preserving order.
  - `time_percentage`: `70`, `100`, `130`, or `"untimed"`. Percentages scale a 90-second-per-question baseline.
- **Response**:
  ```json
  {
    "session_id": "<uuid>",
    "config": {
      "question_count": 10,
      "difficulties": ["Medium", "Hard"],
      "time_percentage": 100
    },
    "questions": [
      {
        "id": 42,
        "question_text": "...",
        "answer_choices": ["A", "B", "C", "D"],
        "correct_answer": "A",
        "difficulty_level": "Medium",
        "question_type": "Assumption",
        "passage_text": ""
      }
    ],
    "time_limit_seconds": 900,
    "time_limit_label": "15m",
    "created_at": "2024-04-01T12:00:00+00:00"
  }
  ```
  - `time_limit_seconds` is `null` and `time_limit_label` is `"untimed"` when the drill is untimed.
- **Error Codes**:
  - `400`: Invalid configuration (unsupported difficulty, question count, or timing).
  - `409`: Inventory cannot satisfy the requested drill (not enough questions for the chosen configuration).

## Local Testing
- Unit tests target the drill logic in `backend/tests/test_skill_builder_drill.py`.
- Run with `pytest backend/tests/test_skill_builder_drill.py` (install `pytest` if not already available).
