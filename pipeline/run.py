import sys
from extractor import EuraxessExtractor
from database import DatabaseManager

def main():
    print("Starting Phase 2 Pipeline Extraction...")
    extractor = EuraxessExtractor()
    
    print("Fetching from Euraxess RSS...")
    # Because EURAXESS is an example, let's pass a mock URL if real one fails or is large
    opportunities = extractor.fetch_and_parse()
    
    print(f"Extracted {len(opportunities)} opportunities from RSS.")
    
    db = DatabaseManager()
    
    new_count = 0
    duplicate_count = 0
    error_count = 0

    for opp in opportunities:
        success = db.store_opportunity(opp)
        if success:
            new_count += 1
        else:
            # For simplicity, we just count as dup/error 
            duplicate_count += 1
            
    print(f"Pipeline finished. Inserted {new_count} new opportunities, {duplicate_count} skipped/duplicates.")

if __name__ == "__main__":
    main()
