import psycopg2
import pandas as pd
import requests
import json
from math import ceil
from supabase import create_client, Client

# connect to local postgreSQL
local_conn = psycopg2.connect(
  host="localhost",
  dbname="travel_db",
  user="postgres",
  password="1q2w",
  port=5432
)

# access to data
query = "SELECT * FROM cities;"
df = pd.read_sql(query, local_conn)

# Supabase setting
SUPABASE_URL = "https://mjhywdfikuoqntjcfnjs.supabase.co"
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaHl3ZGZpa3VvcW50amNmbmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MDA4MTMsImV4cCI6MjA2ODk3NjgxM30.YCw6ia3dOJgbOhJJautHCqeRrvrzM-EZsAnMJa_3f9U"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
TABLE_NAME = "cities"

# login information of supabase
user = supabase.auth.sign_in_with_password({
  "email": "amelia.huang395@gmail.com",
  "password": "Cj;6ru/4tjp60321"
})

access_token = user.session.access_token
user_id = user.session.user.id

# header setting
headers = {
  "apikey": SUPABASE_API_KEY,
  "Authorization": f"Bearer {access_token}",
  "Content-Type": "application/json",
  "Prefer": "return=minimal" # Don't need to return data
}

# Add user_id to dataframe
df["user_id"] = user_id

# transfer dataframe to list of dicts
data_list = df.to_dict(orient="records")

# insert 500 data at once
chunk_size = 500
for i in range(ceil(len(data_list) / chunk_size)):
  chunk = data_list[i * chunk_size : (i+1) * chunk_size]
  response = requests.post(
    f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}",
    headers=headers,
    json=chunk
  )
  # chect the result
  if response.status_code in [200, 201, 204]:
    print(f"✅ Inserted chunk {i}")
  else:
    print(f"⚠️ Failed to insert chunk {i}: {response.text}")