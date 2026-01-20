import os

# ========================================
# 1. Path Configurations
# ========================================

# Current environment
ENV_MODE = os.getenv("ENV_MODE", "development")

# ======== Local ========
# Project root path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Folder paths
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "..", "ml_research", "data")

# ======== Hugging Face ========
HF_BASE_URL = "https://huggingface.co/datasets/ama-h/travel-planning-logic/resolve/main"

# File paths
# ========== Production ========
if ENV_MODE == "production":
    # --- Theme Model ---
    THEME_MODEL_PATH = f"{HF_BASE_URL}/theme_rf_model.pkl"
    THEME_PREPROCESSOR_PATH = f"{HF_BASE_URL}/theme_preprocessor.pkl"
    THEME_LE_PATH = f"{HF_BASE_URL}/theme_label_encoder.pkl"

    # --- City Model ---
    CITY_MODEL_PATH = f"{HF_BASE_URL}/city_knn_model.pkl"
    CITY_SCALER_PATH = f"{HF_BASE_URL}/city_scaler.pkl"
    CITY_DATA_PATH = f"{HF_BASE_URL}/Worldwide%20Travel%20Cities%20Dataset%20(Ratings%20and%20Climate).csv"

    # --- Cancellation Risk Model ---
    CANCELLATION_RISK_MODEL_PATH = f"{HF_BASE_URL}/cancel_pipeline.pkl"
    PRICE_LOOKUP_PATH = f"{HF_BASE_URL}/price_lookup_reference.csv"
    COUNTRY_MONTHLY_STATS_PATH = f"{HF_BASE_URL}/cancellation_predict", "country_monthly_stats.csv"
    
    IS_LOCAL = False

# ======== Local ========
else:
    # --- Theme Model ---
    THEME_MODEL_PATH = os.path.join(MODELS_DIR, "theme_predict", "theme_rf_model.pkl")
    THEME_PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "theme_predict", "theme_preprocessor.pkl")
    THEME_LE_PATH = os.path.join(MODELS_DIR, "theme_predict", "theme_label_encoder.pkl")

    # --- City Model ---
    CITY_MODEL_PATH = os.path.join(MODELS_DIR, "city_recommend", "city_knn_model.pkl")
    CITY_SCALER_PATH = os.path.join(MODELS_DIR, "city_recommend", "city_scaler.pkl")
    CITY_DATA_PATH = os.path.join(DATA_DIR, "Worldwide Travel Cities Dataset (Ratings and Climate).csv")

    # --- Cancellation Risk Model ---
    CANCELLATION_RISK_MODEL_PATH = os.path.join(MODELS_DIR, "cancellation_predict", "cancel_pipeline.pkl")
    PRICE_LOOKUP_PATH = os.path.join(MODELS_DIR, "cancellation_predict", "price_lookup_reference.csv")
    COUNTRY_MONTHLY_STATS_PATH = os.path.join(MODELS_DIR, "cancellation_predict", "country_monthly_stats.csv")
    
    IS_LOCAL = True


# ========================================
# 2. Business Logic Configurations
# ========================================

# Features used in theme predict model
THEME_FEATURES = ['Age', 'Gender', 'Nationality', 'Travel_Companions', 'Budget_Category']

# Budget mapping
BUDGET_MAP = {
    'Low': 0, 'Medium': 1, 'High': 2, # From theme model
    'Budget': 0, 'Mid-range': 1, 'Luxury': 2
}

# Features used in city recommendation model
CITY_FEATURES = ['culture', 'adventure', 'nature', 'beaches', 'nightlife', 'cuisine', 'wellness', 'urban', 'seclusion']

# City score weight
WEIGHT_CONFIG = {
    'Relaxation': {'wellness': 0.4, 'seclusion': 0.4, 'beaches': 0.2},
    'Shopping': {'urban': 0.5, 'cuisine': 0.3, 'nightlife': 0.2},
    'Adventure': {'adventure': 0.6, 'nature': 0.3, 'seclusion': 0.1},
    'Cultural': {'culture': 0.7, 'urban': 0.2, 'cuisine': 0.1},
    'Food': {'cuisine': 0.7, 'nightlife': 0.2, 'urban': 0.1},
    'Nature': {'nature': 0.6, 'seclusion': 0.3, 'adventure': 0.1}
}

# Climate categories
CLIMATE_MODES = {
    'Cold': (float('-inf'), 5),
    'Cool': (5, 18),
    'Pleasant': (18, 26),
    'Hot': (26, float('inf'))
}

# Features used in cancellation risk predict model
RISK_FEATURES = [
    'lead_time', 'arrival_date_month_num', 'adults', 'children', 'babies', 
    'country', 'deposit_type', 'customer_type'
]

# Lead time mapping
LEAD_TIME_CONFIG = {
    'Last Minute': 14,
    'Short-term': 30,
    'Medium-term': 90,
    'Half-year': 180,
    'Long-term': 365,
    'Very Long-term': 730   # Maximum of lead_time is 709
}