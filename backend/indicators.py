import pandas as pd
import numpy as np

def calculate_sma(data: pd.Series, period: int) -> pd.Series:
    """
    단순 이동평균(SMA)을 계산합니다.
    
    Args:
        data: 가격 데이터
        period: 기간
    
    Returns:
        SMA 시리즈
    """
    return data.rolling(window=period).mean()

def calculate_ema(data: pd.Series, period: int) -> pd.Series:
    """
    지수 이동평균(EMA)을 계산합니다.
    
    Args:
        data: 가격 데이터
        period: 기간
    
    Returns:
        EMA 시리즈
    """
    return data.ewm(span=period, adjust=False).mean()

def calculate_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    """
    MACD를 계산합니다.
    
    Args:
        df: OHLCV 데이터가 포함된 DataFrame (close 컬럼 필요)
        fast: 빠른 EMA 기간 (기본값: 12)
        slow: 느린 EMA 기간 (기본값: 26)
        signal: 시그널 라인 기간 (기본값: 9)
    
    Returns:
        MACD, Signal, Histogram이 추가된 DataFrame
    """
    close = df['close']
    
    # EMA 계산
    ema_fast = calculate_ema(close, fast)
    ema_slow = calculate_ema(close, slow)
    
    # MACD 라인
    macd_line = ema_fast - ema_slow
    
    # 시그널 라인
    signal_line = calculate_ema(macd_line, signal)
    
    # 히스토그램
    histogram = macd_line - signal_line
    
    # 결과 DataFrame에 추가
    result = df.copy()
    result['macd'] = macd_line
    result['macd_signal'] = signal_line
    result['macd_histogram'] = histogram
    
    return result

def calculate_ma_cross(df: pd.DataFrame, short_period: int = 20, long_period: int = 50) -> pd.DataFrame:
    """
    이동평균선 크로스를 계산합니다.
    
    Args:
        df: OHLCV 데이터가 포함된 DataFrame (close 컬럼 필요)
        short_period: 단기 이동평균 기간 (기본값: 20)
        long_period: 장기 이동평균 기간 (기본값: 50)
    
    Returns:
        단기/장기 이동평균이 추가된 DataFrame
    """
    close = df['close']
    
    ma_short = calculate_sma(close, short_period)
    ma_long = calculate_sma(close, long_period)
    
    result = df.copy()
    result['ma_short'] = ma_short
    result['ma_long'] = ma_long
    
    return result

def calculate_rsi(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """
    RSI를 계산합니다.
    
    Args:
        df: OHLCV 데이터가 포함된 DataFrame (close 컬럼 필요)
        period: 기간 (기본값: 14)
    
    Returns:
        RSI가 추가된 DataFrame
    """
    close = df['close']
    
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    result = df.copy()
    result['rsi'] = rsi
    
    return result

def calculate_bollinger_bands(df: pd.DataFrame, period: int = 20, std_dev: int = 2) -> pd.DataFrame:
    """
    볼린저 밴드를 계산합니다.
    
    Args:
        df: OHLCV 데이터가 포함된 DataFrame (close 컬럼 필요)
        period: 기간 (기본값: 20)
        std_dev: 표준편차 배수 (기본값: 2)
    
    Returns:
        볼린저 밴드가 추가된 DataFrame
    """
    close = df['close']
    
    sma = calculate_sma(close, period)
    std = close.rolling(window=period).std()
    
    upper_band = sma + (std * std_dev)
    lower_band = sma - (std * std_dev)
    
    result = df.copy()
    result['bb_middle'] = sma
    result['bb_upper'] = upper_band
    result['bb_lower'] = lower_band
    
    return result

def calculate_disparity(df: pd.DataFrame, ma_period: int = 20) -> pd.DataFrame:
    """
    이격도(Disparity Index)를 계산합니다.
    이격도 = (현재가 / 이동평균) * 100
    
    Args:
        df: OHLCV 데이터가 포함된 DataFrame (close 컬럼 필요)
        ma_period: 이동평균 기간 (기본값: 20)
    
    Returns:
        이격도가 추가된 DataFrame
    """
    close = df['close']
    ma = calculate_sma(close, ma_period)
    
    disparity = (close / ma) * 100
    
    result = df.copy()
    result['disparity'] = disparity
    result['ma'] = ma
    
    return result

def calculate_cci(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """
    CCI (Commodity Channel Index)를 계산합니다.
    
    Args:
        df: OHLCV 데이터가 포함된 DataFrame (high, low, close 컬럼 필요)
        period: 기간 (기본값: 14)
    
    Returns:
        CCI가 추가된 DataFrame
    """
    high = df['high']
    low = df['low']
    close = df['close']
    
    # Typical Price = (High + Low + Close) / 3
    typical_price = (high + low + close) / 3
    
    # SMA of Typical Price
    sma_tp = typical_price.rolling(window=period).mean()
    
    # Mean Deviation
    mean_deviation = typical_price.rolling(window=period).apply(lambda x: np.abs(x - x.mean()).mean(), raw=True)
    
    # CCI = (Typical Price - SMA) / (0.015 * Mean Deviation)
    cci = (typical_price - sma_tp) / (0.015 * mean_deviation)
    
    result = df.copy()
    result['cci'] = cci
    
    return result

def calculate_price_ma_cross(df: pd.DataFrame, ma_period: int = 20) -> pd.DataFrame:
    """
    가격 vs 이동평균선 크로스를 계산합니다.
    
    Args:
        df: OHLCV 데이터가 포함된 DataFrame (close 컬럼 필요)
        ma_period: 이동평균 기간 (기본값: 20)
    
    Returns:
        이동평균선이 추가된 DataFrame
    """
    close = df['close']
    
    ma = calculate_sma(close, ma_period)
    
    result = df.copy()
    result['ma'] = ma
    
    return result
