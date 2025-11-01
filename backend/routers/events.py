from fastapi import APIRouter
import requests
import json
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta, time as dtime
from geopy.distance import geodesic
import time as time
from math import radians, sin, cos, sqrt, atan2, degrees
import itertools

class EventRequest(BaseModel):
  city: str
  start_date: str
  end_date: str

load_dotenv() # read .env

router = APIRouter(prefix="/api/events", tags=["Events"])

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

taipei_events_api = "https://www.travel.taipei/api/json/data/2025-eventCalendar_zh-tw.json"
country = "Taiwan"
city = "Taipei"

format_data = []

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
google_maps_place_nearby_api = "https://places.googleapis.com/v1/places:searchNearby"
google_maps_place_text_api = "https://places.googleapis.com/v1/places:searchText"

weekly_slots = {
    "Monday": {"AM": [], "PM": []},
    "Tuesday": {"AM": [], "PM": []},
    "Wednesday": {"AM": [], "PM": []},
    "Thursday": {"AM": [], "PM": []},
    "Friday": {"AM": [], "PM": []},
    "Saturday": {"AM": [], "PM": []},
    "Sunday": {"AM": [], "PM": []},
}

def get_taipei_event():
  table = dynamodb.Table("events")
  
  headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0"
  }
  response = requests.get(taipei_events_api, headers=headers)
  data = response.json()
  
  for event in data["data"]:
    item = {
      "country": country,
      "city": city,
      "id": event["id"],
      "img": event["cover"],
      "title": event["title"],
      "address": f"{event["county"]}{event["town"]}{event["address"]}",
      # boto3 asks for Decimal type to store number, not float type of python
      "lat": Decimal(str(event["lat"])),
      "lng": Decimal(str(event["lng"])),
      "start_date": event["date_begin"],
      "end_date": event["date_end"]
    }
    format_data.append(item)
    table.put_item(Item=item)

# check event data
# '*' in front of a parameter means it accepts any number of arguments
def get_nested_value(data, *keys, default=None):
  for key in keys:
    # isinstance checks if data is a dictionary
    if isinstance(data, dict) and key in data:
      data = data[key]
    else:
      return default
  return data

def has_event(day):
  return any(item["type"] == "event" for item in day["data"])

def decimal_to_float(obj):
  if isinstance(obj, Decimal):
    return float(obj)
  raise TypeError

# ---------- events data by city & datetime ----------
def fetch_events(city, start_date, end_date, trip_duration, trip_events):
  # query events from DynamoDB
  table = dynamodb.Table("events")
  response = table.query(
    KeyConditionExpression=Key("city").eq(city) & Key("start_date").lt(end_date),
    FilterExpression=Attr("end_date").gte(start_date)
  )
  events = response.get("Items", [])
  
  # count the number of event recommendation
  if trip_duration <= 2:
    recommend_num = 1
  else:
    if trip_duration % 2 == 0:
      recommend_num = trip_duration // 2 - 1
    else:
      recommend_num = trip_duration // 2
  # set recommend events & other events
  recommends = random.sample(events, recommend_num)
  recommends = sorted(recommends, key=lambda x: x.get("end_date", "9999-12-31"))
  others = [e for e in events if e not in recommends]
  others = sorted(others, key=lambda x: x.get("end_date", "9999-12-31"))
  
  recommend_result = []
  others_result = []
  
  i = 0
  while i < len(recommends):
    event_r = recommends[i]
    
    # event info
    event_info_r = {
      "id": get_nested_value(event_r, "id"),
      "img": get_nested_value(event_r,"img"),
      "title": get_nested_value(event_r, "title"),
      "start_date": f"{get_nested_value(event_r, 'start_date')}",
      "end_date": f"{get_nested_value(event_r, "end_date")}",
      "address": get_nested_value(event_r, "address"),
      "location": {
        "latitude": decimal_to_float(get_nested_value(event_r, "lat")),
        "longitude": decimal_to_float(get_nested_value(event_r, "lng"))
        
      }
    }
    
    # pick up one date for the event
    event_start = datetime.strptime(event_r["start_date"], "%Y-%m-%d")
    event_end = datetime.strptime(event_r["end_date"], "%Y-%m-%d")
    candidate_days = [
      d for d in trip_events
      if (
        datetime.strptime(d["date"], "%Y-%m-%d") >= event_start
        and datetime.strptime(d["date"], "%Y-%m-%d") <= event_end
        and sum(1 for item in d["data"] if item["type"] == "event") < 2
      )
    ]
    # if no availabel days
    if len(candidate_days) < 1:
      print(f"Remove event {event_r["title"]}")
      recommends.pop(i) # remove the event
      # find another event in others
      replacements = [e for e in others if e["end_date"] > event_r["end_date"]]
      if replacements:
        new_event = random.choice(replacements)
        print(f"Add replacement event {new_event["title"]}")
        recommends.append(new_event)
        others.remove(new_event)
      else:
        continue # if no events can be picked up, skip this round
    # find any days that haven't had any events
    no_event_days = [d for d in candidate_days if not has_event(d)]
    # chosen_day priority: no event day -> already has one event day
    if len(no_event_days) > 1:
      chosen_day = random.choice(no_event_days)
    elif len(no_event_days) == 1:
      chosen_day = no_event_days[0]
    else:
      chosen_day = random.choice(candidate_days)
    
    # put the event into chosen day's data
    chosen_day["data"].append({
      "type": "event",
      "value": event_info_r
    })
    
    recommend_result.append(event_info_r)
    i += 1
  
  return trip_events

