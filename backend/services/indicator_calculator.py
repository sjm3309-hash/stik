import logging
import pandas as pd
import numpy as np
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class IndicatorCalculator:
    """Technical indicator calculator"""
    
    @staticmethod
    def calculate_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> Optional[pd.DataFrame]:
        """
        Calculate MACD indicator manually
        
        Returns:
            DataFrame with MACD, Signal, and Histogram columns
        """
        try:
            # Calculate EMAs
            ema_fast = df['Close'].ewm(span=fast, adjust=False).mean()
            ema_slow = df['Close'].ewm(span=slow, adjust=False).mean()
            
            # MACD line
            macd_line = ema_fast - ema_slow
            
            # Signal line (EMA of MACD)
            signal_line = macd_line.ewm(span=signal, adjust=False).mean()
            
            # Histogram
            histogram = macd_line - signal_line
            
            # Create result DataFrame
            result = pd.DataFrame({
                f'MACD_{fast}_{slow}_{signal}': macd_line,
                f'MACDs_{fast}_{slow}_{signal}': signal_line,
                f'MACDh_{fast}_{slow}_{signal}': histogram
            })
            
            return result
        except Exception as e:
            logger.error(f"Error calculating MACD: {e}")
            return None
    
    @staticmethod
    def get_macd_state(df: pd.DataFrame, macd_col: str = 'MACD_12_26_9',
                      signal_col: str = 'MACDs_12_26_9',
                      threshold: float = 0.01) -> Optional[str]:
        """
        Get current MACD state (not cross event, but current state)
        
        Returns:
            'bullish' (MACD above Signal), 'bearish' (MACD below Signal), or None
        """
        try:
            if len(df) < 1:
                return None
            
            curr = df.iloc[-1]
            curr_diff = curr[macd_col] - curr[signal_col]
            
            if curr_diff > threshold:
                return 'bullish'
            elif curr_diff < -threshold:
                return 'bearish'
            else:
                return None  # Too close to call
        except Exception as e:
            logger.error(f"Error getting MACD state: {e}")
            return None
    
    @staticmethod
    def detect_macd_cross(df: pd.DataFrame, macd_col: str = 'MACD_12_26_9', 
                         signal_col: str = 'MACDs_12_26_9', 
                         threshold: float = 0.01) -> Optional[str]:
        """
        Detect MACD crossover
        
        Returns:
            'golden_cross', 'dead_cross', or None
        """
        try:
            if len(df) < 2:
                return None
            
            # Get last two rows
            prev = df.iloc[-2]
            curr = df.iloc[-1]
            
            # Calculate differences
            prev_diff = prev[macd_col] - prev[signal_col]
            curr_diff = curr[macd_col] - curr[signal_col]
            
            # Log MACD values for debugging
            logger.info(f"MACD Check - Prev: MACD={prev[macd_col]:.4f}, Signal={prev[signal_col]:.4f}, Diff={prev_diff:.4f}")
            logger.info(f"MACD Check - Curr: MACD={curr[macd_col]:.4f}, Signal={curr[signal_col]:.4f}, Diff={curr_diff:.4f}")
            
            # Golden Cross: MACD crosses above Signal with meaningful difference
            # Previous: MACD below or equal to Signal
            # Current: MACD clearly above Signal (by at least threshold)
            if prev_diff <= 0 and curr_diff > threshold:
                logger.info(f"🟢 MACD Golden Cross detected! Prev diff: {prev_diff:.4f}, Curr diff: {curr_diff:.4f} (threshold: {threshold})")
                return 'golden_cross'
            
            # Dead Cross: MACD crosses below Signal with meaningful difference
            # Previous: MACD above or equal to Signal
            # Current: MACD clearly below Signal (by at least threshold)
            if prev_diff >= 0 and curr_diff < -threshold:
                logger.info(f"🔴 MACD Dead Cross detected! Prev diff: {prev_diff:.4f}, Curr diff: {curr_diff:.4f} (threshold: {threshold})")
                return 'dead_cross'
            
            return None
        except Exception as e:
            logger.error(f"Error detecting MACD cross: {e}")
            return None
    
    @staticmethod
    def calculate_rsi(df: pd.DataFrame, period: int = 14) -> Optional[pd.Series]:
        """Calculate RSI indicator manually"""
        try:
            # Calculate price changes
            delta = df['Close'].diff()
            
            # Separate gains and losses
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            
            # Calculate RS and RSI
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            
            return rsi
        except Exception as e:
            logger.error(f"Error calculating RSI: {e}")
            return None
    
    @staticmethod
    def detect_rsi_signal(df: pd.DataFrame, overbought: float = 70, oversold: float = 30, 
                         rsi_col: str = 'RSI_14', threshold: float = 1.0) -> Optional[str]:
        """
        Detect RSI overbought/oversold signals with threshold
        
        Returns:
            'overbought', 'oversold', or None
        """
        try:
            if len(df) < 2:
                return None
            
            curr_rsi = df[rsi_col].iloc[-1]
            prev_rsi = df[rsi_col].iloc[-2]
            
            logger.info(f"RSI Check - Prev: {prev_rsi:.2f}, Curr: {curr_rsi:.2f}")
            
            # Cross above overbought (must exceed threshold)
            if prev_rsi <= overbought and curr_rsi > (overbought + threshold):
                logger.info(f"🔴 RSI overbought detected: {curr_rsi:.2f} > {overbought + threshold}")
                return 'overbought'
            
            # Cross below oversold (must exceed threshold)
            if prev_rsi >= oversold and curr_rsi < (oversold - threshold):
                logger.info(f"🟢 RSI oversold detected: {curr_rsi:.2f} < {oversold - threshold}")
                return 'oversold'
            
            return None
        except Exception as e:
            logger.error(f"Error detecting RSI signal: {e}")
            return None
    
    @staticmethod
    def calculate_bollinger_bands(df: pd.DataFrame, period: int = 20, std_dev: float = 2) -> Optional[pd.DataFrame]:
        """Calculate Bollinger Bands manually"""
        try:
            # Middle band (SMA)
            middle = df['Close'].rolling(window=period).mean()
            
            # Standard deviation
            std = df['Close'].rolling(window=period).std()
            
            # Upper and lower bands
            upper = middle + (std_dev * std)
            lower = middle - (std_dev * std)
            
            result = pd.DataFrame({
                f'BBL_{period}_{std_dev}': lower,
                f'BBM_{period}_{std_dev}': middle,
                f'BBU_{period}_{std_dev}': upper,
                f'BBB_{period}_{std_dev}': (upper - lower) / middle * 100  # Bandwidth
            })
            
            return result
        except Exception as e:
            logger.error(f"Error calculating Bollinger Bands: {e}")
            return None
    
    @staticmethod
    def detect_bollinger_signal(df: pd.DataFrame, upper_col: str = 'BBU_20_2.0', 
                                lower_col: str = 'BBL_20_2.0', threshold_percent: float = 0.2) -> Optional[str]:
        """
        Detect Bollinger Band breakout with threshold
        
        Args:
            threshold_percent: Percentage above/below band required for signal (default 0.2%)
        
        Returns:
            'upper_break', 'lower_break', or None
        """
        try:
            if len(df) < 2:
                return None
            
            prev_close = df['Close'].iloc[-2]
            curr_close = df['Close'].iloc[-1]
            prev_upper = df[upper_col].iloc[-2]
            curr_upper = df[upper_col].iloc[-1]
            prev_lower = df[lower_col].iloc[-2]
            curr_lower = df[lower_col].iloc[-1]
            
            logger.info(f"Bollinger Check - Close: {curr_close:.2f}, Upper: {curr_upper:.2f}, Lower: {curr_lower:.2f}")
            
            # Break above upper band (must exceed by threshold_percent)
            upper_threshold = curr_upper * (1 + threshold_percent / 100)
            if prev_close <= prev_upper and curr_close > upper_threshold:
                logger.info(f"🔴 Bollinger upper band breakout: {curr_close:.2f} > {upper_threshold:.2f}")
                return 'upper_break'
            
            # Break below lower band (must exceed by threshold_percent)
            lower_threshold = curr_lower * (1 - threshold_percent / 100)
            if prev_close >= prev_lower and curr_close < lower_threshold:
                logger.info(f"🟢 Bollinger lower band breakout: {curr_close:.2f} < {lower_threshold:.2f}")
                return 'lower_break'
            
            return None
        except Exception as e:
            logger.error(f"Error detecting Bollinger signal: {e}")
            return None
    
    @staticmethod
    def calculate_disparity(df: pd.DataFrame, ma_period: int = 20) -> Optional[pd.Series]:
        """
        Calculate Disparity Index (이격도)
        
        Formula: (Current Price / Moving Average) * 100
        """
        try:
            ma = df['Close'].rolling(window=ma_period).mean()
            disparity = (df['Close'] / ma) * 100
            return disparity
        except Exception as e:
            logger.error(f"Error calculating disparity: {e}")
            return None
    
    @staticmethod
    def detect_disparity_signal(df: pd.DataFrame, overheat: float = 105, chill: float = 95, 
                                disparity_col: str = 'Disparity_20', threshold: float = 0.5) -> Optional[str]:
        """
        Detect disparity overbought/oversold signals with threshold
        
        Returns:
            'overbought' (disparity > overheat), 'oversold' (disparity < chill), or None
        """
        try:
            if len(df) < 2:
                return None
            
            curr_disparity = df[disparity_col].iloc[-1]
            prev_disparity = df[disparity_col].iloc[-2]
            
            logger.info(f"Disparity Check - Prev: {prev_disparity:.2f}, Curr: {curr_disparity:.2f}")
            
            # Overheat (매도 신호) - must exceed threshold
            if prev_disparity <= overheat and curr_disparity > (overheat + threshold):
                logger.info(f"🔴 Disparity overheat detected: {curr_disparity:.2f} > {overheat + threshold}")
                return 'overbought'
            
            # Chill (매수 신호) - must exceed threshold
            if prev_disparity >= chill and curr_disparity < (chill - threshold):
                logger.info(f"🟢 Disparity chill detected: {curr_disparity:.2f} < {chill - threshold}")
                return 'oversold'
            
            return None
        except Exception as e:
            logger.error(f"Error detecting disparity signal: {e}")
            return None
    
    @staticmethod
    def calculate_cci(df: pd.DataFrame, period: int = 14) -> Optional[pd.Series]:
        """
        Calculate Commodity Channel Index (CCI)
        
        Formula: (Typical Price - SMA) / (0.015 * Mean Deviation)
        """
        try:
            # Typical Price = (High + Low + Close) / 3
            tp = (df['High'] + df['Low'] + df['Close']) / 3
            
            # SMA of Typical Price
            sma_tp = tp.rolling(window=period).mean()
            
            # Mean Deviation
            mad = tp.rolling(window=period).apply(lambda x: np.abs(x - x.mean()).mean())
            
            # CCI
            cci = (tp - sma_tp) / (0.015 * mad)
            
            return cci
        except Exception as e:
            logger.error(f"Error calculating CCI: {e}")
            return None
    
    @staticmethod
    def detect_cci_signal(df: pd.DataFrame, upper: float = 100, lower: float = -100, 
                         cci_col: str = 'CCI_14', threshold: float = 5.0) -> Optional[str]:
        """
        Detect CCI overbought/oversold signals with threshold
        
        Returns:
            'overbought' (CCI > upper), 'oversold' (CCI < lower), or None
        """
        try:
            if len(df) < 2:
                return None
            
            curr_cci = df[cci_col].iloc[-1]
            prev_cci = df[cci_col].iloc[-2]
            
            logger.info(f"CCI Check - Prev: {prev_cci:.2f}, Curr: {curr_cci:.2f}")
            
            # Overbought - must exceed threshold
            if prev_cci <= upper and curr_cci > (upper + threshold):
                logger.info(f"🔴 CCI overbought detected: {curr_cci:.2f} > {upper + threshold}")
                return 'overbought'
            
            # Oversold - must exceed threshold
            if prev_cci >= lower and curr_cci < (lower - threshold):
                logger.info(f"🟢 CCI oversold detected: {curr_cci:.2f} < {lower - threshold}")
                return 'oversold'
            
            return None
        except Exception as e:
            logger.error(f"Error detecting CCI signal: {e}")
            return None
    
    @staticmethod
    def calculate_ma_price_cross(df: pd.DataFrame, period: int = 20) -> Optional[str]:
        """
        Calculate Price crossing Moving Average
        
        Args:
            df: OHLCV DataFrame
            period: Moving average period (in bars, not days)
        
        Returns:
            'golden_cross' (price crosses above MA), 'dead_cross' (price crosses below MA), or None
        """
        try:
            if len(df) < period + 1:
                return None
            
            # Calculate MA
            df['MA'] = df['Close'].rolling(window=period).mean()
            
            # Get last two rows
            prev = df.iloc[-2]
            curr = df.iloc[-1]
            prev_close = df['Close'].iloc[-2]
            curr_close = df['Close'].iloc[-1]
            
            # Price crosses above MA (Golden Cross)
            if prev_close <= prev['MA'] and curr_close > curr['MA']:
                logger.info(f"Price Golden Cross detected: price crosses above {period}-period MA")
                return 'golden_cross'
            
            # Price crosses below MA (Dead Cross)
            if prev_close >= prev['MA'] and curr_close < curr['MA']:
                logger.info(f"Price Dead Cross detected: price crosses below {period}-period MA")
                return 'dead_cross'
            
            return None
        except Exception as e:
            logger.error(f"Error calculating MA price cross: {e}")
            return None
    
    @staticmethod
    def calculate_ma_cross(df: pd.DataFrame, short_period: int = 20, long_period: int = 50) -> Optional[str]:
        """
        Calculate Moving Average crossover
        
        Returns:
            'golden_cross', 'dead_cross', or None
        """
        try:
            if len(df) < max(short_period, long_period) + 1:
                return None
            
            # Calculate MAs
            df['MA_Short'] = df['Close'].rolling(window=short_period).mean()
            df['MA_Long'] = df['Close'].rolling(window=long_period).mean()
            
            # Get last two rows
            prev = df.iloc[-2]
            curr = df.iloc[-1]
            
            # Golden Cross: Short MA crosses above Long MA
            if prev['MA_Short'] <= prev['MA_Long'] and curr['MA_Short'] > curr['MA_Long']:
                logger.info(f"MA Golden Cross detected: {short_period}/{long_period}")
                return 'golden_cross'
            
            # Dead Cross: Short MA crosses below Long MA
            if prev['MA_Short'] >= prev['MA_Long'] and curr['MA_Short'] < curr['MA_Long']:
                logger.info(f"MA Dead Cross detected: {short_period}/{long_period}")
                return 'dead_cross'
            
            return None
        except Exception as e:
            logger.error(f"Error calculating MA cross: {e}")
            return None
    
    @staticmethod
    def check_indicator(df: pd.DataFrame, indicator: str, parameters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Check indicator condition based on type
        
        Args:
            df: OHLCV DataFrame
            indicator: Indicator type ('macd', 'rsi', 'bollinger', 'ma_cross', etc.)
            parameters: Indicator parameters
        
        Returns:
            Dict with signal info or None
        """
        try:
            if indicator == 'macd':
                fast = parameters.get('fast', 12)
                slow = parameters.get('slow', 26)
                signal = parameters.get('signal', 9)
                
                macd_df = IndicatorCalculator.calculate_macd(df, fast, slow, signal)
                if macd_df is not None:
                    df = pd.concat([df, macd_df], axis=1)
                    # Get current state
                    current_state = IndicatorCalculator.get_macd_state(df)
                    # Check for cross event
                    cross = IndicatorCalculator.detect_macd_cross(df)
                    if cross:
                        return {'signal': cross, 'indicator': 'macd', 'current_state': current_state}
            
            elif indicator == 'rsi':
                period = parameters.get('period', 14)
                overbought = parameters.get('overbought', 70)
                oversold = parameters.get('oversold', 30)
                
                rsi = IndicatorCalculator.calculate_rsi(df, period)
                if rsi is not None:
                    df[f'RSI_{period}'] = rsi
                    signal = IndicatorCalculator.detect_rsi_signal(df, overbought, oversold, f'RSI_{period}')
                    if signal:
                        return {'signal': signal, 'indicator': 'rsi', 'value': float(rsi.iloc[-1])}
            
            elif indicator == 'bollinger':
                period = parameters.get('period', 20)
                std_dev = parameters.get('std_dev', 2)
                
                bbands = IndicatorCalculator.calculate_bollinger_bands(df, period, std_dev)
                if bbands is not None:
                    df = pd.concat([df, bbands], axis=1)
                    signal = IndicatorCalculator.detect_bollinger_signal(df)
                    if signal:
                        return {'signal': signal, 'indicator': 'bollinger'}
            
            elif indicator == 'ma_cross':
                short = parameters.get('short_period', 20)
                long_period = parameters.get('long_period', 50)
                
                signal = IndicatorCalculator.calculate_ma_cross(df, short, long_period)
                if signal:
                    return {'signal': signal, 'indicator': 'ma_cross'}
            
            elif indicator == 'ma_price_cross':
                period = parameters.get('period', 20)
                
                signal = IndicatorCalculator.calculate_ma_price_cross(df, period)
                if signal:
                    return {'signal': signal, 'indicator': 'ma_price_cross'}
            
            elif indicator == 'disparity':
                ma_period = parameters.get('ma_period', 20)
                overheat = parameters.get('overheat', 105)
                chill = parameters.get('chill', 95)
                
                disparity = IndicatorCalculator.calculate_disparity(df, ma_period)
                if disparity is not None:
                    df[f'Disparity_{ma_period}'] = disparity
                    signal = IndicatorCalculator.detect_disparity_signal(df, overheat, chill, f'Disparity_{ma_period}')
                    if signal:
                        return {'signal': signal, 'indicator': 'disparity', 'value': float(disparity.iloc[-1])}
            
            elif indicator == 'cci':
                period = parameters.get('period', 14)
                upper = parameters.get('upper', 100)
                lower = parameters.get('lower', -100)
                
                cci = IndicatorCalculator.calculate_cci(df, period)
                if cci is not None:
                    df[f'CCI_{period}'] = cci
                    signal = IndicatorCalculator.detect_cci_signal(df, upper, lower, f'CCI_{period}')
                    if signal:
                        return {'signal': signal, 'indicator': 'cci', 'value': float(cci.iloc[-1])}
            
            return None
        except Exception as e:
            logger.error(f"Error checking indicator {indicator}: {e}")
            return None
