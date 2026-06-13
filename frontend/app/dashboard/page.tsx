"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import AuthButton from "@/components/AuthButton";
import AlertForm from "@/components/AlertForm";
import AlertList from "@/components/AlertList";
import NotificationSetup from "@/components/NotificationSetup";

type Profile = {
  id: string;
  user_id: string;
  subscription_type: "free" | "premium";
  role?: "user" | "admin";
};

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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadData() {
      const supabase = getSupabaseClient();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profileData) {
        // Create default profile
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, subscription_type: "free" })
          .select()
          .single();
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }

      // Load alerts
      const { data: alertsData } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setAlerts(alertsData || []);
      setLoading(false);
    }

    loadData();
  }, [refreshKey]);

  function handleAlertCreated() {
    setRefreshKey((prev) => prev + 1);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">로딩 중...</div>
      </div>
    );
  }

  const alertCount = alerts.length;
  const canAddAlert = profile?.role === "admin" || profile?.subscription_type === "premium" || alertCount < 1;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <NotificationSetup />
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Stik 대시보드</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user?.email} ({profile?.subscription_type === "premium" ? "프리미엄" : "무료"})
            </span>
            <AuthButton />
          </div>
        </div>
      </header>
      <main className="flex flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
                알림 추가
              </h2>
              <AlertForm
                profile={profile}
                alertCount={alertCount}
                canAddAlert={canAddAlert}
                onAlertCreated={handleAlertCreated}
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
                내 알림 ({alertCount})
              </h2>
              <AlertList
                alerts={alerts}
                onAlertDeleted={handleAlertCreated}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