# ---------- recommend schedule ----------
@router.post("/query")
def recommend_schedule(req: EventRequest):
  
  try:
    city = req.city
    start_date = req.start_date
    end_date = req.end_date
    format_start_date = datetime.strptime(start_date, "%Y-%m-%d")
    format_end_date = datetime.strptime(end_date, "%Y-%m-%d")
    trip_duration = (format_end_date - format_start_date).days + 1
    trip_events = [
      {
        "date": (format_start_date + timedelta(days=i)).strftime("%Y-%m-%d"),
        "weekday": (format_start_date + timedelta(days=i)).strftime("%A"),
        "data": []
      }
      for i in range(trip_duration)
    ]
    
    # insert events
    trip_events = fetch_events(city, start_date, end_date, trip_duration, trip_events)
    
    # insert attractions
    ## whole city attractions
    no_event_days_count = sum(
      1 for day in trip_events
      if sum(1 for item in day["data"] if item["type"] == "event") == 0
    )
    
    weekly_city_attractions = get_weekly_attractions(city, no_event_days_count)
    exist_attractions_ids = []
    for day in trip_events:
      # non-events day: add two city attractions & restaurants nearby eanch attractions
      if sum(1 for item in day["data"] if item["type"] == "event") == 0:
        rec_attraction_pair, weekly_city_attractions = find_daily_pairs(day["weekday"], weekly_city_attractions)
        day["data"].extend([
          {"type": "attraction", "value": attraction}
          for attraction in rec_attraction_pair
        ])
        exist_attractions_ids.extend(
          attraction["id"] for attraction in rec_attraction_pair
        )
      
      # the day has one event: add one nearby attraction
      elif sum(1 for item in day["data"] if item["type"] == "event") == 1:
        event = [item for item in day["data"] if item["type"] == "event"][0]["value"]
        nearby_attraction = get_nearby_attraction(event["location"]["latitude"], event["location"]["longitude"], exist_attractions_ids)
        day["data"].insert(0, {
          "type": "attraction",
          "value": nearby_attraction
        })
        exist_attractions_ids.append(nearby_attraction["id"])
    
    # insesrt restaurants
    exist_restaurant_ids = []
    dist = 800
    for day in trip_events:
      insert_restaurants = []
      weekday = day["weekday"]
      for i, item in enumerate(day["data"]):
        if item["type"] in ["event", "attraction"]:
          lat = item["value"]["location"]["latitude"]
          lng = item["value"]["location"]["longitude"]
          meal = "lunch" if i == 0 else "dinner"
          restaurants = get_recommend_restaurant(lat, lng, weekday, meal, exist_restaurant_ids)
          rec_restaurant = random.choice(restaurants)
          insert_restaurants.append((i + 1, {
            "type": "restaurant",
            "value": rec_restaurant
          }))
          exist_restaurant_ids.append(rec_restaurant["id"])
      
      for index, restaurant_item in reversed(insert_restaurants):
        day["data"].insert(index, restaurant_item)
    
    # insert residence
    init_idx = 0
    for idx, accommodation in choose_accommodation_partition(trip_events, trip_duration):
      for i in range(init_idx, init_idx + idx):
        trip_events[i]["data"].append({
          "type": "accommodation",
          "value": accommodation
        })
      init_idx += idx
        
    print("Fianl trip:", trip_events)
  
  except KeyError as e:
    print(f"Missing key in request: {e}")
  
  except Exception as e:
    print(f"Error querying DynamoDB events: {e}")

