#!/bin/bash
set -e

BASE="https://stay-easy-sizw.onrender.com/api/v1"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjlhMDViZC03YWVhLTQ5ZmEtODBlOC01ZDgzMjg5ZWMxZjIiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3ODU2NjIwMzd9.nfd6s_n_pme5LO6YbzPOtHfFsREfNAxq2uoVv9kFYBA"
AUTH="Authorization: Bearer $TOKEN"

# System amenity IDs
AMWIFI="ce3423b3-a49b-48df-acde-77636f8683a7"
AMAC="450780fe-a179-485d-b0fe-29e56a8dfeaa"
AMCOFFEE="8d0c4059-cb93-4e0a-8b1e-e75b634b8f54"
AMGYM="230d9941-85b0-4658-abfc-e5881674af8d"
AMPARKING="1186f44b-4a92-4b83-9729-fbbb2aaabced"
AMHAIR_DRYER="acd20a3b-972a-4916-b1cd-ce9c611c59d4"
AMHEATING="bbfb445b-43c7-4039-9624-d0f4d22cba87"
AMSAFE="feb3b2a0-b99e-42e7-b921-04584b677701"
AMIRON="6f89e1e4-9d90-4044-8581-4eb8be1fbc44"
AMFRIDGE="4dff89a5-9c84-46f1-9c88-a0612416c078"
AMTOILETRIES="c8d49d3a-6823-4480-836d-8e09e3851cea"
AMBATHROOM="94e6a625-03e1-4ed5-92f5-aaa9610bc07f"
AMTV="2658f68e-7723-4a7d-8209-2dad0c5f3101"
AMPOOL="fc0ef054-e40c-484a-9eb5-e40f3b0f0d9c"
AMFRONT_DESK="f7af9fbc-7948-4ada-8ee6-36301607fec2"

echo "=== PHASE 1: Updating existing properties with location, amenities, brand ==="

# Property 2: Pokhara Lakeside Retreat Resort
P2="9f6345b1-c55e-4cae-a4a0-5d0c9851b839"
echo "Updating $P2 (Pokhara Lakeside Retreat Resort)..."
curl -s -X PATCH "$BASE/properties/$P2" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Gandaki","city":"Pokhara","zip_code":"33700",
  "address":"Lakeside Road, Pokhara 33700, Nepal",
  "latitude":"28.2050","longitude":"83.9780",
  "check_in_time":"15:00","check_out_time":"11:00",
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "brand_color":"#0D9488",
  "system_amenity_ids":["'"$AMWIFI"'","'"$AMPOOL"'","'"$AMGYM"'","'"$AMPARKING"'","'"$AMAC"'","'"$AMCOFFEE"'","'"$AMFRIDGE"'","'"$AMTV"'","'"$AMSAFE"'"],
  "custom_amenities":[{"name":"Infinity Pool"},{"name":"Spa Pavilion"},{"name":"Kayak Rental"},{"name":"Mountain View"},{"name":"Lake View"},{"name":"Rooftop Bar"},{"name":"Yoga Deck"},{"name":"Airport Transfer"}]
}' > /dev/null
sleep 1

# Property 3: Annapurna Base Camp Lodge
P3="bab6d96a-3c1f-48fc-9381-4dffc5a47840"
echo "Updating $P3 (Annapurna Base Camp Lodge)..."
curl -s -X PATCH "$BASE/properties/$P3" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Gandaki","city":"Ghandruk","zip_code":"33700",
  "address":"Ghandruk Village, Kaski District, Nepal",
  "latitude":"28.3752","longitude":"83.8062",
  "check_in_time":"12:00","check_out_time":"10:00",
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "brand_color":"#B45309",
  "system_amenity_ids":["'"$AMWIFI"'","'"$AMHEATING"'","'"$AMCOFFEE"'"],
  "custom_amenities":[{"name":"Mountain View"},{"name":"Fireplace"},{"name":"Trekking Guides"},{"name":"Hot Water 24/7"},{"name":"Dal Bhat Included"},{"name":"Bonfire Area"},{"name":"Gear Storage"}]
}' > /dev/null
sleep 1

