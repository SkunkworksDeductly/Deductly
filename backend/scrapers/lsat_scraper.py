"""
LSAT Practice Questions Scraper
Scrapes free practice questions from Manhattan Review

NOTE: Please ensure you have permission to use this content and comply with
the website's terms of service before using this scraper commercially.
"""

import requests
from bs4 import BeautifulSoup
import json
import sqlite3
import os
import time
from typing import List, Dict, Optional

class LSATScraper:
    def __init__(self, db_path: str = None):
        self.base_url = "https://www.manhattanreview.com/lsat-practice-questions/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        if db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(base_dir, 'data', 'deductly.db')
        self.db_path = db_path

    def fetch_page(self) -> Optional[str]:
        """Fetch the HTML content of the page"""
        try:
            response = requests.get(self.base_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching page: {e}")
            return None

    def parse_questions(self, html: str) -> List[Dict]:
        """Parse questions from the HTML content"""
        soup = BeautifulSoup(html, 'html.parser')
        questions = []

        # Find all question containers
        # This is a placeholder - actual selectors depend on page structure
        question_elements = soup.find_all(['div', 'section'], class_=['question', 'practice-question'])

        if not question_elements:
            # Try alternative parsing if no specific class found
            # Look for common patterns in LSAT question pages
            print("No questions found with standard selectors. Trying alternative parsing...")
            question_elements = self._alternative_parsing(soup)

        for idx, elem in enumerate(question_elements, 1):
            try:
                question_data = self._extract_question_data(elem, idx)
                if question_data:
                    questions.append(question_data)
            except Exception as e:
                print(f"Error parsing question {idx}: {e}")
                continue

        return questions

    def _alternative_parsing(self, soup: BeautifulSoup) -> List:
        """Alternative parsing method if standard selectors don't work"""
        # Try to find questions by looking for numbered patterns or specific text
        potential_containers = soup.find_all(['div', 'section', 'article'])
        return potential_containers

    def _extract_question_data(self, element, question_id: int) -> Optional[Dict]:
        """Extract question data from an element"""
        question_data = {
            'id': question_id,
            'question_text': '',
            'options': [],
            'correct_answer': '',
            'explanation': '',
            'difficulty': '',
            'question_type': '',
            'section': '',  # Logical Reasoning, Reading Comprehension, Analytical Reasoning
            'source': 'Manhattan Review'
        }

        # Extract question text
        question_text_elem = element.find(['p', 'div'], class_=['question-text', 'prompt'])
        if question_text_elem:
            question_data['question_text'] = question_text_elem.get_text(strip=True)

        # Extract options (A, B, C, D, E)
        option_elements = element.find_all(['li', 'div'], class_=['option', 'choice', 'answer-choice'])
        if option_elements:
            for opt in option_elements:
                question_data['options'].append(opt.get_text(strip=True))

        # Extract correct answer
        answer_elem = element.find(['span', 'div'], class_=['correct-answer', 'answer'])
        if answer_elem:
            question_data['correct_answer'] = answer_elem.get_text(strip=True)

        # Extract explanation
        explanation_elem = element.find(['div', 'p'], class_=['explanation', 'answer-explanation'])
        if explanation_elem:
            question_data['explanation'] = explanation_elem.get_text(strip=True)

        # Extract difficulty
        difficulty_elem = element.find(['span', 'div'], class_=['difficulty', 'level'])
        if difficulty_elem:
            question_data['difficulty'] = difficulty_elem.get_text(strip=True)

        # Extract question type
        type_elem = element.find(['span', 'div'], class_=['question-type', 'type'])
        if type_elem:
            question_data['question_type'] = type_elem.get_text(strip=True)

        return question_data if question_data['question_text'] else None

    def save_to_json(self, questions: List[Dict], filepath: str = None):
        """Save questions to JSON file"""
        if filepath is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            filepath = os.path.join(base_dir, 'data', 'lsat_questions.json')

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)

        print(f"Saved {len(questions)} questions to {filepath}")

    def save_to_database(self, questions: List[Dict]):
        """Save questions to SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS lsat_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT NOT NULL,
                options TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                explanation TEXT,
                difficulty TEXT,
                question_type TEXT,
                section TEXT,
                source TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Insert questions
        for question in questions:
            cursor.execute('''
                INSERT INTO lsat_questions
                (question_text, options, correct_answer, explanation, difficulty, question_type, section, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                question['question_text'],
                json.dumps(question['options']),
                question['correct_answer'],
                question['explanation'],
                question['difficulty'],
                question['question_type'],
                question['section'],
                question['source']
            ))

        conn.commit()
        conn.close()
        print(f"Saved {len(questions)} questions to database")

    def scrape_and_save(self, save_format: str = 'both'):
        """
        Main method to scrape questions and save them

        Args:
            save_format: 'json', 'db', or 'both'
        """
        print("Fetching LSAT practice questions...")
        html = self.fetch_page()

        if not html:
            print("Failed to fetch page content")
            return

        print("Parsing questions...")
        questions = self.parse_questions(html)

        if not questions:
            print("No questions found. The page structure may have changed.")
            print("Saving raw HTML for manual inspection...")
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            html_path = os.path.join(base_dir, 'data', 'lsat_page.html')
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"HTML saved to {html_path}")
            return

        print(f"Successfully parsed {len(questions)} questions")

        # Save based on format
        if save_format in ['json', 'both']:
            self.save_to_json(questions)

        if save_format in ['db', 'both']:
            self.save_to_database(questions)

        print("Scraping completed successfully!")
        return questions


def main():
    """Run the scraper"""
    scraper = LSATScraper()
    questions = scraper.scrape_and_save(save_format='both')

    if questions:
        print(f"\nSample question:")
        print(f"Q: {questions[0]['question_text'][:100]}...")
        print(f"Difficulty: {questions[0]['difficulty']}")
        print(f"Type: {questions[0]['question_type']}")


if __name__ == "__main__":
    main()