# ---------- included types for google maps api ----------
def get_included_types(main_categories, sub_category=None):
  table = dynamodb.Table("google_map_includedTypes")
  
  all_types = []
  try:
    for mc in main_categories:
      query_params = {
        "KeyConditionExpression": Key("main_category").eq(mc),
        "FilterExpression": Attr("used").eq(True),
        "ProjectionExpression": "sub_type"
      }
      
      # check if sub_category is passed
      if sub_category:
        query_params["FilterExpression"] = Attr("used").eq(True) & Attr("sub_category").eq(sub_category)
      
      # ** is unpacking syntax. Used to convert key-value in a dictionary to keyword arguments of a function
      response = table.query(**query_params)
      items = response.get("Items", [])
      result = [item["sub_type"] for item in items]
      all_types.extend(result)

    return all_types
  
  except KeyError as e:
    print(f"Missing key in request: {e}")
  
  except Exception as e:
    print(f"Error querying DynamoDB events: {e}")

# ---------- parse time string to datetime.time ----------
def parse_time(time_str, ref_str=None):
  time_str = time_str.strip()
  
  if 'AM' in time_str or 'PM' in time_str:
    return datetime.strptime(time_str, "%I:%M %p").time()
  elif ref_str:
    # add the same AM/PM as ref_str
    if 'AM' in ref_str:
      time_str += ' AM'
    elif 'PM' in ref_str:
      time_str += ' PM'
    return datetime.strptime(time_str, "%I:%M %p").time()
  else:
    # no ref_str
    return datetime.strptime(time_str, "%H:%M").time()

# ---------- add attractions to weekly_slots ----------
def add_to_am_pm_slots(attraction, weekly_slots):
  # attraction does have regularOpeningHours information considered as open 24/7
  if "regularOpeningHours" not in attraction:
    for day in weekly_slots:
      for slot in ["AM", "PM"]:
        weekly_slots[day][slot].append(attraction)
    return
  
  hours = attraction["regularOpeningHours"]["weekdayDescriptions"]
  
  for day_periods in hours:
    day = day_periods.split(": ", 1)[0].strip()
    periods = day_periods.split(": ", 1)[1]
    
    # open 24 hours
    if "24 hours" in periods:
      weekly_slots[day]["AM"].append(attraction)
      weekly_slots[day]["PM"].append(attraction)
      continue
    
    periods = periods.replace('\u2009', ' ').replace('\u202f', ' ').replace('–', '-')
    for period in periods.split(","):
      if '-' not in period:
        continue
      start_str, end_str = period.split('-')
      opening_start = parse_time(start_str, end_str)
      opening_end = parse_time(end_str)
      
      # open before 11:00AM regards as AM
      if opening_start < dtime(11, 0):
        weekly_slots[day]["AM"].append(attraction)
      # close after 4:00PM regards as PM
      if opening_end > dtime(16, 0):
        weekly_slots[day]["PM"].append(attraction)

# --- fetch attractions of the city from google maps api ---
def get_city_attractions(city, no_event_days_count):
  
  # headers
  fileds = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.regularOpeningHours",
    "nextPageToken"
  ]
  headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
    "X-Goog-FieldMask": ",".join(fileds)
  }
  
  # body
  body = {
    "textQuery": f"{city} tourist attraction"
  }
  
  # call the nearby api
  response = requests.post(
    google_maps_place_text_api,
    headers=headers,
    json=body
  ).json()
  
  data = response.get("places", [])
  
  # filter the attractions that have specific words
  filtered_data = [
    place for place in data
    if "Meeting Point" not in place["displayName"]["text"]
  ]
  
  next_page_token = response.get("nextPageToken")
  
  # get more attractions if filtered_data is not enough
  while len(filtered_data) < no_event_days_count * 2 and next_page_token:
    time.sleep(2)
    
    next_page_body = {
      "textQuery": f"{city} tourist attraction",
      "pageToken": next_page_token
    }
    
    next_page_res = requests.post(
      google_maps_place_text_api,
      headers=headers,
      json=next_page_body
    ).json()
    
    data.extend(next_page_res.get("places", []))
    
    filtered_data = [
      place for place in data
      if "Meeting Point" not in place["displayName"]["text"]
    ]
    
    next_page_token = next_page_res.get("nextPageToken")

  return filtered_data