# Property 4: Boudha Stupa Courtyard Restaurant
P4="c00915da-5fd6-4443-bac2-7ca33f551683"
echo "Updating $P4 (Boudha Stupa Courtyard Restaurant)..."
curl -s -X PATCH "$BASE/properties/$P4" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Bagmati","city":"Kathmandu","zip_code":"44600",
  "address":"Boudha, Kathmandu 44600, Nepal",
  "latitude":"27.7215","longitude":"85.3620",
  "check_in_time":"14:00","check_out_time":"11:00",
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "brand_color":"#DC2626",
  "system_amenity_ids":["'"$AMWIFI"'","'"$AMCOFFEE"'","'"$AMTV"'"],
  "custom_amenities":[{"name":"Courtyard Dining"},{"name":"Stupa View"},{"name":"Momo Specialist"},{"name":"Rooftop Seating"},{"name":"Live Music Fridays"},{"name":"Vegetarian Options"}]
}' > /dev/null
sleep 1

# Property 5: Nagarkot Mountain View Guesthouse
P5="6ad787ae-10a2-4895-b346-f75ea5df03ea"
echo "Updating $P5 (Nagarkot Mountain View Guesthouse)..."
curl -s -X PATCH "$BASE/properties/$P5" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Bagmati","city":"Nagarkot","zip_code":"44600",
  "address":"Nagarkot Ridge Road, Bhaktapur, Nepal",
  "latitude":"27.7172","longitude":"85.5188",
  "check_in_time":"14:00","check_out_time":"11:00",
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "brand_color":"#16A34A",
  "system_amenity_ids":["'"$AMWIFI"'","'"$AMHEATING"'","'"$AMCOFFEE"'","'"$AMPARKING"'"],
  "custom_amenities":[{"name":"Sunrise Viewpoint"},{"name":"Garden"},{"name":"Bonfire Nights"},{"name":"Home-Cooked Food"},{"name":"Hiking Trails"},{"name":"Newari Cuisine"},{"name":"Mountain View"}]
}' > /dev/null
sleep 1

# Property 6: Bhaktapur Heritage Boutique Hotel
P6="20cb9fa6-30b3-49d6-a15b-3172f6ea3dea"
echo "Updating $P6 (Bhaktapur Heritage Boutique Hotel)..."
curl -s -X PATCH "$BASE/properties/$P6" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Bagmati","city":"Bhaktapur","zip_code":"44600",
  "address":"Durbar Square, Bhaktapur 44600, Nepal",
  "latitude":"27.6710","longitude":"85.4298",
  "check_in_time":"14:00","check_out_time":"11:00",
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "brand_color":"#9333EA",
  "system_amenity_ids":["'"$AMWIFI"'","'"$AMAC"'","'"$AMCOFFEE"'","'"$AMSAFE"'","'"$AMTV"'","'"$AMFRIDGE"'","'"$AMTOILETRIES"'","'"$AMBATHROOM"'"],
  "custom_amenities":[{"name":"UNESCO Heritage Site"},{"name":"Courtyard Garden"},{"name":"Rooftop Temple View"},{"name":"Newari Architecture"},{"name":"Cultural Tours"},{"name":"Pottery Workshop"},{"name":"Yoga Sessions"}]
}' > /dev/null
sleep 1

# Property 7: Chitwan Jungle Safari Resort
P7="9722055c-d82b-4c87-aaa9-3acb07583c79"
echo "Updating $P7 (Chitwan Jungle Safari Resort)..."
curl -s -X PATCH "$BASE/properties/$P7" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Lumbini","city":"Chitwan","zip_code":"44600",
  "address":"Sauraha, Chitwan, Nepal",
  "latitude":"27.5740","longitude":"84.4980",
  "check_in_time":"13:00","check_out_time":"11:00",
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "brand_color":"#059669",
  "system_amenity_ids":["'"$AMWIFI"'","'"$AMPARKING"'","'"$AMPOOL"'","'"$AMCOFFEE"'","'"$AMFRIDGE"'","'"$AMTV"'"],
  "custom_amenities":[{"name":"Jungle Safari"},{"name":"Canoe Rides"},{"name":"Elephant Bathing"},{"name":"Tharu Cultural Dance"},{"name":"Bird Watching"},{"name":"Nature Walks"},{"name":"Riverside Dining"},{"name":"Natural Pool"}]
}' > /dev/null
sleep 1

