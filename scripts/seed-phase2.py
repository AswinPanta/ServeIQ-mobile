#!/usr/bin/env python3
"""Phase 2-5: Add amenities, rooms, discounts, staff to all properties."""
import json, time, subprocess

BASE = "https://stay-easy-sizw.onrender.com/api/v1"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjlhMDViZC03YWVhLTQ5ZmEtODBlOC01ZDgzMjg5ZWMxZjIiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3ODU2NjYzNjV9.cmcPZtMmO-4V4EMhFqmy32zhkuncIvoLQ5YjU0hN7LE"

AM = {
    "wifi": "ce3423b3-a49b-48df-acde-77636f8683a7",
    "ac": "450780fe-a179-485d-b0fe-29e56a8dfeaa",
    "coffee": "8d0c4059-cb93-4e0a-8b1e-e75b634b8f54",
    "gym": "230d9941-85b0-4658-abfc-e5881674af8d",
    "parking": "1186f44b-4a92-4b83-9729-fbbb2aaabced",
    "heating": "bbfb445b-43c7-4039-9624-d0f4d22cba87",
    "safe": "feb3b2a0-b99e-42e7-b921-04584b677701",
    "iron": "6f89e1e4-9d90-4044-8581-4eb8be1fbc44",
    "fridge": "4dff89a5-9c84-46f1-9c88-a0612416c078",
    "toiletries": "c8d49d3a-6823-4480-836d-8e09e3851cea",
    "bathroom": "94e6a625-03e1-4ed5-92f5-aaa9610bc07f",
    "tv": "2658f68e-7723-4a7d-8209-2dad0c5f3101",
    "pool": "fc0ef054-e40c-484a-9eb5-e40f3b0f0d9c",
    "frontdesk": "f7af9fbc-7948-4ada-8ee6-36301607fec2",
}

def api(method, path, data=None):
    url = f"{BASE}{path}"
    cmd = ["curl", "-s", "-X", method, url, "-H", f"Authorization: Bearer {TOKEN}", "-H", "Content-Type: application/json"]
    if data:
        cmd.extend(["-d", json.dumps(data)])
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.stdout:
            return json.loads(result.stdout)
    except Exception as e:
        print(f"  ERROR {method} {path}: {e}")
    return None

def patch_prop(pid, data):
    return api("PATCH", f"/properties/{pid}", data)

# Properties that need amenities added (new ones from phase 2)
props_needing_amenities = [
    ("d3a159f6-254e-4d9c-bfcc-9cfb353c00d8", {
        "system_amenity_ids": [AM["wifi"], AM["pool"], AM["parking"], AM["coffee"], AM["fridge"], AM["tv"], AM["safe"], AM["toiletries"], AM["bathroom"]],
        "custom_amenities": [{"name": "Private Plunge Pool"}, {"name": "Tiger Tracking"}, {"name": "White-Water Rafting"}, {"name": "Canoe Safari"}, {"name": "Tharu Village Tour"}, {"name": "Bird Watching"}, {"name": "Spa Treatments"}, {"name": "Riverside Dining"}]
    }),
    ("9d2b6382-", {  # placeholder, will use full ID below
    }),
]

