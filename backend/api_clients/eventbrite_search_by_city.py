from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import requests

def search_events_by_city(city: str):
  driver = None
  try:
    # selenium setup
    chrome_options = Options() # create a setting object for Chrome browser settings
    chrome_options.add_argument("--headless=new") # hide the browser window
    chrome_options.add_argument("--disable-gpu") # disable GPU hardware acceleration, make headless mode more stable
    
    # start selenium
    driver = webdriver.Chrome(
      service=Service(ChromeDriverManager().install()),
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
    data = response.json()
    return data

  finally:
    if driver:
      driver.quit()