# Property 10: Phewa Lake View Villa - already has location, just add amenities
P10="657ed3cc-ec57-4778-acde-a273385b56c2"
echo "Updating $P10 (Phewa Lake View Villa) amenities..."
curl -s -X PATCH "$BASE/properties/$P10" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "system_amenity_ids":["'"$AMWIFI"'","'"$AMPARKING"'","'"$AMCOFFEE"'","'"$AMFRIDGE"'","'"$AMTV"'"],
  "custom_amenities":[{"name":"Lake View"},{"name":"Mountain View"},{"name":"Private Garden"},{"name":"Full Kitchen"},{"name":"Kayak Rental"},{"name":"Yoga Terrace"},{"name":"BBQ Area"},{"name":"Airport Shuttle"}]
}' > /dev/null
sleep 1

# Property 11: Thamel Backpackers Hostel - already has location, add amenities
P11="0b58dc42-6a29-4ded-98ce-47e9f0fb02b1"
echo "Updating $P11 (Thamel Backpackers Hostel) amenities..."
curl -s -X PATCH "$BASE/properties/$P11" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "system_amenity_ids":["'"$AMWIFI"'","'"$AMCOFFEE"'","'"$AMFRONT_DESK"'"],
  "custom_amenities":[{"name":"Rooftop Café"},{"name":"Communal Kitchen"},{"name":"Lockers"},{"name":"Laundry"},{"name":"Travel Desk"},{"name":"Bicycle Rental"},{"name":"Board Games"},{"name":"Social Events"}]
}' > /dev/null
sleep 1

echo "=== PHASE 1 COMPLETE ==="

echo ""
echo "=== PHASE 2: Creating new properties ==="

# Property 22: Luxury Safari Lodge, Bardia
echo "Creating Bardia Safari Lodge..."
P22=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Bardia Safari Lodge","type":"RESORT",
  "description":"An intimate luxury safari lodge on the banks of the Karnali River in western Nepal. Thatched villas with private plunge pools, guided tiger tracking, white-water rafting and cultural immersion with the indigenous Tharu community. One of the most exclusive wildlife experiences in South Asia.",
  "total_rooms":12,"number_of_floors":2,"year_built":2020,
  "phone_number":"0915201234","email":"info@bardiasafarilodge.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P22"

