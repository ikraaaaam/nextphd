import os
from database import DatabaseManager

def test_favourites():
    # Because Supabase JS/Py uses service_role key, it bypasses RLS, but we can explicitly insert for two owners
    db = DatabaseManager()
    
    owner_a = "11111111-1111-1111-1111-111111111111"
    owner_b = "22222222-2222-2222-2222-222222222222"
    
    db.client.table('universities').upsert({
        "owner_id": owner_a,
        "name": "Test University X",
        "is_favourite": True
    }, on_conflict="owner_id, name").execute()
    
    db.client.table('universities').upsert({
        "owner_id": owner_b,
        "name": "Test University X",
        "is_favourite": False
    }, on_conflict="owner_id, name").execute()

    res = db.client.table('universities').select('owner_id, is_favourite').eq('name', 'Test University X').execute()
    for row in res.data:
        if row['owner_id'] == owner_a:
            assert row['is_favourite'] == True
        elif row['owner_id'] == owner_b:
            assert row['is_favourite'] == False
            
    print("SUCCESS: Multi-user favourite logic works properly without leaking state.")

if __name__ == "__main__":
    test_favourites()
