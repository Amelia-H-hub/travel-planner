interface AdviceData {
  year: number;
  month: number;
  week_number: number;
  lt: number;
  risk: number;
  price: number;
  check_in: string;
  check_out: string;
  is_next_year?: boolean;
}

interface AdviceProp {
  advices: {
    best_cp?: AdviceData;
    month_priority?: AdviceData;
    lt_priority?: AdviceData;
  };
  formatPrice: any
}

export default function AdviceItem({advices, formatPrice}: AdviceProp) {

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

  const groupedAdvices: Record<string, { data: AdviceData; keys: string[] }> = {};

  Object.entries(advices).forEach(([key, val]) => {
    if (!val) return;

    const value = val as AdviceData;
    const id = `${value.check_in}_${value.lt}`;

    if (!groupedAdvices[id]) {
      groupedAdvices[id] = { data: value, keys: [key]};
    } else {
      groupedAdvices[id].keys.push(key)
    }
  })

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('en-US', {month: 'long'});
  }

  return (      
    <div className="flex flex-col gap-4">
      {Object.values(groupedAdvices).map((group, index) => {
        const {data, keys} = group;

        return (
          <div key={index} className="group relative p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-[#2096a8]/30 transition-all duration-500 flex flex-col justify-between">
            <div>
              {/* Label */}
              <div className="flex flex-wrap gap-2 mb-4">
                {keys.map(key => {
                  const cfg = config[key as keyof typeof config];
                  return (
                    <div key={key} className={`flex items-center gap-1.5 text-white text-[10px] font-black px-2.5 py-1.5 rounded-full ${cfg.color} shadow-md`}>
                      <span>{cfg.icon}</span>
                      <span className="whitespace-nowrap uppercase tracking-tighter">{cfg.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Value */}
              <div className="space-y-4">
                <div className="flex items-end justify-between border-t border-slate-50 pt-4">
                  <div className="flex flex-col items-start">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[#1f3255] text-[15px] font-medium">Trip in</span>
                      <span className="text-[#1f3255] font-black text-xl">
                        {getMonthName(data.month)} {data.year}
                      </span>
                    </div>
                    <p className="text-[#1f3255] text-[15px] font-medium mt-1">
                      Book <span className="text-[#2096a8] font-black text-xl">{data.lt} days</span> prior
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[#2096a8] font-black text-3xl leading-none">
                      {formatPrice(Math.round(data.price))}
                    </p>
                    <p className="text-[13px] text-slate-400 font-bold uppercase mt-1">Est. Avg Price</p>
                  </div>
                </div>

                {/* Risk */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[13px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">Risk Assessment</span>
                    <span className={`text-[16px] ${data.risk >= 0.7 ? "text-[#dc3545]" : (data.risk >= 0.3 ? "text-[#ffc107]" : "text-[#28a745]")}`}>
                      {(data.risk * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${data.risk >= 0.7 ? "bg-[#dc3545]!" : (data.risk >= 0.3 ? "bg-[#ffc107]!" : "bg-[#28a745]!")}`}
                      style={{ width: `${data.risk * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="mt-6 pt-3 border-t border-dashed border-slate-100 flex justify-between items-center">
               <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Suggested Stay</span>
               <span className="text-[15px] font-black text-[#1f3255]">{data.check_in} — {data.check_out}</span>
            </div>
          </div>
        );
      })}
    </div>
  )
}