curl -s -X POST "$BASE/properties/$P22/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Lumbini","city":"Bardia","zip_code":"32600",
  "address":"Karnali River Bank, Bardia National Park, Nepal",
  "latitude":"28.3917","longitude":"81.5643"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P22/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMPOOL"'","'"$AMPARKING"'","'"$AMCOFFEE"'","'"$AMFRIDGE"'","'"$AMTV"'","'"$AMSAFE"'","'"$AMTOILETRIES"'","'"$AMBATHROOM"'"],
  "custom_amenities":[{"name":"Private Plunge Pool"},{"name":"Tiger Tracking"},{"name":"White-Water Rafting"},{"name":"Canoe Safari"},{"name":"Tharu Village Tour"},{"name":"Bird Watching"},{"name":"Spa Treatments"},{"name":"Riverside Dining"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P22/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"14:00","check_out_time":"11:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P22/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#166534"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P22/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

# Property 23: Kathmandu Business Hotel
echo "Creating Kathmandu Business Hotel..."
P23=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Kathmandu Business Hotel","type":"HOTEL",
  "description":"A modern business hotel in the heart of Kathmandu's commercial district with state-of-the-art conference facilities, executive lounge and express laundry. Walking distance to Durbar Mall, corporate offices and the domestic airport.",
  "total_rooms":95,"number_of_floors":12,"year_built":2015,
  "phone_number":"0142201234","email":"reservations@ktmbusinesshotel.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P23"

curl -s -X POST "$BASE/properties/$P23/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Bagmati","city":"Kathmandu","zip_code":"44600",
  "address":"New Baneshwor, Kathmandu 44600, Nepal",
  "latitude":"27.6966","longitude":"85.3591"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P23/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMAC"'","'"$AMGYM"'","'"$AMPARKING"'","'"$AMCOFFEE"'","'"$AMFRIDGE"'","'"$AMTV"'","'"$AMSAFE"'","'"$AMIRON"'","'"$AMTOILETRIES"'","'"$AMBATHROOM"'","'"$AMFRONT_DESK"'"],
  "custom_amenities":[{"name":"Executive Lounge"},{"name":"Conference Rooms"},{"name":"Business Center"},{"name":"Airport Shuttle"},{"name":"Express Laundry"},{"name":"Mini Bar"},{"name":"Room Service"},{"name":"Concierge"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P23/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"14:00","check_out_time":"12:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P23/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#1E40AF"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P23/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

# Property 24: Pokhara Paragliding Adventure Resort
echo "Creating Pokhara Paragliding Adventure Resort..."
P24=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Pokhara Paragliding Adventure Resort","type":"RESORT",
  "description":"An adventure resort at the base of Sarangkot paragliding launch site with tandem flights, zip-lining, rock climbing and mountain biking. Eco-cottages with Phewa Lake and Machhapuchhre views, an adventure gear shop and a sports bar.",
  "total_rooms":20,"number_of_floors":3,"year_built":2018,
  "phone_number":"0615234567","email":"adventure@pokharaparagliding.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P24"

curl -s -X POST "$BASE/properties/$P24/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Gandaki","city":"Pokhara","zip_code":"33700",
  "address":"Sarangkot Road, Pokhara 33700, Nepal",
  "latitude":"28.2439","longitude":"83.9554"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P24/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMPARKING"'","'"$AMPOOL"'","'"$AMCOFFEE"'","'"$AMTV"'"],
  "custom_amenities":[{"name":"Tandem Paragliding"},{"name":"Zip-Line Course"},{"name":"Rock Climbing Wall"},{"name":"Mountain Biking"},{"name":"Adventure Gear Shop"},{"name":"Sports Bar"},{"name":"Bonfire Area"},{"name":"Mountain View"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P24/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"14:00","check_out_time":"11:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P24/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#EA580C"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P24/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

# Property 25: Luxury Apartment Kathmandu
echo "Creating Luxury Apartment Kathmandu..."
P25=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Luxury Penthouse Apartment Kathmandu","type":"APARTMENT",
  "description":"A spacious 2-bedroom penthouse apartment in the upscale Boudha area with panoramic Himalayan views from every room. Fully equipped modern kitchen, smart home system, rooftop terrace, dedicated workspace and 24/7 security. Perfect for extended stays and digital nomads.",
  "total_rooms":4,"number_of_floors":1,"year_built":2023,
  "phone_number":"0149101234","email":"stay@luxurykathmanduapartment.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P25"

curl -s -X POST "$BASE/properties/$P25/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Bagmati","city":"Kathmandu","zip_code":"44600",
  "address":"Boudha, Kathmandu 44600, Nepal",
  "latitude":"27.7200","longitude":"85.3600"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P25/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMAC"'","'"$AMCOFFEE"'","'"$AMFRIDGE"'","'"$AMTV"'","'"$AMSAFE"'","'"$AMIRON"'","'"$AMTOILETRIES"'","'"$AMBATHROOM"'","'"$AMHEATING"'"],
  "custom_amenities":[{"name":"Smart Home"},{"name":"Rooftop Terrace"},{"name":"City View"},{"name":"Mountain View"},{"name":"Full Kitchen"},{"name":"Washer/Dryer"},{"name":"Dedicated Workspace"},{"name":"24/7 Security"},{"name":"Elevator"},{"name":"Coffee Machine"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P25/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"15:00","check_out_time":"11:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P25/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#7C3AED"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P25/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

# Property 26: Everest View Lodge
echo "Creating Everest View Lodge..."
P26=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Everest View Lodge","type":"GUESTHOUSE",
  "description":"A traditional Sherpa guesthouse in Namche Bazaar with unmatched views of Everest, Lhotse and Amtse. Stone walls, wood-burning stoves, yak butter tea and authentic Sherpa hospitality. The starting point for Everest Base Camp trekkers.",
  "total_rooms":8,"number_of_floors":2,"year_built":2010,
  "phone_number":"0385201234","email":"info@everestviewlodge.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P26"

curl -s -X POST "$BASE/properties/$P26/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Koshi","city":"Namche Bazaar","zip_code":"56002",
  "address":"Namche Bazaar, Solukhumbu, Nepal",
  "latitude":"27.8069","longitude":"86.7139"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P26/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMHEATING"'","'"$AMCOFFEE"'"],
  "custom_amenities":[{"name":"Everest View"},{"name":"Wood-Burning Stove"},{"name":"Sherpa Cuisine"},{"name":"Trekking Guides"},{"name":"Gear Storage"},{"name":"Oxygen Cylinder"},{"name":"Hot Water Bottles"},{"name":"Cultural Evenings"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P26/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"12:00","check_out_time":"10:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P26/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#0F766E"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P26/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

# Property 27: Kathmandu Heritage Boutique Hotel
echo "Creating Kathmandu Heritage Boutique Hotel..."
P27=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Kathmandu Heritage Boutique Hotel","type":"HOTEL",
  "description":"A restored 19th-century Rana palace in the Dilli Bazaar district, blending neoclassical architecture with contemporary Nepali art. Private courtyard, rooftop fine-dining restaurant, art gallery, and a boutique shop selling local handicrafts.",
  "total_rooms":22,"number_of_floors":4,"year_built":1892,
  "phone_number":"0144401234","email":"reservations@kathmanduheritage.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P27"

curl -s -X POST "$BASE/properties/$P27/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Bagmati","city":"Kathmandu","zip_code":"44600",
  "address":"Dilli Bazaar, Kathmandu 44600, Nepal",
  "latitude":"27.7080","longitude":"85.3240"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P27/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMAC"'","'"$AMCOFFEE"'","'"$AMFRIDGE"'","'"$AMTV"'","'"$AMSAFE"'","'"$AMTOILETRIES"'","'"$AMBATHROOM"'","'"$AMIRON"'"],
  "custom_amenities":[{"name":"Rana Palace Architecture"},{"name":"Art Gallery"},{"name":"Courtyard Garden"},{"name":"Fine Dining Restaurant"},{"name":"Boutique Shop"},{"name":"Cultural Tours"},{"name":"Cooking Classes"},{"name":"Rooftop Bar"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P27/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"14:00","check_out_time":"11:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P27/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#B45309"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P27/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

# Property 28: Lumbini Peace Palace Hotel
echo "Creating Lumbini Peace Palace Hotel..."
P28=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Lumbini Peace Palace Hotel","type":"HOTEL",
  "description":"A serene hotel at the birthplace of Lord Buddha with meditation gardens, a Buddhist library and a vegetarian restaurant. Comfortable rooms with Lumbini Garden views, bicycle rentals for exploring the Sacred Garden and a multi-faith prayer hall.",
  "total_rooms":35,"number_of_floors":3,"year_built":2012,
  "phone_number":"0715201234","email":"peace@lumbinipalace.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P28"

curl -s -X POST "$BASE/properties/$P28/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Lumbini","city":"Lumbini","zip_code":"32900",
  "address":"Sacred Garden, Lumbini 32900, Nepal",
  "latitude":"27.4833","longitude":"83.2764"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P28/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMPARKING"'","'"$AMCOFFEE"'","'"$AMTV"'","'"$AMFRIDGE"'","'"$AMPOOL"'"],
  "custom_amenities":[{"name":"Meditation Garden"},{"name":"Buddhist Library"},{"name":"Vegetarian Restaurant"},{"name":"Bicycle Rental"},{"name":"Prayer Hall"},{"name":"Lumbini Garden View"},{"name":"Yoga Classes"},{"name":"Cultural Workshops"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P28/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"14:00","check_out_time":"11:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P28/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#CA8A04"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P28/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

# Property 29: Bandipur Sky Resort
echo "Creating Bandipur Sky Resort..."
P29=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Bandipur Sky Resort","type":"RESORT",
  "description":"A hilltop resort in the preserved Newari town of Bandipur with panoramic views of the Marsyangdi River valley and the Annapurna range. Traditional stone architecture, a infinity pool overlooking the valley, candlelit dinners in the old bazaar square and guided cave explorations.",
  "total_rooms":18,"number_of_floors":3,"year_built":2017,
  "phone_number":"0664201234","email":"reservations@bandipursky.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P29"

curl -s -X POST "$BASE/properties/$P29/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Gandaki","city":"Bandipur","zip_code":"33700",
  "address":"Bandipur Bazaar, Tanahu, Nepal",
  "latitude":"27.9356","longitude":"84.4108"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P29/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMPARKING"'","'"$AMPOOL"'","'"$AMCOFFEE"'","'"$AMTV"'","'"$AMSAFE"'","'"$AMTOILETRIES"'"],
  "custom_amenities":[{"name":"Valley View Pool"},{"name":"Cave Tours"},{"name":"Newari Architecture"},{"name":"Candlelit Dinners"},{"name":"Hiking Trails"},{"name":"Photography Tours"},{"name":"Cultural Immersion"},{"name":"Sunset Point"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P29/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"14:00","check_out_time":"11:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P29/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#7E22CE"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P29/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

# Property 30: Chitwan Elephant Camp
echo "Creating Chitwan Elephant Camp..."
P30=$(curl -s -X POST "$BASE/properties/general-information" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "name":"Chitwan Elephant Camp","type":"RESORT",
  "description":"An ethical elephant conservation camp and resort at the edge of Chitwan National Park. Watch elephants in their natural habitat, learn about conservation efforts, enjoy jungle safaris and Tharu cultural programs. Eco-friendly bamboo cottages with jungle views.",
  "total_rooms":15,"number_of_floors":2,"year_built":2019,
  "phone_number":"0565801234","email":"stay@chitwanelephantcamp.com"
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "  Created: $P30"

curl -s -X POST "$BASE/properties/$P30/create-location" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "country":"Nepal","state":"Lumbini","city":"Chitwan","zip_code":"44600",
  "address":"Sauraha Road, Chitwan, Nepal",
  "latitude":"27.5840","longitude":"84.4950"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P30/create-photos-and-amenities" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "amenities":{"system_amenity_ids":["'"$AMWIFI"'","'"$AMPARKING"'","'"$AMCOFFEE"'","'"$AMTV"'","'"$AMFRIDGE"'"],
  "custom_amenities":[{"name":"Elephant Conservation"},{"name":"Jungle Safari"},{"name":"Tharu Cultural Show"},{"name":"Canoe Ride"},{"name":"Bird Watching"},{"name":"Nature Walk"},{"name":"Riverside Campfire"},{"name":"Organic Farm"}]}
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P30/create-localization" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "currency":"NPR","timezone":"Asia/Kathmandu","language":"English",
  "check_in_time":"13:00","check_out_time":"11:00"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P30/create-brand-visual" -H "$AUTH" -H "Content-Type: application/json" -d '{
  "brand_color":"#15803D"
}' > /dev/null
sleep 1

curl -s -X POST "$BASE/properties/$P30/toggle-property-activation" -H "$AUTH" > /dev/null
sleep 1

echo "=== PHASE 2 COMPLETE ==="

echo ""
echo "=== PHASE 3: Creating room types, bed types, and rooms for ALL properties ==="

# Get all property IDs
ALL_PROPS=$(curl -s "$BASE/properties/?skip=0&limit=50" -H "$AUTH" | python3 -c "
import sys,json
data = json.load(sys.stdin)['data']['properties']
for p in data:
    print(p['id'] + '|' + p['name'] + '|' + str(p.get('total_rooms',1)))
")

while IFS='|' read -r PID PNAME TROOMS; do
  echo "Setting up rooms for: $PNAME ($PID)..."
  
  # Create room types
  RT_DELUXE=$(curl -s -X POST "$BASE/properties/$PID/rooms/room-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"room_type_name":"Deluxe"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  RT_STANDARD=$(curl -s -X POST "$BASE/properties/$PID/rooms/room-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"room_type_name":"Standard"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  RT_SUITE=$(curl -s -X POST "$BASE/properties/$PID/rooms/room-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"room_type_name":"Suite"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  RT_SUPERIOR=$(curl -s -X POST "$BASE/properties/$PID/rooms/room-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"room_type_name":"Superior"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  RT_FAMILY=$(curl -s -X POST "$BASE/properties/$PID/rooms/room-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"room_type_name":"Family"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  RT_ECONOMY=$(curl -s -X POST "$BASE/properties/$PID/rooms/room-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"room_type_name":"Economy"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  
  # Create bed types
  BT_KING=$(curl -s -X POST "$BASE/properties/$PID/rooms/bed-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"bed_name":"King"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  BT_QUEEN=$(curl -s -X POST "$BASE/properties/$PID/rooms/bed-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"bed_name":"Queen"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  BT_TWIN=$(curl -s -X POST "$BASE/properties/$PID/rooms/bed-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"bed_name":"Twin"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  BT_SINGLE=$(curl -s -X POST "$BASE/properties/$PID/rooms/bed-type" -H "$AUTH" -H "Content-Type: application/json" -d '{"bed_name":"Single"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
  
  sleep 1
  
  # Build rooms array based on total rooms (create up to 10 per property for bulk)
  ROOM_COUNT=${TROOMS:-8}
  if [ "$ROOM_COUNT" -gt 10 ]; then ROOM_COUNT=10; fi
  
  ROOMS_JSON="["
  for i in $(seq 1 $ROOM_COUNT); do
    FLOOR=$(( (i - 1) / 4 ))
    # Pick room type and bed type based on room number
    case $((i % 6)) in
      0) RT="$RT_DELUXE"; BT="$BT_KING"; RATE="120"; ADULTS=2; CHILDREN=1 ;;
      1) RT="$RT_STANDARD"; BT="$BT_QUEEN"; RATE="80"; ADULTS=2; CHILDREN=0 ;;
      2) RT="$RT_SUITE"; BT="$BT_KING"; RATE="200"; ADULTS=3; CHILDREN=2 ;;
      3) RT="$RT_SUPERIOR"; BT="$BT_TWIN"; RATE="95"; ADULTS=2; CHILDREN=1 ;;
      4) RT="$RT_FAMILY"; BT="$BT_QUEEN"; RATE="150"; ADULTS=4; CHILDREN=2 ;;
      5) RT="$RT_ECONOMY"; BT="$BT_SINGLE"; RATE="55"; ADULTS=1; CHILDREN=0 ;;
    esac
    
    # Use first available room type if some failed
    if [ -z "$RT" ]; then RT="$RT_DELUXE"; fi
    if [ -z "$RT" ]; then RT="$RT_STANDARD"; fi
    if [ -z "$BT" ]; then BT="$BT_KING"; fi
    if [ -z "$BT" ]; then BT="$BT_QUEEN"; fi
    
    CANCEL_POLICY="FLEXIBLE"
    case $((i % 3)) in
      0) CANCEL_POLICY="FLEXIBLE" ;;
      1) CANCEL_POLICY="MODERATE" ;;
      2) CANCEL_POLICY="STRICT" ;;
    esac
    
    ROOMS_JSON+="{
      \"floor_number\":$FLOOR,
      \"room_name\":\"Room $i\",
      \"room_type_id\":\"$RT\",
      \"bed_type_id\":\"$BT\",
      \"max_adults\":$ADULTS,
      \"max_children\":$CHILDREN,
      \"base_rate\":$RATE,
      \"status\":\"AVAILABLE\",
      \"cancellation_policy\":\"$CANCEL_POLICY\",
      \"cancellation_title\":\"Free cancellation up to 48 hours before check-in\",
      \"cancellation_description\":\"Full refund if cancelled at least 48 hours before check-in. 50% refund for cancellations within 48 hours. No refund for no-shows.\"
    }"
    if [ "$i" -lt "$ROOM_COUNT" ]; then
      ROOMS_JSON+=","
    fi
  done
  ROOMS_JSON+="]"
  
  curl -s -X POST "$BASE/properties/$PID/rooms" -H "$AUTH" -H "Content-Type: application/json" -d "{\"rooms\":$ROOMS_JSON}" > /dev/null
  sleep 1
  
done <<< "$ALL_PROPS"

echo "=== PHASE 3 COMPLETE ==="

echo ""
echo "=== PHASE 4: Adding discount codes and special offers ==="

# Discount codes for each property
while IFS='|' read -r PID PNAME TROOMS; do
  echo "Adding discounts/offers to: $PNAME..."
  
  curl -s -X POST "$BASE/properties/$PID/discount-codes/" -H "$AUTH" -H "Content-Type: application/json" -d '{
    "code":"EARLY20","type":"PERCENTAGE","discount_value":20,
    "min_amount":100,"max_uses":50,
    "valid_from":"2026-01-01","valid_to":"2026-12-31"
  }' > /dev/null
  
  curl -s -X POST "$BASE/properties/$PID/discount-codes/" -H "$AUTH" -H "Content-Type: application/json" -d '{
    "code":"LONGSTAY","type":"PERCENTAGE","discount_value":15,
    "min_amount":200,"max_uses":30,
    "valid_from":"2026-01-01","valid_to":"2026-12-31"
  }' > /dev/null
  
  curl -s -X POST "$BASE/properties/$PID/discount-codes/" -H "$AUTH" -H "Content-Type: application/json" -d '{
    "code":"WELCOME","type":"FIXED","discount_value":25,
    "min_amount":50,"max_uses":100,
    "valid_from":"2026-01-01","valid_to":"2026-12-31"
  }' > /dev/null
  
  curl -s -X POST "$BASE/properties/$PID/special-offers/" -H "$AUTH" -H "Content-Type: application/json" -d '{
    "offers":[
      {"title":"Early Bird Special","description":"Book 30 days in advance and save 20% on your stay.","discount_percentage":20,"start_date":"2026-01-01","end_date":"2026-12-31","is_active":true},
      {"title":"Long Stay Discount","description":"Stay 5 nights or more and enjoy 15% off the total bill.","discount_percentage":15,"start_date":"2026-01-01","end_date":"2026-12-31","is_active":true},
      {"title":"Weekend Getaway","description":"Book Friday-Sunday and get a complimentary breakfast for two.","discount_percentage":10,"start_date":"2026-01-01","end_date":"2026-12-31","is_active":true},
      {"title":"Honeymoon Package","description":"Special romantic package with room upgrade, champagne and dinner for two.","discount_percentage":25,"start_date":"2026-02-14","end_date":"2026-12-31","is_active":true},
      {"title":"Festival Season Offer","description":"Celebrate Dashain and Tihar with 30% off on select rooms.","discount_percentage":30,"start_date":"2026-10-01","end_date":"2026-11-15","is_active":true}
    ]
  }' > /dev/null
  
  sleep 1
