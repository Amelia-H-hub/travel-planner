import { useEffect, useState, type Ref } from "react";

type AutoCompleteProps = {
  value: any;
  onChange: (value: any) => void;
  onSearch?: (input: any) => Promise<string[]>;
  onBlur?: () => void;
  name?: string;
  ref?: Ref<any>;
  placeholder?: string;
  onSelect?: (value: string) => any;
  displayFormat?: (item: any) => string;
}

export default function AutoComplete({
  value,
  placeholder = "請輸入文字以查詢",
  onChange,
  onSearch,
  onSelect,
  displayFormat
}: AutoCompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Get value from parent Hook Form
  useEffect(() => {
    // value is passed by parent component
    if (value && typeof value === 'object' && displayFormat) {
      const formatted = displayFormat(value);
      if (formatted !== inputValue) {
        setInputValue(formatted)
      }
    }
    // value is reseted by parent component
    else if (!value && inputValue !== "") {
      setInputValue("");
    }
  }, [value])

  useEffect(() => {
    // Don't search when user select an item or input characters less
    if (isSelecting || inputValue.length <= 1 || !onSearch) {
      setFilteredSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Debounce
    const timer = setTimeout(() => {
      onSearch(inputValue).then((results) => {
        // Check if user input value is exactly the same as the only option
        const isExactMatch = results.length === 1 && (displayFormat ? displayFormat(results[0]).toLowerCase(): results[0].toLowerCase()) === inputValue.toLowerCase();

        setFilteredSuggestions(results);
        if (results.length > 0 && !isExactMatch) {
          setShowDropdown(true);
        } else {
          setShowDropdown(false);
        }
      });
    }, 300)

    return () => clearTimeout(timer);
  }, [inputValue, onSearch, isSelecting]);

  const handleSelect = (item: any) => {
    setIsSelecting(true);
    setShowDropdown(false);
    // empty dropdown options
    setFilteredSuggestions([]);

    // inform Hook Form to update
    onChange(item);
    // update input value
    if (onSelect) {
      setInputValue(onSelect(item))
    };
  };

  const inputBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);

      const exactMatch = filteredSuggestions.find((item) => {
        const label = displayFormat ? displayFormat(item) : item;
        return label.toLowerCase() === inputValue.trim().toLowerCase();
      });

      if (exactMatch) {
        handleSelect(exactMatch);
      } else if (inputValue.trim() === "") {
        onChange(null);
      }
    }, 200);
  }

  return (
    <div className="relative w-full">
      <input 
        type="search"
        value={inputValue}
        onChange={(e) => {
          setIsSelecting(false);
          setInputValue(e.target.value);
        }}
        onBlur={inputBlur}
        placeholder={placeholder}
        className="w-full text-[#3C3C3C] px-6 py-5 bg-slate-200/60! rounded-lg border-solid border-1 border-gray-500!"
      >
      </input>
      {showDropdown && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 max-h-[250px] overflow-y-auto custom-scrollbar bg-slate-200/60! border border-gray-500! w-full rounded mt-1 shadow backdrop-blur-sm">
          {filteredSuggestions.map((item, index) => (
            <li
              key={index}
              className="p-2 text-[#3C3C3C] text-left hover:bg-white/30 cursor-pointer"
              onClick={() => handleSelect(item)}
            >
              {displayFormat ? displayFormat(item) : item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}