# ---------- generate attrations list by weekdays ----------
def get_weekly_attractions(city, no_event_days_count):
  attractions = get_city_attractions(city, no_event_days_count)
  
  weekly_slots = {
    day: {"AM": [], "PM": []} 
    for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  }
  
  # categorize attractions by operating time
  for a in attractions:
    add_to_am_pm_slots(a, weekly_slots)
  
  return weekly_slots

# ---------- pair up the city attractions ----------
def find_daily_pairs(tardet_day, weekly_slots, max_distance_km=5):
  day_attractions = weekly_slots[tardet_day]
  am_attractions = day_attractions["AM"]
  pm_attractions = day_attractions["PM"]
  
  if not am_attractions:
    print("Nothing in AM!")
    return
  elif not pm_attractions:
    print("Nothing in PM!")
    return
  
  best_pair = None
  min_dist = float("inf")
  
  for am in am_attractions:
    for pm in pm_attractions:
      dist = geodesic(
        (am["location"]["latitude"], am["location"]["longitude"]),
        (pm["location"]["latitude"], pm["location"]["longitude"])
      ).km
      if dist < min_dist and dist <= max_distance_km:
        min_dist = dist
        best_pair = (am, pm)
  
  if best_pair:
    # remove chosen attractions
    for day, _ in weekly_slots.items():
      for slot in ["AM", "PM"]:
        for a in best_pair:
          weekly_slots[day][slot] = [
            x for x in weekly_slots[day][slot] if x["id"] != a["id"]
          ]
        
    return best_pair, weekly_slots
  else:
    print("Cannot find the best pair!")

# ---------- find nearby attractions ----------
def get_nearby_attraction(lat, lng, exist_ids):
  
  # headers
  fileds = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.regularOpeningHours"
  ]
  headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
    "X-Goog-FieldMask": ",".join(fileds)
  }
  
  # body
  main_category = ["Culture", "Entertainment and Recreation", "Natural Features", "Shopping", "Sports"]
  includedTypes = get_included_types(main_category)
  body = {
    "includedTypes": includedTypes,
    "maxResultCount": 20,
    "locationRestriction": {
      "circle": {
        "center": {
          "latitude": lat,
          "longitude": lng
        },
        "radius": 1000.0
      }
    }
  }
  
  # call the nearby api
  response = requests.post(
    google_maps_place_nearby_api,
    headers=headers,
    json=body
  )
  data = response.json().get("places", [])
  
  exist_ids = set(exist_ids)
  filtered_data = [
    attraction for attraction in data if "id" in attraction and attraction["id"] not in exist_ids
  ]
  
  return filtered_data[0]

# --- check if the restaurant is open during specific time period ---
def time_ranges_overlap(opening_start, opening_end, check_time_start, check_time_end):
  # transfer to datetime
  dt0 = datetime(2000, 1, 1) # any same date
  s_open = datetime.combine(dt0, opening_start)
  e_open = datetime.combine(dt0, opening_end)
  s_meal = datetime.combine(dt0, check_time_start)
  e_meal = datetime.combine(dt0, check_time_end)
  
  # deal with the opening time across midnight
  if e_open <= s_open:
    e_open += timedelta(days=1)
  if e_meal <= s_meal:
    e_meal += timedelta(days=1)
  
  latest_start = max(s_open, s_meal)
  earliest_end = min(e_open, e_meal)
  delta = (earliest_end - latest_start).total_seconds() / 3600
  return delta >= 1

# --- check if the restaurant is opend during the meal period ---
def is_open(opening_hours, check_time_start, check_time_end):
  opening_hours = opening_hours.replace('\u2009', ' ').replace('\u202f', ' ').replace('–', '-')
  for period in opening_hours.split(','):
    if '-' not in period:
      continue
    start_str, end_str = period.split('-')
    opening_start = parse_time(start_str, end_str)
    opening_end = parse_time(end_str)
    if time_ranges_overlap(opening_start, opening_end, check_time_start, check_time_end):
      return True
  return False

