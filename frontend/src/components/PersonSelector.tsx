import { useEffect, useRef, useState, useMemo, type Ref } from "react";

type PersonSelectorProps = {
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  name?: string;
  ref?: Ref<any>;
}

const groups = [
  { key: "babies", label: "Babies (0-2)" },
  { key: "children", label: "Children (3-11)" },
  { key: "adults", label: "Adults (12-64)" },
  { key: "seniors", label: "Seniors (65+)" }
];

const displayLabel = {
  babies: 'Babies',
  children: 'Children',
  adults: 'adults',
  seniors: 'Seniors'
}

type Groupkey = keyof typeof displayLabel;

export default function PersonSelector({ value, onChange }: PersonSelectorProps) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({
    babies: 0,
    children: 0,
    adults: 0,
    seniors: 0
  });
  // const [display, setDisplay] = useState("");
  // const [isMultiline, setIsMultiline] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  

  // Get value from parent Hook Form
  useEffect(() => {
    if (value && typeof value === 'object') {
      setCounts(value);
    }
  }, [value]);

  const handleChange = (key: string, delta: number) => {
    const newCounts = {
      ...counts,
      [key]: Math.max(0, (counts[key] || 0) + delta)
    }
    setCounts(newCounts);
    onChange(newCounts);
  }

  const handleInputChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    const newCounts = {
      ...counts,
      [key]: isNaN(numValue) ? 0 : Math.max(0, numValue)
    };
    setCounts(newCounts);
  }

  const displayText = useMemo(() => {
    return Object.entries(counts)
      .filter(([, val]) => val > 0)
      .map(([key, val]) => `${val} ${displayLabel[key as Groupkey] || key}`)
      .join(', ');
  }, [counts]);

  const isMultiline = displayText.length > 30;

  // useEffect(() => {
  //   const display = Object.entries(counts)
  //     .filter(([, value]) => value > 0)
  //     .map(([key, value]) => {
  //       const groupKey = key as Groupkey;
  //       return `${value} ${displayLabel[groupKey] || key}`
  //     })
  //     .join(', ');
    
  //   setDisplay(display);
  // }, [counts])

  // Change text size based on the length
  // useEffect(() => {
  //   setIsMultiline(display.length > 30);
  // }, [display])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      // contains()：是原生 DOM 方法，檢查某個元素是不是在另一個元素裡面
    };

    document.addEventListener('mousedown', handleClickOutside);
    // 在整個網頁 document 上監聽滑鼠點擊（mousedown）事件，不只限於 React 裡的元素。
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    // 在 useEffect 裡 return function 時，此 function 為 cleanup function
    // cleanup function 會在以下情況執行：
    //     1. 元件 unmount 時（例如頁面跳轉、條件渲染不顯示這個 component）
    //     2. 依賴值（dependencies）改變時（這時 useEffect 會重新執行，先清理舊的）
    // cleanup function 裡不可放非清理的行為，因為可能不會執行
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        value={value}
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen(!open);
        }}
        className={`w-full text-[#3C3C3C] px-6 py-5 bg-slate-200/60! !border-solid !border-1 !border-gray-500 rounded-lg max-h-[67px] ${isMultiline && displayText ? 'text-sm': 'text-lg'}`}
      >
        {displayText ? displayText : 'Click to select'}
      </button>

      {open && (
        <div className="absolute z-10 w-full bg-slate-200/60! border border-gray-500! p-4 space-y-3 rounded-lg shadow-sm">
          {groups.map((group) => (
            <div key={group.key} className="flex justify-between items-center">
              <span className="w-3/5 bg-transparent! text-[#3C3C3C] text-base">{group.label}</span>
              <button
                type="button"
                onClick={() => {
                  handleChange(group.key, -1);
                }}
                className="w-6 h-6 flex justify-center items-center bg-slate-200/60! text-[#646cff] !border-[#646cff] rounded-full hover:!bg-gray-200"
              >
                -
              </button>
              <input
                type="number"
                value={counts[group.key]}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleInputChange(group.key, e.target.value)}
                className="w-12 text-center border-b border-gray-600 focus:border-[#646cff] focus:outline-none bg-transparent text-[#3C3C3C]"
                min="0"
              >
              </input>
              <button
                type="button"
                onClick={() => {
                  handleChange(group.key, +1);
                }}
                className="w-6 h-6 flex justify-center items-center bg-slate-200/60! text-[#646cff] !border-[#646cff] rounded-full hover:!bg-gray-200"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )


}