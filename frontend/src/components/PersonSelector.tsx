import { useEffect, useRef, useState, type Ref } from "react";

type PersonSelectorProps = {
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  name?: string;
  ref?: Ref<any>;
}

const groups = [
  { key: "children", label: "Children (0-12)" },
  { key: "teenagers", label: "Teenagers (13-18)" },
  { key: "youngAdults", label: "Young Adults (19-40)" },
  { key: "adults", label: "Adults (41-65)" },
  { key: "seniors", label: "Seniors (66+)" }
];

const displayLabel = {
  children: 'Children',
  teenagers: 'Teenagers',
  youngAdults: 'Young Adults',
  adults: 'Adults',
  seniors: 'Seniors'
}

type Groupkey = keyof typeof displayLabel;

export default function PersonSelector({ value, onChange }: PersonSelectorProps) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({
    children: 0,
    teenagers: 0,
    youngAdults: 0,
    adults: 0,
    seniors: 0
  });
  const [display, setDisplay] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = (key: string, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  }

  useEffect(() => {
    onChange(counts);
    const display = Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => {
        const groupKey = key as Groupkey;
        return `${value} ${displayLabel[groupKey] || key}`
      })
      .join(', ');
    
    setDisplay(display);
  }, [counts])

  // 偵測文字長度控制文字大小
  useEffect(() => {
    setIsMultiline(display.length > 30);
  }, [display])

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
        className={`w-full !bg-white text-[#3C3C3C] px-6 py-5 rounded-lg max-h-[67px] ${isMultiline && display ? 'text-sm': 'text-lg'}`}
      >
        {display ? display : 'Click to select'}
      </button>

      {open && (
        <div className="absolute z-10 w-full bg-white border p-4 space-y-3 rounded-lg shadow-sm">
          {groups.map((group) => (
            <div key={group.key} className="flex justify-between items-center">
              <span className="w-3/5 !bg-white text-[#3C3C3C] text-base">{group.label}</span>
              <button
                type="button"
                onClick={() => {
                  handleChange(group.key, -1);
                }}
                className="w-6 h-6 flex justify-center items-center !bg-white text-[#646cff] !border-[#646cff] rounded-full hover:!bg-gray-200"
              >
                -
              </button>
              <span className="!bg-white text-[#3C3C3C]">{counts[group.key]}</span>
              <button
                type="button"
                onClick={() => {
                  handleChange(group.key, +1);
                }}
                className="w-6 h-6 flex justify-center items-center !bg-white text-[#646cff] !border-[#646cff] rounded-full hover:!bg-gray-200"
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