# ---------- find nearby restaurants ----------
def get_nearby_restaurants(lat, lng, dist):
  
  # headers
  fileds = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.regularOpeningHours"
  ]
  headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
    "X-Goog-FieldMask": ",".join(fileds)
  }
  
  # body
  main_categories = ["Food and Drink"]
  sub_category = "restaurant"
  includedTypes = get_included_types(main_categories, sub_category)
  body = {
    "includedTypes": includedTypes,
    "maxResultCount": 20,
    "locationRestriction": {
      "circle": {
        "center": {
          "latitude": lat,
          "longitude": lng
        },
        "radius": dist
      }
    }
  }
  
  # call the nearby api
  response = requests.post(
    google_maps_place_nearby_api,
    headers=headers,
    json=body
  )
  data = response.json().get("places", [])
  return data

# ---------- find nearby restaurants ----------
def get_recommend_restaurant(lat, lng, weekday, meal, exist_restaurant_ids):
  filtered_restaurants = []
  max_dist = 2000.0
  dist = 800.0
  while len(filtered_restaurants) < 1 and dist <= max_dist:
    restaurants = get_nearby_restaurants(lat, lng, dist)
    
    meal_time = {
      "lunch": [dtime(11, 0), dtime(14, )],
      "dinner": [dtime(17, 0), dtime(20, 0)]
    }
    meal_start = meal_time[meal][0]
    meal_end = meal_time[meal][1]
    
    for restaurant in restaurants:
      if "regularOpeningHours" not in restaurant:
        continue
      
      opening_hours = next((h for h in restaurant["regularOpeningHours"]["weekdayDescriptions"] if h.startswith(weekday)), None)
      if opening_hours:
        # remove weekday name
        opening_hours = opening_hours.split(": ", 1)[1]
      
      # check if the restaurant is open
      if opening_hours == "Open 24 hours":
        filtered_restaurants.append(restaurant)
      elif is_open(opening_hours, meal_start, meal_end):
        filtered_restaurants.append(restaurant)
    
    filtered_restaurants = [
      restaurant for restaurant in filtered_restaurants
      if "id" in restaurant and restaurant["id"] not in exist_restaurant_ids and "月子餐" not in restaurant["displayName"]["text"]
    ]
    
    if len(filtered_restaurants) < 1:
      dist += 200.0
  
  if not filtered_restaurants:
    print(f"No restaurants found near {lat},{lng} for {meal} on {weekday}")
    return []

  return filtered_restaurants

# ---------- helper: haversine ----------
def haversine_km(lat1, lon1, lat2, lon2):
  """Return distance in kilometers between two lat/lon"""
  R = 6371.0
  phi1, phi2 = radians(lat1), radians(lat2)
  dphi = radians(lat2 - lat1)
  dlambda = radians(lon2 - lon1)
  a = sin(dphi/2)**2 + cos(phi1)*cos(phi2)*sin(dlambda/2)**2
  return 2 * R * atan2(sqrt(a), sqrt(1 - a))

# --- generate how many nights for one accommodation ---
def compositions_with_min(n, k, min_value=2):
  if k == 1:
    if n >= min_value:
      yield [n]
    return
  # allocate at least min_value to each slot
  n_remaining = n - min_value * k
  if n_remaining < 0:
    return
  # generate nonnegative compositions of n_remaining into k parts, then add min_value
  # Use stars-and-bars via recursive
  def _rec(remaining, parts_left):
    if parts_left == 1:
      yield [remaining]
      return
    for i in range(remaining + 1):
      for rest in _rec(remaining - i, parts_left - 1):
        yield [i] + rest
  
  for base in _rec(n_remaining, k):
    yield [x + min_value for x in base]

# ---------- map a stay (start_day, nights) -> points to evaluate ----------
def gather_points_for_stay(trip_events, trip_duration, start_day_idx, nights):
  """
  For a stay starting at day index start_day_idx (0-based), with length 'nights' nights,
  collect representative points:
    - day start_day_idx: last point (the day's last activity before staying)
    - days in middle: for each, include first and last if exist
    - day start_day_idx + nights: include first point (the next morning's first activity)
  Returns list of (lat, lng) tuples.
  """
  points = []
  start = start_day_idx
  end_day = start_day_idx + nights
  # day start: last point
  if 0 <= start < trip_duration and trip_events[start]["data"]:
    item = trip_events[start]["data"][-1]
    loc = item.get("value", {}).get("location")
    if loc and "latitude" in loc and "longitude" in loc:
      points.append((loc["latitude"], loc["longitude"]))
  # middle days
  for d in range(start + 1, start + nights):
    if 0 <= d < trip_duration and trip_events[d]["data"]:
      # first
      item_f = trip_events[d]["data"][0]
      loc_f = item_f.get("value", {}).get("location")
      if loc_f and "latitude" in loc_f and "longitude" in loc_f:
        points.append((loc_f["latitude"], loc_f["longitude"]))
  # end day's first point
  if 0 <= end_day < trip_duration and trip_events[end_day]["data"]:
    item = trip_events[end_day]["data"][0]
    loc = item.get("value", {}).get("location")
    if loc_f and "latitude" in loc and "longitude" in loc:
      points.append((loc["latitude"], loc["longitude"]))
      
  return points

