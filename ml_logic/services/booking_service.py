import pandas as pd
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
        self.bins = [0] + list(LEAD_TIME_CONFIG.values())
        self.labels = list(LEAD_TIME_CONFIG.keys())
        self.visual_service = VisualService()
    
    def get_lt_bucket_name(self, lt):
        return pd.cut([lt], bins=self.bins, labels=self.labels, include_lowest=True)[0]
    
    def get_complete_risk_price_report(self, input_data):
        test_lead_times = list(LEAD_TIME_CONFIG.values())
        test_months = range(1, 13)
        results = []
        
        for m in test_months:
            for lt in test_lead_times:
                temp_df = input_data.copy()
                temp_df['arrival_date_month_num'] = m
                temp_df['lead_time'] = lt
                # Predict risk
                prob = self.risk_model.predict_proba(temp_df)[0][1]
                # Look up price
                bucket = self.get_lt_bucket_name(lt)
                price_row = self.price_lookup[(self.price_lookup['arrival_date_month_num'] == m) &
                                        (self.price_lookup['lead_time_bucket'] == bucket)]
                avg_price = price_row['adr'].values[0] if not price_row.empty else 100
                
                results.append({
                    'month': m,
                    'lt': lt,
                    'risk': prob,
                    'price': avg_price
                })
        
        res_df = pd.DataFrame(results)
        
        return res_df
    
    def get_advice_by_weight(self, candidates, weight_risk=1.5, weight_price=1.2):
        if candidates.empty:
            return None
        
        temp_candidates = candidates.copy()
        temp_candidates['total_score'] = (temp_candidates['risk_norm'] * weight_risk) + (temp_candidates['price_norm'] * weight_price)
        
        advice = temp_candidates.sort_values('total_score').iloc[0]
        
        return advice
    
    def get_stategic_advice(self, input_data, isThisYear=True):
        res_df = self.get_complete_risk_price_report(input_data)
        user_lt = input_data['lead_time'].iloc[0]
        user_month = input_data['arrival_date_month_num'].iloc[0]
        yearly_avg_price = res_df['price'].mean()
        
        # normalization
        risk_min, risk_max = res_df['risk'].min(), res_df['risk'].max()
        res_df['risk_norm'] = (res_df['risk'] - risk_min) / (risk_max - risk_min)
        
        price_min, price_max = res_df['price'].min(), res_df['price'].max()
        res_df['price_norm'] = (res_df['price'] - price_min) / (price_max - price_min)
            
        # 1. Best CP value
        # risk < 30% & price < yearly_avg_price
        cp_candidates = res_df[(res_df['risk'] < 0.3) & (res_df['price'] < yearly_avg_price)].copy()
        cp_advice = self.get_advice_by_weight(cp_candidates)
        
        # 2. Same or longer lead time
        target_months = [(int(user_month) + i - 1) % 12 + 1 for i in range(0, 4)]
        lt_priority = res_df[(res_df['lt'] >= user_lt) & (res_df['month'].isin(target_months))].copy()
        lt_advice = self.get_advice_by_weight(lt_priority)
        
        # 3. Same month
        if isThisYear:
            month_priority = res_df[(res_df['month'] == user_month) & (res_df['lt'] <= user_lt)].copy()
        else:
            month_priority = res_df[res_df['month'] == user_month].copy()
        month_advice = self.get_advice_by_weight(month_priority)
        
        # Plot bubble chart
        bubble_chart = self.visual_service.plot_bubble_recommendation(res_df, cp_advice, lt_advice, month_advice)
        
        return cp_advice, lt_advice, month_advice, bubble_chart
    
    def get_hotel_booking_strategy(self, user_input):
        current_input = pd.DataFrame([user_input]) if isinstance(user_input, dict) else user_input.copy()
        current_input['lead_time'] = calculate_lead_time(user_input['arrival_date'])
        current_input['arrival_date_month_num'] = get_month(user_input['arrival_date'])
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
        cp_advice, lt_advice, month_advice, bubble_chart = self.get_stategic_advice(current_input)
        
        return {
            "donut_chart": donut_chart,
            "current_risk": user_prob,
            "recommendations": {
                "best_cp": cp_advice.to_dict() if cp_advice is not None else None,
                "lt_priority": lt_advice.to_dict() if lt_advice is not None else None,
                "month_priority": month_advice.to_dict() if month_advice is not None else None
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
        
        combined_df = pd.merge(price_df, climate_df, on='month', how='left')
        combined_df['month_name'] = combined_df['month'].apply(lambda x: calendar.month_name[x])
        combined_df = combined_df.sort_values(by='month')
        
        return combined_df
    
    def plot_monthly_climate_price(self, rec_city):
        plot_data = self.prepare_plot_data(rec_city)
        
        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=plot_data['month'],
            y=plot_data['avg_adr'],
            mode='lines',
            line=dict(color='lightgrey', width=2),
            name='Price Trend',
            showlegend=False,
            hoverinfo='skip' # Disable hover for this trace
        ))
        
        palette = {
            'Cold': '#a5c8ff',
            'Cool': '#95e1d3',
            'Pleasant': '#fce38a',
            'Hot': '#f38181'
        }
        
        unique_climates = [c for c in plot_data['climate'].unique() if pd.notna(c)]
        
        for climate_type in unique_climates:
            df_sub = plot_data[plot_data['climate'] == climate_type]
            if not df_sub.empty:
                fig.add_trace(go.Scatter(
                    x=df_sub['month'],
                    y=df_sub['avg_adr'],
                    mode='markers',
                    name=climate_type,
                    marker=dict(
                        size=14,
                        color=palette[climate_type],
                        line=dict(width=1, color='black')
                    ),
                    # Define detailed hover information
                    customdata=df_sub[['month_name', 'avg_temp', 'max_adr', 'min_adr']],
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
            title=f"Travel Insights: Hotel Price & Climate in {rec_city.country}",
            xaxis=dict(
                title='Month',
                tickmode='array',
                tickvals=list(range(1, 13)),
                ticktext=[calendar.month_abbr[i] for i in range(1, 13)]
            ),
            yaxis=dict(
                title='Average Daily Reate (€)'
            ),
            hovermode='closest',
            template='plotly_white',
            legend_title='Climate Type'
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
            font_size=32,
            font_color=risk_color,
            showarrow=False
        )
        
        fig.update_layout(
            title={
                'text': "Booking Cancellation Risk",
                'x': 0.5,
                'y': 0.9,
                'xanchor': 'center',
                'yanchor': 'top'
            },
            margin=dict(t=80, b=10, l=10, r=10),
            height=300,
            width=300,
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
            title="<b>AI Recommendation: Risk vs. Price Strategy</b>",
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