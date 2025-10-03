#!/usr/bin/env python3
"""
Simple script to run the LSAT scraper

Usage:
    python run_lsat_scraper.py              # Scrape all questions (default: first 10)
    python run_lsat_scraper.py --all        # Scrape ALL questions (73+)
    python run_lsat_scraper.py --limit 5    # Scrape first 5 questions
"""

import argparse
from lsat_scraper_enhanced import LSATScraperEnhanced

def main():
    parser = argparse.ArgumentParser(description='Scrape LSAT practice questions')
    parser.add_argument('--all', action='store_true', help='Scrape all questions (default: first 10)')
    parser.add_argument('--limit', type=int, help='Limit number of questions to scrape')
    parser.add_argument('--format', choices=['json', 'db', 'both'], default='both',
                        help='Output format (default: both)')

    args = parser.parse_args()

    scraper = LSATScraperEnhanced()

    # Determine limit
    if args.limit:
        limit = args.limit
    elif args.all:
        limit = None  # No limit
    else:
        limit = 10  # Default

    print("="*60)
    print("LSAT Questions Scraper")
    print("="*60)

    # Get question links
    print("\nStep 1: Getting question links...")
    links = scraper.get_question_links()
    print(f"Found {len(links)} total question links")

    # Apply limit
    if limit:
        links = links[:limit]
        print(f"Limiting to first {limit} questions")

    # Scrape questions
    print(f"\nStep 2: Scraping {len(links)} questions...")
    questions = []

    for idx, link_info in enumerate(links, 1):
        print(f"\nProcessing question {idx}/{len(links)}")
        question_data = scraper.parse_question_page(link_info['url'], link_info)

        if question_data:
            questions.append(question_data)
            print(f"✓ {question_data['question_type']} - {question_data['difficulty']}")
        else:
            print(f"✗ Failed to parse: {link_info['url']}")

    # Save results
    print(f"\n{'='*60}")
    print(f"Successfully scraped {len(questions)} questions")
    print(f"{'='*60}")

    if questions:
        if args.format in ['json', 'both']:
            scraper.save_to_json(questions)

        if args.format in ['db', 'both']:
            scraper.save_to_database(questions)

        # Print summary
        print("\nSummary by Section:")
        sections = {}
        for q in questions:
            sections[q['section']] = sections.get(q['section'], 0) + 1
        for section, count in sections.items():
            print(f"  {section}: {count}")

        print("\nSummary by Question Type:")
        qtypes = {}
        for q in questions:
            qtypes[q['question_type']] = qtypes.get(q['question_type'], 0) + 1
        for qtype, count in sorted(qtypes.items()):
            print(f"  {qtype}: {count}")

if __name__ == "__main__":
    main()