# ---------- dispersion metric ----------
def average_pairwise_distance_km(points):
  """Average pairwise haversine distance (km). If < 2 points, return large numver (treated as bad)"""
  if len(points) < 2:
    return float("inf")
  dists = []
  for (a, b) in itertools.combinations(points, 2):
    dists.append(haversine_km(a[0], a[1], b[0], b[1]))
    return sum(dists) / len(dists)

def get_geographic_center(points):
  x = y = z = 0.0
  for lat, lng in points:
    lat_rad = radians(lat)
    lng_rad = radians(lng)
    x += cos(lat_rad) * cos(lng_rad)
    y += cos(lat_rad) * sin(lng_rad)
    z += sin(lat_rad)
  
  n = len(points)
  x /= n
  y /= n
  z /= n
  
  center_lng = degrees(atan2(y, x))
  center_lat = degrees(atan2(z, sqrt(x * x + y * y)))
  return (center_lat, center_lng)

# ---------- find nearby residence ----------
def get_nearby_accommodation(lat, lng, exist_accommodations_ids):
  
  # headers
  fileds = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location"
  ]
  headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": "AIzaSyD7ze2EIwiG5b2rqhfQksBWGproKoTd7T8",
    "X-Goog-FieldMask": ",".join(fileds)
  }
  
  # body
  includedTypes = get_included_types(["Lodging"])
  body = {
    "includedTypes": includedTypes,
    "maxResultCount": 20,
    "locationRestriction": {
      "circle": {
        "center": {
          "latitude": lat,
          "longitude": lng
        },
        "radius": 2000.0
      }
    }
  }
  
  # call the api
  response = requests.post(
    google_maps_place_nearby_api,
    headers=headers,
    json=body
  )
  data = response.json().get("places", [])
  
  filtered_data = [
    accommodation for accommodation in data if "id" in accommodation and accommodation["id"] not in exist_accommodations_ids
  ]
  return filtered_data[0]

# ---------- main accommodation evaluator ----------
def choose_accommodation_partition(trip_events, trip_duration):
  # one day trip
  if trip_duration < 2:
    return None
  
  nights = trip_duration - 1
  k = max(1, trip_duration // 3) # number of accommodations
  # ensure we can partition nights into k parts each >= 2
  # list() automatically calls next() of a generator
  partitions = list(compositions_with_min(nights, k, min_value=2))
  if not partitions:
    partitions = list(compositions_with_min(nights, k, min_value=1))
  best = None
  best_score = float("inf")
  best_detail = None
  
  for part in partitions:
    # build stays: compute start_day for each stay
    stays = []
    cursor = 0
    valid = True
    detail = []
    total_score = 0.0
    for s in part:
      points = gather_points_for_stay(trip_events, trip_duration, cursor, s)
      score = average_pairwise_distance_km(points)
      total_score += score
      detail.append({
        "start_day_idx": cursor,
        "nights": s,
        "end_day_idx": cursor + s,
        "points_collected": points,
        "score": score
      })
      cursor += s # next stay starts the next day after last night
    # after building, cursor should equal nights
    if cursor != nights:
      # partition invalid for this days/nights mapping
      valid = False
    if not valid:
      continue
    if total_score < best_score:
      best_score = total_score
      best = part
      best_detail = detail
  
  rec_accommodations = []
  exist_accommodations_ids = []
  for detail in best_detail:
    center_lat, center_lng = get_geographic_center(detail["points_collected"])
    rec_accom = get_nearby_accommodation(center_lat, center_lng, exist_accommodations_ids)
    rec_accommodations.append(rec_accom)
    exist_accommodations_ids.append(rec_accom["id"])
  
  print(f"Accommodations: \n{list(zip(best, rec_accommodations))}\n")
  return list(zip(best, rec_accommodations))

if __name__ == "__main__":
  get_recommend_restaurant(25.1277518, 121.4700057, "Wednesday", "lunch", [])