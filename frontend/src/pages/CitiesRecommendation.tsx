import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from '@/constants';
import CityCard from "@/components/CityCard";

interface Companion {
  babies: number;
  children: number;
  adults: number;
  seniors: number;
}

interface CityRecommendInfo {
  age: number;
  gender: string;
  nationality: string;
  region: string;
  companion: Companion;
  budget: string;
}

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

interface MonthPriceInfo {
  country: string
  climate_calendar: ClimateCalendar
}

export default function CitiesRecommendation() {

  const location = useLocation();
  const inputData = location.state || {};

  const [recCities, setRecCities] = useState<City[]>([])
  const [climatePriceChartData, setClimatePriceChartData] = useState<any>(null);
  const [countryCache, setCountryCache] = useState<Record<string, any>>({});
  const [loadingCountries, setLoadingCountries] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("Input Data Received:", inputData);
    getRecommendedCities(inputData);
  }, [])

  const getRecommendedCities = async (data: CityRecommendInfo) => {
    const res = await fetch(`${API_BASE_URL}/api/recommendation/cities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const cities = await res.json();
    console.log("Recommended Cities:", cities.data);
    setRecCities(cities.data || []);
  }

  const handleBookingStrategy = async (data: any) => {
    console.log(data)
  }

  const fetchMonthlyClimatePrice = async (country: string, climate_calendar: ClimateCalendar) => {
    // Check if already had this country's data
    if (countryCache[country]) {
      console.log(`Using cached data for ${country}`);
      return;
    }

    // Avoid sending the same country request at the same time
    if (loadingCountries[country]) return;
    
    setLoadingCountries(prev => ({ ...prev, [country]: true }));

    try {
      const data = {
        country: country,
        climate_calendar: climate_calendar
      }
      
      const res = await fetch(`${API_BASE_URL}/api/recommendation/get_monthly_climate_price` , {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      console.log("Fetch Climate Price Plot:", result);

      if (result.status === "success") {
        setCountryCache(prev => ({
          ...prev,
          [country]: result.data.chart
        }));
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoadingCountries(prev => ({ ...prev, [country]: true}));
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#e0f2f1] via-[#f0f9ff] to-white"> {/* 溫和的淺灰藍底色 */}
      {/* 模擬雲層的柔光感 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#2096a8]/10 to-transparent pointer-events-none" />

      {/* 增加一點點動態的光暈，模擬陽光穿過雲層 */}
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-[#fff9c4]/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[-5%] w-[600px] h-[600px] bg-[#2096a8]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 pt-32 px-8 max-w-7xl mx-auto">
        <header className="mb-12">
          <h2 className="text-[#1f3255] text-4xl font-bold tracking-tight">Your Next Adventure</h2>
          <p className="text-[#1f3255]/60 mt-2 text-lg font-medium">Based on your travel personality, we found these perfect matches.</p>
        </header>
        
        {/* 使用 Grid 佈局，自動處理 RWD */}
        <div className="relative z-10">
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> */}
            {recCities.map((cityObj) => (
              <CityCard
                key={cityObj.city}
                cityObj={cityObj}
                chartData={countryCache[cityObj.country]}
                isLoadingChart={loadingCountries[cityObj.country]}
                onExpand={() => fetchMonthlyClimatePrice(cityObj.country, cityObj.climate_calendar)}
              />
              // <div className="bg-white/80 backdrop-blur-md border border-white rounded-3xl overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(31,50,85,0.1)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(31,50,85,0.15)] hover:-translate-y-1">
              //   <div className="p-8 space-y-6 flex-grow">
                  
              //     {/* 標題區：使用深藍色 (#1f3255) 維持視覺一致性 */}
              //     <div className="flex justify-between items-start">
              //       <div className="space-y-1">
              //         <h3 className="text-3xl font-extrabold text-[#1f3255] tracking-tight leading-tight">
              //           {cityObj.city}
              //         </h3>
              //         <p className="text-[#1f3255]/60 text-base flex items-center gap-2 font-medium">
              //           <span className="text-[#2096a8]">📍</span> {cityObj.country}
              //         </p>
              //       </div>
              //       <span className="bg-[#2096a8] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              //         {cityObj.budget_level}
              //       </span>
              //     </div>

              //     {/* 描述區：字體加大，顏色選用深灰藍，閱讀起來最舒服 */}
              //     <p className="text-slate-600 text-base leading-relaxed font-normal italic line-clamp-4">
              //       "{cityObj.short_description}"
              //     </p>

              //     {/* 氣候區：顯示月份數字 */}
              //     <div className="space-y-4 pt-4 border-t border-slate-100">
              //       <div className="flex justify-between items-center">
              //         <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Climate Guide</p>
              //         <div className="flex gap-2">
              //           <div className="flex items-center gap-1 text-[10px] text-slate-400">
              //             <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>Cold
              //           </div>
              //           <div className="flex items-center gap-1 text-[10px] text-slate-400">
              //             <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Cool
              //           </div>
              //           <div className="flex items-center gap-1 text-[10px] text-slate-400">
              //             <span className="w-1.5 h-1.5 rounded-full bg-[#2096a8]"></span>Best
              //           </div>
              //           <div className="flex items-center gap-1 text-[10px] text-slate-400">
              //             <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]"></span>Hot
              //           </div>
              //         </div>
              //       </div>
                    
              //       <div className="flex gap-2 h-8 items-end">
              //         {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
              //           const isHot = cityObj.climate_calendar.Hot.some(item => item.month === m);
              //           const isPleasant = cityObj.climate_calendar.Pleasant.some(item => item.month === m);
              //           const isCool = cityObj.climate_calendar.Cool.some(item => item.month === m);
              //           const isCold = cityObj.climate_calendar.Cold.some(item => item.month === m);

              //           let bgColor = "bg-slate-100"; // 預設淺灰
              //           if (isHot) bgColor = "bg-[#f43f5e]";
              //           else if (isPleasant) bgColor = "bg-[#2096a8]";
              //           else if (isCool) bgColor = "bg-slate-400";
              //           else if (isCold) bgColor = "bg-blue-300";

              //           return (
              //             <div key={m} className="flex-1 flex flex-col items-center gap-1.5">
              //               <div className={`w-full h-2 rounded-full ${bgColor}`} />
              //               <span className={`text-[10px] font-bold ${(isPleasant || isHot) ? 'text-[#1f3255]' : 'text-slate-300'}`}>
              //                 {m}
              //               </span>
              //             </div>
              //           );
              //         })}
              //       </div>
              //     </div>
              //   </div>

              //   {/* 按鈕區 */}
              //   <div className="p-8 pt-0">
              //     <button 
              //       onClick={() => fetchMonthlyClimatePrice(cityObj.country, cityObj.climate_calendar)}
              //       className="w-full py-4 bg-[#2096a8] hover:bg-[#1a7d8c] text-white rounded-2xl text-base font-bold transition-all shadow-lg shadow-[#2096a8]/20 active:scale-[0.98]"
              //     >
              //       🏨 Hotel Booking Strategy
              //     </button>
              //   </div>

              //   {/* 展開區域容器 */}
              //   <div className="mt-4 bg-slate-50/50 border-t border-slate-100 p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                  
              //     {/* Phase 1: General Trend */}
              //     <section className="space-y-4">
              //       <h4 className="text-[#1f3255] font-bold flex items-center gap-2">
              //         <span className="w-1.5 h-6 bg-[#2096a8] rounded-full"></span>
              //         Annual Climate & Price Trend
              //       </h4>
              //       <div className="w-full h-64 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              //         {/* 這裡放你的 Climate vs. Price 圖表組件 */}
              //         <div className="flex items-center justify-center h-full text-slate-300">Trend Chart Placeholder</div>
              //       </div>

              //       {/* Date Selection Row */}
              //       <div className="flex flex-col md:flex-row items-end gap-4 p-6 bg-[#2096a8]/5 rounded-2xl">
              //         <div className="flex-1 space-y-2">
              //           <label className="text-[10px] uppercase tracking-widest text-[#2096a8] font-extrabold">Step 2: Pick Your Arrival Date</label>
              //           <Flatpickr 
              //             options={{ dateFormat: "Y-m-d" }}
              //             className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[#1f3255] focus:ring-2 focus:ring-[#2096a8] outline-none"
              //             placeholder="Select Date..."
              //           />
              //         </div>
              //         <button className="px-8 py-3 bg-[#2096a8] text-white font-bold rounded-xl hover:bg-[#1a7d8c] transition-all shadow-lg shadow-[#2096a8]/20">
              //           Analyze Booking Strategy
              //         </button>
              //       </div>
              //     </section>

              //     {/* Phase 2: Detailed Analysis (Conditional Rendering) */}
              //     {hasAnalysisData && (
              //       <section className="pt-8 border-t border-dashed border-slate-200 animate-in fade-in zoom-in duration-700">
              //         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
              //           {/* Left: Visualization (7 columns) */}
              //           <div className="lg:col-span-7 space-y-6">
              //             <div className="grid grid-cols-2 gap-4">
              //               {/* Donut Chart */}
              //               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              //                 <p className="text-xs font-bold text-slate-400 mb-4">CANCELLATION RISK</p>
              //                 <div className="h-40 bg-slate-50 rounded-full mx-auto aspect-square"></div> {/* Placeholder */}
              //               </div>
              //               {/* Some Other Metric */}
              //               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              //                 <p className="text-xs font-bold text-slate-400 mb-4">MARKET DEMAND</p>
              //                 <div className="h-40 flex items-end gap-2">
              //                     <div className="flex-1 bg-slate-100 h-[40%] rounded-t-sm"></div>
              //                     <div className="flex-1 bg-[#2096a8]/40 h-[70%] rounded-t-sm"></div>
              //                     <div className="flex-1 bg-[#2096a8] h-[90%] rounded-t-sm"></div>
              //                 </div>
              //               </div>
              //             </div>
              //             {/* Bubble Chart (Full Width) */}
              //             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-64">
              //               <p className="text-xs font-bold text-slate-400 mb-4">LEAD TIME VS. RISK BUBBLE ANALYSIS</p>
              //               {/* Bubble Chart Component Here */}
              //             </div>
              //           </div>

              //           {/* Right: Advice (5 columns) */}
              //           <div className="lg:col-span-5 space-y-4">
              //             <h5 className="text-[#1f3255] font-bold">Recommended Strategies</h5>
              //             {[1, 2, 3].map((i) => (
              //               <div key={i} className="group p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-[#2096a8] transition-all cursor-default">
              //                 <div className="flex justify-between items-start mb-2">
              //                   <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500">Option {i}</span>
              //                   <span className="text-[#2096a8] font-bold text-sm">$ 120 / night</span>
              //                 </div>
              //                 <p className="text-[#1f3255] font-bold">Book {i * 15} days in advance</p>
              //                 <p className="text-xs text-slate-500 mt-1">Expected cancellation risk: {i * 5}%</p>
              //               </div>
              //             ))}
              //           </div>
              //         </div>
              //       </section>
              //     )}
              //   </div>
              // </div>
            ))}
          {/* </div> */}
        </div>
      </div>
    </div>
  );
}