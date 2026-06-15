"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import stockNames from "@/data/stock_names.json";

interface AlertHistory {
  id: string;
  ticker: string;
  timeframe: string;
  indicator: string;
  condition: string;
  trigger_price: number;
  signal_type: string;
  message: string;
  triggered_at: string;
  notification_sent: boolean;
}

export default function AlertHistoryPage() {
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    setUser(user);
    await fetchHistory(user.id);
  }

  async function fetchHistory(userId: string) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("alert_history")
        .select("*")
        .eq("user_id", userId)
        .order("triggered_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Failed to fetch alert history:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteHistoryItem(itemId: string) {
    if (!confirm("이 알림 기록을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("alert_history")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      // Remove from local state
      setHistory(history.filter(item => item.id !== itemId));
      alert("알림 기록이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete history item:", error);
      alert("알림 기록 삭제에 실패했습니다.");
    }
  }

  async function deleteAllHistory() {
    if (!user) return;

    if (!confirm("모든 알림 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("alert_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setHistory([]);
      alert("모든 알림 기록이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete all history:", error);
      alert("알림 기록 삭제에 실패했습니다.");
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    // 1분 미만이면 "방금 전", 그 외에는 정확한 날짜/시간 표시
    if (diffMins < 1) return "방금 전";
    
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  function getIndicatorName(indicator: string) {
    const names: Record<string, string> = {
      macd: "MACD",
      rsi: "RSI",
      bollinger: "볼린저 밴드",
      ma_cross: "이평선 크로스",
      ma_price_cross: "이평선 가격 돌파",
      disparity: "이격도",
      cci: "CCI",
      target_price: "목표가",
    };
    return names[indicator] || indicator;
  }

  function getTimeframeName(timeframe: string) {
    const names: Record<string, string> = {
      "1m": "1분봉",
      "3m": "3분봉",
      "5m": "5분봉",
      "10m": "10분봉",
      "15m": "15분봉",
      "30m": "30분봉",
      "1h": "1시간봉",
      "1d": "일봉",
      "1w": "주봉",
      "1M": "월봉",
    };
    return names[timeframe] || timeframe;
  }

  function getStockName(ticker: string) {
    // 종목 코드에서 .KS, .KQ 제거
    const code = ticker.replace('.KS', '').replace('.KQ', '');
    
    // JSON 파일에서 종목명 조회
    return (stockNames as Record<string, string>)[code] || ticker;
  }

  function getConditionName(condition: string) {
    const conditions: Record<string, string> = {
      "golden_cross": "골든크로스",
      "death_cross": "데드크로스",
      "above": "상향 돌파",
      "below": "하향 돌파",
      "overbought": "과매수",
      "oversold": "과매도",
      "upper_break": "상단 돌파",
      "lower_break": "하단 돌파",
      "above_ma": "이평선 상향 돌파",
      "below_ma": "이평선 하향 돌파",
      "buy": "매수",
      "sell": "매도",
    };
    return conditions[condition] || condition;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대시보드로 돌아가기
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">알림 히스토리</h1>
                <p className="text-sm text-gray-600">과거에 발생한 모든 알림 내역</p>
              </div>
            </div>
            
            {history.length > 0 && (
              <button
                onClick={deleteAllHistory}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                전체 삭제
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 font-medium">아직 발생한 알림이 없습니다</p>
              <p className="text-sm text-gray-500 mt-2">알림을 생성하고 조건이 충족되면 여기에 표시됩니다</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.signal_type === "buy"
                          ? "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {item.signal_type === "buy" ? "매수" : "매도"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.triggered_at)}
                      </span>
                      {!item.notification_sent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          전송 실패
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {getStockName(item.ticker)} {getTimeframeName(item.timeframe)} {getIndicatorName(item.indicator)} {item.condition && getConditionName(item.condition)}
                    </h3>
                    
                    <p className="text-sm text-gray-600">
                      발생 시점 가격: <span className="font-semibold text-gray-900">
                        {item.ticker.endsWith('.KS') || item.ticker.endsWith('.KQ')
                          ? `${item.trigger_price.toLocaleString()}원`
                          : `$${item.trigger_price.toLocaleString()}`}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                      item.signal_type === "buy"
                        ? "bg-teal-100 text-teal-600"
                        : "bg-red-100 text-red-600"
                    }`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {item.signal_type === "buy" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                        )}
                      </svg>
                    </div>
                    
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
                      title="삭제"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
