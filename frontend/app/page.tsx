"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

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
      
      // Redirect logged-in users to dashboard, non-logged-in users to login
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
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
      } else {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Show loading state while checking auth and redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-zinc-600 dark:text-zinc-400">
        {loading ? "로딩 중..." : user ? "대시보드로 이동 중..." : "로그인 페이지로 이동 중..."}
      </div>
    </div>
  );
}
