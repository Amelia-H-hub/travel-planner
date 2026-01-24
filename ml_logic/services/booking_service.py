import pandas as pd
import joblib
import plotly.graph_objects as go
import plotly.io as pio
import calendar
import json
import requests
import io
from ml_logic.config import CANCELLATION_RISK_MODEL_PATH, PRICE_MODEL_PATH, COUNTRY_MONTHLY_STATS_PATH, BOOKING_FEATURES, LEAD_TIME_CONFIG, IS_LOCAL
from ml_logic.processors.data_utils import calculate_lead_time, get_month, determine_customer_type, calculate_stay_distribution
from ml_logic.processors.geo_tools import get_country_iso_code

class BookingService:
    def __init__(self):
        if IS_LOCAL:
            self.risk_model = joblib.load(CANCELLATION_RISK_MODEL_PATH)
            self.price_model = joblib.load(PRICE_MODEL_PATH)
            
        else:
            print("Running in production, loading models from Hugging Face...")
            risk_resp = requests.get(CANCELLATION_RISK_MODEL_PATH)
            self.risk_model = joblib.load(io.BytesIO(risk_resp.content))
            price_resp = requests.get(PRICE_MODEL_PATH)
            self.price_model = joblib.load(io.BytesIO(price_resp.content))
        
        self.lt_map = LEAD_TIME_CONFIG
        self.lt_steps = sorted(LEAD_TIME_CONFIG.values())
        self.visual_service = VisualService()
    
    def get_test_lts(self, user_lt, is_flexible_year=False):
        if user_lt <= 30: step = 1
        elif user_lt <= 90: step = 3
        elif user_lt <= 180: step = 7
        elif user_lt <= 365: step = 14
        else: step = 28
        
        test_lts = list(range(1, user_lt + 1, step))
        
        if is_flexible_year:
            future_lts = list(range(user_lt + 28, user_lt + 366, 28))
            test_lts.extend(future_lts)
        
        test_lts.append(user_lt)
        return sorted(list(set(test_lts)))
    
    def _get_weeks_in_month(self, year, month):
        month_days = pd.date_range(start=f"{year}-{month}-01", periods=pd.Period(f"{year}-{month}").days_in_month)
        return sorted(list(set([d.isocalendar().week for d in month_days])))
    
    def get_complete_risk_price_report(self, input_data, is_flexible_year=False):
        now = pd.Timestamp.now()
        
        # test lead time
        user_lt = int(input_data['lead_time'].iloc[0])
        test_lts = self.get_test_lts(user_lt, is_flexible_year)
        
        # test arrival month
        user_month = input_data['arrival_date_month_num'].iloc[0]
        test_months = range(1, 13)
        
        results = []
        for m in test_months:            
            lts_to_check = test_lts if m == user_month else self.lt_steps
            
            for lt in lts_to_check:
                simulated_date = now + pd.Timedelta(days=lt)
                sim_year = simulated_date.year
                
                test_weeks = self._get_weeks_in_month(sim_year, m)
                
                for w in test_weeks:
                    # Exclude the date before today
                    try:
                        check_date = pd.to_datetime(f'{sim_year}-W{w}-1', format='%G-W%V-%u')
                        if check_date <= now:
                            continue
                    except:
                        pass
                    
                    temp_df = input_data.copy()
                    temp_df['arrival_date_month_num'] = m
                    temp_df['arrival_date_week_number'] = w
                    temp_df['lead_time'] = lt
                    
                    # Predict risk
                    prob = self.risk_model.predict_proba(temp_df)[0][1]
                    
                    # Calculate price
                    price = self.price_model.predict(temp_df)[0]
                    
                    results.append({
                        'year': sim_year,
                        'month': m,
                        'week_number': w,
                        'lt': lt,
                        'risk': prob,
                        'price': price
                    })
        
        res_df = pd.DataFrame(results)
        
        return res_df
    
    def get_advice_by_weight(self, candidates, weight_risk, weight_price):
        if candidates.empty:
            return None
        
        temp_candidates = candidates.copy()
        temp_candidates['total_score'] = (temp_candidates['risk_norm'] * weight_risk) + (temp_candidates['price_norm'] * weight_price)
        
        advice = temp_candidates.sort_values('total_score').iloc[0]
        
        return advice
    
    def _get_date_match_from_week(self, advice, target_weekend, target_week):
        if advice is None: return None
        
        advice_data = advice.to_dict() if hasattr(advice, 'to_dict') else advice
        year = int(advice_data['year'])
        week = int(advice_data['week_number'])
        start_of_week = pd.to_datetime(f'{year}-W{week}-1', format='%G-W%V-%u')
        total_nights = target_weekend + target_week
        
        for i in range(7):
            candidate_start = start_of_week + pd.Timedelta(days=i)
            
            stay_range = pd.date_range(start=candidate_start, periods=total_nights)
            
            current_weekend = len([d for d in stay_range if d.weekday() in [4, 5]])
            current_week = total_nights - current_weekend
            
            if current_weekend == target_weekend and current_week == target_week:
                return {
                    **advice_data,
                    "check_in": stay_range[0].strftime('%Y-%m-%d'),
                    "check_out": (stay_range[-1] + pd.Timedelta(days=1)).strftime('%Y-%m-%d'),
                    "stay_dates": [d.strftime('%Y-%m-%d') for d in stay_range]
                }
        
        # Fallback: If cannot match, return Friday of the week as start date
        fallback_start = start_of_week + pd.Timedelta(days=4)
        return {
            **advice_data,
            "check_in": fallback_start.strftime('%Y-%m-%d'),
            "check_out": (fallback_start + pd.Timedelta(days=total_nights)).strftime('%Y-%m-%d'),
            "stay_dates": [] 
        }
    
    def get_stategic_advice(self, input_data, w_risk, w_price, is_flexible_year=False):
        res_df = self.get_complete_risk_price_report(input_data, is_flexible_year)
        user_lt = input_data['lead_time'].iloc[0]
        user_month = input_data['arrival_date_month_num'].iloc[0]
        
        # normalization
        risk_min, risk_max = res_df['risk'].min(), res_df['risk'].max()
        res_df['risk_norm'] = (res_df['risk'] - risk_min) / (risk_max - risk_min)
        
        price_min, price_max = res_df['price'].min(), res_df['price'].max()
        res_df['price_norm'] = (res_df['price'] - price_min) / (price_max - price_min)
            
        # 1. Best CP value in an year
        cp_advice = self.get_advice_by_weight(res_df[res_df['lt'] <= 365], w_risk, w_price)
        cp_advice = self._get_date_match_from_week(
            cp_advice,
            input_data['stays_in_weekend_nights'].iloc[0], input_data['stays_in_week_nights'].iloc[0]
        )
        
        # 2. Same month
        this_year_options = res_df[(res_df['month'] == user_month) & (res_df['lt'] <= 365)]
        next_year_options = res_df[(res_df['month'] == user_month) & (res_df['lt'] > 365)]
        
        best_this_year = self.get_advice_by_weight(this_year_options, w_risk, w_price)
        
        if is_flexible_year and not next_year_options.empty:
            best_next_year = self.get_advice_by_weight(next_year_options, w_risk, w_price)
            
            price_saving_ratio = (best_this_year['price'] - best_next_year['price']) / best_this_year['price']
            
            if price_saving_ratio > 0.15:
                month_advice = best_next_year
                month_advice['is_next_year'] = True
            else:
                month_advice = best_this_year
                month_advice['is_next_year'] = False
        else:
            month_advice = best_this_year
            month_advice['is_next_year'] = False
        
        month_advice = self._get_date_match_from_week(
            month_advice,
            input_data['stays_in_weekend_nights'].iloc[0], input_data['stays_in_week_nights'].iloc[0]
        )
        
        # 3. Same or longer lead time
        future_months = [(int(user_month) + i - 1) % 12 + 1 for i in range(1, 4)]
        lt_candidates = res_df[
            (res_df['month'].isin(future_months)) &
            (res_df['lt'] > user_lt)
        ].copy()
        
        if cp_advice is not None:
            lt_candidates = lt_candidates[
                ~((lt_candidates['month'] == cp_advice['month']) &
                  (lt_candidates['lt'] == cp_advice['lt']))
            ]
        
        lt_advice = self.get_advice_by_weight(lt_candidates, w_risk, w_price)
        lt_advice = self._get_date_match_from_week(
            lt_advice,
            input_data['stays_in_weekend_nights'].iloc[0], input_data['stays_in_week_nights'].iloc[0]
        )
        
        # Plot bubble chart
        bubble_chart = self.visual_service.plot_bubble_recommendation(res_df, cp_advice, lt_advice, month_advice)
        
        return cp_advice, month_advice, lt_advice, bubble_chart
    
    def get_risk_price_weight(self, companion):
        total_people = companion.get('babies', 0) + companion.get('children', 0) + companion.get('adults', 0) + companion.get('seniors', 0)
        is_family = (companion.get('babies', 0) + companion.get('children', 0) + companion.get('seniors', 0)) > 0
        
        # Default weights
        w_risk = 1.2
        w_price = 1.2
        
        if is_family:
            w_risk = 1.8
            w_price = 1.0
        elif total_people > 4:
            w_risk = 1.5
            w_price = 1.2
        else:
            w_risk = 1.0
            w_price = 1.8
        
        return w_risk, w_price
    
    def get_ai_insight(self, predicted_price, country_iso, month):
        context, avg_base = self.visual_service.get_price_baseline(country_iso, month)
        
        diff_ratio = (predicted_price - avg_base) / avg_base
        diff_pct = abs(int(diff_ratio * 100))
        
        if diff_ratio < -0.15:
            return {
                "status": "success",
                "message": f"{context}, this is a Great Value! The predicted rate is {diff_pct}% lower than the historical average. It’s an excellent time to secure your booking."
            }
        
        elif diff_ratio > 0.15:
            return {
                "status": "warning",
                "message": f"{context}, the estimated price is {diff_pct}% higher than average. This may be due to peak demand or your specific group size. Consider adjusting your dates for better rates."
            }
        
        else:
            return {
                "status": "info",
                "message": f"The price is within a reasonable range. Our AI prediction is consistent with typical market rates {context.lower()}."
            }
    
    def get_hotel_booking_strategy(self, user_input):
        w_risk, w_price = self.get_risk_price_weight(user_input['companion'])
        is_flexible_year = user_input['is_flexible_year']
        
        # Format data for predicting risk
        current_input = pd.DataFrame([user_input]) if isinstance(user_input, dict) else user_input.copy()
        current_input['lead_time'] = calculate_lead_time(user_input['arrival_date'])
        current_input['arrival_date_month_num'] = get_month(user_input['arrival_date'])
        current_input['arrival_date_week_number'] = pd.to_datetime(user_input['arrival_date']).isocalendar().week
        current_input['stays_in_weekend_nights'], current_input['stays_in_week_nights'] = calculate_stay_distribution(user_input['arrival_date'], user_input['leave_date'])
        current_input['adults'] = user_input['companion'].get('adults', 0) + user_input['companion'].get('seniors', 0)
        current_input['children'] = user_input['companion'].get('children', 0)
        current_input['babies'] = user_input['companion'].get('babies', 0)
        current_input['country'] = get_country_iso_code(user_input['country_name'])
        current_input['market_segment'] = 'Online TA' # Default
        current_input['deposit_type'] = 'No Deposit' # Default
        current_input['customer_type'] = determine_customer_type(
            user_input['companion']
        )
        current_input['required_car_parking_spaces'] = 0
        current_input['total_of_special_requests'] = 0
        current_input = current_input[BOOKING_FEATURES]
        
        # Plot risk donut chart
        user_prob = float(self.risk_model.predict_proba(current_input)[0][1])
        donut_chart = self.visual_service.draw_risk_donut(user_prob)
        
        # Predict adr
        price_predicted = int(self.price_model.predict(current_input)[0])
        
        # Get current AI insight
        ai_insight = self.get_ai_insight(price_predicted, current_input['country'].iloc[0], current_input['arrival_date_month_num'].iloc[0])
        
        # Get advices
        cp_advice, month_advice, lt_advice, bubble_chart = self.get_stategic_advice(current_input, w_risk, w_price, is_flexible_year)
        
        return {
            "donut_chart": donut_chart,
            "current_risk": user_prob,
            "current_adr": price_predicted,
            "current_insight": ai_insight,
            "recommendations": {
                "best_cp": cp_advice,
                "month_priority": month_advice,
                "lt_priority": lt_advice
            },
            "bubble_chart": bubble_chart
        }
    
