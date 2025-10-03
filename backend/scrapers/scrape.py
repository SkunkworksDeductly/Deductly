from lsat_scraper_enhanced import LSATScraperEnhanced

scraper = LSATScraperEnhanced()

# Or save to specific format
questions = scraper.run(save_format='json')  # JSON only