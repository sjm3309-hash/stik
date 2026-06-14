"""
실제 주식 시장 연동 테스트 스크립트
백엔드 서버 없이 독립적으로 실행 가능
"""
import asyncio
import logging
from datetime import datetime
from services.data_fetcher import DataFetcher
from services.indicator_calculator import IndicatorCalculator

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_korean_stock():
    """한국 주식 (삼성전자) 데이터 수집 테스트"""
    logger.info("=" * 60)
    logger.info("🇰🇷 한국 주식 테스트: 삼성전자 (005930)")
    logger.info("=" * 60)
    
    symbol = "005930"
    timeframe = "1d"
    
    # 1. 데이터 수집
    logger.info(f"📊 {symbol} 데이터 수집 중...")
    df = DataFetcher.get_stock_data(symbol, timeframe, period="30d")
    
    if df is None or df.empty:
        logger.error("❌ 데이터 수집 실패!")
        return False
    
    logger.info(f"✅ 데이터 수집 성공! ({len(df)}개 행)")
    logger.info(f"   최신 날짜: {df.index[-1]}")
    logger.info(f"   최신 종가: {df['Close'].iloc[-1]:,.0f}원")
    logger.info(f"   전일 대비: {((df['Close'].iloc[-1] / df['Close'].iloc[-2] - 1) * 100):.2f}%")
    
    # 2. 이동평균선 계산
    logger.info("\n📈 이동평균선 계산 중...")
    df_ma = IndicatorCalculator.calculate_ma(df, short_period=5, long_period=20)
    
    if df_ma is not None:
        logger.info(f"✅ MA 계산 성공!")
        logger.info(f"   MA5 (단기): {df_ma['MA_short'].iloc[-1]:,.0f}원")
        logger.info(f"   MA20 (장기): {df_ma['MA_long'].iloc[-1]:,.0f}원")
        
        # 골든크로스/데드크로스 체크
        if df_ma['MA_short'].iloc[-1] > df_ma['MA_long'].iloc[-1]:
            logger.info("   🟢 단기 > 장기 (상승 신호)")
        else:
            logger.info("   🔴 단기 < 장기 (하락 신호)")
    
    # 3. RSI 계산
    logger.info("\n📊 RSI 계산 중...")
    df_rsi = IndicatorCalculator.calculate_rsi(df, period=14)
    
    if df_rsi is not None:
        rsi_value = df_rsi['RSI'].iloc[-1]
        logger.info(f"✅ RSI 계산 성공!")
        logger.info(f"   RSI(14): {rsi_value:.2f}")
        
        if rsi_value >= 70:
            logger.info("   🔥 과매수 구간 (매도 고려)")
        elif rsi_value <= 30:
            logger.info("   ❄️ 과매도 구간 (매수 고려)")
        else:
            logger.info("   ⚖️ 중립 구간")
    
    return True


async def test_us_stock():
    """미국 주식 (애플) 데이터 수집 테스트"""
    logger.info("\n" + "=" * 60)
    logger.info("🇺🇸 미국 주식 테스트: Apple (AAPL)")
    logger.info("=" * 60)
    
    symbol = "AAPL"
    timeframe = "1d"
    
    # 1. 데이터 수집
    logger.info(f"📊 {symbol} 데이터 수집 중...")
    df = DataFetcher.get_stock_data(symbol, timeframe, period="30d")
    
    if df is None or df.empty:
        logger.error("❌ 데이터 수집 실패!")
        return False
    
    logger.info(f"✅ 데이터 수집 성공! ({len(df)}개 행)")
    logger.info(f"   최신 날짜: {df.index[-1]}")
    logger.info(f"   최신 종가: ${df['Close'].iloc[-1]:.2f}")
    logger.info(f"   전일 대비: {((df['Close'].iloc[-1] / df['Close'].iloc[-2] - 1) * 100):.2f}%")
    
    # 2. MACD 계산
    logger.info("\n📈 MACD 계산 중...")
    df_macd = IndicatorCalculator.calculate_macd(df, fast=12, slow=26, signal=9)
    
    if df_macd is not None:
        macd = df_macd['MACD'].iloc[-1]
        signal = df_macd['MACD_signal'].iloc[-1]
        logger.info(f"✅ MACD 계산 성공!")
        logger.info(f"   MACD: {macd:.2f}")
        logger.info(f"   Signal: {signal:.2f}")
        
        if macd > signal:
            logger.info("   🟢 MACD > Signal (상승 신호)")
        else:
            logger.info("   🔴 MACD < Signal (하락 신호)")
    
    return True


async def test_latest_price():
    """최신 가격 조회 테스트"""
    logger.info("\n" + "=" * 60)
    logger.info("💰 최신 가격 조회 테스트")
    logger.info("=" * 60)
    
    symbols = [
        ("005930", "삼성전자"),
        ("035720", "카카오"),
        ("AAPL", "Apple"),
        ("TSLA", "Tesla"),
    ]
    
    for symbol, name in symbols:
        price = DataFetcher.get_latest_price(symbol)
        if price:
            currency = "원" if symbol.isdigit() else "$"
            if currency == "원":
                logger.info(f"✅ {name} ({symbol}): {price:,.0f}{currency}")
            else:
                logger.info(f"✅ {name} ({symbol}): {currency}{price:.2f}")
        else:
            logger.error(f"❌ {name} ({symbol}): 가격 조회 실패")


async def main():
    """메인 테스트 실행"""
    logger.info("\n🚀 Stik 주식 시장 연동 테스트 시작")
    logger.info(f"⏰ 테스트 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # 1. 한국 주식 테스트
        await test_korean_stock()
        
        # 2. 미국 주식 테스트
        await test_us_stock()
        
        # 3. 최신 가격 조회 테스트
        await test_latest_price()
        
        logger.info("\n" + "=" * 60)
        logger.info("✅ 모든 테스트 완료!")
        logger.info("=" * 60)
        logger.info("\n📌 다음 단계:")
        logger.info("   1. backend 폴더에서 'python -m uvicorn main:app --reload' 실행")
        logger.info("   2. 프론트엔드에서 알림 생성")
        logger.info("   3. 백엔드 로그에서 자동 체크 확인")
        logger.info("\n💡 주의사항:")
        logger.info("   - 한국 주식: 평일 오전 9시~오후 3:30분에만 실시간 거래")
        logger.info("   - 미국 주식: 한국 시간 기준 평일 밤 11:30~새벽 6:00 (서머타임 적용)")
        logger.info("   - 장 마감 후에는 당일 종가 데이터 사용")
        
    except Exception as e:
        logger.error(f"❌ 테스트 중 오류 발생: {e}", exc_info=True)
        return False
    
    return True


if __name__ == "__main__":
    asyncio.run(main())
