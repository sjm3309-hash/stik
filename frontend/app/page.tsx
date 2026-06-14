"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import NotificationSetup from "@/components/NotificationSetup";
import AuthButton from "@/components/AuthButton";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      // Redirect logged-in users to dashboard
      if (user) {
        router.push("/dashboard");
      }
    }

    getUser();

    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Redirect on login
      if (session?.user) {
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Stik
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            알림을 설정하려면 먼저 로그인하세요.
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  // User is logged in, will redirect via useEffect
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-zinc-600 dark:text-zinc-400">대시보드로 이동 중...</div>
    </div>
  );
}
