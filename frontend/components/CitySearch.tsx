import { useState, useEffect, useRef, useCallback } from "react";
import { CitySearchResult } from "../types/weather";

interface CitySearchProps {
  onSelect: (city: string) => void;
  loading: boolean;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export default function CitySearch({ onSelect, loading }: CitySearchProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [suggestions, setSuggestions] = useState<CitySearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [fetching, setFetching] = useState<boolean>(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setFetching(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
      const data: CitySearchResult[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setFetching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (city: CitySearchResult) => {
    const label = `${city.name}, ${city.country}`;
    setInputValue(label);
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    onSelect(label);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (inputValue.trim()) onSelect(inputValue.trim());
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else if (inputValue.trim()) {
        setShowDropdown(false);
        onSelect(inputValue.trim());
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      handleSelect(suggestions[activeIndex]);
    } else if (inputValue.trim()) {
      setShowDropdown(false);
      onSelect(inputValue.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
      <div className="relative flex gap-3" ref={wrapperRef}>
        {/* Input wrapper */}
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontSize: 18 }}>
            {fetching ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
                <path d="M12 2A10 10 0 0 1 22 12" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <line x1="12.5" y1="12.5" x2="16" y2="16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </span>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search city (e.g. Berlin, Tokyo, New York…)"
            autoComplete="off"
            className="w-full pl-12 pr-4 py-4 rounded-2xl font-body text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:ring-2 focus:ring-white/20"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: `1px solid ${showDropdown ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`,
              backdropFilter: "blur(20px)",
              borderRadius: showDropdown ? "16px 16px 0 0" : "16px",
              transition: "border-color 0.2s, border-radius 0.15s",
            }}
          />

          {/* Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 z-50 overflow-hidden"
              style={{
                top: "100%",
                background: "rgba(18, 18, 28, 0.97)",
                backdropFilter: "blur(40px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderTop: "none",
                borderRadius: "0 0 16px 16px",
              }}
            >
              {suggestions.map((city, i) => (
                <li
                  key={city.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={() => handleSelect(city)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-100"
                  style={{
                    background: i === activeIndex ? "rgba(255,255,255,0.08)" : "transparent",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  {/* Pin icon */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                    <path d="M7 1C4.8 1 3 2.8 3 5C3 8 7 13 7 13C7 13 11 8 11 5C11 2.8 9.2 1 7 1ZM7 6.5C6.2 6.5 5.5 5.8 5.5 5C5.5 4.2 6.2 3.5 7 3.5C7.8 3.5 8.5 4.2 8.5 5C8.5 5.8 7.8 6.5 7 6.5Z" fill="white"/>
                  </svg>

                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white font-body block truncate">
                      {city.name}
                      {city.region ? (
                        <span className="text-white/40 font-normal">, {city.region}</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-white/35 font-body">{city.country}</span>
                  </div>

                  {/* Coordinates badge */}
                  <span
                    className="text-xs font-body flex-shrink-0"
                    style={{
                      color: "rgba(255,255,255,0.25)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {city.lat.toFixed(1)}°, {city.lon.toFixed(1)}°
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search button */}
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="px-6 py-4 rounded-2xl font-semibold text-sm font-body transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #FF6B6B, #FFE66D)",
            color: loading ? "rgba(255,255,255,0.5)" : "#0A0A0F",
            border: "none",
            alignSelf: "flex-start",
          }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Searching
            </span>
          ) : "Search"}
        </button>
      </div>
    </form>
  );
}