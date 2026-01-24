import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from '@/constants';
import CityCard from "../components/CityCard";
import BookingStrategy from "../components/BookingStategy";

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


export default function CitiesRecommendation() {

  const location = useLocation();
  const inputData = location.state || {};

  // Recommended Cities
  const [recCities, setRecCities] = useState<City[]>([])

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#e0f2f1] via-[#f0f9ff] to-white">
      {/* 模擬雲層的柔光感 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#2096a8]/10 to-transparent pointer-events-none" />

      {/* 增加一點點動態的光暈，模擬陽光穿過雲層 */}
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-[#fff9c4]/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[-5%] w-[600px] h-[600px] bg-[#2096a8]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 pt-32 px-8 max-w-7xl mx-auto">
        <header className="mb-12">
          <h2 className="text-[#1f3255] text-[36px] lg:text-[52px] font-bold tracking-tight mb-2">
            Smart Destinations & Strategic Timing
          </h2>
          <p className="text-[14px] lg:text-[20px] text-slate-500 font-medium flex items-center justify-center gap-2">
            <span className="text-[#2096a8] font-bold">Where:</span> Discover top cities 
            <span className="text-slate-300">|</span>
            <span className="text-[#1f3255] font-bold">When:</span> Optimize your booking window
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cities list */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#2096a8] text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg shadow-[#2096a8]/20">1</div>
              <div>
                <h2 className="text-left text-2xl font-bold text-[#1f3255] leading-none">Where to go?</h2>
                <p className="text-[14px] text-slate-400 font-bold uppercase mt-1">Select a destination</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {recCities.map((cityObj) => {
                return (
                  <CityCard
                    key={cityObj.city}
                    cityObj={cityObj}
                  />
                );
              })}
            </div>
          </div>

          {/* Booking Strategy */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#1f3255] text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg shadow-[#1f3255]/20">2</div>
              <div>
                <h2 className="text-left text-2xl font-bold text-[#1f3255] leading-none">When to book?</h2>
                <p className="text-[14px] text-slate-400 font-bold uppercase mt-1">Optimize date & lead time</p>
              </div>
            </div>
            <BookingStrategy 
              country={inputData.nationality} 
              companion={inputData.companion} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}