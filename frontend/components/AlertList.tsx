"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type Alert = {
  id: string;
  user_id: string;
  name: string;
  condition: any;
  parameters: any;
  is_active: boolean;
  enable_buy_signal: boolean;
  enable_sell_signal: boolean;
  created_at: string;
  updated_at: string;
};

type Symbol = {
  name: string;
  symbol: string;
  type: "stock" | "etf";
  market: string;
};

interface AlertListProps {
  alerts: Alert[];
  onAlertDeleted: () => void;
}

export default function AlertList({ alerts, onAlertDeleted }: AlertListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function loadSymbols() {
      try {
        const response = await fetch("/symbols.json");
        const symbols: Symbol[] = await response.json();
        const map = new Map<string, string>();
        symbols.forEach((s) => map.set(s.symbol, s.name));
        setSymbolMap(map);
      } catch (error) {
        console.error("Failed to load symbols:", error);
      }
    }

    loadSymbols();
  }, []);

  function getSymbolName(symbol: string): string {
    return symbolMap.get(symbol) || symbol;
  }

  function getTimeframeName(timeframe: string): string {
    const timeframeMap: Record<string, string> = {
      "1d": "일봉",
      "1w": "주봉",
      "1m": "월봉",
      "1h": "시간봉",
      "15m": "15분봉",
      "5m": "5분봉",
    };
    return timeframeMap[timeframe] || timeframe;
  }

  function getIndicatorName(indicator: string): string {
    const indicatorMap: Record<string, string> = {
      "target_price": "매수/매도가",
      "macd": "MACD",
      "ma_price_cross": "이평선 가격 돌파",
      "ma_cross": "이평선 크로스오버",
      "rsi": "RSI",
      "bollinger": "볼린저 밴드",
      "disparity": "Disparity",
      "cci": "CCI",
    };
    return indicatorMap[indicator] || indicator;
  }

  function getIndicatorDetails(indicator: string, parameters: any): string {
    if (!parameters) return "";

    switch (indicator) {
      case "target_price": {
        const parts: string[] = [];
        const targetPrice = parameters.target_price || parameters;
        if (targetPrice.buy_price) {
          parts.push(`매수: ${Number(targetPrice.buy_price).toLocaleString()}원`);
        }
        if (targetPrice.sell_price) {
          parts.push(`매도: ${Number(targetPrice.sell_price).toLocaleString()}원`);
        }
        return parts.length > 0 ? `매수/매도가(${parts.join(", ")})` : "매수/매도가";
      }
      case "macd": {
        const macdParams = parameters.macd || parameters;
        const fast = macdParams.fast || 12;
        const slow = macdParams.slow || 26;
        const signal = macdParams.signal || 9;
        return `MACD(${fast},${slow},${signal})`;
      }
      case "ma_price_cross": {
        const maParams = parameters.ma_price_cross || parameters;
        const period = maParams.period || 20;
        return `이평선 가격 돌파(${period}일)`;
      }
      case "ma_cross": {
        const maParams = parameters.ma || parameters;
        const short = maParams.short_period || 5;
        const long = maParams.long_period || 20;
        return `이평선 크로스오버(${short}/${long})`;
      }
      case "rsi": {
        const rsiParams = parameters.rsi || parameters;
        const period = rsiParams.period || 14;
        const oversold = rsiParams.oversold || 30;
        const overbought = rsiParams.overbought || 70;
        return `RSI(${period}, ${oversold}/${overbought})`;
      }
      case "bollinger": {
        const bollingerParams = parameters.bollinger || parameters;
        const period = bollingerParams.period || 20;
        const std = bollingerParams.std_dev || 2;
        return `볼린저 밴드(${period}, ${std})`;
      }
      case "disparity": {
        const disparityParams = parameters.disparity || parameters;
        const period = disparityParams.period || 5;
        const threshold = disparityParams.threshold || 10;
        return `Disparity(${period}, ±${threshold}%)`;
      }
      case "cci": {
        const cciParams = parameters.cci || parameters;
        const period = cciParams.period || 20;
        const threshold = cciParams.threshold || 100;
        return `CCI(${period}, ±${threshold})`;
      }
      default:
        return getIndicatorName(indicator);
    }
  }

  function getConditionName(enableBuy: boolean, enableSell: boolean): string {
    if (enableBuy && enableSell) {
      return "매수/매도 모두";
    } else if (enableBuy) {
      return "매수 알림";
    } else if (enableSell) {
      return "매도 알림";
    }
    return "알림 없음";
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("alerts").delete().eq("id", id);

      if (error) {
        throw error;
      }

      onAlertDeleted();
    } catch (err) {
      console.error("알림 삭제 중 오류:", err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("alerts")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) {
        throw error;
      }

      onAlertDeleted();
    } catch (err) {
      console.error("알림 상태 변경 중 오류:", err);
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">등록된 알림이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex-1">
                  {getSymbolName(alert.condition.symbol)} {alert.condition.indicator !== "target_price" && getTimeframeName(alert.condition.timeframe)} {getIndicatorDetails(alert.condition.indicator, alert.parameters)}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                    alert.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {alert.is_active ? "활성" : "비활성"}
                </span>
              </div>
              <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  <span className="font-medium">종목:</span> {getSymbolName(alert.condition.symbol)}
                </p>
                {alert.condition.indicator !== "target_price" && (
                  <p>
                    <span className="font-medium">주기:</span> {getTimeframeName(alert.condition.timeframe)}
                  </p>
                )}
                <p>
                  <span className="font-medium">알림 설정:</span> {getIndicatorDetails(alert.condition.indicator, alert.parameters)}
                </p>
                <p>
                  <span className="font-medium">조건:</span> {getConditionName(alert.enable_buy_signal ?? true, alert.enable_sell_signal ?? true)}
                </p>
              </div>
              <div className="mt-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  {new Date(alert.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleActive(alert.id, alert.is_active)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus:ring-zinc-600"
              >
                {alert.is_active ? "비활성화" : "활성화"}
              </button>
              <button
                onClick={() => handleDelete(alert.id)}
                disabled={deletingId === alert.id}
                className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:ring-red-600"
              >
                {deletingId === alert.id ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
