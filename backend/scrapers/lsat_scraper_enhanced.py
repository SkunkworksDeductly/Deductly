"""
Enhanced LSAT Practice Questions Scraper
Scrapes free practice questions from Manhattan Review (two-step process)

Step 1: Scrape listing page for question links
Step 2: Scrape each individual question page for full content

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
from urllib.parse import urljoin

class LSATScraperEnhanced:
    def __init__(self, db_path: str = None):
        self.base_url = "https://www.manhattanreview.com"
        self.listing_url = "https://www.manhattanreview.com/lsat-practice-questions/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        if db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(base_dir, 'data', 'deductly.db')
        self.db_path = db_path
        self.delay = 1  # Delay between requests (be respectful)

    def fetch_page(self, url: str) -> Optional[str]:
        """Fetch the HTML content of a page"""
        try:
            print(f"Fetching: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            time.sleep(self.delay)  # Be respectful to the server
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None

    def get_question_links(self) -> List[Dict[str, str]]:
        """Get all question links from the listing page"""
        html = self.fetch_page(self.listing_url)
        if not html:
            return []

        soup = BeautifulSoup(html, 'html.parser')
        question_links = []

        # Find all list items containing question links
        list_items = soup.find_all('li')

        for item in list_items:
            link = item.find('a', href=True)
            if link and '/lsat-practice-questions/' in link['href']:
                # Extract metadata from the listing
                full_url = urljoin(self.base_url, link['href'])

                # Try to extract question type and difficulty from the listing
                text = item.get_text(strip=True)

                question_info = {
                    'url': full_url,
                    'list_text': text
                }

                # Try to parse difficulty from text
                difficulty_levels = ['Easy', 'Medium', 'Hard', 'Challenging']
                for level in difficulty_levels:
                    if level in text:
                        question_info['difficulty'] = level
                        break

                question_links.append(question_info)

        print(f"Found {len(question_links)} question links")
        return question_links

    def parse_question_page(self, url: str, metadata: Dict) -> Optional[Dict]:
        """Parse a single question page"""
        html = self.fetch_page(url)
        if not html:
            return None

        soup = BeautifulSoup(html, 'html.parser')

        question_data = {
            'url': url,
            'question_text': '',
            'passage': '',  # For reading comprehension questions
            'options': [],
            'correct_answer': '',
            'explanation': '',
            'difficulty': metadata.get('difficulty', ''),
            'question_type': '',
            'section': self._determine_section(url),
            'source': 'Manhattan Review'
        }

        # Extract question metadata from header (wf_qb_question_head)
        header = soup.find('div', class_='wf_qb_question_head')
        if header:
            header_text = header.get_text()
            # Extract difficulty - match only the difficulty word
            import re
            difficulty_match = re.search(r'Difficulty level:\s*(\w+?)(?:Practice|\n|<)', header_text)
            if difficulty_match:
                question_data['difficulty'] = difficulty_match.group(1)

            # Extract topic (question type) - match until newline or "Difficulty"
            topic_match = re.search(r'Topic:\s*([^\nD]+?)(?:Difficulty|\n)', header_text)
            if topic_match:
                question_data['question_type'] = topic_match.group(1).strip()

            # Extract section - match until newline or "Topic"
            section_match = re.search(r'Section:\s*([^\nT]+?)(?:Topic|\n)', header_text)
            if section_match:
                question_data['section'] = section_match.group(1).strip()

        # Extract question text from wf_qb_question class
        question_div = soup.find('div', class_='wf_qb_question')
        if question_div:
            # Get all paragraphs in the question
            paragraphs = question_div.find_all('p')
            if paragraphs:
                # Combine all paragraphs for the question text
                question_data['question_text'] = ' '.join([p.get_text(strip=True) for p in paragraphs])

        # Extract answer options from wf_qb_answer_row divs
        answer_rows = soup.find_all('div', class_='wf_qb_answer_row')
        if answer_rows:
            options = []
            for row in answer_rows:
                # Get the option letter (wf_qb_answer_col1) and text (wf_qb_answer_col2)
                letter_elem = row.find('span', class_='wf_qb_answer_col1')
                text_elem = row.find('span', class_='wf_qb_answer_col2')

                if letter_elem and text_elem:
                    letter = letter_elem.get_text(strip=True)
                    text = text_elem.get_text(strip=True)
                    options.append(f"{letter}) {text}")

            question_data['options'] = options

        # Note: Answer and explanation are not available on the question page
        # They are only shown after form submission
        # We'll mark these as unavailable
        question_data['correct_answer'] = 'Not available (requires submission)'
        question_data['explanation'] = 'Not available (requires submission)'

        return question_data if question_data['question_text'] else None

    def _determine_section(self, url: str) -> str:
        """Determine the LSAT section from URL or content"""
        if 'logical-reasoning' in url:
            return 'Logical Reasoning'
        elif 'reading-comprehension' in url:
            return 'Reading Comprehension'
        elif 'analytical-reasoning' in url or 'logic-games' in url:
            return 'Analytical Reasoning'
        return 'Unknown'

    def scrape_all_questions(self) -> List[Dict]:
        """Scrape all questions from the site"""
        print("Step 1: Getting question links...")
        question_links = self.get_question_links()

        if not question_links:
            print("No question links found")
            return []

        print(f"\nStep 2: Scraping {len(question_links)} individual questions...")
        questions = []

        for idx, link_info in enumerate(question_links, 1):
            print(f"\nProcessing question {idx}/{len(question_links)}")
            question_data = self.parse_question_page(link_info['url'], link_info)

            if question_data:
                questions.append(question_data)
                print(f"✓ Successfully parsed: {question_data['question_type']} - {question_data['difficulty']}")
            else:
                print(f"✗ Failed to parse: {link_info['url']}")

        return questions

    def save_to_json(self, questions: List[Dict], filepath: str = None):
        """Save questions to JSON file"""
        if filepath is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            filepath = os.path.join(base_dir, 'data', 'lsat_questions.json')

        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)

        print(f"\n✓ Saved {len(questions)} questions to {filepath}")

    def save_to_database(self, questions: List[Dict]):
        """Save questions to SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS lsat_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                question_text TEXT NOT NULL,
                passage TEXT,
                options TEXT NOT NULL,
                correct_answer TEXT,
                explanation TEXT,
                difficulty TEXT,
                question_type TEXT,
                section TEXT,
                source TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Insert questions
        inserted = 0
        for question in questions:
            try:
                cursor.execute('''
                    INSERT INTO lsat_questions
                    (url, question_text, passage, options, correct_answer, explanation,
                     difficulty, question_type, section, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    question.get('url', ''),
                    question['question_text'],
                    question.get('passage', ''),
                    json.dumps(question['options']),
                    question.get('correct_answer', ''),
                    question.get('explanation', ''),
                    question.get('difficulty', ''),
                    question.get('question_type', ''),
                    question.get('section', ''),
                    question['source']
                ))
                inserted += 1
            except sqlite3.IntegrityError:
                print(f"Skipping duplicate: {question.get('url', 'unknown')}")

        conn.commit()
        conn.close()
        print(f"✓ Saved {inserted} questions to database (skipped {len(questions) - inserted} duplicates)")

    def run(self, save_format: str = 'both'):
        """
        Main method to scrape questions and save them

        Args:
            save_format: 'json', 'db', or 'both'
        """
        print("="*60)
        print("LSAT Questions Scraper")
        print("="*60)

        questions = self.scrape_all_questions()

        if not questions:
            print("\n✗ No questions were successfully scraped")
            return []

        print(f"\n✓ Successfully scraped {len(questions)} questions")

        # Save based on format
        if save_format in ['json', 'both']:
            self.save_to_json(questions)

        if save_format in ['db', 'both']:
            self.save_to_database(questions)

        # Print summary
        print("\n" + "="*60)
        print("Summary:")
        print("="*60)
        sections = {}
        difficulties = {}
        question_types = {}

        for q in questions:
            sections[q['section']] = sections.get(q['section'], 0) + 1
            difficulties[q['difficulty']] = difficulties.get(q['difficulty'], 0) + 1
            question_types[q['question_type']] = question_types.get(q['question_type'], 0) + 1

        print(f"\nBy Section:")
        for section, count in sections.items():
            print(f"  {section}: {count}")

        print(f"\nBy Difficulty:")
        for difficulty, count in difficulties.items():
            print(f"  {difficulty}: {count}")

        print(f"\nBy Question Type:")
        for qtype, count in sorted(question_types.items()):
            print(f"  {qtype}: {count}")

        return questions


def main():
    """Run the enhanced scraper"""
    scraper = LSATScraperEnhanced()
    questions = scraper.run(save_format='both')

    if questions:
        print(f"\n" + "="*60)
        print("Sample Question:")
        print("="*60)
        sample = questions[0]
        print(f"Type: {sample['question_type']}")
        print(f"Difficulty: {sample['difficulty']}")
        print(f"Section: {sample['section']}")
        print(f"Question: {sample['question_text'][:200]}...")
        if sample['options']:
            print(f"Options: {len(sample['options'])} choices")
        print(f"Answer: {sample['correct_answer']}")


if __name__ == "__main__":
    main()
