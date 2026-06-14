"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 재설정 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Stik
          </h1>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              비밀번호 재설정
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              가입하신 이메일 주소를 입력하시면<br />
              비밀번호 재설정 링크를 보내드립니다.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-teal-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-teal-800">
                      이메일이 전송되었습니다!
                    </p>
                    <p className="mt-1 text-sm text-teal-700">
                      {email}으로 비밀번호 재설정 링크를 보냈습니다.<br />
                      이메일을 확인해주세요.
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/login"
                className="block w-full text-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일 주소
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-500 to-blue-600 shadow-md hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "전송 중..." : "재설정 링크 보내기"}
              </button>

              <Link
                href="/login"
                className="block text-center text-sm text-gray-600 hover:text-teal-600 transition-colors"
              >
                ← 로그인으로 돌아가기
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
