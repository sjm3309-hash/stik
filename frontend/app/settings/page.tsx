"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserSettings {
  sound_enabled: boolean;
  vibrate_enabled: boolean;
  global_cooldown_minutes: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    sound_enabled: true,
    vibrate_enabled: true,
    global_cooldown_minutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
    await loadSettings(user.id);
  }

  async function loadSettings(userId: string) {
    try {
      const supabase = getSupabaseClient();
      
      // First check if profile exists
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw error;
      }
      
      if (data) {
        // Use default values if columns don't exist yet
        setSettings({
          sound_enabled: data.sound_enabled !== undefined ? data.sound_enabled : true,
          vibrate_enabled: data.vibrate_enabled !== undefined ? data.vibrate_enabled : true,
          global_cooldown_minutes: data.global_cooldown_minutes !== undefined ? data.global_cooldown_minutes : 0,
        });
      } else {
        // Profile doesn't exist, create it with defaults
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            subscription_type: "free",
            role: "user",
            sound_enabled: true,
            vibrate_enabled: true,
            global_cooldown_minutes: 0,
          });
        
        if (insertError) {
          console.error("Failed to create profile:", insertError);
        }
      }
    } catch (error: any) {
      console.error("Failed to load settings:", error);
      // Only show error if it's not a missing column error
      if (!error.message?.includes('column') && !error.message?.includes('does not exist')) {
        setMessage({ type: "error", text: "설정을 불러오는데 실패했습니다. DB 마이그레이션을 실행해주세요." });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          sound_enabled: settings.sound_enabled,
          vibrate_enabled: settings.vibrate_enabled,
          global_cooldown_minutes: settings.global_cooldown_minutes,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      setMessage({ type: "success", text: "설정이 저장되었습니다!" });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ type: "error", text: "설정 저장에 실패했습니다." });
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-2xl mx-auto px-4">
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
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">환경 설정</h1>
              <p className="text-sm text-gray-600">알림 설정 및 개인 환경 설정</p>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-4 rounded-lg border p-4 ${
            message.type === "success"
              ? "bg-teal-50 border-teal-200 text-teal-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Notification Sound */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">알림 소리</h3>
                <p className="text-sm text-gray-600 mt-1">
                  알림이 올 때 소리를 재생합니다
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, sound_enabled: !settings.sound_enabled })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  settings.sound_enabled ? "bg-teal-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.sound_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Vibration */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">알림 진동</h3>
                <p className="text-sm text-gray-600 mt-1">
                  알림이 올 때 기기를 진동시킵니다 (모바일)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, vibrate_enabled: !settings.vibrate_enabled })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  settings.vibrate_enabled ? "bg-teal-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.vibrate_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Global Cooldown */}
            <div className="pb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-1">중복 알림 제한</h3>
              <p className="text-sm text-gray-600 mb-3">
                같은 알림이 설정된 시간 동안 반복되지 않도록 제한합니다
              </p>
              <select
                value={settings.global_cooldown_minutes}
                onChange={(e) => setSettings({ ...settings, global_cooldown_minutes: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              >
                <option value={0}>제한 없음 (추세 변화마다 알림)</option>
                <option value={1}>1분</option>
                <option value={5}>5분</option>
                <option value={10}>10분</option>
                <option value={60}>1시간</option>
                <option value={1440}>1일</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                예: 5분으로 설정하면 같은 조건의 알림이 5분에 한 번만 발생합니다
              </p>
            </div>

            {/* Account Info */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">계정 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">이메일</span>
                  <span className="font-medium text-gray-900">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-500 to-blue-600 shadow-md hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  설정 저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
