import { useState, useEffect } from "react"
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
  cityObj: City;
  chartData: any;
  isLoadingChart: boolean;
  onExpand: () => void;
}

export default function CityCard({ cityObj, chartData, isLoadingChart, onExpand }: CityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAnalysisData, setHasAnalysisData] = useState(false); // 控制 Phase 2 顯示
  const [selectedDate, setSelectedDate] = useState<Date[]>([]);

  const handleToggle = () => {
    if (!isExpanded) onExpand(); // 只有在打開時觸發 API
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border border-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(31,50,85,0.1)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(31,50,85,0.15)] mb-6">
      
      {/* 橫式主體區 */}
      <div className="flex flex-col lg:flex-row">
        
        {/* 左側：城市照片或大標題區 (可根據需求加入圖片) */}
        <div className="lg:w-1/3 p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-4xl font-extrabold text-[#1f3255] tracking-tight">{cityObj.city}</h3>
              <span className="bg-[#2096a8] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
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
                {['Cold', 'Cool', 'Best', 'Hot'].map((type, idx) => {
                  const colors = ['bg-blue-300', 'bg-slate-400', 'bg-[#2096a8]', 'bg-[#f43f5e]'];
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

                let bgColor = "bg-slate-100";
                if (isHot) bgColor = "bg-[#f43f5e]";
                else if (isPleasant) bgColor = "bg-[#2096a8]";
                else if (isCool) bgColor = "bg-slate-400";
                else if (isCold) bgColor = "bg-blue-300";

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
            className="w-full lg:w-fit px-10 py-3 bg-[#2096a8] hover:bg-[#1a7d8c] text-white rounded-2xl text-base font-bold transition-all shadow-lg shadow-[#2096a8]/20"
          >
            {isExpanded ? "Close Strategy" : "🏨 Hotel Booking Strategy"}
          </button>
        </div>
      </div>

      {/* 展開區域：100% 寬度 */}
      {isExpanded && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-8 space-y-10 animate-in slide-in-from-top-4 duration-500">
          
          {/* Phase 1: General Trend */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[#1f3255] font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2096a8] rounded-full"></span>
                Annual Climate & Price Trend
              </h4>
              <div className="w-full h-72 bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
                {isLoadingChart ? (
                  <div>Loading Chart...</div>
                ) : (
                  <PlotlyChart chartData={chartData} />
                )}
              </div>
            </div>

            {/* Date Selection Box */}
            <div className="space-y-4 h-full flex flex-col">
              <h4 className="text-[#1f3255] font-bold">Plan Your Trip</h4>
              <div className="flex-grow p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[#1f3255] outline-none focus:ring-2 focus:ring-[#2096a8]/20"
                    placeholder="Select Arrival Date"
                  />
                </div>
                <button 
                  onClick={() => setHasAnalysisData(true)} // 測試用
                  className="w-full py-4 bg-[#1f3255] text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl"
                >
                  Get Advice
                </button>
              </div>
            </div>
          </section>

          {/* Phase 2: Detailed Analysis */}
          {hasAnalysisData && (
            <section className="pt-10 border-t border-dashed border-slate-200 animate-in fade-in zoom-in duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 圖表列 */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-tighter">Cancellation Risk</p>
                      <div className="h-48 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">Donut Chart</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-tighter">Market Demand</p>
                      <div className="h-48 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">Demand Bar</div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-80">
                    <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-tighter">Lead Time Analysis (Bubble)</p>
                    <div className="h-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">Bubble Chart</div>
                  </div>
                </div>

                {/* 建議列 */}
                <div className="lg:col-span-4 space-y-4">
                  <h5 className="text-[#1f3255] font-bold text-lg mb-4">Top 3 Recommendations</h5>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="group p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-[#2096a8] transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${i===1 ? 'bg-[#2096a8] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          Option {i}
                        </span>
                        <span className="text-[#2096a8] font-black text-lg">€ 120<span className="text-xs font-normal">/avg</span></span>
                      </div>
                      <p className="text-[#1f3255] font-bold text-lg">Book {i * 15} days before</p>
                      <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                        Risk: {i * 5}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}