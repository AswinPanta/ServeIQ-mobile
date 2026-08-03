#!/usr/bin/env python3
"""Full database seed script for StayEasy backend."""
import json, time, sys, subprocess

BASE = "https://stay-easy-sizw.onrender.com/api/v1"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjlhMDViZC03YWVhLTQ5ZmEtODBlOC01ZDgzMjg5ZWMxZjIiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3ODU2NjYzNjV9.cmcPZtMmO-4V4EMhFqmy32zhkuncIvoLQ5YjU0hN7LE"

AM = {
    "wifi": "ce3423b3-a49b-48df-acde-77636f8683a7",
    "ac": "450780fe-a179-485d-b0fe-29e56a8dfeaa",
    "coffee": "8d0c4059-cb93-4e0a-8b1e-e75b634b8f54",
    "gym": "230d9941-85b0-4658-abfc-e5881674af8d",
    "parking": "1186f44b-4a92-4b83-9729-fbbb2aaabced",
    "hairdryer": "acd20a3b-972a-4916-b1cd-ce9c611c59d4",
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

def post_prop(data):
    r = api("POST", "/properties/general-information", data)
    if r and r.get("success"):
        return r["data"]["id"]
    return None

def create_location(pid, data):
    return api("POST", f"/properties/{pid}/create-location", data)

def create_photos_amenities(pid, data):
    return api("POST", f"/properties/{pid}/create-photos-and-amenities", data)

def create_localization(pid, data):
    return api("POST", f"/properties/{pid}/create-localization", data)

def create_brand(pid, data):
    return api("POST", f"/properties/{pid}/create-brand-visual", data)

def toggle_activate(pid):
    return api("POST", f"/properties/{pid}/toggle-property-activation")

def create_room_type(pid, name):
    r = api("POST", f"/properties/{pid}/rooms/room-type", {"room_type_name": name})
    if r and r.get("success"):
        return r["data"]["id"]
    return None

def create_bed_type(pid, name):
    r = api("POST", f"/properties/{pid}/rooms/bed-type", {"bed_name": name})
    if r and r.get("success"):
        return r["data"]["id"]
    return None

def bulk_create_rooms(pid, rooms):
    return api("POST", f"/properties/{pid}/rooms", {"rooms": rooms})

def add_discount(pid, code, dtype, value, min_amt, max_uses):
    return api("POST", f"/properties/{pid}/discount-codes/", {
        "code": code, "type": dtype, "discount_value": value,
        "min_amount": min_amt, "max_uses": max_uses,
        "valid_from": "2026-01-01", "valid_to": "2026-12-31"
    })

def add_offers(pid, offers):
    return api("POST", f"/properties/{pid}/special-offers/", {"offers": offers})

def add_staff(pid, name, email, phone, role, salary):
    return api("POST", f"/properties/{pid}/staffs", {
        "full_name": name, "email": email, "phone_number": phone,
        "job_role": role, "monthly_salary": salary,
        "joining_date": "2024-01-15", "status": "ACTIVE"
    })

# ============================================================
# PHASE 1: Update existing properties missing location/amenities
# ============================================================
print("=== PHASE 1: Updating existing properties ===")

updates = [
    ("9f6345b1-c55e-4cae-a4a0-5d0c9851b839", {
        "country": "Nepal", "state": "Gandaki", "city": "Pokhara", "zip_code": "33700",
        "address": "Lakeside Road, Pokhara 33700, Nepal",
        "latitude": "28.2050", "longitude": "83.9780",
        "check_in_time": "15:00", "check_out_time": "11:00",
        "currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English",
        "brand_color": "#0D9488",
        "system_amenity_ids": [AM["wifi"], AM["pool"], AM["gym"], AM["parking"], AM["ac"], AM["coffee"], AM["fridge"], AM["tv"], AM["safe"]],
        "custom_amenities": [{"name": "Infinity Pool"}, {"name": "Spa Pavilion"}, {"name": "Kayak Rental"}, {"name": "Mountain View"}, {"name": "Lake View"}, {"name": "Rooftop Bar"}, {"name": "Yoga Deck"}, {"name": "Airport Transfer"}]
    }, "Pokhara Lakeside Retreat Resort"),

    ("bab6d96a-3c1f-48fc-9381-4dffc5a47840", {
        "country": "Nepal", "state": "Gandaki", "city": "Ghandruk", "zip_code": "33700",
        "address": "Ghandruk Village, Kaski District, Nepal",
        "latitude": "28.3752", "longitude": "83.8062",
        "check_in_time": "12:00", "check_out_time": "10:00",
        "currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English",
        "brand_color": "#B45309",
        "system_amenity_ids": [AM["wifi"], AM["heating"], AM["coffee"]],
        "custom_amenities": [{"name": "Mountain View"}, {"name": "Fireplace"}, {"name": "Trekking Guides"}, {"name": "Hot Water 24/7"}, {"name": "Dal Bhat Included"}, {"name": "Bonfire Area"}, {"name": "Gear Storage"}]
    }, "Annapurna Base Camp Lodge"),

    ("c00915da-5fd6-4443-bac2-7ca33f551683", {
        "country": "Nepal", "state": "Bagmati", "city": "Kathmandu", "zip_code": "44600",
        "address": "Boudha, Kathmandu 44600, Nepal",
        "latitude": "27.7215", "longitude": "85.3620",
        "check_in_time": "14:00", "check_out_time": "11:00",
        "currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English",
        "brand_color": "#DC2626",
        "system_amenity_ids": [AM["wifi"], AM["coffee"], AM["tv"]],
        "custom_amenities": [{"name": "Courtyard Dining"}, {"name": "Stupa View"}, {"name": "Momo Specialist"}, {"name": "Rooftop Seating"}, {"name": "Live Music Fridays"}, {"name": "Vegetarian Options"}]
    }, "Boudha Stupa Courtyard Restaurant"),

    ("6ad787ae-10a2-4895-b346-f75ea5df03ea", {
        "country": "Nepal", "state": "Bagmati", "city": "Nagarkot", "zip_code": "44600",
        "address": "Nagarkot Ridge Road, Bhaktapur, Nepal",
        "latitude": "27.7172", "longitude": "85.5188",
        "check_in_time": "14:00", "check_out_time": "11:00",
        "currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English",
        "brand_color": "#16A34A",
        "system_amenity_ids": [AM["wifi"], AM["heating"], AM["coffee"], AM["parking"]],
        "custom_amenities": [{"name": "Sunrise Viewpoint"}, {"name": "Garden"}, {"name": "Bonfire Nights"}, {"name": "Home-Cooked Food"}, {"name": "Hiking Trails"}, {"name": "Newari Cuisine"}, {"name": "Mountain View"}]
    }, "Nagarkot Mountain View Guesthouse"),

    ("20cb9fa6-30b3-49d6-a15b-3172f6ea3dea", {
        "country": "Nepal", "state": "Bagmati", "city": "Bhaktapur", "zip_code": "44600",
        "address": "Durbar Square, Bhaktapur 44600, Nepal",
        "latitude": "27.6710", "longitude": "85.4298",
        "check_in_time": "14:00", "check_out_time": "11:00",
        "currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English",
        "brand_color": "#9333EA",
        "system_amenity_ids": [AM["wifi"], AM["ac"], AM["coffee"], AM["safe"], AM["tv"], AM["fridge"], AM["toiletries"], AM["bathroom"]],
        "custom_amenities": [{"name": "UNESCO Heritage Site"}, {"name": "Courtyard Garden"}, {"name": "Rooftop Temple View"}, {"name": "Newari Architecture"}, {"name": "Cultural Tours"}, {"name": "Pottery Workshop"}, {"name": "Yoga Sessions"}]
    }, "Bhaktapur Heritage Boutique Hotel"),

    ("9722055c-d82b-4c87-aaa9-3acb07583c79", {
        "country": "Nepal", "state": "Lumbini", "city": "Chitwan", "zip_code": "44600",
        "address": "Sauraha, Chitwan, Nepal",
        "latitude": "27.5740", "longitude": "84.4980",
        "check_in_time": "13:00", "check_out_time": "11:00",
        "currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English",
        "brand_color": "#059669",
        "system_amenity_ids": [AM["wifi"], AM["parking"], AM["pool"], AM["coffee"], AM["fridge"], AM["tv"]],
        "custom_amenities": [{"name": "Jungle Safari"}, {"name": "Canoe Rides"}, {"name": "Elephant Bathing"}, {"name": "Tharu Cultural Dance"}, {"name": "Bird Watching"}, {"name": "Nature Walks"}, {"name": "Riverside Dining"}, {"name": "Natural Pool"}]
    }, "Chitwan Jungle Safari Resort"),

    ("657ed3cc-ec57-4778-acde-a273385b56c2", {
        "system_amenity_ids": [AM["wifi"], AM["parking"], AM["coffee"], AM["fridge"], AM["tv"]],
        "custom_amenities": [{"name": "Lake View"}, {"name": "Mountain View"}, {"name": "Private Garden"}, {"name": "Full Kitchen"}, {"name": "Kayak Rental"}, {"name": "Yoga Terrace"}, {"name": "BBQ Area"}, {"name": "Airport Shuttle"}]
    }, "Phewa Lake View Villa"),

    ("0b58dc42-6a29-4ded-98ce-47e9f0fb02b1", {
        "system_amenity_ids": [AM["wifi"], AM["coffee"], AM["frontdesk"]],
        "custom_amenities": [{"name": "Rooftop Cafe"}, {"name": "Communal Kitchen"}, {"name": "Lockers"}, {"name": "Laundry"}, {"name": "Travel Desk"}, {"name": "Bicycle Rental"}, {"name": "Board Games"}, {"name": "Social Events"}]
    }, "Thamel Backpackers Hostel"),
]

for pid, data, name in updates:
    print(f"  Updating {name}...")
    patch_prop(pid, data)
    time.sleep(0.5)

print("=== PHASE 1 DONE ===\n")

# ============================================================
# PHASE 2: Create new properties
# ============================================================
print("=== PHASE 2: Creating new properties ===")

new_props = [
    {
        "info": {"name": "Bardia Safari Lodge", "type": "RESORT", "description": "An intimate luxury safari lodge on the banks of the Karnali River in western Nepal. Thatched villas with private plunge pools, guided tiger tracking, white-water rafting and cultural immersion with the indigenous Tharu community.", "total_rooms": 12, "number_of_floors": 2, "year_built": 2020, "phone_number": "0915201234", "email": "info@bardiasafarilodge.com"},
        "location": {"country": "Nepal", "state": "Lumbini", "city": "Bardia", "zip_code": "32600", "address": "Karnali River Bank, Bardia National Park, Nepal", "latitude": "28.3917", "longitude": "81.5643"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["pool"], AM["parking"], AM["coffee"], AM["fridge"], AM["tv"], AM["safe"], AM["toiletries"], AM["bathroom"]], "custom_amenities": [{"name": "Private Plunge Pool"}, {"name": "Tiger Tracking"}, {"name": "White-Water Rafting"}, {"name": "Canoe Safari"}, {"name": "Tharu Village Tour"}, {"name": "Bird Watching"}, {"name": "Spa Treatments"}, {"name": "Riverside Dining"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "14:00", "check_out_time": "11:00"},
        "brand": {"brand_color": "#166534"},
    },
    {
        "info": {"name": "Kathmandu Business Hotel", "type": "HOTEL", "description": "A modern business hotel in the heart of Kathmandu's commercial district with state-of-the-art conference facilities, executive lounge and express laundry. Walking distance to corporate offices and the domestic airport.", "total_rooms": 95, "number_of_floors": 12, "year_built": 2015, "phone_number": "0142201234", "email": "reservations@ktmbusinesshotel.com"},
        "location": {"country": "Nepal", "state": "Bagmati", "city": "Kathmandu", "zip_code": "44600", "address": "New Baneshwor, Kathmandu 44600, Nepal", "latitude": "27.6966", "longitude": "85.3591"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["ac"], AM["gym"], AM["parking"], AM["coffee"], AM["fridge"], AM["tv"], AM["safe"], AM["iron"], AM["toiletries"], AM["bathroom"], AM["frontdesk"]], "custom_amenities": [{"name": "Executive Lounge"}, {"name": "Conference Rooms"}, {"name": "Business Center"}, {"name": "Airport Shuttle"}, {"name": "Express Laundry"}, {"name": "Mini Bar"}, {"name": "Room Service"}, {"name": "Concierge"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "14:00", "check_out_time": "12:00"},
        "brand": {"brand_color": "#1E40AF"},
    },
    {
        "info": {"name": "Pokhara Paragliding Adventure Resort", "type": "RESORT", "description": "An adventure resort at the base of Sarangkot paragliding launch site with tandem flights, zip-lining, rock climbing and mountain biking. Eco-cottages with Phewa Lake and Machhapuchhre views.", "total_rooms": 20, "number_of_floors": 3, "year_built": 2018, "phone_number": "0615234567", "email": "adventure@pokharaparagliding.com"},
        "location": {"country": "Nepal", "state": "Gandaki", "city": "Pokhara", "zip_code": "33700", "address": "Sarangkot Road, Pokhara 33700, Nepal", "latitude": "28.2439", "longitude": "83.9554"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["parking"], AM["pool"], AM["coffee"], AM["tv"]], "custom_amenities": [{"name": "Tandem Paragliding"}, {"name": "Zip-Line Course"}, {"name": "Rock Climbing Wall"}, {"name": "Mountain Biking"}, {"name": "Adventure Gear Shop"}, {"name": "Sports Bar"}, {"name": "Bonfire Area"}, {"name": "Mountain View"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "14:00", "check_out_time": "11:00"},
        "brand": {"brand_color": "#EA580C"},
    },
    {
        "info": {"name": "Luxury Penthouse Apartment Kathmandu", "type": "APARTMENT", "description": "A spacious 2-bedroom penthouse apartment in the upscale Boudha area with panoramic Himalayan views. Smart home system, rooftop terrace, dedicated workspace and 24/7 security. Perfect for extended stays.", "total_rooms": 4, "number_of_floors": 1, "year_built": 2023, "phone_number": "0149101234", "email": "stay@luxurykathmanduapartment.com"},
        "location": {"country": "Nepal", "state": "Bagmati", "city": "Kathmandu", "zip_code": "44600", "address": "Boudha, Kathmandu 44600, Nepal", "latitude": "27.7200", "longitude": "85.3600"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["ac"], AM["coffee"], AM["fridge"], AM["tv"], AM["safe"], AM["iron"], AM["toiletries"], AM["bathroom"], AM["heating"]], "custom_amenities": [{"name": "Smart Home"}, {"name": "Rooftop Terrace"}, {"name": "City View"}, {"name": "Mountain View"}, {"name": "Full Kitchen"}, {"name": "Washer/Dryer"}, {"name": "Dedicated Workspace"}, {"name": "24/7 Security"}, {"name": "Elevator"}, {"name": "Coffee Machine"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "15:00", "check_out_time": "11:00"},
        "brand": {"brand_color": "#7C3AED"},
    },
    {
        "info": {"name": "Everest View Lodge", "type": "GUESTHOUSE", "description": "A traditional Sherpa guesthouse in Namche Bazaar with unmatched views of Everest, Lhotse and Amtse. Stone walls, wood-burning stoves, yak butter tea and authentic Sherpa hospitality.", "total_rooms": 8, "number_of_floors": 2, "year_built": 2010, "phone_number": "0385201234", "email": "info@everestviewlodge.com"},
        "location": {"country": "Nepal", "state": "Koshi", "city": "Namche Bazaar", "zip_code": "56002", "address": "Namche Bazaar, Solukhumbu, Nepal", "latitude": "27.8069", "longitude": "86.7139"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["heating"], AM["coffee"]], "custom_amenities": [{"name": "Everest View"}, {"name": "Wood-Burning Stove"}, {"name": "Sherpa Cuisine"}, {"name": "Trekking Guides"}, {"name": "Gear Storage"}, {"name": "Oxygen Cylinder"}, {"name": "Hot Water Bottles"}, {"name": "Cultural Evenings"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "12:00", "check_out_time": "10:00"},
        "brand": {"brand_color": "#0F766E"},
    },
    {
        "info": {"name": "Kathmandu Heritage Boutique Hotel", "type": "HOTEL", "description": "A restored 19th-century Rana palace in the Dilli Bazaar district, blending neoclassical architecture with contemporary Nepali art. Private courtyard, rooftop fine-dining and art gallery.", "total_rooms": 22, "number_of_floors": 4, "year_built": 1892, "phone_number": "0144401234", "email": "reservations@kathmanduheritage.com"},
        "location": {"country": "Nepal", "state": "Bagmati", "city": "Kathmandu", "zip_code": "44600", "address": "Dilli Bazaar, Kathmandu 44600, Nepal", "latitude": "27.7080", "longitude": "85.3240"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["ac"], AM["coffee"], AM["fridge"], AM["tv"], AM["safe"], AM["toiletries"], AM["bathroom"], AM["iron"]], "custom_amenities": [{"name": "Rana Palace Architecture"}, {"name": "Art Gallery"}, {"name": "Courtyard Garden"}, {"name": "Fine Dining Restaurant"}, {"name": "Boutique Shop"}, {"name": "Cultural Tours"}, {"name": "Cooking Classes"}, {"name": "Rooftop Bar"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "14:00", "check_out_time": "11:00"},
        "brand": {"brand_color": "#B45309"},
    },
    {
        "info": {"name": "Lumbini Peace Palace Hotel", "type": "HOTEL", "description": "A serene hotel at the birthplace of Lord Buddha with meditation gardens, a Buddhist library and vegetarian restaurant. Comfortable rooms with Lumbini Garden views.", "total_rooms": 35, "number_of_floors": 3, "year_built": 2012, "phone_number": "0715201234", "email": "peace@lumbinipalace.com"},
        "location": {"country": "Nepal", "state": "Lumbini", "city": "Lumbini", "zip_code": "32900", "address": "Sacred Garden, Lumbini 32900, Nepal", "latitude": "27.4833", "longitude": "83.2764"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["parking"], AM["coffee"], AM["tv"], AM["fridge"], AM["pool"]], "custom_amenities": [{"name": "Meditation Garden"}, {"name": "Buddhist Library"}, {"name": "Vegetarian Restaurant"}, {"name": "Bicycle Rental"}, {"name": "Prayer Hall"}, {"name": "Lumbini Garden View"}, {"name": "Yoga Classes"}, {"name": "Cultural Workshops"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "14:00", "check_out_time": "11:00"},
        "brand": {"brand_color": "#CA8A04"},
    },
    {
        "info": {"name": "Bandipur Sky Resort", "type": "RESORT", "description": "A hilltop resort in the preserved Newari town of Bandipur with panoramic views of the Marsyangdi River valley and the Annapurna range. Infinity pool, candlelit dinners and cave explorations.", "total_rooms": 18, "number_of_floors": 3, "year_built": 2017, "phone_number": "0664201234", "email": "reservations@bandipursky.com"},
        "location": {"country": "Nepal", "state": "Gandaki", "city": "Bandipur", "zip_code": "33700", "address": "Bandipur Bazaar, Tanahu, Nepal", "latitude": "27.9356", "longitude": "84.4108"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["parking"], AM["pool"], AM["coffee"], AM["tv"], AM["safe"], AM["toiletries"]], "custom_amenities": [{"name": "Valley View Pool"}, {"name": "Cave Tours"}, {"name": "Newari Architecture"}, {"name": "Candlelit Dinners"}, {"name": "Hiking Trails"}, {"name": "Photography Tours"}, {"name": "Cultural Immersion"}, {"name": "Sunset Point"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "14:00", "check_out_time": "11:00"},
        "brand": {"brand_color": "#7E22CE"},
    },
    {
        "info": {"name": "Chitwan Elephant Camp", "type": "RESORT", "description": "An ethical elephant conservation camp and resort at the edge of Chitwan National Park. Watch elephants in their natural habitat, enjoy jungle safaris and Tharu cultural programs.", "total_rooms": 15, "number_of_floors": 2, "year_built": 2019, "phone_number": "0565801234", "email": "stay@chitwanelephantcamp.com"},
        "location": {"country": "Nepal", "state": "Lumbini", "city": "Chitwan", "zip_code": "44600", "address": "Sauraha Road, Chitwan, Nepal", "latitude": "27.5840", "longitude": "84.4950"},
        "amenities": {"system_amenity_ids": [AM["wifi"], AM["parking"], AM["coffee"], AM["tv"], AM["fridge"]], "custom_amenities": [{"name": "Elephant Conservation"}, {"name": "Jungle Safari"}, {"name": "Tharu Cultural Show"}, {"name": "Canoe Ride"}, {"name": "Bird Watching"}, {"name": "Nature Walk"}, {"name": "Riverside Campfire"}, {"name": "Organic Farm"}]},
        "localization": {"currency": "NPR", "timezone": "Asia/Kathmandu", "language": "English", "check_in_time": "13:00", "check_out_time": "11:00"},
        "brand": {"brand_color": "#15803D"},
    },
]

created_pids = []
for prop in new_props:
    name = prop["info"]["name"]
    print(f"  Creating {name}...")
    pid = post_prop(prop["info"])
    if not pid:
        print(f"    FAILED to create {name}")
        continue
    created_pids.append(pid)
    print(f"    ID: {pid}")
    time.sleep(0.5)
    create_location(pid, prop["location"])
    time.sleep(0.3)
    create_photos_amenities(pid, prop["amenities"])
    time.sleep(0.3)
    create_localization(pid, prop["localization"])
    time.sleep(0.3)
    create_brand(pid, prop["brand"])
    time.sleep(0.3)
    toggle_activate(pid)
    time.sleep(0.3)

print("=== PHASE 2 DONE ===\n")

# ============================================================
# PHASE 3: Add room types, bed types, rooms to ALL properties
# ============================================================
print("=== PHASE 3: Creating rooms for all properties ===")

r = api("GET", "/properties/?skip=0&limit=50")
all_props = r["data"]["properties"] if r and r.get("success") else []
print(f"  Found {len(all_props)} properties total")

room_type_names = ["Deluxe", "Standard", "Suite", "Superior", "Family", "Economy"]
bed_type_names = ["King", "Queen", "Twin", "Single"]

for prop in all_props:
    pid = prop["id"]
    pname = prop["name"]
    trooms = prop.get("total_rooms", 8)
    print(f"  Rooms for {pname}...")

    # Create room types
    rt_ids = []
    for rt_name in room_type_names:
        rtid = create_room_type(pid, rt_name)
        if rtid:
            rt_ids.append(rtid)
        time.sleep(0.2)

    # Create bed types
    bt_ids = []
    for bt_name in bed_type_names:
        btid = create_bed_type(pid, bt_name)
        if btid:
            bt_ids.append(btid)
        time.sleep(0.2)

    if not rt_ids or not bt_ids:
        print(f"    SKIP - no room/bed types created")
        continue

    # Build rooms (up to 10)
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
            "floor_number": floor,
            "room_name": f"Room {i}",
            "room_type_id": rt_ids[rt_idx],
            "bed_type_id": bt_ids[bt_idx],
            "max_adults": cfg["adults"],
            "max_children": cfg["children"],
            "base_rate": cfg["rate"],
            "status": "AVAILABLE",
            "cancellation_policy": cfg["cancel"],
            "cancellation_title": "Free cancellation up to 48 hours before check-in",
            "cancellation_description": "Full refund if cancelled at least 48 hours before check-in. 50% refund for cancellations within 48 hours. No refund for no-shows."
        })

    bulk_create_rooms(pid, rooms)
    time.sleep(0.3)

print("=== PHASE 3 DONE ===\n")

# ============================================================
# PHASE 4: Discount codes and special offers
# ============================================================
print("=== PHASE 4: Adding discounts and offers ===")

for prop in all_props:
    pid = prop["id"]
    pname = prop["name"]
    print(f"  Discounts for {pname}...")

    add_discount(pid, "EARLY20", "PERCENTAGE", 20, 100, 50)
    add_discount(pid, "LONGSTAY", "PERCENTAGE", 15, 200, 30)
    add_discount(pid, "WELCOME", "FIXED", 25, 50, 100)

    add_offers(pid, [
        {"title": "Early Bird Special", "description": "Book 30 days in advance and save 20% on your stay.", "discount_percentage": 20, "start_date": "2026-01-01", "end_date": "2026-12-31", "is_active": True},
        {"title": "Long Stay Discount", "description": "Stay 5 nights or more and enjoy 15% off the total bill.", "discount_percentage": 15, "start_date": "2026-01-01", "end_date": "2026-12-31", "is_active": True},
        {"title": "Weekend Getaway", "description": "Book Friday-Sunday and get a complimentary breakfast for two.", "discount_percentage": 10, "start_date": "2026-01-01", "end_date": "2026-12-31", "is_active": True},
        {"title": "Honeymoon Package", "description": "Special romantic package with room upgrade, champagne and dinner for two.", "discount_percentage": 25, "start_date": "2026-02-14", "end_date": "2026-12-31", "is_active": True},
        {"title": "Festival Season Offer", "description": "Celebrate Dashain and Tihar with 30% off on select rooms.", "discount_percentage": 30, "start_date": "2026-10-01", "end_date": "2026-11-15", "is_active": True},
    ])
    time.sleep(0.3)

print("=== PHASE 4 DONE ===\n")

# ============================================================
# PHASE 5: Staff
# ============================================================
print("=== PHASE 5: Adding staff ===")

staff_data = [
    ("Ram Sharma", "ram.sharma@staff.com", "9801000001", "MANAGER", 35000),
    ("Sita Thapa", "sita.thapa@staff.com", "9801000002", "FRONT_DESK", 20000),
    ("Hari Gurung", "hari.gurung@staff.com", "9801000003", "HOUSEKEEPING", 18000),
    ("Maya Magar", "maya.magar@staff.com", "9801000004", "WAITER", 15000),
    ("Krishna Rai", "krishna.rai@staff.com", "9801000005", "KITCHEN", 18000),
    ("Gita Shrestha", "gita.shrestha@staff.com", "9801000006", "MANAGER", 35000),
    ("Bikash Tamang", "bikash.tamang@staff.com", "9801000007", "FRONT_DESK", 20000),
    ("Anita Limbu", "anita.limbu@staff.com", "9801000008", "HOUSEKEEPING", 18000),
    ("Raj Poudel", "raj.poudel@staff.com", "9801000009", "WAITER", 15000),
    ("Sunita Karki", "sunita.karki@staff.com", "9801000010", "KITCHEN", 18000),
]

for prop in all_props:
    pid = prop["id"]
    pname = prop["name"]
    print(f"  Staff for {pname}...")
    for name, email, phone, role, salary in staff_data:
        add_staff(pid, name, email, phone, role, salary)
    time.sleep(0.3)

print("=== PHASE 5 DONE ===\n")
print("=== SEED COMPLETE ===")
print(f"Total properties: {len(all_props)}")
