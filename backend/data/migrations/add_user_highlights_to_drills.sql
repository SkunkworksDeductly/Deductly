-- Migration: Add user_highlights column to drills table
-- Date: 2025-10-17
-- Purpose: Store user text highlights as JSON: {question_id: [[start, end], ...]}

ALTER TABLE drills ADD COLUMN user_highlights TEXT;
