import yfinance as yf
import pandas as pd
from typing import Optional

# 주기 매핑 (yfinance interval)
TIMEFRAME_MAP = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1w": "1wk",
    "1M": "1mo",
}

def fetch_ohlcv(symbol: str, timeframe: str, period: str = "3mo") -> Optional[pd.DataFrame]:
    """
    yfinance를 사용하여 OHLCV 데이터를 가져옵니다.
    
    Args:
        symbol: 종목 심볼 (예: "AAPL", "BTC-USD")
        timeframe: 주기 (예: "1d", "1h")
        period: 데이터 기간 (기본값: "3mo")
    
    Returns:
        OHLCV 데이터가 포함된 DataFrame 또는 None
    """
    try:
        interval = TIMEFRAME_MAP.get(timeframe, timeframe)
        
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            print(f"Warning: No data found for {symbol}")
            return None
        
        # 컬럼명 표준화
        df.columns = df.columns.str.lower()
        
        return df
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return None

def fetch_multiple_symbols(symbols: list[str], timeframe: str, period: str = "3mo") -> dict[str, pd.DataFrame]:
    """
    여러 종목의 OHLCV 데이터를 가져옵니다.
    
    Args:
        symbols: 종목 심볼 리스트
        timeframe: 주기
        period: 데이터 기간
    
    Returns:
        심볼을 키로 하고 DataFrame을 값으로 하는 딕셔너리
    """
    results = {}
    for symbol in symbols:
        df = fetch_ohlcv(symbol, timeframe, period)
        if df is not None:
            results[symbol] = df
    return results
