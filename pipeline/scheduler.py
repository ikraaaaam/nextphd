import sys
import argparse
from database import DatabaseManager
from intelligence_cycle import IntelligenceCycle

class ProductionScheduler:
    def __init__(self):
        self.db = DatabaseManager()
        
    def run_segment_for_all(self, segment: str):
        """
        Executes a specific intelligence cycle segment for all active users.
        """
        print(f"Starting {segment} for all active users...")
        
        # We query the settings table which has owner_id
        res = self.db.client.table("settings").select("owner_id").execute()
        if not res.data:
            print("No users found.")
            return
            
        for row in res.data:
            owner_id = row['owner_id']
            print(f"\n--- Running {segment} for User {owner_id} ---")
            try:
                cycle = IntelligenceCycle(owner_id)
                if segment == "morning":
                    cycle.execute_morning_discovery()
                elif segment == "afternoon":
                    cycle.execute_afternoon_verification()
                elif segment == "evening":
                    cycle.execute_evening_digest()
                else:
                    print(f"Unknown segment: {segment}")
            except Exception as e:
                print(f"Error running {segment} for {owner_id}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NEXTPHD Production Scheduler")
    parser.add_argument("segment", choices=["morning", "afternoon", "evening"], help="The segment to run")
    args = parser.parse_args()
    
    scheduler = ProductionScheduler()
    scheduler.run_segment_for_all(args.segment)