done <<< "$ALL_PROPS"

echo "=== PHASE 4 COMPLETE ==="

echo ""
echo "=== PHASE 5: Adding staff to all properties ==="

# Staff data arrays
STAFF_NAMES=("Ram Sharma" "Sita Thapa" "Hari Gurung" "Maya Magar" "Krishna Rai" "Gita Shrestha" "Bikash Tamang" "Anita Limbu" "Raj Poudel" "Sunita Karki")
STAFF_EMAILS=("ram.sharma@staff.com" "sita.thapa@staff.com" "hari.gurung@staff.com" "maya.magar@staff.com" "krishna.rai@staff.com" "gita.shrestha@staff.com" "bikash.tamang@staff.com" "anita.limbu@staff.com" "raj.poudel@staff.com" "sunita.karki@staff.com")
STAFF_PHONES=("9801000001" "9801000002" "9801000003" "9801000004" "9801000005" "9801000006" "9801000007" "9801000008" "9801000009" "9801000010")
ROLES=("MANAGER" "FRONT_DESK" "HOUSEKEEPING" "WAITER" "KITCHEN" "MANAGER" "FRONT_DESK" "HOUSEKEEPING" "WAITER" "KITCHEN")
SALARIES=(35000 20000 18000 15000 18000 35000 20000 18000 15000 18000)

while IFS='|' read -r PID PNAME TROOMS; do
  echo "Adding staff to: $PNAME..."
  for i in $(seq 0 9); do
    curl -s -X POST "$BASE/properties/$PID/staffs" -H "$AUTH" -H "Content-Type: application/json" -d "{
      \"full_name\":\"${STAFF_NAMES[$i]}\",
      \"email\":\"${STAFF_EMAILS[$i]}\",
      \"phone_number\":\"${STAFF_PHONES[$i]}\",
      \"job_role\":\"${ROLES[$i]}\",
      \"monthly_salary\":${SALARIES[$i]},
      \"joining_date\":\"2024-01-15\",
      \"status\":\"ACTIVE\"
    }" > /dev/null
  done
  sleep 1
done <<< "$ALL_PROPS"

echo "=== PHASE 5 COMPLETE ==="

echo ""
echo "=== SEED COMPLETE ==="
echo "Total properties: $(echo "$ALL_PROPS" | wc -l | tr -d ' ')"
echo "Each property has: location, amenities, brand, rooms (10), room types (6), bed types (4), discount codes (3), special offers (5), staff (10)"
