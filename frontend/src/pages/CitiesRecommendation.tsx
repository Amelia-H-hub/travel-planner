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


export default function CitiesRecommendation() {

  const location = useLocation();
  const inputData = location.state || {};

  // Recommended Cities
  const [recCities, setRecCities] = useState<City[]>([])

  // Climate Price Chart
  const [countryCache, setCountryCache] = useState<Record<string, any>>({});
  const [loadingCountries, setLoadingCountries] = useState<Record<string, boolean>>({});

  // Hotel Booking Strategy
  const [adviceCache, setAdviceCache] = useState<Record<string, any>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const [activeDatePerCity, setActiveDatePerCity] = useState<Record<string, string>>({});
  const [activeFlexPerCity, setActiveFlexPerCity] = useState<Record<string, boolean>>({});

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
      console.log("Fetch climate price plot:", result);

      if (result.status === "success") {
        setCountryCache(prev => ({
          ...prev,
          [country]: result.data.chart
        }));
      }
    } catch (error) {
      console.error("Fetch climate price error:", error);
    } finally {
      setLoadingCountries(prev => ({ ...prev, [country]: false }));
    }
  };

  const handleBookingAdvice = async (country_name: string, date: string, isFlexibleYear: boolean) => {
    const cacheKey = `${country_name}_${date}_${isFlexibleYear}`;    
    if (adviceCache[cacheKey] || isAnalyzing[cacheKey]) return;

    // Start analyzing
    setIsAnalyzing(prev => ({ ...prev, [cacheKey]: true }));
    const companion = inputData.companion;
    const req = {
      arrival_date: date,
      is_flexible_year: isFlexibleYear,
      companion: companion,
      country_name: country_name
    }

    // Trigger API
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommendation/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      const result = await res.json()
      console.log("Fetch booking advices:", result);

      if (result.code === 200) {
        setAdviceCache(prev => ({ ...prev, [cacheKey]: result.data }));
      }
    } catch (error) {
      console.error("Fetch booking advices error:", error);
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [cacheKey]: false }));
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
          <h2 className="text-[#1f3255] text-4xl font-bold tracking-tight">
            Your Next Adventure
          </h2>
          <p className="text-[#1f3255]/60 mt-2 text-lg font-medium">
            Based on your travel personality, we found these perfect matches.
          </p>
        </header>
        
        {/* City Cards */}
        <div className="relative z-10">
          {recCities.map((cityObj) => {
            const currentActiveDate = activeDatePerCity[cityObj.country];
            const currentIsFlexible = activeFlexPerCity[cityObj.country];
            const cacheKey = currentActiveDate 
              ? `${cityObj.country}_${currentActiveDate}_${currentIsFlexible}` 
              : null;

            return (
              <CityCard
                key={cityObj.city}
                companion={inputData.companion}
                cityObj={cityObj}
                onExpand={() => fetchMonthlyClimatePrice(cityObj.country, cityObj.climate_calendar)}
                chartData={countryCache[cityObj.country]}
                isLoadingChart={loadingCountries[cityObj.country]}
                onGetAdvice={(date, isFlexibleYear) => {
                  setActiveDatePerCity(prev => ({ ...prev, [cityObj.country]: date}));
                  setActiveFlexPerCity(prev => ({ ...prev, [cityObj.country]: isFlexibleYear}));
                  handleBookingAdvice(cityObj.country, date, isFlexibleYear)
                }}
                analysisData={cacheKey ? adviceCache[cacheKey] : null}
                isLoadingAdvice={cacheKey ? isAnalyzing[cacheKey] : false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}