class VisualService:
    def __init__(self):
        self.country_monthly_stats = pd.read_csv(COUNTRY_MONTHLY_STATS_PATH)
        self.country_monthly_stats = self.country_monthly_stats.rename(
            columns={'arrival_date_month_num': 'month'}
        )
    
    def draw_risk_donut(self, cancel_prob: float):
        risk_percent = cancel_prob * 100
        
        if risk_percent >= 70:
            risk_color = '#dc3545'
        elif risk_percent >= 30:
            risk_color = '#ffc107'
        else:
            risk_color = '#28a745'
            
        values = [risk_percent, 100 - risk_percent]
        colors = [risk_color, '#e9ecef']
        
        fig = go.Figure(data=[go.Pie(
            values=values,
            labels=['Risk', 'Remaining'],
            hole=0.8,
            marker_colors=colors,
            sort=False,
            direction='clockwise',
            rotation=0,
            showlegend=False,
            textinfo='none',
            hoverinfo='none'
        )])
        
        fig.add_annotation(
            text=f'<b>{risk_percent:.1f}%</b>',
            x=0.5,
            y=0.5,
            font_size=28,
            font_color=risk_color,
            showarrow=False
        )
        
        fig.update_layout(
            autosize=True,
            margin=dict(t=0, b=0, l=0, r=0),
            paper_bgcolor='rgba(0, 0, 0, 0)',
            plot_bgcolor='rgba(0, 0, 0, 0)'
        )
        
        return json.loads(pio.to_json(fig))
    
    def get_price_baseline(self, country_iso, month):
        row = self.country_monthly_stats[
            (self.country_monthly_stats['country'] == country_iso) & 
            (self.country_monthly_stats['month'] == month)
        ]
        
        if not row.empty and row['count'].iloc[0] > 10:
            return 'Compare to travelers from your country', row['avg_adr'].iloc[0]
        
        # When there's no specific country data, return global average
        global_avg = self.country_monthly_stats[self.country_monthly_stats['month'] == month]['avg_adr'].mean()
        return 'Based on general market trends for this month', global_avg
    
    def plot_bubble_recommendation(self, res_df, cp_advice, lt_advice, month_advice):
        fig = go.Figure()
        
        # Draw all the points
        fig.add_trace(go.Scatter(
            x=res_df['price'],
            y=res_df['risk']*100,
            mode='markers',
            marker=dict(color='lightgrey', size=8, opacity=0.5),
            name='Others',
            hoverinfo='text',
            text=[f"Month: {m}<br>Lead time: {lt}<br>Price: ${p:.1f}"
                for m, lt, p in zip(res_df['month'], res_df['lt'], res_df['price'])]
        ))
        
        advices = []
        if cp_advice is not None: advices.append({'data': cp_advice,
                                                'label': '🌟 Best CP Value',
                                                'color': 'gold',
                                                'symbol': 'star'})
        if lt_advice is not None: advices.append({'data': lt_advice,
                                                'label': '🛡️ Planning Priority',
                                                'color': 'royalblue',
                                                'symbol': 'diamond'})
        if month_advice is not None: advices.append({'data': month_advice,
                                                'label': '📅 Month Priority',
                                                'color': 'forestgreen',
                                                'symbol': 'square'})
        advices.sort(key=lambda x: x['data']['risk'], reverse=True)
        
        offsets = [
            {'ay': -50, 'ax': 0},
            {'ay': 0, 'ax': 90},
            {'ay': 50, 'ax': 0},
        ]
        
        for i, adv_item in enumerate(advices):
            advice = adv_item['data']
            label = adv_item['label']
            color = adv_item['color']
            symbol = adv_item['symbol']
            month_name = calendar.month_abbr[int(advice['month'])]
            
            offset = offsets[i] if i < len(offsets) else {'ay': 40, 'ax': 40}

            fig.add_trace(go.Scatter(
                x=[advice['price']],
                y=[advice['risk']*100],
                mode='markers',
                marker=dict(
                    color=color,
                    size=15,
                    symbol=symbol,
                    line=dict(width=2, color='white')
                ),
                name=label
            ))
            
            fig.add_annotation(
                x=advice['price'],
                y=advice['risk']*100,
                text=f"<span style='color:{color}'><b>{label}</b></span><br>{month_name} / {int(advice['lt'])} days prep",
                ax=offset['ax'],
                ay=offset['ay'],
                bgcolor="rgba(255, 255, 255, 0.9)",
                bordercolor=color,
                borderwidth=1,
                font=dict(size=11)
            )
        
        fig.update_layout(
            xaxis_title="Estimated Price (ADR)",
            yaxis_title="Cancellation Risk (%)",
            template="plotly_white",
            hovermode="closest"
        )
        
        fig.add_shape(
            type='rect',
            x0=res_df['price'].min(),
            y0=0,
            x1=res_df['price'].mean(),
            y1=30,
            line=dict(color='Green', width=1, dash='dot'),
            fillcolor='LightGreen',
            opacity=0.3
        )
        
        fig.add_vline(
            x=res_df['price'].mean(),
            line_dash="dash",
            line_color="grey",
            annotation_text="Average Price"
        )
        
        return json.loads(pio.to_json(fig))