# Let me get IDs from the list
props_to_amend = {
    "d3a159f6-254e-4d9c-bfcc-9cfb353c00d8": {"name":"Bardia Safari Lodge","sys":[AM["wifi"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"]],"custom":[{"name":"Private Plunge Pool"},{"name":"Tiger Tracking"},{"name":"White-Water Rafting"},{"name":"Canoe Safari"},{"name":"Tharu Village Tour"},{"name":"Bird Watching"},{"name":"Spa Treatments"},{"name":"Riverside Dining"}]},
    "9d2b6382-": {"name":"Kathmandu Business Hotel"},  # placeholder
}

# Actually let me just hardcode all the amenity data properly
# First get all property IDs
r = api("GET", "/properties/?skip=0&limit=50")
all_props = r["data"]["properties"]
print(f"Found {len(all_props)} properties")

# Map property IDs to their amenity needs
amenity_map = {
    "d3a159f6-254e-4d9c-bfcc-9cfb353c00d8": {"sys":[AM["wifi"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"]],"cust":[{"name":"Private Plunge Pool"},{"name":"Tiger Tracking"},{"name":"White-Water Rafting"},{"name":"Canoe Safari"},{"name":"Tharu Village Tour"},{"name":"Bird Watching"},{"name":"Spa Treatments"},{"name":"Riverside Dining"}]},
    "9d2b6382-": None,  # will fill after
}

# Just get the full IDs from all_props
id_map = {p["id"][:8]: p["id"] for p in all_props}

# Amenity data for all new properties (by name)
amenity_data_by_name = {
    "Bardia Safari Lodge": {"sys":[AM["wifi"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"]],"cust":[{"name":"Private Plunge Pool"},{"name":"Tiger Tracking"},{"name":"White-Water Rafting"},{"name":"Canoe Safari"},{"name":"Tharu Village Tour"},{"name":"Bird Watching"},{"name":"Spa Treatments"},{"name":"Riverside Dining"}]},
    "Kathmandu Business Hotel": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["iron"],AM["toiletries"],AM["bathroom"],AM["frontdesk"]],"cust":[{"name":"Executive Lounge"},{"name":"Conference Rooms"},{"name":"Business Center"},{"name":"Airport Shuttle"},{"name":"Express Laundry"},{"name":"Mini Bar"},{"name":"Room Service"},{"name":"Concierge"}]},
    "Pokhara Paragliding Adventure Resort": {"sys":[AM["wifi"],AM["parking"],AM["pool"],AM["coffee"],AM["tv"]],"cust":[{"name":"Tandem Paragliding"},{"name":"Zip-Line Course"},{"name":"Rock Climbing Wall"},{"name":"Mountain Biking"},{"name":"Adventure Gear Shop"},{"name":"Sports Bar"},{"name":"Bonfire Area"},{"name":"Mountain View"}]},
    "Luxury Penthouse Apartment Kathmandu": {"sys":[AM["wifi"],AM["ac"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["iron"],AM["toiletries"],AM["bathroom"],AM["heating"]],"cust":[{"name":"Smart Home"},{"name":"Rooftop Terrace"},{"name":"City View"},{"name":"Mountain View"},{"name":"Full Kitchen"},{"name":"Washer/Dryer"},{"name":"Dedicated Workspace"},{"name":"24/7 Security"},{"name":"Elevator"},{"name":"Coffee Machine"}]},
    "Everest View Lodge": {"sys":[AM["wifi"],AM["heating"],AM["coffee"]],"cust":[{"name":"Everest View"},{"name":"Wood-Burning Stove"},{"name":"Sherpa Cuisine"},{"name":"Trekking Guides"},{"name":"Gear Storage"},{"name":"Oxygen Cylinder"},{"name":"Hot Water Bottles"},{"name":"Cultural Evenings"}]},
    "Kathmandu Heritage Boutique Hotel": {"sys":[AM["wifi"],AM["ac"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"]],"cust":[{"name":"Rana Palace Architecture"},{"name":"Art Gallery"},{"name":"Courtyard Garden"},{"name":"Fine Dining Restaurant"},{"name":"Boutique Shop"},{"name":"Cultural Tours"},{"name":"Cooking Classes"},{"name":"Rooftop Bar"}]},
    "Lumbini Peace Palace Hotel": {"sys":[AM["wifi"],AM["parking"],AM["coffee"],AM["tv"],AM["fridge"],AM["pool"]],"cust":[{"name":"Meditation Garden"},{"name":"Buddhist Library"},{"name":"Vegetarian Restaurant"},{"name":"Bicycle Rental"},{"name":"Prayer Hall"},{"name":"Lumbini Garden View"},{"name":"Yoga Classes"},{"name":"Cultural Workshops"}]},
    "Bandipur Sky Resort": {"sys":[AM["wifi"],AM["parking"],AM["pool"],AM["coffee"],AM["tv"],AM["safe"],AM["toiletries"]],"cust":[{"name":"Valley View Pool"},{"name":"Cave Tours"},{"name":"Newari Architecture"},{"name":"Candlelit Dinners"},{"name":"Hiking Trails"},{"name":"Photography Tours"},{"name":"Cultural Immersion"},{"name":"Sunset Point"}]},
    "Chitwan Elephant Camp": {"sys":[AM["wifi"],AM["parking"],AM["coffee"],AM["tv"],AM["fridge"]],"cust":[{"name":"Elephant Conservation"},{"name":"Jungle Safari"},{"name":"Tharu Cultural Show"},{"name":"Canoe Ride"},{"name":"Bird Watching"},{"name":"Nature Walk"},{"name":"Riverside Campfire"},{"name":"Organic Farm"}]},
    "Test Lodge": {"sys":[AM["wifi"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"]],"cust":[{"name":"Safari Tours"},{"name":"Bonfire Area"},{"name":"Nature Trails"},{"name":"Cultural Program"}]},
    "Hotel Barahi": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"Lake View"},{"name":"Spa & Wellness"},{"name":"Infinity Pool"},{"name":"Fine Dining Restaurant"},{"name":"Room Service"},{"name":"Airport Shuttle"},{"name":"Boat Tours"},{"name":"Business Center"}]},
    "Mount Kailash Resort": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"Himalayan Sunrise View"},{"name":"Mountain View"},{"name":"Spa Treatments"},{"name":"Yoga Classes"},{"name":"Guided Hiking"},{"name":"Restaurant & Bar"},{"name":"Conference Room"},{"name":"Gift Shop"}]},
    "Temple House": {"sys":[AM["wifi"],AM["coffee"],AM["tv"],AM["parking"]],"cust":[{"name":"Meditation Garden"},{"name":"Buddhist Library"},{"name":"Prayer Hall"},{"name":"Bicycle Rental"},{"name":"Vegetarian Restaurant"},{"name":"Yoga Classes"},{"name":"Temple Tours"},{"name":"Cultural Workshops"}]},
    "Grand Hotel": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"Sunrise Viewpoint"},{"name":"Mountain View"},{"name":"Restaurant & Bar"},{"name":"Conference Hall"},{"name":"Room Service"},{"name":"Airport Shuttle"},{"name":"Gift Shop"},{"name":"Garden"}]},
    "Fishtail Lodge": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"Lake View"},{"name":"Mountain View"},{"name":"Spa & Wellness"},{"name":"Fine Dining"},{"name":"Boat Tours"},{"name":"Fishing Trips"},{"name":"Hiking Guides"},{"name":"Cultural Programs"}]},
    "Hotel Annapurna": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"Panoramic Mountain View"},{"name":"Rooftop Restaurant"},{"name":"Spa & Sauna"},{"name":"Conference Center"},{"name":"Travel Desk"},{"name":"Room Service"},{"name":"Airport Transfer"},{"name":"Gift Shop"}]},
    "Soaltee Westend Hotel": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"5-Star Service"},{"name":"World-Class Spa"},{"name":"Himalayan Views"},{"name":"Fine Dining"},{"name":"Business Center"},{"name":"Helipad"},{"name":"Swimming Pool"},{"name":"Concierge Service"}]},
    "Tiger Palace Resort": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"Jungle Safari"},{"name":"Elephant Rides"},{"name":"Canoe Rides"},{"name":"Tharu Cultural Show"},{"name":"Bird Watching"},{"name":"Spa & Wellness"},{"name":"Pool Side Bar"},{"name":"Conference Hall"}]},
    "Hotel Shanker": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"Palace Heritage"},{"name":"Lush Gardens"},{"name":"Swimming Pool"},{"name":"Restaurant & Bar"},{"name":"Spa Treatments"},{"name":"Conference Rooms"},{"name":"Travel Desk"},{"name":"Airport Transfer"}]},
    "Yak & Yeti Hotel": {"sys":[AM["wifi"],AM["ac"],AM["gym"],AM["pool"],AM["parking"],AM["coffee"],AM["fridge"],AM["tv"],AM["safe"],AM["toiletries"],AM["bathroom"],AM["iron"],AM["frontdesk"]],"cust":[{"name":"Victorian Architecture"},{"name":"Heritage Rooms"},{"name":"Multiple Restaurants"},{"name":"Casino"},{"name":"Spa & Gym"},{"name":"Conference Center"},{"name":"Rooftop Bar"},{"name":"Shopping Arcade"}]},
    "Pokhara Hotel1": {"sys":[AM["wifi"],AM["ac"],AM["coffee"],AM["tv"]],"cust":[{"name":"Lake View"},{"name":"Restaurant"},{"name":"Travel Desk"},{"name":"Parking"}]},
}

