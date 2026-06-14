# 🚀 Stik 설정 가이드

이 가이드를 따라하면 5-10분 안에 Stik을 실행할 수 있습니다!

---

## 📋 체크리스트

- [ ] 1단계: Supabase DB 마이그레이션
- [ ] 2단계: Firebase 설정
- [ ] 3단계: 환경변수 설정
- [ ] 4단계: 로컬 테스트 실행

---

## 1️⃣ Supabase DB 마이그레이션 (5분)

### 1-1. Supabase Dashboard 접속
1. https://supabase.com 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 1-2. 마이그레이션 SQL 실행
1. **New query** 버튼 클릭
2. `frontend/supabase-migration-complete.sql` 파일 내용을 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭 (또는 Ctrl+Enter)

### 1-3. 실행 확인
성공하면 다음 메시지가 표시됩니다:
```
Success. No rows returned
```

**추가된 테이블/컬럼 확인:**
- `alerts` 테이블 → `last_triggered_at` 컬럼 추가됨
- `alert_history` 테이블 생성됨
- `profiles` 테이블 → `sound_enabled`, `vibrate_enabled`, `global_cooldown_minutes` 추가됨

### 1-4. 에러 발생 시
만약 "already exists" 에러가 나면 괜찮습니다! 이미 컬럼/테이블이 존재한다는 의미입니다.

---

## 2️⃣ Firebase 설정 (10분)

### 2-1. Firebase Console 접속
1. https://console.firebase.google.com 접속
2. **프로젝트 추가** 클릭 (또는 기존 프로젝트 선택)
3. 프로젝트 이름: `Stik` (원하는 이름)
4. Google Analytics: 선택 사항 (추천: 비활성화)

### 2-2. Cloud Messaging 활성화
1. 왼쪽 메뉴에서 **프로젝트 설정** (톱니바퀴 아이콘) 클릭
2. **Cloud Messaging** 탭 클릭
3. **Cloud Messaging API (Legacy)** 활성화
4. **Server Key** 복사해두기 (나중에 사용)

### 2-3. 서비스 계정 키 다운로드
1. **프로젝트 설정** > **서비스 계정** 탭
2. **새 비공개 키 생성** 버튼 클릭
3. JSON 파일 다운로드
4. 다운로드한 파일을 다음 위치로 이동:
   ```
   backend/firebase-credentials.json
   ```

### 2-4. FCM 토큰 발급 (모바일 앱에서)
- 현재는 백엔드 테스트용으로 임시 토큰 사용 가능
- 실제 푸시 알림을 받으려면 모바일 앱 개발 필요
- 테스트용으로는 FCM 토큰 없이도 서버 로그로 확인 가능

---

## 3️⃣ 환경변수 설정 (5분)

### 3-1. Supabase 키 복사

**Supabase Dashboard:**
1. 프로젝트 설정 (톱니바퀴) > **API**
2. 다음 정보 복사:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJhbG...` (프론트엔드용)
   - **service_role**: `eyJhbG...` (백엔드용, **절대 공개 금지!**)

### 3-2. Backend 환경변수 설정

`backend/.env` 파일 생성:

```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...your_service_role_key

# Firebase
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# Server
LOG_LEVEL=INFO
```

### 3-3. Frontend 환경변수 설정

`frontend/.env.local` 파일 생성:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your_anon_key
```

---

## 4️⃣ 로컬 테스트 실행 (5분)

### 4-1. Backend 실행

**터미널 1 (또는 VS Code 터미널):**

```bash
cd backend

# 가상환경 활성화 (이미 설치되어 있다고 가정)
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 서버 실행
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**성공 시 다음과 같은 로그가 출력됩니다:**
```
INFO:     Starting Stik Alert Service...
INFO:     Alert scheduler started
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**브라우저에서 확인:**
- http://localhost:8000/docs → FastAPI Swagger UI
- http://localhost:8000/health → Health Check

### 4-2. Frontend 실행

**터미널 2 (새 터미널):**

```bash
cd frontend

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm run dev
```

**브라우저에서 확인:**
- http://localhost:3000 → Stik 앱

### 4-3. 빠른 테스트

1. **회원가입**: http://localhost:3000/signup
   - 이메일, 비밀번호 입력
   - 약관 모두 동의
   - 회원가입 완료

2. **로그인**: http://localhost:3000/login
   - 방금 만든 계정으로 로그인

3. **알림 생성**: Dashboard에서 `+ 알림 추가`
   - 종목: 삼성전자 (005930)
   - 시간프레임: 1분봉
   - 지표: RSI
   - 조건: 골든크로스

4. **백엔드 로그 확인**: 터미널 1에서
   ```
   INFO: Checking 1-minute alerts...
   INFO: Fetching data for 005930...
   ```

---

## 🧪 테스트 시나리오

### 시나리오 1: 회원가입/로그인
- [ ] 약관 미동의 시 버튼 비활성화 확인
- [ ] 회원가입 성공
- [ ] 로그인 성공
- [ ] 대시보드 진입

### 시나리오 2: 알림 생성
- [ ] 종목 검색 (삼성전자)
- [ ] 지표 선택 (RSI, MACD 등)
- [ ] 매수/매도 신호 선택
- [ ] 알림 생성 성공
- [ ] 알림 목록에 표시

### 시나리오 3: 설정 변경
- [ ] 설정 페이지 접근
- [ ] 알림 소리 ON/OFF
- [ ] 진동 ON/OFF
- [ ] 쿨다운 시간 설정 (1분, 5분 등)
- [ ] 저장 성공

### 시나리오 4: 백엔드 동작 확인
- [ ] 백엔드 로그에서 "Checking alerts..." 메시지 출력
- [ ] 데이터 수집 성공 로그 확인
- [ ] 조건 체크 로그 확인

---

## 🐛 문제 해결

### "Failed to load settings" 오류
→ Supabase 마이그레이션을 실행했는지 확인하세요.

### Backend 연결 실패
→ `.env` 파일의 `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` 확인

### Firebase 오류
→ `firebase-credentials.json` 파일이 `backend/` 폴더에 있는지 확인

### 알림이 안 와요
→ 현재는 주식 시장이 닫혀있어서 실시간 데이터가 없습니다.
   월요일 오전 9시 이후에 테스트하세요!

---

## 📱 실제 푸시 알림 받기 (선택사항)

현재 웹 버전에서는 푸시 알림을 받을 수 없습니다.
실제 푸시 알림을 받으려면:

1. **React Native 모바일 앱 개발** (향후 작업)
2. **PWA (Progressive Web App)** 로 변환 (상대적으로 간단)

당장은 백엔드 로그와 히스토리 페이지에서 알림 발생을 확인할 수 있습니다!

---

## ✅ 다음 단계

### 로컬 테스트 성공 후:
1. **월요일 실제 테스트**: 주식 시장 개장 시간에 실시간 테스트
2. **백엔드 배포**: Railway, Render, AWS 등에 배포
3. **프론트엔드 배포**: Vercel (이미 연동되어 있음)
4. **모바일 앱 개발**: React Native + FCM

### 추가 기능 개발:
- 프리미엄 구독 결제
- 차트 시각화
- 백테스팅
- 포트폴리오 관리

---

## 🎉 축하합니다!

모든 설정이 완료되면 Stik이 자동으로:
- 1분마다 1분봉 알림 체크
- 5분마다 5분봉 알림 체크
- 오후 3:35에 일봉 알림 체크
- 조건 만족 시 자동으로 푸시 알림 발송

**Happy Trading! 📈**
