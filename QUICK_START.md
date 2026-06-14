# ⚡ 빠른 시작 가이드

**5분 안에 Stik 실행하기!**

---

## 🎯 지금 바로 해야 할 것 (순서대로)

### ✅ Step 1: Supabase 마이그레이션 (필수!)

1. https://supabase.com 로그인
2. 프로젝트 선택 → **SQL Editor**
3. `frontend/supabase-migration-complete.sql` 파일 내용 복사/붙여넣기
4. **Run** 버튼 클릭

**예상 결과:** `Success. No rows returned`

---

### ✅ Step 2: Firebase 설정 (선택사항 - 푸시 알림용)

**지금 건너뛰고 나중에 해도 됩니다!**

푸시 알림 없이도 히스토리 페이지에서 알림 발생 확인 가능합니다.

**설정하려면:**
1. https://console.firebase.google.com
2. 프로젝트 생성
3. 서비스 계정 키 다운로드
4. `backend/firebase-credentials.json`에 저장

---

### ✅ Step 3: 환경변수 설정

#### Backend 설정

`backend/.env` 파일 생성:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

**Supabase 키 찾는 방법:**
- Supabase Dashboard → 프로젝트 설정 → API
- URL: Project URL
- Service Key: service_role (secret)

#### Frontend 설정

`frontend/.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

### ✅ Step 4: 실행!

#### 터미널 1 - Backend

```bash
cd backend
python -m uvicorn main:app --reload
```

#### 터미널 2 - Frontend

```bash
cd frontend
npm run dev
```

#### 브라우저

http://localhost:3000

---

## 🎉 완료!

이제 다음을 할 수 있습니다:

1. **회원가입/로그인**
2. **알림 생성** (삼성전자, Apple 등)
3. **설정 변경** (소리/진동/쿨다운)
4. **히스토리 확인**

**백엔드가 1분마다 자동으로 알림을 체크합니다!**

---

## 📝 참고사항

- **주식 시장 열려있을 때만** 실시간 데이터 수집됩니다
  - 한국: 평일 09:00-15:30
  - 미국: 평일 22:30-05:00 (한국 시간)
  
- **장 마감 후에는** 당일 종가 데이터를 사용합니다

- **자세한 설명**은 `SETUP_GUIDE.md` 참고

---

## 🐛 문제 발생 시

### "Failed to load settings"
→ Supabase 마이그레이션 실행했나요?

### Backend 연결 안 됨
→ `.env` 파일의 Supabase URL/Key 확인

### 알림이 안 와요
→ 지금은 일요일이라 주식 시장이 닫혀있습니다!
   월요일 오전 9시 이후에 테스트하세요.

---

**더 궁금한 점은 `SETUP_GUIDE.md`를 확인하세요!**
