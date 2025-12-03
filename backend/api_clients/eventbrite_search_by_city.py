from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
import time
import requests
import boto3
import os
# from playwright.sync_api import sync_playwright

# Set AWS region
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")

# Create DynamoDB client
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table("eventbrite_events")

# def search_events_by_city(city: str):
#   try:
#     with sync_playwright() as p:
#       browser = p.chromium.launch(
#         headless=True,
#         args=["--no-sandbox", "--disable-dev-shm-usage"]
#       )
#       page = browser.new_page()
#       page.goto("https://www.eventbrite.com/", timeout=600000)
      
#       # fill in location
#       page.fill("#location-autocomplete", city)
#       time.sleep(0.2 * len(city))  # simulate typing delay
#       page.wait_for_timeout(2000)  # wait for the suggestions to load
#       page.click("#location-autocomplete-listbox li:first-child button")
#       page.wait_for_timeout(1000)
#       page.click('[data-testid="header-search"] button')
#       page.wait_for_timeout(3000)  # wait for the search results to load
      
#       # get event API request URL
#       api_requests_url = page.evaluate("""
#         () => window.performance.getEntriesByType('resource')
#           .filter(e => e.name.includes('/destination/events/'))[0].name;
#       """)
      
#       headers = {
#         "User-Agent": "Mozilla/5.0"
#       }
#       response = requests.get(
#         api_requests_url,
#         headers = headers
#       )
#       response.raise_for_status() # Throw an error for bad responses
#       data = response.json()
#       data["city"] = city  # add city to the data for saving to DynamoDB
#       browser.close()
#       return data
    
#   except Exception as e:
#     print(f"Error in search_events_by_city for {city}: {e}")
#     return {"error": str(e), "city": city}

def search_events_by_city(city: str):
  driver = None
  try:
    # selenium setup
    chrome_options = Options() # create a setting object for Chrome browser settings
    chrome_options.add_argument("--headless=new") # hide the browser window
    chrome_options.add_argument("--disable-gpu") # disable GPU hardware acceleration, make headless mode more stable
    chrome_options.add_argument("--no-sandbox") # bypass OS security model, required by some Linux OS
    chrome_options.add_argument("--single-process") # run in a single process, required by some Linux OS
    chrome_options.add_argument("--disable-dev-shm-usage") # overcome limited resource problems
    
    # Lambda writable directory
    chrome_options.add_argument("--user-data-dir=/tmp/chrome_user_data")
    chrome_options.add_argument("--data-path=/tmp/chrome_data")
    chrome_options.add_argument("--disk-cache-dir=/tmp/chrome_cache")
    
    # Judge the environment
    if os.getenv("AWS_EXECUTION_ENV"):
      # for AWS Lambda environment
      chrome_options.binary_location = "/opt/headless-chromium"
      chromedriver_path = "/opt/chromedriver"
    else:
      # for local environment
      from webdriver_manager.chrome import ChromeDriverManager
      chromedriver_path = ChromeDriverManager().install()
    
    # start selenium
    driver = webdriver.Chrome(
      service=Service(chromedriver_path),
      options=chrome_options
    )
    
    driver.get("https://www.eventbrite.com/")
    # wait for the page to load
    wait = WebDriverWait(driver, 15)

    # fill in location
    location_input = wait.until(
      EC.presence_of_element_located((By.ID, "location-autocomplete"))
    )
    for char in city:
      location_input.send_keys(char)
      time.sleep(0.2)
    # location_input.send_keys(city) # element.send_keys() method is to simulate typing with the keyboard

    time.sleep(2)  # wait for the suggestions to load

    # select the first option from the dropdown
    dropdown = wait.until(
      EC.presence_of_element_located((By.ID, "location-autocomplete-listbox"))
    )
    first_option = dropdown.find_element(By.CSS_SELECTOR, "li:first-child button")
    first_option.click()

    time.sleep(1)

    # click the search button
    header = wait.until(
      EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="header-search"]'))
    )
    buttons = header.find_elements(By.TAG_NAME, "button")
    visible_buttons = [b for b in buttons if b.is_displayed() and b.is_enabled()]
    if visible_buttons:
      visible_buttons[0].click()
    else:
      print("No visible buttons found.")

    time.sleep(3)  # wait for the search results to load

    # get event data
    # get the event API request URL
    api_requests_url = driver.execute_script("""
      return window.performance.getEntriesByType('resource')
        .filter(e => e.name.includes('/destination/events/'))[0].name;
    """)
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    }
    response = requests.get(
        api_requests_url,
        headers = headers
    )
    response.raise_for_status() # Throw an error for bad responses
    data = response.json()
    data["city"] = city  # add city to the data for saving to DynamoDB later
    
    return data
  
  except Exception as e:
    print(f"Error in search_events_by_city for {city}: {e}")
    return {"error": str(e), "city": city}

  finally:
    if driver:
      driver.quit()

def save_events_to_dynamodb(data):
  for event in data["events"]:
    item = {
      "city": data["city"],
      "id": get_nested_value(event, "id"),
      "img_url": get_nested_value(event, "image", "url"),
      "name": get_nested_value(event, "name"),
      "start_datetime": f"{get_nested_value(event, 'start_date')} {get_nested_value(event, 'start_time')}",
      "location": get_nested_value(event, "primary_venue", "address", "localized_area_display"),
      "min_ticket_price": f"{get_nested_value(event, 'ticket_availability', 'minimum_ticket_price', 'currency')}{get_nested_value(event, 'ticket_availability', 'minimum_ticket_price', 'major_value')}",
      "updated_at": int(time.time())  # add a timestamp to track when the item was last updated
    }
    
    # Put item into DynamoDB table
    table.put_item(Item=item)
  
  return {"message": "Events saved!"}

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