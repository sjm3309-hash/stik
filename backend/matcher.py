import pandas as pd
from typing import Dict, List, Optional
from indicators import calculate_macd, calculate_ma_cross, calculate_price_ma_cross, calculate_disparity, calculate_cci

def check_macd_cross(df: pd.DataFrame) -> Optional[str]:
    """
    MACD 골든/데드크로스를 확인합니다.
    
    Args:
        df: MACD가 계산된 DataFrame
    
    Returns:
        "golden_cross", "dead_cross", 또는 None
    """
    if len(df) < 2:
        return None
    
    # 직전 봉과 현재 봉
    prev = df.iloc[-2]
    curr = df.iloc[-1]
    
    # MACD 라인과 시그널 라인
    prev_macd = prev['macd']
    prev_signal = prev['macd_signal']
    curr_macd = curr['macd']
    curr_signal = curr['macd_signal']
    
    # 골든 크로스: MACD가 시그널을 아래에서 위로 뚫음
    if prev_macd <= prev_signal and curr_macd > curr_signal:
        return "golden_cross"
    
    # 데드 크로스: MACD가 시그널을 위에서 아래로 뚫음
    if prev_macd >= prev_signal and curr_macd < curr_signal:
        return "dead_cross"
    
    return None

def check_ma_cross(df: pd.DataFrame, short_period: int = 20, long_period: int = 50) -> Optional[str]:
    """
    이동평균선 골든/데드크로스를 확인합니다.
    
    Args:
        df: OHLCV 데이터
        short_period: 단기 MA 기간
        long_period: 장기 MA 기간
    
    Returns:
        "golden_cross", "dead_cross", 또는 None
    """
    if len(df) < long_period + 1:
        return None
    
    # MA 계산
    df_with_ma = calculate_ma_cross(df, short_period, long_period)
    
    if len(df_with_ma) < 2:
        return None
    
    prev = df_with_ma.iloc[-2]
    curr = df_with_ma.iloc[-1]
    
    prev_short = prev['ma_short']
    prev_long = prev['ma_long']
    curr_short = curr['ma_short']
    curr_long = curr['ma_long']
    
    # 골든 크로스: 단기 MA가 장기 MA를 아래에서 위로 뚫음
    if prev_short <= prev_long and curr_short > curr_long:
        return "golden_cross"
    
    # 데드 크로스: 단기 MA가 장기 MA를 위에서 아래로 뚫음
    if prev_short >= prev_long and curr_short < curr_long:
        return "dead_cross"
    
    return None

def check_price_ma_cross(df: pd.DataFrame, ma_period: int = 20) -> Optional[str]:
    """
    가격 vs 이동평균선 골든/데드크로스를 확인합니다.
    
    Args:
        df: OHLCV 데이터
        ma_period: 이동평균 기간
    
    Returns:
        "golden_cross", "dead_cross", 또는 None
    """
    if len(df) < ma_period + 1:
        return None
    
    # 가격 vs MA 계산
    df_with_ma = calculate_price_ma_cross(df, ma_period)
    
    if len(df_with_ma) < 2:
        return None
    
    prev = df_with_ma.iloc[-2]
    curr = df_with_ma.iloc[-1]
    
    prev_price = prev['close']
    prev_ma = prev['ma']
    curr_price = curr['close']
    curr_ma = curr['ma']
    
    # 골든 크로스: 가격이 MA를 아래에서 위로 뚫음
    if prev_price <= prev_ma and curr_price > curr_ma:
        return "golden_cross"
    
    # 데드 크로스: 가격이 MA를 위에서 아래로 뚫음
    if prev_price >= prev_ma and curr_price < curr_ma:
        return "dead_cross"
    
    return None

def check_disparity(df: pd.DataFrame, parameters: Dict = None) -> Optional[str]:
    """
    이격도 과열/침체를 확인합니다.
    
    Args:
        df: OHLCV 데이터
        parameters: 이격도 파라미터 (ma_period, overheat, chill)
    
    Returns:
        "golden_cross" (과열 상향 돌파), "dead_cross" (침체 하향 이탈), 또는 None
    """
    if parameters is None:
        parameters = {}
    
    ma_period = parameters.get('ma_period', 20)
    overheat = parameters.get('overheat', 105)
    chill = parameters.get('chill', 95)
    
    if len(df) < ma_period + 1:
        return None
    
    df_with_disparity = calculate_disparity(df, ma_period)
    
    if len(df_with_disparity) < 2:
        return None
    
    prev = df_with_disparity.iloc[-2]
    curr = df_with_disparity.iloc[-1]
    
    prev_disparity = prev['disparity']
    curr_disparity = curr['disparity']
    
    # 과열 상향 돌파: 이격도가 과열선을 아래에서 위로 뚫음
    if prev_disparity <= overheat and curr_disparity > overheat:
        return "golden_cross"
    
    # 침체 하향 이탈: 이격도가 침체선을 위에서 아래로 뚫음
    if prev_disparity >= chill and curr_disparity < chill:
        return "dead_cross"
    
    return None

