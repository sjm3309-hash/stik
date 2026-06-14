"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import TermsModal from "@/components/TermsModal";
import { ServiceTermsContent, PrivacyTermsContent, PushTermsContent } from "@/components/TermsContent";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 약관 동의 상태
  const [allAgreed, setAllAgreed] = useState(false);
  const [serviceTerms, setServiceTerms] = useState(false);
  const [privacyTerms, setPrivacyTerms] = useState(false);
  const [pushTerms, setPushTerms] = useState(false);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"service" | "privacy" | "push">("service");

  // 전체 동의 토글
  function handleAllAgreedToggle() {
    const newValue = !allAgreed;
    setAllAgreed(newValue);
    setServiceTerms(newValue);
    setPrivacyTerms(newValue);
    setPushTerms(newValue);
  }

  // 개별 약관 체크 시 전체 동의 상태 업데이트
  function handleIndividualCheck(
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    value: boolean
  ) {
    setter(value);
    // 다음 렌더링에서 전체 동의 상태 확인
    setTimeout(() => {
      const service = setter === setServiceTerms ? value : serviceTerms;
      const privacy = setter === setPrivacyTerms ? value : privacyTerms;
      const push = setter === setPushTerms ? value : pushTerms;
      setAllAgreed(service && privacy && push);
    }, 0);
  }

  // 모달 열기
  function openModal(type: "service" | "privacy" | "push") {
    setModalType(type);
    setModalOpen(true);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 약관 동의 확인
    if (!serviceTerms || !privacyTerms || !pushTerms) {
      setError("모든 필수 약관에 동의해주세요.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      
      // 1. 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("회원가입에 실패했습니다.");
      }

      // 2. 프로필 생성 (약관 동의 정보 포함)
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        subscription_type: "free",
        role: "user",
        terms_agreed: true,
        privacy_agreed: true,
        push_agreed: true,
        agreed_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // 프로필 생성 실패해도 회원가입은 성공했으므로 진행
      }

      router.push("/login?message=회원가입이 완료되었습니다. 로그인해주세요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <a href="/login" className="font-medium text-teal-600 hover:text-teal-500">
              로그인
            </a>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* 약관 동의 섹션 */}
          <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
            {/* 전체 동의 */}
            <div className="pb-3 border-b-2 border-gray-300">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={allAgreed}
                  onChange={handleAllAgreedToggle}
                  className="w-5 h-5 text-teal-600 border-2 border-gray-400 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer"
                />
                <span className="ml-3 text-base font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                  전체 동의하기
                </span>
              </label>
            </div>

            {/* 개별 약관 */}
            <div className="space-y-2.5">
              {/* 서비스 이용약관 */}
              <div className="flex items-center justify-between group">
                <label className="flex items-center cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={serviceTerms}
                    onChange={(e) => handleIndividualCheck(setServiceTerms, e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="ml-2.5 text-sm text-gray-700">
                    <span className="text-red-600 font-semibold">[필수]</span> Stik 서비스 이용약관 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => openModal("service")}
                  className="ml-2 text-gray-400 hover:text-teal-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 개인정보 수집 및 이용 동의 */}
              <div className="flex items-center justify-between group">
                <label className="flex items-center cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={privacyTerms}
                    onChange={(e) => handleIndividualCheck(setPrivacyTerms, e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="ml-2.5 text-sm text-gray-700">
                    <span className="text-red-600 font-semibold">[필수]</span> 개인정보 수집 및 이용 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => openModal("privacy")}
                  className="ml-2 text-gray-400 hover:text-teal-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 푸시 알림 수신 동의 */}
              <div className="flex items-center justify-between group">
                <label className="flex items-center cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={pushTerms}
                    onChange={(e) => handleIndividualCheck(setPushTerms, e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="ml-2.5 text-sm text-gray-700">
                    <span className="text-red-600 font-semibold">[필수]</span> 앱 푸시 및 야간 알림 수신 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => openModal("push")}
                  className="ml-2 text-gray-400 hover:text-teal-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !serviceTerms || !privacyTerms || !pushTerms}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-teal-500 to-blue-600 shadow-md hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </div>
        </form>
      </div>

      {/* 약관 모달 */}
      <TermsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === "service"
            ? "Stik 서비스 이용약관"
            : modalType === "privacy"
            ? "개인정보 수집 및 이용"
            : "푸시 알림 및 야간 알림 수신"
        }
        content={
          modalType === "service" ? (
            <ServiceTermsContent />
          ) : modalType === "privacy" ? (
            <PrivacyTermsContent />
          ) : (
            <PushTermsContent />
          )
        }
      />
    </div>
  );
}
