# Stik Backend - Stock Alert Service

주식 매매 시그널 알림 서비스 백엔드

## 기능

- 📊 실시간 주가 데이터 수집 (yfinance)
- 📈 보조지표 계산 (MACD, RSI, 볼린저밴드, 이평선 등)
- 🔔 조건 만족 시 FCM 푸시 알림 발송
- ⏰ 스케줄러를 통한 주기적 알림 체크

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

`.env.example`을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```

### 4. Firebase 서비스 계정 키 설정

1. Firebase Console → Project Settings → Service accounts
2. "Generate new private key" 클릭
3. 다운로드한 JSON 파일을 `firebase-service-account.json`으로 저장

### 5. 서버 실행

```bash
python main.py
```

또는 개발 모드:

```bash
uvicorn main:app --reload
```

## API 엔드포인트

- `GET /` - Health check
- `GET /health` - Detailed health status

## 프로젝트 구조

```
backend/
├── main.py                  # FastAPI 앱 진입점
├── config.py                # 설정 관리
├── requirements.txt         # Python 패키지
├── services/
│   ├── database.py          # Supabase 클라이언트
│   ├── firebase_service.py  # Firebase Admin SDK
│   ├── data_fetcher.py      # 주가 데이터 수집
│   ├── indicator_calculator.py  # 보조지표 계산
│   ├── alert_checker.py     # 알림 조건 체크
│   ├── notification_sender.py   # FCM 푸시 발송
│   └── scheduler.py         # 스케줄러
└── .env                     # 환경변수 (git ignore)
```

## 스케줄 작업

- **1분마다**: 1분봉 알림 체크
- **5분마다**: 5분봉 알림 체크
- **15분마다**: 15분봉 알림 체크
- **1시간마다**: 시간봉 알림 체크
- **평일 15:35**: 일봉 알림 체크 (한국 시간)
- **매주 월요일 16:00**: 주봉 알림 체크

## 지원하는 보조지표

1. **MACD** - 골든/데드 크로스
2. **RSI** - 과매수/과매도
3. **볼린저 밴드** - 상단/하단 돌파
4. **이평선 크로스** - 단기/장기 이평선 교차
5. **이격도**
6. **CCI**

## 데이터베이스 스키마

필요한 Supabase 테이블:

- `alerts` - 알림 설정
- `user_devices` - FCM 토큰
- `alert_history` - 알림 히스토리
- `profiles` - 유저 프로필

## 배포

### Docker (추천)

```bash
docker build -t stik-backend .
docker run -p 8000:8000 --env-file .env stik-backend
```

### Heroku

```bash
heroku create stik-backend
git push heroku main
```

### AWS Lambda + API Gateway

Serverless Framework 사용 권장

## 트러블슈팅

### yfinance 데이터 오류
- 한국 주식: 종목코드 뒤에 `.KS` (KOSPI) 또는 `.KQ` (KOSDAQ) 추가
- 미국 주식: 티커 그대로 사용 (예: `AAPL`)

### Firebase 푸시 실패
- FCM 토큰이 유효한지 확인
- `firebase-service-account.json` 경로 확인
- Firebase Console에서 Cloud Messaging 활성화 확인

## 라이선스

MIT
