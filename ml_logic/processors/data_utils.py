from datetime import datetime, date
import pandas as pd

def classify_travel_companion(companion):
    b, c, a, s = companion['babies'], companion['children'], companion['adults'], companion['seniors']
    total_people = b + c + a + s
    
    if total_people == 1:
        return 'Solo'
    
    if a >= 1 and (b > 0 or c > 0 or s > 0):
        return 'Family'
    
    if total_people > 6:
        return 'Group'
    else:
        return 'Friends'

def calculate_lead_time(arrival_date):
    today = date.today()
    
    arrival_date = datetime.strptime(arrival_date, '%Y-%m-%d').date()
    
    delta = arrival_date - today
    lead_time = delta.days
    
    return max(0, lead_time)

def get_month(arrival_date):
    date_obj = datetime.strptime(arrival_date, '%Y-%m-%d')
    month = date_obj.month
    
    return month

def determine_customer_type(companion):
    b, c, a, s = companion['babies'], companion['children'], companion['adults'], companion['seniors']
    total_people = b + c + a + s
    
    if total_people > 5:
        return 'Transient-Party'
    
    return 'Transient'

def calculate_stay_distribution(start_date_str, end_date_str):
    start_date = pd.to_datetime(start_date_str)
    end_date = pd.to_datetime(end_date_str)
    
    stay_days = pd.date_range(start=start_date, end=end_date, inclusive='left')
    
    weekend_nights = len([d for d in stay_days if d.weekday() in [4, 5]])
    week_nights = len(stay_days) - weekend_nights
    
    return weekend_nights, week_nights