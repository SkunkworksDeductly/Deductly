# Web Scrapers

This directory contains web scrapers for collecting educational content for the Deductly platform.

## LSAT Questions Scraper

Scrapes free LSAT practice questions from Manhattan Review.

### ✅ What It Can Do

- Scrapes 73+ free practice questions
- Extracts question text and all answer options (A-E)
- Extracts metadata: difficulty level, question type, section
- Categorizes by section (Logical Reasoning, Reading Comprehension, Analytical Reasoning)
- Tracks difficulty levels and question types (Assumption, Weaken, Strengthen, etc.)
- Saves to both JSON and SQLite database

### ❌ Current Limitations

- **Cannot extract correct answers** - Requires form submission
- **Cannot extract explanations** - Requires form submission

These would require Selenium/Playwright to submit forms and extract the response page.

### Installation

Install required dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### Usage

#### Recommended: Use the run script

```bash
# Scrape first 10 questions (default)
python scrapers/run_lsat_scraper.py

# Scrape specific number of questions
python scrapers/run_lsat_scraper.py --limit 5

# Scrape ALL questions (73+)
python scrapers/run_lsat_scraper.py --all

# Save to JSON only
python scrapers/run_lsat_scraper.py --format json

# Save to database only
python scrapers/run_lsat_scraper.py --format db
```

#### Alternative: Run the enhanced scraper directly

```bash
cd backend/scrapers
python lsat_scraper_enhanced.py
```

#### Or import and use in your code

```python
from scrapers.lsat_scraper_enhanced import LSATScraperEnhanced

scraper = LSATScraperEnhanced()

# Scrape and save to both JSON and database
questions = scraper.run(save_format='both')

# Or save to specific format
questions = scraper.run(save_format='json')  # JSON only
questions = scraper.run(save_format='db')    # Database only
```

### Output

The scraper produces two outputs:

1. **JSON File**: `backend/data/lsat_questions.json`
   - Human-readable format
   - Easy to inspect and manipulate
   - Can be version controlled

2. **SQLite Database**: `backend/data/deductly.db`
   - Table: `lsat_questions`
   - Optimized for querying
   - Integrated with backend application

### Database Schema

```sql
CREATE TABLE lsat_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,
    question_text TEXT NOT NULL,
    passage TEXT,
    options TEXT NOT NULL,  -- JSON array
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT,
    question_type TEXT,
    section TEXT,
    source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Configuration

You can customize the scraper behavior:

```python
scraper = LSATScraperEnhanced(db_path='/custom/path/to/database.db')
scraper.delay = 2  # Increase delay between requests (seconds)
```

### Important Notes

⚠️ **Legal & Ethical Considerations**:
- The content scraped is freely available on Manhattan Review's website
- Please respect the website's terms of service
- Use appropriate delays between requests to avoid overloading the server
- This scraper is for educational purposes
- Verify you have rights to use the content before deploying commercially

⚠️ **Rate Limiting**:
- The scraper includes a 1-second delay between requests by default
- Adjust `scraper.delay` if needed for your use case

### Troubleshooting

**Scraper hanging or timing out?**
- The website structure may have changed
- Check network connectivity
- Verify the website is accessible

**No questions found or parsing fails?**
- The website HTML structure may have changed
- The current scraper looks for these CSS classes:
  - `wf_qb_question_head` - question metadata
  - `wf_qb_question` - question text
  - `wf_qb_answer_row` - answer options
  - `wf_qb_answer_col1` - option letter (A, B, C, etc.)
  - `wf_qb_answer_col2` - option text
- Update the CSS selectors in `parse_question_page()` if structure changed

**Import errors?**
- Make sure you're running from the correct directory
- Ensure all dependencies are installed: `pip install -r requirements.txt`

**Database errors?**
- Ensure the `backend/data/` directory exists
- Check file permissions
- The database will be created automatically if it doesn't exist

### Recent Fixes (2025-10)

The scraper was completely refactored to match the actual Manhattan Review HTML structure:

1. **Fixed HTML selectors** - Updated to use correct class names (`wf_qb_*`)
2. **Fixed metadata extraction** - Properly parse difficulty, question type, and section
3. **Documented limitations** - Clearly marked that answers/explanations require form submission
4. **Added usage script** - Created `run_lsat_scraper.py` for easier use

## Adding More Scrapers

To add scrapers for other sources:

1. Create a new file: `backend/scrapers/your_scraper.py`
2. Follow the pattern from `lsat_scraper_enhanced.py`
3. Add the class to `__init__.py`
4. Update this README

### Scraper Template

```python
class YourScraper:
    def __init__(self, db_path=None):
        self.base_url = "https://example.com"
        # ... setup

    def fetch_page(self, url):
        # ... fetch logic

    def parse_content(self, html):
        # ... parsing logic

    def save_to_database(self, data):
        # ... save logic

    def run(self):
        # ... main execution
```

## Testing

To test the scraper without saving:

```python
scraper = LSATScraperEnhanced()
questions = scraper.scrape_all_questions()

# Inspect the first question
print(questions[0])
```

## Contributing

When adding or modifying scrapers:
- Follow PEP 8 style guidelines
- Add appropriate error handling
- Include logging/progress indicators
- Document the HTML structure being scraped
- Add rate limiting to be respectful to servers