def check_cci(df: pd.DataFrame, parameters: Dict = None) -> Optional[str]:
    """
    CCI 상향/하향 돌파를 확인합니다.
    
    Args:
        df: OHLCV 데이터
        parameters: CCI 파라미터 (period, upper, lower)
    
    Returns:
        "golden_cross" (상향 기준 돌파), "dead_cross" (하향 기준 이탈), 또는 None
    """
    if parameters is None:
        parameters = {}
    
    period = parameters.get('period', 14)
    upper = parameters.get('upper', 100)
    lower = parameters.get('lower', -100)
    
    if len(df) < period + 1:
        return None
    
    df_with_cci = calculate_cci(df, period)
    
    if len(df_with_cci) < 2:
        return None
    
    prev = df_with_cci.iloc[-2]
    curr = df_with_cci.iloc[-1]
    
    prev_cci = prev['cci']
    curr_cci = curr['cci']
    
    # 상향 기준 돌파: CCI가 상향 기준을 아래에서 위로 뚫음
    if prev_cci <= upper and curr_cci > upper:
        return "golden_cross"
    
    # 하향 기준 이탈: CCI가 하향 기준을 위에서 아래로 뚫음
    if prev_cci >= lower and curr_cci < lower:
        return "dead_cross"
    
    return None

def check_condition(df: pd.DataFrame, indicator: str, condition: str, ma_short_period: int = None, ma_long_period: int = None, parameters: Dict = None) -> Optional[str]:
    """
    지표와 조건에 따라 크로스를 확인합니다.
    
    Args:
        df: OHLCV 데이터
        indicator: 지표 타입 (macd, disparity, cci, ma_price_cross, ma_cross, rsi, bollinger)
        condition: 조건 (golden_cross, dead_cross, above, below)
        ma_short_period: 단기 이평선 기간
        ma_long_period: 장기 이평선 기간
        parameters: 지표별 파라미터
    
    Returns:
        조건이 일치하면 해당 조건, 아니면 None
    """
    if indicator == "macd":
        df_with_macd = calculate_macd(df)
        return check_macd_cross(df_with_macd)
    
    elif indicator == "disparity":
        return check_disparity(df, parameters)
    
    elif indicator == "cci":
        return check_cci(df, parameters)
    
    elif indicator == "ma_price_cross":
        # 가격 vs 단기 이평선
        period = ma_short_period if ma_short_period else 20
        return check_price_ma_cross(df, period)
    
    elif indicator == "ma_cross":
        # 단기 vs 장기 이평선
        short = ma_short_period if ma_short_period else 20
        long = ma_long_period if ma_long_period else 50
        return check_ma_cross(df, short, long)
    
    elif indicator == "rsi":
        # RSI 기반 조건 (추후 구현)
        return None
    
    elif indicator == "bollinger":
        # 볼린저 밴드 기반 조건 (추후 구현)
        return None
    
    return None

def match_alerts(alerts: List[Dict], data_dict: Dict[str, pd.DataFrame]) -> List[Dict]:
    """
    알림 조건과 실제 데이터를 매칭합니다.
    
    Args:
        alerts: alerts 테이블에서 가져온 알림 리스트
        data_dict: 종목별 OHLCV 데이터 딕셔너리
    
    Returns:
        매칭된 알림 리스트
    """
    matched_alerts = []
    
    for alert in alerts:
        if not alert['is_active']:
            continue
        
        symbol = alert['condition']['symbol']
        timeframe = alert['condition']['timeframe']
        indicator = alert['condition']['indicator']
        condition = alert['condition']['condition']
        
        # 매수/매도 알림 설정 확인
        enable_buy_signal = alert.get('enable_buy_signal', True)
        enable_sell_signal = alert.get('enable_sell_signal', True)
        
        # 기간 확인
        ma_short_period = alert.get('ma_short_period', 20)
        ma_long_period = alert.get('ma_long_period', 50)
        
        # 파라미터 확인
        parameters = alert.get('parameters', {})
        
        # 해당 종목 데이터 확인
        if symbol not in data_dict:
            print(f"No data for {symbol}")
            continue
        
        df = data_dict[symbol]
        
        # 조건 확인 (매수/매도 모두 체크)
        matched_condition = check_condition(df, indicator, condition, ma_short_period, ma_long_period, parameters)
        
        # 매수/매도 알림 필터링
        if matched_condition == "golden_cross" and not enable_buy_signal:
            continue
        if matched_condition == "dead_cross" and not enable_sell_signal:
            continue
        
        if matched_condition:
            matched_alerts.append({
                'alert_id': alert['id'],
                'user_id': alert['user_id'],
                'symbol': symbol,
                'timeframe': timeframe,
                'indicator': indicator,
                'condition': matched_condition,
                'matched_at': pd.Timestamp.now().isoformat(),
            })
            print(f"Matched: {symbol} {timeframe} {indicator} {matched_condition}")
    
    return matched_alerts
