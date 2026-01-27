import Flatpickr from "react-flatpickr";
import { useState, useMemo, useEffect } from "react";
import { API_BASE_URL } from '@/constants';
import PlotlyChart from "../PlotlyChart";
import AdviceItem from "./AdviceItem";
import { Building2, Palmtree, Calendar, Rocket, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import countries from "i18n-iso-countries";
import { countries as countriesList } from 'countries-list';

interface BookingProp {
  country: string;
  companion: any;
}

export default function BookingStrategy({
    country,
    companion
  }: BookingProp) {
  const [rate, setRate] = useState(1); // currency transfer rate
  const [hotelType, setHotelType] = useState("City Hotel");
  const [selectedDate, setSelectedDate] = useState<string[]>([]);
  const [isFlexibleYear, setIsFlexibleYear] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const flatpickrOptions = useMemo(() => ({
    mode: "range" as const,
    dateFormat: "Y-m-d",
    closeOnSelect: false,
    minDate: "today",
    conjunction: " to "
  }), []);

  // Tranfer country name to ISO alpha-2
  const countryCode = useMemo(() =>  countries.getAlpha2Code(country, "en"), [country]);
  // Get currency
  const currencyCode = useMemo(() => {
    const info = countriesList[countryCode as keyof typeof countriesList];
    return info?.currency[0] || 'EUR';
  }, [countryCode]);

  useEffect(() => {
    if (currencyCode === 'EUR') {
      setRate(1);
      return;
    }
    
    fetch(`https://open.er-api.com/v6/latest/EUR`)
      .then(res => res.json())
      .then(data => {
        setRate(data.rates[currencyCode] || 1);
      })
      .catch(() => setRate(1));
  }, [currencyCode]);
  
  // AI insight config
  const insightConfig = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      textColor: "text-emerald-800",
      highlightColor: "text-emerald-900"
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      textColor: "text-amber-800",
      highlightColor: "text-amber-950"
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      textColor: "text-blue-800",
      highlightColor: "text-blue-950"
    }
  };

  // Transfer price based on currency
  const formatPrice = (priceInEur: number) => {
    const noDecimalCurrencies = ['TWD', 'JPY', 'KRW'];
    const isNoDecimal = noDecimalCurrencies.includes(currencyCode);

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: isNoDecimal ? 0 : 2,
      maximumFractionDigits: isNoDecimal ? 0 : 2,
    }).format(priceInEur * rate);
  };

  // render markdown format
  const renderMessage = (text: string, status: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    const config = insightConfig[status as keyof typeof insightConfig];
    const highlightClass = config?.highlightColor || "text-slate-900"

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong 
            key={index} 
            className={`font-black ${highlightClass} underline decoration-2 decoration-current/15 underline-offset-2`}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Get hotel booking advices
  const handleGetAdvice = async () => {
    if (selectedDate.length < 2) return alert("Please select both arrival and leave dates!");
    
    setIsLoadingAdvice(true);
    try {
      const req = {
        hotel: hotelType,
        arrival_date: selectedDate[0],
        leave_date: selectedDate[1],
        is_flexible_year: isFlexibleYear,
        companion: companion,
        country_name: country
      }

      const res = await fetch(`${API_BASE_URL}/api/recommendation/booking`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(req)
      });
      const result = await res.json();
      setAnalysisData(result.data);
    } catch (e) {
      console.error("Fetch booking advices error:", e);
    } finally {
      setIsLoadingAdvice(false);
    }
  };


  return (
  <div className="bg-white rounded-[40px] shadow-xl border border-white p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-[#1f3255] text-2xl font-black">Booking Intelligence</h3>
        <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          AI Prediction
        </div>
      </div>

      {/* Inputs */}
      <div className="bg-slate-50 p-6 rounded-[32px] space-y-6">
        {/* Hotel Type Selection */}
        <div className="space-y-3">
          <div className="flex flex-col ml-1">
            <label className="text-[16px] font-black text-[#2096a8] uppercase tracking-wider">
              Accommodation Style
            </label>
            <span className="text-[13px] text-slate-400">Choose your preferred stay for better AI accuracy</span>
          </div>
          
          <div className="grid grid-cols-2 bg-slate-200/50 p-1.5 rounded-2xl gap-2">
            <button 
              onClick={() => setHotelType("City Hotel")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                hotelType === "City Hotel" 
                ? "bg-white text-[#1f3255] shadow-sm scale-[1.02]" 
                : "text-slate-400 hover:text-slate-500"
              }`}
            >
              <Building2 className={`w-5 h-5 ${hotelType === "City Hotel" ? "text-[#2096a8]" : "text-slate-400"}`} />
              <div className="flex flex-col items-start">
                <span className="text-[14px] leading-tight">Urban Stay</span>
                <span className="text-[12px] opacity-60 font-medium">Business & Sightseeing</span>
              </div>
            </button>
            
            <button 
              onClick={() => setHotelType("Resort Hotel")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                hotelType === "Resort Hotel" 
                ? "bg-white text-[#1f3255] shadow-sm scale-[1.02]" 
                : "text-slate-400 hover:text-slate-500"
              }`}
            >
              <Palmtree className={`w-5 h-5 ${hotelType === "Resort Hotel" ? "text-[#2096a8]" : "text-slate-400"}`} />
              <div className="flex flex-col items-start">
                <span className="text-[14px] leading-tight">Holiday Resort</span>
                <span className="text-[12px] opacity-60 font-medium">Leisure & Vacation</span>
              </div>
            </button>
          </div>
        </div>

        {/* Date selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          {/* Stay Duration */}
          <div className="space-y-2">
            <label className="text-[14px] font-black text-[#2096a8] uppercase tracking-wider ml-1">
              Stay Duration
            </label>
            <Flatpickr 
              value={selectedDate} 
              options={flatpickrOptions}
              onChange={(_, dateStr) => setSelectedDate(dateStr ? dateStr.split(" to ") : [])}
              placeholder="Select Dates"
              className="w-full bg-white border-2 border-transparent focus:border-[#2096a8]/20 rounded-2xl p-4 text-md text-[#1f3255] font-bold shadow-sm outline-none transition-all"
            />
          </div>

          {/* Flexible Checkbox */}
          <div className="flex items-center h-[62px]">
            <label className="flex items-center gap-3 bg-white/50 border border-slate-200 w-full h-full px-4 rounded-2xl cursor-pointer hover:bg-white transition-all shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox" 
                  className="w-5 h-5 rounded-md border-slate-300 text-[#2096a8] focus:ring-[#2096a8]"
                  checked={isFlexibleYear} 
                  onChange={e => setIsFlexibleYear(e.target.checked)}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#1f3255]">Flexible Year</span>
                <span className="text-[11px] text-slate-400 leading-none">Compare prices across 2026</span>
              </div>
            </label>
          </div>
        </div>

        {/* Analyze button */}
        <button 
          onClick={handleGetAdvice}
          disabled={isLoadingAdvice || selectedDate.length < 2}
          className="w-full bg-[#1f3255] text-white py-4 rounded-2xl font-black text-lg 
                    hover:bg-[#2a4372] hover:shadow-xl hover:shadow-[#1f3255]/20 
                    transition-all transform active:scale-[0.98]
                    disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
        >
          {isLoadingAdvice ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Syncing with AI Models...</span>
            </>
          ) : (
            <>
              <span>Generate AI Strategy</span>
              <Rocket className="w-5 h-5 group-hover:animate-pulse" />
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {analysisData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* 1. Donut & ADR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center">
              <span className="text-[12px] font-bold text-slate-400 uppercase self-start mb-2">Cancel Risk</span>
              <div className="h-40 w-full flex justify-center">
                <PlotlyChart chartData={analysisData.donut_chart} />
              </div>
            </div>
            <div className="bg-[#e6f6f4] rounded-3xl p-6 flex flex-col justify-center items-center">
              <span className="text-[13px] font-bold text-[#2096a8]/60 uppercase mb-2">Estimated ADR</span>
              <div className="text-4xl font-black text-[#1f3255]">{formatPrice(analysisData.current_adr)}</div>
              <div className="text-[13px] mt-2 text-[#2096a8] font-bold">Avg. Daily Rate</div>
            </div>
          </div>

          {/* 2. Insight Message */}
          {analysisData.current_insight && (
            <div className={`p-5 rounded-3xl border transition-all duration-300 ${
              insightConfig[analysisData.current_insight.status as keyof typeof insightConfig]?.bgColor || 'bg-slate-50'
            } ${
              insightConfig[analysisData.current_insight.status as keyof typeof insightConfig]?.borderColor || 'border-slate-100'
            }`}>
              <div className="flex gap-4 items-start">
                <div className="shrink-0 mt-0.5">
                  {insightConfig[analysisData.current_insight.status as keyof typeof insightConfig]?.icon}
                </div>
                <p className={`text-[16px] font-semibold leading-relaxed ${
                  insightConfig[analysisData.current_insight.status as keyof typeof insightConfig]?.textColor || 'text-slate-700'
                }`}>
                  {renderMessage(analysisData.current_insight.message, analysisData.current_insight.status)}
                </p>
              </div>
            </div>
          )}
          
          <div className="p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[500px]">
            <p className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">
              Cancellation Risk vs. Price (Bubble Analysis)
            </p>
            <div className="flex-grow min-h-0">
                <PlotlyChart chartData={analysisData.bubble_chart} />
            </div>
          </div>

          {/* 3. Advices 1x3 */}
          <AdviceItem advices={analysisData.recommendations} formatPrice={formatPrice}/>
        </div>
      )}
    </div>
  )
}
