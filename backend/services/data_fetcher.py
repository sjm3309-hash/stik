import logging
import FinanceDataReader as fdr
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


class DataFetcher:
    """Stock data fetcher using FinanceDataReader"""
    
    @staticmethod
    def get_stock_data(symbol: str, timeframe: str, period: str = "60d") -> Optional[pd.DataFrame]:
        """
        Fetch stock data from FinanceDataReader
        
        Args:
            symbol: Stock symbol (e.g., '005930' for Samsung, 'AAPL' for Apple)
            timeframe: Timeframe ('1d', '5m', '1h', etc.)
            period: Data period ('60d', '1y', etc.)
        
        Returns:
            DataFrame with OHLCV data or None if failed
        """
        try:
            # Remove .KS or .KQ suffix if present (FinanceDataReader doesn't need it for Korean stocks)
            clean_symbol = symbol.replace('.KS', '').replace('.KQ', '')
            
            logger.info(f"Fetching data for {clean_symbol}, timeframe: {timeframe}, period: {period}")
            
            # Calculate start date from period
            end_date = datetime.now()
            if 'd' in period:
                days = int(period.replace('d', ''))
                start_date = end_date - timedelta(days=days)
            elif 'mo' in period:
                months = int(period.replace('mo', ''))
                start_date = end_date - timedelta(days=months * 30)
            elif 'y' in period:
                years = int(period.replace('y', ''))
                start_date = end_date - timedelta(days=years * 365)
            else:
                start_date = end_date - timedelta(days=60)
            
            # Fetch data
            df = fdr.DataReader(clean_symbol, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
            
            if df is None or df.empty:
                logger.warning(f"No data returned for {clean_symbol}")
                return None
            
            # Ensure column names match expected format (Open, High, Low, Close, Volume)
            # FinanceDataReader returns columns in this format already
            
            # Resample if needed (for intraday timeframes)
            if timeframe != '1d':
                df = DataFetcher._resample_data(df, timeframe)
            
            logger.info(f"Successfully fetched {len(df)} rows for {clean_symbol}")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            return None
    
    @staticmethod
    def _resample_data(df: pd.DataFrame, timeframe: str) -> pd.DataFrame:
        """
        Resample daily data to different timeframes
        Note: FinanceDataReader primarily provides daily data for most stocks
        For intraday data, we'll need to use daily data and return as-is for now
        """
        try:
            # For now, return daily data for all timeframes
            # In production, you might want to integrate with a real-time data provider
            # for intraday data (5m, 15m, 1h, etc.)
            logger.warning(f"Intraday timeframe {timeframe} requested but using daily data")
            return df
        except Exception as e:
            logger.error(f"Error resampling data: {e}")
            return df
    
    @staticmethod
    def get_latest_price(symbol: str) -> Optional[float]:
        """Get latest closing price for a symbol"""
        try:
            # Remove .KS or .KQ suffix
            clean_symbol = symbol.replace('.KS', '').replace('.KQ', '')
            
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            
            df = fdr.DataReader(clean_symbol, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
            
            if df is not None and not df.empty:
                return float(df['Close'].iloc[-1])
            return None
        except Exception as e:
            logger.error(f"Error getting latest price for {symbol}: {e}")
            return None
    
    @staticmethod
    def normalize_symbol(symbol: str, market: str = "KR") -> str:
        """
        Normalize stock symbol for FinanceDataReader
        
        Args:
            symbol: Stock code (e.g., '005930' or 'AAPL')
            market: Market identifier ('KR' for Korea, 'US' for US)
        
        Returns:
            Normalized symbol (removes .KS or .KQ suffix)
        """
        # FinanceDataReader doesn't need .KS or .KQ suffix for Korean stocks
        # It auto-detects based on the code format
        return symbol.replace('.KS', '').replace('.KQ', '')
