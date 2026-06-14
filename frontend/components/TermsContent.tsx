"use client";

export const ServiceTermsContent = () => (
  <div className="prose prose-sm max-w-none">
    {/* 면책 조항 - 빨간색 강조 */}
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
      <p className="text-red-700 font-bold text-base leading-relaxed m-0">
        ⚠️ 투자 책임 면책 조항
      </p>
      <p className="text-red-600 font-semibold text-sm leading-relaxed mt-2 mb-0">
        본 서비스(Stik)에서 제공하는 모든 보조지표 계산 결과 및 매수/매도 알림 신호는 투자 판단을 위한 참고용 정보입니다. 
        시장 상황이나 데이터 수집 지연 등으로 인해 오차가 발생할 수 있으며, 제공된 정보로 인한 최종 투자 결정과 그에 따른 
        모든 손익의 책임은 전적으로 사용자 본인에게 있습니다.
      </p>
    </div>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제1조 (목적)</h4>
    <p className="text-gray-700 leading-relaxed">
      본 약관은 Stik(이하 "서비스")이 제공하는 주식 알림 서비스의 이용과 관련하여 
      서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제2조 (서비스의 내용)</h4>
    <p className="text-gray-700 leading-relaxed">
      1. 본 서비스는 사용자가 설정한 조건에 따라 주식 시장의 보조지표(MACD, RSI, 볼린저밴드 등)를 
      계산하고 알림을 제공합니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      2. 서비스는 참고용 정보 제공을 목적으로 하며, 투자 권유나 종목 추천이 아닙니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      3. 데이터 수집 지연, 시스템 오류 등으로 인해 알림이 지연되거나 누락될 수 있습니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제3조 (이용자의 의무)</h4>
    <p className="text-gray-700 leading-relaxed">
      1. 이용자는 본인의 계정 정보를 안전하게 관리할 책임이 있습니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      2. 이용자는 서비스를 불법적인 목적으로 이용할 수 없습니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      3. 이용자는 제공된 정보를 바탕으로 한 모든 투자 결정에 대한 책임을 집니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제4조 (서비스의 제한 및 중단)</h4>
    <p className="text-gray-700 leading-relaxed">
      서비스는 시스템 점검, 보수, 천재지변 등의 사유로 서비스 제공을 일시적으로 
      중단할 수 있으며, 이에 대한 사전 고지를 원칙으로 합니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제5조 (면책 조항)</h4>
    <p className="text-gray-700 leading-relaxed">
      1. 서비스는 제공된 정보의 정확성, 완전성, 적시성을 보증하지 않습니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      2. 서비스를 이용한 투자로 인한 손실에 대해 일체의 책임을 지지 않습니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      3. 외부 데이터 제공 업체의 장애로 인한 서비스 중단에 대해 책임을 지지 않습니다.
    </p>
  </div>
);

export const PrivacyTermsContent = () => (
  <div className="prose prose-sm max-w-none">
    <h4 className="font-bold text-gray-900 mb-3">제1조 (개인정보의 수집 항목)</h4>
    <p className="text-gray-700 leading-relaxed">
      서비스는 회원가입 및 서비스 제공을 위해 다음의 개인정보를 수집합니다:
    </p>
    <ul className="list-disc list-inside text-gray-700 space-y-1">
      <li>필수 항목: 이메일 주소, 비밀번호</li>
      <li>자동 수집 항목: 접속 IP, 쿠키, 서비스 이용 기록</li>
      <li>푸시 알림을 위한 기기 토큰 (선택 시)</li>
    </ul>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제2조 (개인정보의 이용 목적)</h4>
    <p className="text-gray-700 leading-relaxed">
      수집된 개인정보는 다음의 목적으로 이용됩니다:
    </p>
    <ul className="list-disc list-inside text-gray-700 space-y-1">
      <li>회원 가입 및 관리</li>
      <li>주식 알림 서비스 제공</li>
      <li>서비스 개선 및 신규 서비스 개발</li>
      <li>고객 문의 응대 및 공지사항 전달</li>
    </ul>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제3조 (개인정보의 보유 및 이용 기간)</h4>
    <p className="text-gray-700 leading-relaxed">
      1. 개인정보는 회원 탈퇴 시까지 보유 및 이용됩니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      2. 회원 탈퇴 시 즉시 파기됩니다. 단, 관련 법령에 따라 보존할 필요가 있는 경우 
      해당 기간 동안 보관됩니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제4조 (개인정보의 제3자 제공)</h4>
    <p className="text-gray-700 leading-relaxed">
      서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
      다만, 법령의 규정에 따라 요구되는 경우는 예외로 합니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제5조 (이용자의 권리)</h4>
    <p className="text-gray-700 leading-relaxed">
      이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 
      회원 탈퇴를 통해 개인정보의 삭제를 요청할 수 있습니다.
    </p>
  </div>
);

export const PushTermsContent = () => (
  <div className="prose prose-sm max-w-none">
    <h4 className="font-bold text-gray-900 mb-3">제1조 (푸시 알림 서비스)</h4>
    <p className="text-gray-700 leading-relaxed">
      서비스는 사용자가 설정한 주식 알림 조건이 충족될 경우 모바일 푸시 알림을 
      전송합니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제2조 (야간 알림)</h4>
    <p className="text-gray-700 leading-relaxed">
      1. 본 서비스는 주식 시장의 특성상 거래 시간 외에도 알림이 발생할 수 있습니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      2. 해외 주식의 경우 한국 시간 기준 야간(21:00 ~ 08:00)에도 알림이 
      전송될 수 있습니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      3. 야간 알림 수신에 동의하지 않을 경우 해당 시간대의 알림은 전송되지 않습니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제3조 (알림 수신 설정)</h4>
    <p className="text-gray-700 leading-relaxed">
      1. 사용자는 대시보드 설정에서 언제든지 알림 수신을 변경할 수 있습니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      2. 기기 설정에서 앱 알림을 차단한 경우 서비스 내 설정과 관계없이 알림이 
      전송되지 않습니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제4조 (알림 지연 및 누락)</h4>
    <p className="text-gray-700 leading-relaxed">
      1. 네트워크 상태, 기기 상태 등에 따라 알림이 지연되거나 누락될 수 있습니다.
    </p>
    <p className="text-gray-700 leading-relaxed">
      2. 서비스는 알림 지연 및 누락으로 인한 손실에 대해 책임을 지지 않습니다.
    </p>

    <h4 className="font-bold text-gray-900 mt-6 mb-3">제5조 (푸시 토큰 관리)</h4>
    <p className="text-gray-700 leading-relaxed">
      서비스는 푸시 알림 전송을 위해 기기의 푸시 토큰을 수집 및 저장합니다. 
      회원 탈퇴 시 해당 정보는 즉시 삭제됩니다.
    </p>
  </div>
);
