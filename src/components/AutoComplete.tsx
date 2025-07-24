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
  placeholder = "請輸入文字以查詢",
  onChange,
  onSearch,
  onSelect,
  displayFormat
}: AutoCompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
    
  //   setInputValue(value);

  //   if (value.trim() === "") {
  //     setFilteredSuggestions([]);
  //     return;
  //   }

  //   const filtered = suggestions.filter(s => 
  //     s.toLowerCase().includes(value.toLowerCase())
  //   );

  //   setFilteredSuggestions(filtered);
  // };

  useEffect(() => {
    if (inputValue.length > 1 && onSearch) {
      onSearch(inputValue).then(setFilteredSuggestions)
    }
  }, [inputValue]);

  const handleSelect = (value: any) => {
    onChange(value);
    setFilteredSuggestions([]);
    if (onSelect) {
      setInputValue(onSelect(value))
    };
  };

  return (
    <div className="relative w-full">
      <input 
        type="search"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        placeholder={placeholder}
        className="bg-white w-full text-[#3C3C3C] px-6 py-5 rounded-lg"
      >
      </input>
      {filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 max-h-[250px] overflow-scroll bg-white border border-gray-200 w-full rounded mt-1 shadow">
          {filteredSuggestions.map((item, index) => (
            <li
              key={index}
              className="p-2 text-black text-left hover:bg-gray-100 cursor-pointer"
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