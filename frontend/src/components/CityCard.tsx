import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { useEffect, useRef, useState } from "react";

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
}

export default function CityCard({
  cityObj
}: CityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflowing = textRef.current.scrollHeight > textRef.current.clientHeight;
        setShowButton(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [cityObj.short_description]);

  return (
    <div className="w-full bg-white/80! backdrop-blur-md border border-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(31,50,85,0.1)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(31,50,85,0.15)] mb-6">
      <div className="flex flex-col">
        
        {/* City Basic Info */}
        <div className="w-full p-8 justify-center border-b lg:border-b-0 lg:border-r border-slate-100">
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
          <div className="mt-4 relative">
            <p 
              ref={textRef}
              className={`text-slate-600 italic transition-all duration-500 ${isExpanded ? "" : "line-clamp-3"}`}
            >
              "{cityObj.short_description}"
            </p>
            
            {showButton && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-[#2096a8] text-xs font-bold uppercase tracking-widest hover:text-[#1f3255] transition-colors flex items-center gap-1"
              >
                {isExpanded ? (
                  <>Show Less <span className="text-[10px]">▲</span></>
                ) : (
                  <>Read More <span className="text-[10px]">▼</span></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Climate Guide */}
        <div className="w-full p-8 flex flex-col justify-between space-y-6">
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
            
            {/* Climate Figure */}
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
        </div>
      </div>
    </div>
  );
}