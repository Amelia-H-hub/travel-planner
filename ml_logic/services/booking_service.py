import pandas as pd
import numpy as np
import joblib
import plotly.graph_objects as go
import plotly.io as pio
import calendar
import json
from ..config import CANCELLATION_RISK_MODEL_PATH, PRICE_LOOKUP_PATH, COUNTRY_MONTHLY_STATS_PATH, RISK_FEATURES, LEAD_TIME_CONFIG
from ..processors.data_utils import calculate_lead_time, get_month, determine_customer_type
from ..processors.geo_tools import get_country_iso_code

class BookingService:
    def __init__(self):
        self.risk_model = joblib.load(CANCELLATION_RISK_MODEL_PATH)
        self.price_lookup = pd.read_csv(PRICE_LOOKUP_PATH)
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
    
    def get_interpolated_price(self, country, month, lt):
        city_prices = self.price_lookup[
            (self.price_lookup['country'] == country) &
            (self.price_lookup['arrival_date_month_num'] == month)
        ].copy()
        
        if city_prices.empty: return 100
        
        city_prices['lt_days'] = city_prices['lead_time_bucket'].map(self.lt_map)
        city_prices = city_prices.sort_values('lt_days')
        
        estimated_price = np.interp(
            lt,
            city_prices['lt_days'].values,
            city_prices['adr'].values
        )
        
        return estimated_price
    
    def get_complete_risk_price_report(self, input_data, is_flexible_year=False):
        target_country = input_data['country'].values[0]
        
        user_lt = int(input_data['lead_time'].iloc[0])
        test_lts = self.get_test_lts(user_lt, is_flexible_year)
        
        user_month = input_data['arrival_date_month_num'].iloc[0]
        test_months = range(1, 13)
        
        results = []
        for m in test_months:
            lts_to_check = test_lts if m == user_month else self.lt_steps
            
            for lt in lts_to_check:
                temp_df = input_data.copy()
                temp_df['arrival_date_month_num'] = m
                temp_df['lead_time'] = lt
                
                # Predict risk
                prob = self.risk_model.predict_proba(temp_df)[0][1]
                
                # Calculate price
                price = self.get_interpolated_price(target_country, m, lt)
                
                results.append({
                    'month': m,
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
    
    def get_stategic_advice(self, input_data, w_risk, w_price, is_flexible_year=False):
        res_df = self.get_complete_risk_price_report(input_data, is_flexible_year)
        user_lt = input_data['lead_time'].iloc[0]
        user_month = input_data['arrival_date_month_num'].iloc[0]
        avg_risk = res_df['risk'].mean()
        yearly_avg_price = res_df['price'].mean()
        
        # normalization
        risk_min, risk_max = res_df['risk'].min(), res_df['risk'].max()
        res_df['risk_norm'] = (res_df['risk'] - risk_min) / (risk_max - risk_min)
        
        price_min, price_max = res_df['price'].min(), res_df['price'].max()
        res_df['price_norm'] = (res_df['price'] - price_min) / (price_max - price_min)
            
        # 1. Best CP value in an year
        cp_advice = self.get_advice_by_weight(res_df[res_df['lt'] <= 365], w_risk, w_price)
        
        # 2. Same month
        this_year_options = res_df[(res_df['month'] == user_month) & (res_df['lt'] <= user_lt)]
        next_year_options = res_df[(res_df['month'] == user_month) & (res_df['lt'] > user_lt)]
        
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
    
    def get_hotel_booking_strategy(self, user_input):
        w_risk, w_price = self.get_risk_price_weight(user_input['companion'])
        is_flexible_year = user_input['is_flexible_year']
        
        # Format data for predicting risk
        current_input = pd.DataFrame([user_input]) if isinstance(user_input, dict) else user_input.copy()
        current_input['lead_time'] = calculate_lead_time(user_input['arrival_date'])
        current_input['arrival_date_month_num'] = get_month(user_input['arrival_date'])
        current_input['adults'] = user_input['companion'].get('adults', 0) + user_input['companion'].get('seniors', 0)
        current_input['children'] = user_input['companion'].get('children', 0)
        current_input['babies'] = user_input['companion'].get('babies', 0)
        current_input['country'] = get_country_iso_code(user_input['country_name'])
        current_input['deposit_type'] = 'No Deposit' # Default
        current_input['customer_type'] = determine_customer_type(
            user_input['companion']
        )
        current_input = current_input[RISK_FEATURES]
        
        # Plot risk donut chart
        user_prob = float(self.risk_model.predict_proba(current_input)[0][1])
        donut_chart = self.visual_service.draw_risk_donut(user_prob)
        
        # Get advices
        cp_advice, month_advice, lt_advice, bubble_chart = self.get_stategic_advice(current_input, w_risk, w_price, is_flexible_year)
        
        return {
            "donut_chart": donut_chart,
            "current_risk": user_prob,
            "recommendations": {
                "best_cp": cp_advice.to_dict() if cp_advice is not None else None,
                "month_priority": month_advice.to_dict() if month_advice is not None else None,
                "lt_priority": lt_advice.to_dict() if lt_advice is not None else None
            },
            "bubble_chart": bubble_chart
        }
    
class VisualService:
    def __init__(self):
        self.country_monthly_stats = pd.read_csv(COUNTRY_MONTHLY_STATS_PATH)
        self.country_monthly_stats = self.country_monthly_stats.rename(
            columns={'arrival_date_month_num': 'month'}
        )
    
    def get_climate(self, climate_calendar):
        if hasattr(climate_calendar, "model_dump"):
            climate_calendar = climate_calendar.model_dump()
        
        rows= []
        for climate_type, months_list in climate_calendar.items():
            for item in months_list:
                if isinstance(item, dict):
                    m = item.get('month')
                    t = item.get('temp')
                else:
                    m = getattr(item, 'month', None)
                    t = getattr(item, 'temp', None)
                
                rows.append({
                    'month': m,
                    'avg_temp': t,
                    'climate': climate_type
                })
        
        climate_df = pd.DataFrame(rows)
        climate_df = climate_df.dropna(subset=['month'])
        return climate_df.sort_values(by='month')
    
    def prepare_plot_data(self, rec_city):
        country_iso = get_country_iso_code(rec_city.country)
        price_df = self.country_monthly_stats[self.country_monthly_stats['country'] == country_iso]
        climate_df = self. get_climate(rec_city.climate_calendar)
        
        combined_df = pd.merge(price_df, climate_df, on='month', how='right')
        combined_df['month_name'] = combined_df['month'].apply(lambda x: calendar.month_name[x])
        combined_df = combined_df.sort_values(by='month')
        print(combined_df)
        
        return combined_df
    
    def plot_monthly_climate_price(self, rec_city):
        plot_data = self.prepare_plot_data(rec_city)
        
        fig = go.Figure()
        
        bg_palette = {
            'Cold': 'rgba(147, 197, 253, 0.2)',     # 淺天藍
            'Cool': 'rgba(148, 163, 184, 0.2)',     # 灰藍色
            'Pleasant': 'rgba(32, 150, 168, 0.2)', # 湖水綠
            'Hot': 'rgba(244, 63, 94, 0.2)'       # 西瓜紅
        }
        
        shapes = []
        for _, row in plot_data.iterrows():
            m = row['month']
            c_type = row.get('climate')
            
            if pd.notna(c_type) and c_type in bg_palette:
                shapes.append(dict(
                    type='rect',
                    xref='x',
                    yref='paper',
                    x0=m - 0.5, x1=m + 0.5,
                    y0=0, y1=1,
                    fillcolor=bg_palette[c_type],
                    layer="below",
                    line_width=0
                ))
        
        fig.add_trace(go.Scatter(
            x=plot_data['month'],
            y=plot_data['avg_adr'],
            mode='lines+markers',
            line=dict(
                color='#1f3255',
                width=3
            ),
            marker=dict(
                size=10,
                color='#1f3255',
                line=dict(
                    width=2,
                    color='white'
                )
            ),
            name='Avg Price',
            showlegend=False,
            # Define detailed hover information
            customdata=np.stack((
                plot_data['month_name'], 
                plot_data['avg_temp'], 
                plot_data['max_adr'].fillna(0), 
                plot_data['min_adr'].fillna(0),
                plot_data['climate'].fillna("Unknown")
            ), axis=-1),
            hovertemplate=(
                "<b>Month: %{customdata[0]}</b><br>" +
                "Avg Temp: %{customdata[1]}°C<br>" +
                "Avg Price: €%{y:.2f}<br>" +
                "Max Price: €%{customdata[2]:.2f}<br>" +
                "Min Price: €%{customdata[3]:.2f}<br>" +
                "<extra></extra>"
            )
        ))
                
        fig.update_layout(
            shapes=shapes,
            title=f"Travel Insights: Hotel Price & Climate in {rec_city.country}",
            xaxis=dict(
                title='Month',
                tickmode='array',
                tickvals=list(range(1, 13)),
                ticktext=[calendar.month_abbr[i] for i in range(1, 13)],
                range=[0.5, 12.5],
                showgrid=False
            ),
            yaxis=dict(
                title='Average Daily Reate (€)',
                gridcolor='rgba(0, 0, 0, 0.05)',
                zeroline=False
            ),
            hovermode='closest',
            plot_bgcolor='rgba(0, 0, 0, 0)',
            paper_bgcolor='rgba(0, 0, 0, 0)',
            margin=dict(l=50, r=20, t=30, b=40),
            showlegend=False
        )
        
        return json.loads(pio.to_json(fig))
    
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