print("\n=== Adding amenities to properties missing them ===")
for prop in all_props:
    pid = prop["id"]
    pname = prop["name"]
    has_amen = bool(prop.get("custom_amenities") or prop.get("system_amenities"))
    if has_amen:
        continue
    if pname in amenity_data_by_name:
        data = amenity_data_by_name[pname]
        print(f"  Adding amenities to {pname}...")
        patch_prop(pid, {"system_amenity_ids": data["sys"], "custom_amenities": data["cust"]})
        time.sleep(0.5)
    else:
        print(f"  No amenity data for {pname}, adding defaults...")
        patch_prop(pid, {"system_amenity_ids": [AM["wifi"], AM["coffee"], AM["tv"]], "custom_amenities": [{"name": "Free WiFi"}, {"name": "Restaurant"}, {"name": "Parking"}]})
        time.sleep(0.5)

# Also activate properties that are inactive
print("\n=== Activating inactive properties ===")
for prop in all_props:
    if not prop.get("is_active"):
        print(f"  Activating {prop['name']}...")
        api("POST", f"/properties/{prop['id']}/toggle-property-activation")
        time.sleep(0.5)

# Also fix properties with missing phone/email (they need 10-digit phone)
print("\n=== Fixing properties with missing/bad phone numbers ===")
phone_fixes = {
    "0915201234": True,  # Bardia - already fine
    "0142201234": True,  # KTM Business - already fine
    "0615234567": True,  # Pokhara Para - already fine
}
# The ones from original data need fixing - some have non-10-digit phones
# Let's just patch all with valid phones
for prop in all_props:
    phone = prop.get("phone_number", "")
    if phone and len(str(phone)) != 10:
        # Fix to 10 digits
        new_phone = str(phone)[:10]
        print(f"  Fixing phone for {prop['name']}: {phone} -> {new_phone}")
        patch_prop(prop["id"], {"phone_number": new_phone})
        time.sleep(0.3)

