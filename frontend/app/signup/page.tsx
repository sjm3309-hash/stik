"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import TermsModal from "@/components/TermsModal";
import { ServiceTermsContent, PrivacyTermsContent, PushTermsContent } from "@/components/TermsContent";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

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
        console.error("Error details:", {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        // 프로필 생성 실패해도 회원가입은 성공했으므로 진행
      } else {
        console.log("Profile created successfully!");
      }

      router.push("/login?message=회원가입이 완료되었습니다. 로그인해주세요.");
    } catch (err: any) {
      // 에러 메시지 한글화
      let errorMessage = "회원가입 중 오류가 발생했습니다.";
      
      if (err.message?.includes("already registered")) {
        errorMessage = "이미 등록된 이메일입니다.";
      } else if (err.message?.includes("Email rate limit")) {
        errorMessage = "이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
      } else if (err.message?.includes("Invalid email")) {
        errorMessage = "올바른 이메일 형식이 아닙니다.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
          <p className="mt-2 text-sm text-gray-500">주식 알림 서비스</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              회원가입
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              이미 계정이 있으신가요?{" "}
              <a href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                로그인
              </a>
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSignup}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                이메일
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
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                비밀번호 확인
              </label>
              <input
                id="password-confirm"
                name="password-confirm"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="비밀번호 재입력"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
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
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !serviceTerms || !privacyTerms || !pushTerms}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-500 to-blue-600 shadow-md hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "처리 중..." : "회원가입"}
          </button>
        </form>
        </div>
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
