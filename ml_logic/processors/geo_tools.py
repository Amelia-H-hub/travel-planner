import json
import pycountry

def get_monthly_temp(temp_json, month):
    try:
        data = json.loads(temp_json)
        return data.get(str(month), {}).get('avg', None)
    except:
        return None
    
def get_climate_label(temp, modes):
    if temp is None: return 'Unknown'
    
    label = next((k for k , (low, high) in modes.items() if low <= temp < high), 'Other')
    return label
    
def get_city_climate_calendar(city_row, climate_modes):
    calendar = {'Cold': [], 'Cool': [], 'Pleasant': [], 'Hot': []}
    
    for m in range(1, 13):
        temp = get_monthly_temp(city_row['avg_temp_monthly'], m)
        if temp is None: continue
        
        label = get_climate_label(temp, climate_modes)
        if label in calendar:
            calendar[label].append({'month': m, 'temp': temp})
    
    return calendar

def get_country_iso_code(country_name):
    # Some commeon discrepancies in country names
    mapping = {
        'USA': 'USA',
        'UK': 'GBR',
        'South Korea': 'KOR',
        'Vietnam': 'VNM'
    }
    if country_name in mapping:
        return mapping[country_name]
    try:
        return pycountry.countries.lookup(country_name).alpha_3
    except (LookupError, AttributeError):
        try:
            result = pycountry.countries.search_fuzzy(country_name)
            return result[0].alpha_3
        except:
            return None