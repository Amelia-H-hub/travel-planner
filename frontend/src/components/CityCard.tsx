import { useState } from "react"
import PlotlyChart from "./PlotlyChart";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

interface Climate {
  month: number;
  temp: number;
}

interface ClimateCalendar {
  Cold: Climate[];
  Cool: Climate[];
  Pleasant: Climate[];
  Hot: Climate[];
}

interface City {
  city: string;
  country: string;
  region: string;
  short_description: string;
  budget_level: string;
  climate_calendar: ClimateCalendar;
}

interface CityCardProps {
  companion: any;
  cityObj: City;
  onExpand: () => void;
  chartData: any;
  isLoadingChart: boolean;
  onGetAdvice: (date: string, isFlexibleYear: boolean) => void;
  analysisData: AnalysisData;
  isLoadingAdvice: boolean;
}

interface Advice {
  month: number;
  lt: number;
  risk: number;
  price: number;
  risk_norm: number;
  price_norm: number;
  total_score: number;
  is_next_year?: boolean;
}
interface AnalysisData {
  donut_chart: any;
  current_risk: number;
  recommendations: {
    best_cp: Advice;
    lt_priority: Advice;
    month_priority: Advice;
  };
  bubble_chart: any;
}

export default function CityCard({
  companion,
  cityObj, 
  onExpand, chartData, isLoadingChart,
  onGetAdvice, analysisData, isLoadingAdvice
}: CityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date[]>([]);
  const [isFlexibleYear, setIsFlexibleYear] = useState(false);

  // Expand & get climate price chart
  const handleToggle = () => {
    if (!isExpanded) onExpand(); // Trigger API
    setIsExpanded(!isExpanded);
  };

  // Months missing hotel price
  const getMissingMonthsText = () => {
    if (!chartData || !chartData.data[0].customdata || chartData.data[0].customdata.length === 0) return null;

    const priceTrace = chartData.data[0].customdata;
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const missingIndices: number[] = [];

    priceTrace.forEach((monthData: any[], index: number) => {
      const price = monthData[2];
      if (price === null || price == undefined || price === 0) {
        missingIndices.push(index);
      }
    });

    if (missingIndices.length === 0) return null;

    const missingMonthNames = missingIndices.map(i => months[i]);

    return missingMonthNames.length > 6
      ? "Note: Some monthly price data is unavailable for this region."
      : `Note: Hotel price data for ${missingMonthNames.join(", ")} is currently unavailable.`;
  }
  const missingText = getMissingMonthsText();

  // Get hotel booking advices
  const handleGetAdvice = () => {
    if (selectedDate.length > 0) {
      // Convert Date to YYYY-MM-DD
      const dateStr = selectedDate[0].toLocaleDateString('en-CA');
      onGetAdvice(dateStr, isFlexibleYear);
    } else {
      alert("Please select a date first!");
    }
  };

  return (
    <div className="w-full bg-white/80! backdrop-blur-md border border-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(31,50,85,0.1)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(31,50,85,0.15)] mb-6">
      
      {/* 橫式主體區 */}
      <div className="flex flex-col lg:flex-row">
        
        {/* 左側：城市照片或大標題區 (可根據需求加入圖片) */}
        <div className="lg:w-1/3 p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-left text-4xl font-extrabold text-[#1f3255] tracking-tight">
                {cityObj.city}
              </h3>
              <span className="bg-[#2096a8]! text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {cityObj.budget_level}
              </span>
            </div>
            <p className="text-[#1f3255]/60 text-lg font-medium flex items-center gap-2">
              <span className="text-[#2096a8]">📍</span> {cityObj.country}
              <span className={`fi fi-${countries.getAlpha2Code(cityObj.country, "en")?.toLowerCase()} rounded-sm shadow-sm`}></span>
            </p>
          </div>
          <p className="text-slate-600 mt-4 italic line-clamp-3">"{cityObj.short_description}"</p>
        </div>

        {/* 右側：氣候指南與按鈕 */}
        <div className="lg:w-2/3 p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[13px] uppercase tracking-widest text-slate-400 font-bold">Climate Guide</p>
              <div className="flex gap-3">
                {['Cold', 'Cool', 'Pleasant', 'Hot'].map((type, idx) => {
                  const colors = ['bg-blue-300!', 'bg-slate-400!', 'bg-[#2096a8]!', 'bg-[#f43f5e]!'];
                  return (
                    <div key={type} className="flex items-center gap-1 text-[13px] text-slate-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${colors[idx]}`}></span>{type}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 月份圖表：橫向拉長更清晰 */}
            <div className="flex gap-2 h-10 items-end">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                const isHot = cityObj.climate_calendar.Hot.some(item => item.month === m);
                const isPleasant = cityObj.climate_calendar.Pleasant.some(item => item.month === m);
                const isCool = cityObj.climate_calendar.Cool.some(item => item.month === m);
                const isCold = cityObj.climate_calendar.Cold.some(item => item.month === m);

                let bgColor = "bg-slate-100!";
                if (isHot) bgColor = "bg-[#f43f5e]!";
                else if (isPleasant) bgColor = "bg-[#2096a8]!";
                else if (isCool) bgColor = "bg-slate-400!";
                else if (isCold) bgColor = "bg-blue-300!";

                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className={`w-full h-2 rounded-full transition-all group-hover:h-3 ${bgColor}`} />
                    <span className={`text-[12px] font-bold ${isPleasant ? 'text-[#1f3255]' : 'text-slate-300'}`}>
                      {m}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleToggle}
            className="w-full lg:w-fit px-10 py-3 bg-[#2096a8]! hover:bg-[#1a7d8c]! text-white rounded-2xl text-base font-bold transition-all shadow-lg shadow-[#2096a8]/20"
          >
            {isExpanded ? "Close Strategy" : "🏨 Hotel Booking Strategy"}
          </button>
        </div>
      </div>

      {/* 展開區域：100% 寬度 */}
      {isExpanded && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-8 space-y-10 animate-in slide-in-from-top-4 duration-500">
          <h2 className="text-xl md:text-2xl lg:text-3xl text-[#1f3255] font-bold tracking-tight leading-tight">
            Based on your preference for <span className="text-slate-500 italic">{cityObj.city}</span>, 
            <br className="hidden md:block" />
            here is the hospitality trend for <span className="relative inline-block text-[#2096a8] font-black">
              {cityObj.country}
              <span className="absolute bottom-1 left-0 w-full h-3 bg-[#4de4cf]/80 -z-10 animate-pulse-slow"></span>
            </span>.
          </h2>
          {/* Phase 1: General Trend */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[#1f3255] font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2096a8]! rounded-full"></span>
                Annual Climate & Price Trend
              </h4>
              <div className="flex flex-col w-full h-84 bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
                {isLoadingChart ? (
                  <div>Loading Chart...</div>
                ) : (
                  <>
                    <div className="flex-grow min-h-0"> {/* 👈 包裹圖表並允許它縮放 */}
                      <PlotlyChart chartData={chartData} />
                    </div>
                    {missingText && (
                      <p className="mt-2 text-[12px] text-slate-400 italic font-medium px-2">
                        <span className="text-[#2096a8]/60 mr-1">ℹ️</span> {missingText}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Date Selection Box */}
            <div className="space-y-4 h-full flex flex-col">
              <h4 className="text-[#1f3255] font-bold">Plan Your Trip</h4>
              <div className="flex-grow p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#2096a8] font-extrabold">Arrival Date</label>
                    <Flatpickr
                      value={selectedDate}
                      onChange={([date]) => {
                        setSelectedDate([date]);
                        console.log("Selected date:", date);
                      }}
                      options={{
                        dateFormat: "Y-m-d",
                        closeOnSelect: false,
                        disableMobile: true,
                        minDate: "today"
                      }}
                      className="w-full px-4 py-3 bg-slate-50! border border-slate-100 rounded-xl text-[#1f3255] outline-none focus:ring-2 focus:ring-[#2096a8]/20"
                      placeholder="Select Arrival Date"
                    />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={isFlexibleYear} 
                        onChange={(e) => setIsFlexibleYear(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-200 checked:bg-[#2096a8]! checked:border-[#2096a8] transition-all"
                      />
                      {/* Checkmark Icon */}
                      <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-left font-bold text-[#1f3255] group-hover:text-[#2096a8] transition-colors">
                        Flexible with future dates
                      </span>
                      <p className="text-[11px] text-left text-slate-400 leading-tight">
                        If the current date is too close, show me the best strategy for next year.
                      </p>
                    </div>
                  </label>
                </div>
                <button 
                  onClick={handleGetAdvice}
                  disabled={isLoadingAdvice}
                  className="w-full py-4 bg-[#1f3255]! text-white text-[16px] font-bold rounded-2xl hover:bg-black! transition-all shadow-xl"
                >
                  {isLoadingAdvice ? "Analyzing..." : "Get Hotel Booking Advice"}
                </button>
              </div>
            </div>
          </section>

          {/* Phase 2: Detailed Analysis */}
          {!analysisData ? (
            <div className="text-center py-20 text-slate-300 italic border-t border-dashed">
              Select a date and analyze to see personalized booking strategies.
            </div>
          ) : (
            <section className="pt-10 border-t border-dashed border-slate-200 animate-in fade-in zoom-in duration-700">
              <div className="flex flex-col gap-8">
                
                {/* --- 上層：橫式摘要區 --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* 左側：甜甜圈 (佔 4/12) */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                    <p className="w-full text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider text-left">
                      Current Cancellation Risk
                    </p>
                    <div className="w-full max-w-[160px] aspect-square overflow-hidden">
                      <PlotlyChart chartData={analysisData.donut_chart} />
                    </div>
                  </div>

                  {/* 右側：橫向展開的 AI Strategy Insight (佔 8/12) */}
                  <div className="lg:col-span-8 bg-gradient-to-br from-[#2096a8]/5 to-transparent p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    {/* 背景裝飾 */}
                    <div className="absolute -right-4 -bottom-4 text-[#2096a8]/10 text-9xl font-black select-none italic">
                      "
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      <p className="text-xs font-bold text-[#2096a8] uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#2096a8]! rounded-full animate-pulse" />
                        AI Strategy Insight
                      </p>

                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <h5 className="text-[#1f3255] text-2xl font-black leading-tight flex-1">
                          <span className="mr-2">🎯</span>
                          {analysisData.current_risk < 0.3 
                            ? "Secure this price now — market risk is at its lowest."
                            : "Prioritize 'Free Cancellation' — high volatility detected."}
                        </h5>

                        <div className="pl-6 border-l-2 border-[#2096a8]/20 flex-1">
                          <p className="text-[#2096a8] text-xs font-bold uppercase tracking-tight mb-1">
                            {companion.babies > 0 || companion.children > 0 || companion.seniors > 0
                              ? "Family-First Logic Applied"
                              : "Value-Optimized Logic Applied"}
                          </p>
                          <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            {analysisData.current_risk < 0.3 
                              ? "A stable pricing window ideal for your group structure has been identified."
                              : "We've filtered for strategies that protect your budget from high seasonal volatility."}
                          </p>
                        </div>
                      </div>

                      <p className="text-slate-400 text-[10px] uppercase tracking-tighter font-bold border-t border-slate-100 pt-3 w-fit">
                        Personalized for {companion.adults} Adults {companion.children > 0 && `& ${companion.children} Kids`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- 下層：詳細分析區 --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* 左側：Bubble Chart (佔 7/12) */}
                  <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[500px]">
                    <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">
                      Cancellation Risk vs. Price (Bubble Analysis)
                    </p>
                    <div className="flex-grow min-h-0">
                        <PlotlyChart chartData={analysisData.bubble_chart} />
                    </div>
                  </div>

                  {/* 右側：Booking Strategies (佔 5/12) */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[#1f3255] font-black text-xl tracking-tight">
                        Booking Strategies
                      </h5>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100! px-2 py-1 rounded">
                        3D Model Predicted
                      </span>
                    </div>

                    {/* 動態渲染 Recommendations */}
                    {Object.entries(analysisData.recommendations).map(([key, value]) => {
                      if (!value) return null; // 處理 month_priority 為 null 的情況

                      const config = {
                        best_cp: {
                          label: "Best Value",
                          color: "bg-[#2096a8]!",
                          icon: "💎",
                          sub: "Absolute lowest price across 12 months",
                          timeframe: "Yearly Best"
                        },
                        month_priority: {
                          label: "Stay in your Month",
                          color: "bg-[#f43f5e]!",
                          icon: "🌟",
                          sub: "Optimized for your chosen month",
                          timeframe: "Specific Month"
                        },
                        lt_priority: {
                          label: "The Patient Saver",
                          color: "bg-[#1f3255]!",
                          icon: "⏰",
                          sub: "Wait 1-4 months for major savings",
                          timeframe: "Nearby Alternative"
                        },
                      };
                      const item = config[key as keyof typeof config];

                      const getMonthName = (monthNum: number) => {
                        const date = new Date();
                        date.setMonth(Math.floor(monthNum) - 1);
                        return date.toLocaleString('en-US', {month: 'long'});
                      }

                      return (
                        <div key={key} className="group relative p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-[#2096a8]/30 transition-all duration-500">
                          <div className="flex items-start justify-between mb-3">
                            {/* Label */}
                            <div className={`flex items-center gap-2 text-white text-[13px] font-black px-3 py-1.5 rounded-full ${item.color} shadow-lg shadow-current/20`}>
                              <span className="text-base">{item.icon}</span>
                              <span className="whitespace-nowrap">{item.label}</span>
                            </div>

                            {/* Timeframe */}
                            <div className="shrink-0 px-2 py-0.5 rounded-md bg-slate-50! border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              {item.timeframe}
                            </div>
                          </div>

                          {/* Sub */}
                          {item.sub && (
                            <div className="mb-6 pl-1">
                              <p className="text-left text-[#2096a8] text-[11px] font-bold leading-relaxed max-w-[85%]">
                                {key === 'month_priority' && value.is_next_year ? (
                                  <span className="flex items-center gap-1">📅 2027 Strategy: Wait for next year to save more</span>
                                ) : (
                                  item.sub
                                )}
                              </p>
                            </div>
                          )}

                          <div className="space-y-4">
                            {/* Month & Lead time */}
                            <div className="flex items-end justify-between border-t border-slate-50 pt-3">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[#1f3255] text-sm font-medium">For your</span>
                                  <span className="text-[#1f3255] font-black text-xl">
                                    {value.month ? `${getMonthName(value.month)}` : "planned"}
                                  </span>
                                  <span className="text-[#1f3255] text-sm font-medium">trip</span>
                                </div>
                                
                                <p className="text-[#1f3255] text-sm font-medium">
                                  Book <span className="text-[#2096a8] font-black text-xl">{value.lt} days</span> prior
                                </p>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <p className="text-[#2096a8] font-black text-2xl leading-none">
                                  €{Math.round(value.price)}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                  Est. Avg Price
                                </p>
                              </div>
                            </div>

                            {/* Risk Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                                <span className="text-slate-400">
                                  Predicted Cancellation Risk
                                </span>
                                <span className={`text-[14px] ${value.risk >= 0.7 ? "text-[#dc3545]" : (value.risk >= 0.3 ? "text-[#ffc107]" : "text-[#28a745]")}`}>
                                  {(value.risk * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100! rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ${value.risk >= 0.7 ? "bg-[#dc3545]!" : (value.risk >= 0.3 ? "bg-[#ffc107]!" : "bg-[#28a745]!")}`}
                                  style={{ width: `${value.risk * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}