print("\n=== PHASE 3: Creating rooms for ALL properties ===")

room_type_names = ["Deluxe", "Standard", "Suite", "Superior", "Family", "Economy"]
bed_type_names = ["King", "Queen", "Twin", "Single"]

# Refresh property list
r = api("GET", "/properties/?skip=0&limit=50")
all_props = r["data"]["properties"]

for prop in all_props:
    pid = prop["id"]
    pname = prop["name"]
    trooms = prop.get("total_rooms", 8)
    print(f"  Rooms for {pname} ({trooms} rooms)...")

    # Create room types
    rt_ids = []
    for rt_name in room_type_names:
        rtid_resp = api("POST", f"/properties/{pid}/rooms/room-type", {"room_type_name": rt_name})
        if rtid_resp and rtid_resp.get("success"):
            rt_ids.append(rtid_resp["data"]["id"])
        time.sleep(0.15)

    # Create bed types
    bt_ids = []
    for bt_name in bed_type_names:
        btid_resp = api("POST", f"/properties/{pid}/rooms/bed-type", {"bed_name": bt_name})
        if btid_resp and btid_resp.get("success"):
            bt_ids.append(btid_resp["data"]["id"])
        time.sleep(0.15)

    if not rt_ids or not bt_ids:
        print(f"    SKIP - room/bed types already exist or failed")
        continue

    num_rooms = min(trooms, 10)
    rooms = []
    for i in range(1, num_rooms + 1):
        floor = (i - 1) // 4
        rt_idx = (i - 1) % len(rt_ids)
        bt_idx = (i - 1) % len(bt_ids)
        configs = [
            {"rate": 120, "adults": 2, "children": 1, "cancel": "FLEXIBLE"},
            {"rate": 80, "adults": 2, "children": 0, "cancel": "MODERATE"},
            {"rate": 200, "adults": 3, "children": 2, "cancel": "STRICT"},
            {"rate": 95, "adults": 2, "children": 1, "cancel": "FLEXIBLE"},
            {"rate": 150, "adults": 4, "children": 2, "cancel": "MODERATE"},
            {"rate": 55, "adults": 1, "children": 0, "cancel": "FLEXIBLE"},
        ]
        cfg = configs[(i - 1) % len(configs)]
        rooms.append({
            "floor_number": floor, "room_name": f"Room {i}",
            "room_type_id": rt_ids[rt_idx], "bed_type_id": bt_ids[bt_idx],
            "max_adults": cfg["adults"], "max_children": cfg["children"],
            "base_rate": cfg["rate"], "status": "AVAILABLE",
            "cancellation_policy": cfg["cancel"],
            "cancellation_title": "Free cancellation up to 48 hours before check-in",
            "cancellation_description": "Full refund if cancelled at least 48 hours before check-in. 50% refund for cancellations within 48 hours. No refund for no-shows."
        })

    resp = api("POST", f"/properties/{pid}/rooms", {"rooms": rooms})
    if resp and resp.get("success"):
        print(f"    Created {len(rooms)} rooms")
    else:
        print(f"    Room creation response: {resp}")
    time.sleep(0.3)

