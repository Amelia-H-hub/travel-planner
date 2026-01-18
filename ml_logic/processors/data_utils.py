from datetime import datetime, date

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