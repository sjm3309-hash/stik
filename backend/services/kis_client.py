"""
한국투자증권 OpenAPI (KIS Developers) 클라이언트
실시간 분봉 데이터 조회 지원
"""

import os
import logging
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Dict
import hashlib
import json

logger = logging.getLogger(__name__)


class KISClient:
    """한국투자증권 OpenAPI 클라이언트"""
    
    def __init__(self):
        self.app_key = os.getenv("KIS_APP_KEY")
        self.app_secret = os.getenv("KIS_APP_SECRET")
        self.base_url = os.getenv("KIS_BASE_URL", "https://openapi.koreainvestment.com:9443")
        self.mock_mode = os.getenv("KIS_MOCK_MODE", "true").lower() == "true"
        
        if not self.app_key or not self.app_secret:
            raise ValueError("KIS_APP_KEY and KIS_APP_SECRET must be set in environment variables")
        
        self.access_token = None
        self.token_expires_at = None
        
        logger.info(f"KIS Client initialized (Mock Mode: {self.mock_mode})")
    
    def get_access_token(self) -> str:
        """
        OAuth 2.0 액세스 토큰 발급
        토큰은 24시간 유효하므로 캐싱
        """
        # 토큰이 유효하면 재사용
        if self.access_token and self.token_expires_at:
            if datetime.now() < self.token_expires_at:
                return self.access_token
        
        url = f"{self.base_url}/oauth2/tokenP"
        headers = {"content-type": "application/json"}
        body = {
            "grant_type": "client_credentials",
            "appkey": self.app_key,
            "appsecret": self.app_secret
        }
        
        try:
            response = requests.post(url, headers=headers, json=body)
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data["access_token"]
            
            # 토큰 만료 시간 설정 (24시간 - 1시간 여유)
            self.token_expires_at = datetime.now() + timedelta(hours=23)
            
            logger.info("KIS access token obtained successfully")
            return self.access_token
            
        except Exception as e:
            logger.error(f"Failed to get KIS access token: {e}")
            raise
    
    def _get_headers(self, tr_id: str) -> Dict[str, str]:
        """API 호출을 위한 공통 헤더 생성"""
        token = self.get_access_token()
        
        return {
            "content-type": "application/json; charset=utf-8",
            "authorization": f"Bearer {token}",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
            "tr_id": tr_id
        }
    
    def get_minute_data(self, symbol: str, interval: int = 5, count: int = 100) -> Optional[pd.DataFrame]:
        """
        분봉 데이터 조회
        
        Args:
            symbol: 종목코드 (예: '005930')
            interval: 분봉 간격 (1, 5, 10, 15, 30, 60)
            count: 조회할 데이터 개수 (최대 120)
        
        Returns:
            DataFrame with columns: Open, High, Low, Close, Volume, Date
        """
        try:
            # 종목코드에서 .KS, .KQ 제거
            clean_symbol = symbol.replace('.KS', '').replace('.KQ', '').zfill(6)
            
            logger.info(f"Fetching {interval}-minute data for {clean_symbol} (count: {count})")
            
            # API 엔드포인트
            url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"
            
            # TR_ID: 모의투자/실전투자에 따라 다름
            tr_id = "FHKST03010200" if self.mock_mode else "FHKST03010200"
            
            headers = self._get_headers(tr_id)
            
            # 쿼리 파라미터
            params = {
                "FID_ETC_CLS_CODE": "",
                "FID_COND_MRKT_DIV_CODE": "J",  # J: 주식
                "FID_INPUT_ISCD": clean_symbol,
                "FID_INPUT_HOUR_1": "",  # 빈 문자열이면 현재 시각부터
                "FID_PW_DATA_INCU_YN": "Y",  # Y: 과거 데이터 포함
                "FID_HOUR_CLS_CODE": str(interval).zfill(2)  # 01, 05, 10, 15, 30, 60
            }
            
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("rt_cd") != "0":
                logger.error(f"KIS API error: {data.get('msg1')}")
                return None
            
            # 데이터 파싱
            output = data.get("output2", [])
            
            if not output:
                logger.warning(f"No data returned for {clean_symbol}")
                return None
            
            # DataFrame 생성
            df_data = []
            for item in output[:count]:  # count 개수만큼만 가져오기
                try:
                    df_data.append({
                        'Date': pd.to_datetime(item['stck_bsop_date'] + ' ' + item['stck_cntg_hour'], 
                                              format='%Y%m%d %H%M%S'),
                        'Open': float(item['stck_oprc']),
                        'High': float(item['stck_hgpr']),
                        'Low': float(item['stck_lwpr']),
                        'Close': float(item['stck_prpr']),
                        'Volume': int(item['cntg_vol'])
                    })
                except (KeyError, ValueError) as e:
                    logger.warning(f"Error parsing data item: {e}")
                    continue
            
            if not df_data:
                logger.warning(f"No valid data parsed for {clean_symbol}")
                return None
            
            df = pd.DataFrame(df_data)
            df.set_index('Date', inplace=True)
            df.sort_index(inplace=True)  # 오래된 것부터 정렬
            
            logger.info(f"Successfully fetched {len(df)} {interval}-minute bars for {clean_symbol}")
            return df
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error fetching KIS data: {e}")
            logger.error(f"Response: {e.response.text if hasattr(e, 'response') else 'N/A'}")
            return None
        except Exception as e:
            logger.error(f"Error fetching KIS minute data for {symbol}: {e}")
            return None
    
    def get_current_price(self, symbol: str) -> Optional[float]:
        """
        현재가 조회
        
        Args:
            symbol: 종목코드 (예: '005930')
        
        Returns:
            현재가 (float)
        """
        try:
            clean_symbol = symbol.replace('.KS', '').replace('.KQ', '').zfill(6)
            
            url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
            
            tr_id = "FHKST01010100" if self.mock_mode else "FHKST01010100"
            headers = self._get_headers(tr_id)
            
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": clean_symbol
            }
            
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("rt_cd") != "0":
                logger.error(f"KIS API error: {data.get('msg1')}")
                return None
            
            output = data.get("output")
            if output:
                return float(output.get("stck_prpr", 0))
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting current price for {symbol}: {e}")
            return None


# 전역 클라이언트 인스턴스 (싱글톤 패턴)
_kis_client = None


def get_kis_client() -> KISClient:
    """KIS 클라이언트 싱글톤 인스턴스 반환"""
    global _kis_client
    if _kis_client is None:
        _kis_client = KISClient()
    return _kis_client