print("\n=== PHASE 4: Discounts and offers ===")

for prop in all_props:
    pid = prop["id"]
    pname = prop["name"]
    print(f"  Discounts for {pname}...")
    api("POST", f"/properties/{pid}/discount-codes/", {"code":"EARLY20","type":"PERCENTAGE","discount_value":20,"min_amount":100,"max_uses":50,"valid_from":"2026-01-01","valid_to":"2026-12-31"})
    api("POST", f"/properties/{pid}/discount-codes/", {"code":"LONGSTAY","type":"PERCENTAGE","discount_value":15,"min_amount":200,"max_uses":30,"valid_from":"2026-01-01","valid_to":"2026-12-31"})
    api("POST", f"/properties/{pid}/discount-codes/", {"code":"WELCOME","type":"FIXED","discount_value":25,"min_amount":50,"max_uses":100,"valid_from":"2026-01-01","valid_to":"2026-12-31"})
    api("POST", f"/properties/{pid}/special-offers/", {"offers":[
        {"title":"Early Bird Special","description":"Book 30 days in advance and save 20%.","discount_percentage":20,"start_date":"2026-01-01","end_date":"2026-12-31","is_active":True},
        {"title":"Long Stay Discount","description":"Stay 5+ nights and enjoy 15% off.","discount_percentage":15,"start_date":"2026-01-01","end_date":"2026-12-31","is_active":True},
        {"title":"Weekend Getaway","description":"Book Fri-Sun, get complimentary breakfast.","discount_percentage":10,"start_date":"2026-01-01","end_date":"2026-12-31","is_active":True},
        {"title":"Honeymoon Package","description":"Romantic package with upgrade, champagne & dinner.","discount_percentage":25,"start_date":"2026-02-14","end_date":"2026-12-31","is_active":True},
        {"title":"Festival Season Offer","description":"Dashain/Tihar special: 30% off select rooms.","discount_percentage":30,"start_date":"2026-10-01","end_date":"2026-11-15","is_active":True},
    ]})
    time.sleep(0.3)

print("\n=== PHASE 5: Staff ===")

staff_data = [
    ("Ram Sharma", "ram.sharma@stayeasy.com", "9801000001", "MANAGER", 35000),
    ("Sita Thapa", "sita.thapa@stayeasy.com", "9801000002", "FRONT_DESK", 20000),
    ("Hari Gurung", "hari.gurung@stayeasy.com", "9801000003", "HOUSEKEEPING", 18000),
    ("Maya Magar", "maya.magar@stayeasy.com", "9801000004", "WAITER", 15000),
    ("Krishna Rai", "krishna.rai@stayeasy.com", "9801000005", "KITCHEN", 18000),
    ("Gita Shrestha", "gita.shrestha@stayeasy.com", "9801000006", "MANAGER", 35000),
    ("Bikash Tamang", "bikash.tamang@stayeasy.com", "9801000007", "FRONT_DESK", 20000),
    ("Anita Limbu", "anita.limbu@stayeasy.com", "9801000008", "HOUSEKEEPING", 18000),
    ("Raj Poudel", "raj.poudel@stayeasy.com", "9801000009", "WAITER", 15000),
    ("Sunita Karki", "sunita.karki@stayeasy.com", "9801000010", "KITCHEN", 18000),
]

for prop in all_props:
    pid = prop["id"]
    pname = prop["name"]
    print(f"  Staff for {pname}...")
    for name, email, phone, role, salary in staff_data:
        api("POST", f"/properties/{pid}/staffs", {"full_name":name,"email":email,"phone_number":phone,"job_role":role,"monthly_salary":salary,"joining_date":"2024-01-15","status":"ACTIVE"})
    time.sleep(0.3)

print("\n=== ALL PHASES COMPLETE ===")
print(f"Total properties seeded: {len(all_props)}")
