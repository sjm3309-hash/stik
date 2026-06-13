"use client";

import { useState, useRef, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import SymbolAutocomplete from "@/components/SymbolAutocomplete";

type Profile = {
  subscription_type: "free" | "premium";
  role?: "user" | "admin";
};

interface AlertFormProps {
  profile: Profile | null;
  alertCount: number;
  canAddAlert: boolean;
  onAlertCreated: () => void;
}

export default function AlertForm({ profile, alertCount, canAddAlert, onAlertCreated }: AlertFormProps) {
  const [symbolName, setSymbolName] = useState("????");
  const [symbolCode, setSymbolCode] = useState("005930.KS");
  const [isInitialSymbol, setIsInitialSymbol] = useState(true);
  const [stockInfo, setStockInfo] = useState<{ price: number; change: number; change_percent: number } | null>(null);
  const [loadingStockInfo, setLoadingStockInfo] = useState(false);
  const [timeframe, setTimeframe] = useState("1d");
  const [indicator, setIndicator] = useState("target_price");
  const [enableBuySignal, setEnableBuySignal] = useState(true);
  const [enableSellSignal, setEnableSellSignal] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showIndicatorSettings, setShowIndicatorSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parameters, setParameters] = useState<Record<string, any>>({
    disparity: { ma_period: 20, overheat: 105, chill: 95 },
    cci: { period: 14, upper: 100, lower: -100 },
    rsi: { period: 14, overbought: 70, oversold: 30 },
    bollinger: { period: 20, std_dev: 2 },
    macd: { fast: 12, slow: 26, signal: 9 },
    ma: { short_period: 20, long_period: 50 },
    ma_price_cross: { period: 20 },
    target_price: { buy_price: null, sell_price: null },
  });

  const [dayDropdownOpen, setDayDropdownOpen] = useState(false);
  const [minuteDropdownOpen, setMinuteDropdownOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("?");
  const [selectedMinute, setSelectedMinute] = useState("5");

  const dayDropdownRef = useRef<HTMLDivElement>(null);
  const minuteDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target as Node)) {
        setDayDropdownOpen(false);
      }
      if (minuteDropdownRef.current && !minuteDropdownRef.current.contains(event.target as Node)) {
        setMinuteDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleDaySelect(day: string) {
    setSelectedDay(day);
    setDayDropdownOpen(false);
    let timeframe = "1d";
    if (day === "?") timeframe = "1d";
    else if (day === "?") timeframe = "1w";
    else if (day === "?") timeframe = "1M";
    else if (day === "?") timeframe = "1Y";
    setTimeframe(timeframe);
  }

  function handleMinuteSelect(minute: string) {
    setSelectedMinute(minute);
    setMinuteDropdownOpen(false);
    setTimeframe(`${minute}m`);
  }

  function updateParameter(indicatorKey: string, paramKey: string, value: string | number | null) {
    setParameters((prev) => ({
      ...prev,
      [indicatorKey]: {
        ...prev[indicatorKey],
        [paramKey]: value,
      },
    }));
  }

  async function fetchStockInfo(symbol: string) {
    if (!symbol) {
      setStockInfo(null);
      return;
    }

    try {
      setLoadingStockInfo(true);
      const response = await fetch(`http://localhost:8000/api/stock/${symbol}`);
      
      if (response.ok) {
        const data = await response.json();
        setStockInfo(data);
      } else {
        setStockInfo(null);
      }
    } catch (err) {
      console.error("Failed to fetch stock info:", err);
      setStockInfo(null);
    } finally {
      setLoadingStockInfo(false);
    }
  }

  useEffect(() => {
    if (symbolCode) {
      fetchStockInfo(symbolCode);
    } else {
      setStockInfo(null);
    }
  }, [symbolCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!canAddAlert) {
      setError("?? ??? ?? 1?? ??? ??? ? ????. ?????? ????????.");
      setLoading(false);
      return;
    }

    if (!symbolCode) {
      setError("??? ??????.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("??? ?????.");
      }

      const { error } = await supabase.from("alerts").insert({
        user_id: user.id,
        name: `${symbolName} ${timeframe} ${indicator}`,
        condition: {
          symbol: symbolCode,
          timeframe,
          indicator,
          condition: "both",
        },
        enable_buy_signal: enableBuySignal,
        enable_sell_signal: enableSellSignal,
        ma_short_period: parameters.ma.short_period,
        ma_long_period: parameters.ma.long_period,
        parameters: parameters,
      });

      if (error) {
        throw error;
      }

      setShowAdvanced(false);
      setShowIndicatorSettings(false);
      onAlertCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "?? ?? ? ??? ??????.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            ?? ??
          </label>
          <SymbolAutocomplete
            value={symbolName}
            onChange={(name, code) => {
              setSymbolName(name);
              setSymbolCode(code);
              setIsInitialSymbol(false);
            }}
            onFocusCapture={() => {
              if (isInitialSymbol) {
                setSymbolName("");
                setSymbolCode("");
                setIsInitialSymbol(false);
              }
            }}
            placeholder="?? ?? (?: ????, Apple)"
          />
          
          {loadingStockInfo && (
            <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              ?? ??? ???? ?...
            </div>
          )}
          {stockInfo && !loadingStockInfo && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {symbolCode.endsWith('.KS') || symbolCode.endsWith('.KQ') 
                  ? `${stockInfo.price.toLocaleString()}?`
                  : `$${stockInfo.price.toLocaleString()}`}
              </span>
              <span className={`flex items-center gap-1 font-medium ${
                stockInfo.change >= 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {stockInfo.change >= 0 ? '?' : '?'} 
                {symbolCode.endsWith('.KS') || symbolCode.endsWith('.KQ')
                  ? `${Math.abs(stockInfo.change).toLocaleString()}?`
                  : `$${Math.abs(stockInfo.change).toLocaleString()}`}
                ({stockInfo.change >= 0 ? '+' : ''}{stockInfo.change_percent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {indicator !== 'target_price' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              ??
            </label>
            <div className="flex gap-2">
              <div ref={dayDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setDayDropdownOpen(!dayDropdownOpen);
                    setMinuteDropdownOpen(false);
                  }}
                  className={`w-20 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                    timeframe.includes('d') || timeframe.includes('w') || timeframe.includes('M') || timeframe.includes('Y')
                      ? "border-teal-500 bg-white text-teal-600 dark:border-teal-400 dark:bg-zinc-800 dark:text-teal-400"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {selectedDay}
                </button>
              {dayDropdownOpen && (
                <div className="absolute top-full left-0 z-20 mt-1 w-24 rounded-lg border-2 border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
                  {["?", "?", "?", "?"].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDaySelect(day)}
                      className="w-full px-3 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none transition-colors dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700"
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={minuteDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setMinuteDropdownOpen(!minuteDropdownOpen);
                  setDayDropdownOpen(false);
                }}
                className={`w-20 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                  timeframe.includes('m')
                    ? "border-teal-500 bg-white text-teal-600 dark:border-teal-400 dark:bg-zinc-800 dark:text-teal-400"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                {selectedMinute}?
              </button>
              {minuteDropdownOpen && (
                <div className="absolute top-full left-0 z-20 mt-1 w-24 rounded-lg border-2 border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden max-h-64 overflow-y-auto">
                  {["1", "3", "5", "10", "15", "30", "45", "60", "90", "120"].map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => handleMinuteSelect(minute)}
                      className="w-full px-3 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none transition-colors dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700"
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        <div>
          <label htmlFor="indicator" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            ?? ??
          </label>
          <select
            id="indicator"
            value={indicator}
            onChange={(e) => {
              const newIndicator = e.target.value;
              setIndicator(newIndicator);
              if (['target_price', 'ma_price_cross', 'ma_cross'].includes(newIndicator)) {
                setShowIndicatorSettings(true);
              }
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
          >
            <option value="target_price">???/???</option>
            <option value="macd">MACD</option>
            <option value="disparity">???</option>
            <option value="cci">CCI</option>
            <option value="ma_price_cross">??? ?? ??</option>
            <option value="ma_cross">??? ?????</option>
            <option value="rsi">RSI</option>
            <option value="bollinger">??? ??</option>
          </select>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowIndicatorSettings(!showIndicatorSettings)}
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showIndicatorSettings ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>?? ?? ??</span>
          </button>

          {showIndicatorSettings && (
            <div className="mt-3 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              {indicator === "target_price" && (
                <>
                  <div>
                    <label htmlFor="buy_price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ?? ??? ({symbolCode.endsWith('.KS') || symbolCode.endsWith('.KQ') ? '?' : '??'}) {!enableBuySignal && <span className="text-xs text-zinc-500">(???)</span>}
                    </label>
                    <input
                      id="buy_price"
                      type="text"
                      placeholder="?? ?? ??"
                      disabled={!enableBuySignal}
                      value={parameters.target_price.buy_price ? parameters.target_price.buy_price.toLocaleString() : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/,/g, '');
                        if (numericValue === '' || /^\d+(\.\d*)?$/.test(numericValue)) {
                          updateParameter("target_price", "buy_price", numericValue ? parseFloat(numericValue) : null);
                        }
                      }}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {parameters.target_price.buy_price && stockInfo && (
                      <p className={`mt-1 text-sm ${
                        ((parameters.target_price.buy_price - stockInfo.price) / stockInfo.price * 100) < 0 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ?? ?? {((parameters.target_price.buy_price - stockInfo.price) / stockInfo.price * 100).toFixed(2)}%
                        {((parameters.target_price.buy_price - stockInfo.price) / stockInfo.price * 100) < 0 ? ' ?? ??' : ' ?? ??'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="sell_price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ?? ??? ({symbolCode.endsWith('.KS') || symbolCode.endsWith('.KQ') ? '?' : '??'}) {!enableSellSignal && <span className="text-xs text-zinc-500">(???)</span>}
                    </label>
                    <input
                      id="sell_price"
                      type="text"
                      placeholder="?? ?? ??"
                      disabled={!enableSellSignal}
                      value={parameters.target_price.sell_price ? parameters.target_price.sell_price.toLocaleString() : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/,/g, '');
                        if (numericValue === '' || /^\d+(\.\d*)?$/.test(numericValue)) {
                          updateParameter("target_price", "sell_price", numericValue ? parseFloat(numericValue) : null);
                        }
                      }}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {parameters.target_price.sell_price && stockInfo && (
                      <p className={`mt-1 text-sm ${
                        ((parameters.target_price.sell_price - stockInfo.price) / stockInfo.price * 100) > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        ?? ?? {((parameters.target_price.sell_price - stockInfo.price) / stockInfo.price * 100).toFixed(2)}%
                        {((parameters.target_price.sell_price - stockInfo.price) / stockInfo.price * 100) > 0 ? ' ?? ??' : ' ?? ??'}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ???? ???? ?? ??? ?? ????. ? ? ??? ??? ?? ????.
                  </p>
                </>
              )}

              {indicator === "disparity" && (
                <>
                  <div>
                    <label htmlFor="disparity_ma_period" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ?? ??? ?? (?)
                    </label>
                    <input
                      id="disparity_ma_period"
                      type="number"
                      min="1"
                      max="200"
                      value={parameters.disparity.ma_period}
                      onChange={(e) => updateParameter("disparity", "ma_period", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="disparity_overheat" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ?? (%)
                    </label>
                    <input
                      id="disparity_overheat"
                      type="number"
                      min="100"
                      max="200"
                      value={parameters.disparity.overheat}
                      onChange={(e) => updateParameter("disparity", "overheat", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="disparity_chill" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ?? (%)
                    </label>
                    <input
                      id="disparity_chill"
                      type="number"
                      min="0"
                      max="100"
                      value={parameters.disparity.chill}
                      onChange={(e) => updateParameter("disparity", "chill", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                </>
              )}

              {indicator === "cci" && (
                <>
                  <div>
                    <label htmlFor="cci_period" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ??
                    </label>
                    <input
                      id="cci_period"
                      type="number"
                      min="1"
                      max="100"
                      value={parameters.cci.period}
                      onChange={(e) => updateParameter("cci", "period", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="cci_upper" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ??? ??
                    </label>
                    <input
                      id="cci_upper"
                      type="number"
                      min="0"
                      max="500"
                      value={parameters.cci.upper}
                      onChange={(e) => updateParameter("cci", "upper", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="cci_lower" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ??? ??
                    </label>
                    <input
                      id="cci_lower"
                      type="number"
                      min="-500"
                      max="0"
                      value={parameters.cci.lower}
                      onChange={(e) => updateParameter("cci", "lower", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                </>
              )}

              {indicator === "rsi" && (
                <>
                  <div>
                    <label htmlFor="rsi_period" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ??
                    </label>
                    <input
                      id="rsi_period"
                      type="number"
                      min="1"
                      max="100"
                      value={parameters.rsi.period}
                      onChange={(e) => updateParameter("rsi", "period", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="rsi_overbought" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ????
                    </label>
                    <input
                      id="rsi_overbought"
                      type="number"
                      min="50"
                      max="100"
                      value={parameters.rsi.overbought}
                      onChange={(e) => updateParameter("rsi", "overbought", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="rsi_oversold" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ????
                    </label>
                    <input
                      id="rsi_oversold"
                      type="number"
                      min="0"
                      max="50"
                      value={parameters.rsi.oversold}
                      onChange={(e) => updateParameter("rsi", "oversold", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                </>
              )}

              {indicator === "bollinger" && (
                <>
                  <div>
                    <label htmlFor="bollinger_period" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ??
                    </label>
                    <input
                      id="bollinger_period"
                      type="number"
                      min="1"
                      max="100"
                      value={parameters.bollinger.period}
                      onChange={(e) => updateParameter("bollinger", "period", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="bollinger_std_dev" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ????
                    </label>
                    <input
                      id="bollinger_std_dev"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={parameters.bollinger.std_dev}
                      onChange={(e) => updateParameter("bollinger", "std_dev", parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                </>
              )}

              {indicator === "macd" && (
                <>
                  <div>
                    <label htmlFor="macd_fast" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ??
                    </label>
                    <input
                      id="macd_fast"
                      type="number"
                      min="1"
                      max="50"
                      value={parameters.macd.fast}
                      onChange={(e) => updateParameter("macd", "fast", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="macd_slow" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ??
                    </label>
                    <input
                      id="macd_slow"
                      type="number"
                      min="1"
                      max="100"
                      value={parameters.macd.slow}
                      onChange={(e) => updateParameter("macd", "slow", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="macd_signal" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ????
                    </label>
                    <input
                      id="macd_signal"
                      type="number"
                      min="1"
                      max="50"
                      value={parameters.macd.signal}
                      onChange={(e) => updateParameter("macd", "signal", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                </>
              )}

              {indicator === "ma_price_cross" && (
                <>
                  <div>
                    <label htmlFor="ma_price_cross_period" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ??? ??
                    </label>
                    <input
                      id="ma_price_cross_period"
                      type="number"
                      min="1"
                      max="200"
                      value={parameters.ma_price_cross.period}
                      onChange={(e) => updateParameter("ma_price_cross", "period", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ?? ??? {parameters.ma_price_cross.period}? ?????? ??? ? ??? ????.
                  </p>
                </>
              )}

              {indicator === "ma_cross" && (
                <>
                  <div>
                    <label htmlFor="ma_short_period" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ?? ??? ??
                    </label>
                    <input
                      id="ma_short_period"
                      type="number"
                      min="1"
                      max="200"
                      value={parameters.ma.short_period}
                      onChange={(e) => updateParameter("ma", "short_period", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="ma_long_period" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ?? ??? ??
                    </label>
                    <input
                      id="ma_long_period"
                      type="number"
                      min="1"
                      max="200"
                      value={parameters.ma.long_period}
                      onChange={(e) => updateParameter("ma", "long_period", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            ?? ??
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEnableBuySignal(!enableBuySignal)}
              className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                enableBuySignal
                  ? "border-teal-500 bg-teal-50 text-teal-600 dark:border-teal-400 dark:bg-teal-900/20 dark:text-teal-400"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              ??
            </button>
            <button
              type="button"
              onClick={() => setEnableSellSignal(!enableSellSignal)}
              className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                enableSellSignal
                  ? "border-red-600 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              ??
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            ? ? ?????, ??? ??? ? ????
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !canAddAlert}
          className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg"
        >
          {loading ? "?? ?? ?..." : "?? ??"}
        </button>

        {profile?.subscription_type === "free" && alertCount >= 1 && (
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            ?? ??? ?? 1?? ??? ??? ? ????.
          </p>
        )}
      </form>
    </div>
  );
}
