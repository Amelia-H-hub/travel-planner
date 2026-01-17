from datetime import datetime, date

def classify_travel_companion(babies, children, adults, elders):
    total_people = adults + children + babies + elders
    
    if total_people == 1:
        return 'Solo'
    
    if adults >=1 and (babies > 0 or children > 0 or elders > 0):
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

def determine_customer_type(babies, children, adults, elders):
    total_people = babies + children + adults + elders
    
    if total_people > 5:
        return 'Transient-Party'
    
    return 'Transient'