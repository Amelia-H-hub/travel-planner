import joblib
import pandas as pd
import numpy as np
from ..config import THEME_MODEL_PATH, THEME_PREPROCESSOR_PATH, THEME_LE_PATH, CITY_MODEL_PATH, CITY_SCALER_PATH, CITY_DATA_PATH, THEME_FEATURES, BUDGET_MAP, CITY_FEATURES, WEIGHT_CONFIG, CLIMATE_MODES
from ..processors.geo_tools import get_city_climate_calendar
from ..processors.data_utils import classify_travel_companion

class ThemeCityService:
    # Load models and data    
    def __init__(self):
        self.rf = joblib.load(THEME_MODEL_PATH)
        self.preprocessor = joblib.load(THEME_PREPROCESSOR_PATH)
        self.le = joblib.load(THEME_LE_PATH)
        self.knn = joblib.load(CITY_MODEL_PATH)
        self.scaler = joblib.load(CITY_SCALER_PATH)
        self.city_raw_data = pd.read_csv(CITY_DATA_PATH)
    
    def predict_theme(self, user_input):
        companion_label = classify_travel_companion(
            user_input['companion']
        )
        
        processed_input = {
            'Age': user_input['age'],
            'Gender': user_input['gender'],
            'Nationality': user_input['nationality'],
            'Travel_Companions': companion_label,
            'Budget_Category': user_input['budget']
        }
        df = pd.DataFrame([processed_input])[THEME_FEATURES]
        df['Budget_Category'] = df['Budget_Category'].map(BUDGET_MAP)
        
        X_processed = self.preprocessor.transform(df)
        pred_index = self.rf.predict(X_processed)
        
        return self.le.inverse_transform(pred_index)[0]
    
    def _build_ideal_vector(self, theme):
        vec = np.zeros(len(CITY_FEATURES))
        theme_weights = WEIGHT_CONFIG.get(theme, {})
        
        for i, feat in enumerate(CITY_FEATURES):
            if feat in theme_weights:
                vec[i] = theme_weights[feat] * 10
        
        return vec
        
    def get_complete_recommendations(self, user_input, top_n=5):
        predicted_theme = self.predict_theme(user_input)
        ideal_vector = self._build_ideal_vector(predicted_theme)
        ideal_scales = self.scaler.transform([ideal_vector])
        distance, indices = self.knn.kneighbors(ideal_scales, n_neighbors=30)
        
        candidates = self.city_raw_data.iloc[indices[0]].copy()
        
        # Calculate budget fit
        user_val = BUDGET_MAP.get(user_input['budget'], 1)
        candidates['budget_score'] = candidates['budget_level'].apply(
            lambda x: 1.5 if BUDGET_MAP.get(x, 1) == user_val else (1.2 if user_val > BUDGET_MAP.get(x, 1) else 0.8)
        )
        
        # Get total score
        candidates['similarity'] = 1 - distance[0]
        candidates['final_score'] = candidates['similarity'] * candidates['budget_score']
        results = candidates.sort_values(by='final_score', ascending=False).head(top_n)
        
        city_recommendations = []
        for _, row in results.iterrows():
            climate_calendar = get_city_climate_calendar(row, CLIMATE_MODES)
            rec = {
                'city': row['city'],
                'country': row['country'],
                'region': row['region'],
                'short_description': row['short_description'],
                'budget_level': row['budget_level'],
                'climate_calendar': climate_calendar
            }
            city_recommendations.append(rec)

        return city_recommendations