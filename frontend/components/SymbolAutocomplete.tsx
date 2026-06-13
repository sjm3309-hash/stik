"use client";

import { useState, useEffect, useRef } from "react";

type Symbol = {
  name: string;
  symbol: string;
  type: "stock" | "etf";
  market: string;
};

interface SymbolAutocompleteProps {
  value: string;
  onChange: (value: string, symbol: string) => void;
  placeholder?: string;
  onFocusCapture?: () => void;
}

export default function SymbolAutocomplete({ value, onChange, placeholder = "종목 검색", onFocusCapture }: SymbolAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Symbol[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // value prop이 변경되면 query 업데이트
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    async function loadSymbols() {
      try {
        const response = await fetch("/symbols.json");
        const symbols: Symbol[] = await response.json();
        setSuggestions(symbols);
      } catch (error) {
        console.error("Failed to load symbols:", error);
      }
    }

    loadSymbols();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = query
    ? suggestions.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.symbol.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  }

  function handleSelect(symbol: Symbol) {
    setQuery(symbol.name);
    onChange(symbol.name, symbol.symbol);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || filteredSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0) {
        handleSelect(filteredSuggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onFocusCapture={onFocusCapture}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {filteredSuggestions.map((symbol, index) => (
            <div
              key={symbol.symbol}
              onClick={() => handleSelect(symbol)}
              className={`cursor-pointer px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                index === selectedIndex ? "bg-zinc-100 dark:bg-zinc-800" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{symbol.name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{symbol.symbol}</span>
              </div>
              <div className="text-xs text-zinc-400 dark:text-zinc-500">
                {symbol.market} · {symbol.type === "stock" ? "주식" : "ETF"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
