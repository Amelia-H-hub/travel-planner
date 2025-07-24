import pandas as pd
import pycountry # use for convert country code to name
from backend.database import SessionLocal
from backend import models
from zoneinfo import ZoneInfo
from datetime import datetime
from decimal import Decimal, InvalidOperation

columns = [
  "geonameid", "name", "asciiname", "alternatenames",
  "latitude", "longitude", "feature_class", "feature_code",
  "country_code", "cc2", "admin1_code", "admin2_code",
  "admin3_code", "admin4_code", "population", "elevation",
  "dem", "timezone", "modification_date"
]

def country_code_to_name(code):
  try:
    country = pycountry.countries.get(alpha_2=code)
    return country.name if country else code
  except:
    return code

def get_utc_offset(timezone_str):
  try:
    now = datetime.now(ZoneInfo(timezone_str))
    # datetime.now(): gets current time
    # ZoneInfo(timezone_str): transfer timezone string to a timezone object
    # so now is the current time of passing timezone_str
    # Example: datetime.now(ZoneInfo("Asia/Taipei"))
      # The result might be like: 2025-07-17 23:25:00+08:00 
    offset = now.utcoffset()
    # .utcoffset(): calculate the time different between this itme and UTC
    # It returns a timedelta object, like: 8:00:00
    hours = int(offset.total_seconds() // 3600)
    return f"{hours:+d}"
    # +d: Add a sign for both positive and negative numbers
  except Exception as e:
    print(f"Invalid timezone: {timezone_str}, error: {e}")
    return None

df = pd.read_csv("../travel-planner_db/cities15000.txt", sep="\t", header=None, names=columns)
# python reads files from current working directory, not from current file
# sep="\t" means the columns in the file is separated by tab (.txt)
# names=columns helps us be able to operate the data frame by column name

admin1_df = pd.read_csv("../travel-planner_db/admin1CodesASCII.txt", sep="\t", header=None, names=["code", "admin1_name", "asciiname", "geonameid"])

df['country_name'] = df['country_code'].apply(country_code_to_name)

df['timezone_offset'] = df['timezone'].apply(get_utc_offset)

df['admin1_full_code'] = df['country_code'] + "." + df['admin1_code']
merge_df = df.merge(admin1_df, left_on="admin1_full_code", right_on="code", how="left")
df['admin1_name'] = merge_df["admin1_name"]

cities = df[['name', 'country_code', 'country_name', 'admin1_code', 'admin1_name', 'timezone', 'timezone_offset', 'latitude', 'longitude']]

# print(cities[cities['admin1_name'] == 'Escaldes-Engordany'][['admin1_name', 'latitude', 'longitude']])
# print(cities[cities['admin1_name'] == 'Escaldes-Engordany'].dtypes)


# def is_valid_decimal(val):
#     try:
#         Decimal(str(val))
#         return True
#     except (InvalidOperation, ValueError):
#         return False

# invalid_rows = cities[
#     ~cities['latitude'].apply(is_valid_decimal) |
#     ~cities['longitude'].apply(is_valid_decimal)
# ]

# print(invalid_rows)

try:
  db = SessionLocal()

  for _, row in cities.iterrows():
    city = models.City(
      name = str(row['name']),
      country_code = str(row['country_code']),
      country_name = str(row['country_name']),
      admin1_code = str(row['admin1_code']),
      admin1_name = str(row['admin1_name']),
      timezone = str(row['timezone']),
      timezone_offset = str(row['timezone_offset']),
      latitude = Decimal(str(row['latitude'])),
      longitude = Decimal(str(row['longitude'])),
    )
    db.add(city)

  db.commit()
except Exception as e:
  print("Error happened:", e)
finally:
  db.close()

# print(cities.head())