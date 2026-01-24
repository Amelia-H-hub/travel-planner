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
}

export default function CityCard({
  cityObj
}: CityCardProps) {
  return (
    <div className="w-full bg-white/80! backdrop-blur-md border border-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(31,50,85,0.1)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(31,50,85,0.15)] mb-6">
      
      {/* 橫式主體區 */}
      <div className="flex flex-col">
        
        {/* 左側：城市照片或大標題區 (可根據需求加入圖片) */}
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
          <p className="text-slate-600 mt-4 italic line-clamp-3">"{cityObj.short_description}"</p>
        </div>

        {/* 右側：氣候指南與按鈕 */}
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
        </div>
      </div>
    </div>
  );
}