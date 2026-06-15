import logging
import FinanceDataReader as fdr
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional
from services.kis_client import get_kis_client

logger = logging.getLogger(__name__)


class DataFetcher:
    """Stock data fetcher using FinanceDataReader"""
    
    @staticmethod
    def get_stock_data(symbol: str, timeframe: str, period: str = "60d") -> Optional[pd.DataFrame]:
        """
        Fetch stock data from KIS API (intraday) or FinanceDataReader (daily)
        
        Args:
            symbol: Stock symbol (e.g., '005930' for Samsung, 'AAPL' for Apple)
            timeframe: Timeframe ('1d', '5m', '1h', etc.)
            period: Data period ('60d', '1y', etc.)
        
        Returns:
            DataFrame with OHLCV data or None if failed
        """
        try:
            clean_symbol = symbol.replace('.KS', '').replace('.KQ', '')
            
            logger.info(f"Fetching data for {clean_symbol}, timeframe: {timeframe}, period: {period}")
            
            # 분봉 데이터는 한국투자증권 API 사용
            if timeframe in ['1m', '5m', '10m', '15m', '30m', '60m']:
                return DataFetcher._fetch_intraday_data(clean_symbol, timeframe, period)
            
            # 일봉 이상은 FinanceDataReader 사용
            return DataFetcher._fetch_daily_data(clean_symbol, period)
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            return None
    
    @staticmethod
    def _fetch_intraday_data(symbol: str, timeframe: str, period: str) -> Optional[pd.DataFrame]:
        """
        한국투자증권 API로 분봉 데이터 조회
        """
        try:
            # timeframe에서 분 단위 추출 (예: '5m' -> 5)
            interval = int(timeframe.replace('m', ''))
            
            # period에서 데이터 개수 계산 (최대 120개)
            if 'd' in period:
                days = int(period.replace('d', ''))
                # 하루 6시간 거래 기준 (9:00-15:30)
                count = min(120, int(days * 6 * 60 / interval))
            else:
                count = 100  # 기본값
            
            kis_client = get_kis_client()
            df = kis_client.get_minute_data(symbol, interval=interval, count=count)
            
            if df is not None and not df.empty:
                logger.info(f"Successfully fetched {len(df)} {timeframe} bars for {symbol}")
                return df
            
            logger.warning(f"No intraday data returned for {symbol}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching intraday data for {symbol}: {e}")
            return None
    
    @staticmethod
    def _fetch_daily_data(symbol: str, period: str) -> Optional[pd.DataFrame]:
        """
        FinanceDataReader로 일봉 데이터 조회
        """
        try:
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
            
            # Fetch data from FinanceDataReader
            df = fdr.DataReader(symbol, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
            
            if df is None or df.empty:
                logger.warning(f"No daily data returned for {symbol}")
                return None
            
            logger.info(f"Successfully fetched {len(df)} daily bars for {symbol}")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching daily data for {symbol}: {e}")
            return None
    
    
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
