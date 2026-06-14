import logging
from typing import Optional

from services.database import Database
from services.firebase_service import FirebaseService

logger = logging.getLogger(__name__)


class NotificationSender:
    """Handle notification sending logic"""
    
    # Korean stock name mapping (예시, 실제로는 DB나 API에서 가져와야 함)
    STOCK_NAMES = {
        '005930.KS': '삼성전자',
        '000660.KS': 'SK하이닉스',
        '035420.KS': 'NAVER',
        '035720.KS': '카카오',
        # US stocks
        'AAPL': 'Apple',
        'GOOGL': 'Google',
        'TSLA': 'Tesla',
        'MSFT': 'Microsoft',
    }
    
    INDICATOR_NAMES = {
        'macd': 'MACD',
        'rsi': 'RSI',
        'bollinger': '볼린저 밴드',
        'ma_cross': '이평선 크로스',
        'ma_price_cross': '이평선 가격 돌파',
        'disparity': '이격도',
        'cci': 'CCI',
        'target_price': '목표가',
    }
    
    SIGNAL_MESSAGES = {
        'buy': {
            'title': '{stock} 매수 시그널!',
            'body': '{timeframe} {indicator}에서 매수 타이밍이 발생했습니다. 현재가: {price}원'
        },
        'sell': {
            'title': '{stock} 매도 시그널!',
            'body': '{timeframe} {indicator}에서 매도 타이밍이 발생했습니다. 현재가: {price}원'
        }
    }
    
    @classmethod
    def get_stock_name(cls, symbol: str) -> str:
        """Get human-readable stock name"""
        return cls.STOCK_NAMES.get(symbol, symbol)
    
    @classmethod
    def get_indicator_name(cls, indicator: str) -> str:
        """Get human-readable indicator name"""
        return cls.INDICATOR_NAMES.get(indicator, indicator)
    
    @classmethod
    def get_timeframe_name(cls, timeframe: str) -> str:
        """Get human-readable timeframe name"""
        timeframe_map = {
            '1m': '1분봉',
            '3m': '3분봉',
            '5m': '5분봉',
            '10m': '10분봉',
            '15m': '15분봉',
            '30m': '30분봉',
            '1h': '1시간봉',
            '1d': '일봉',
            '1w': '주봉',
            '1M': '월봉',
        }
        return timeframe_map.get(timeframe, timeframe)
    
    @classmethod
    async def send_alert_notification(cls, alert: dict, alert_id: str, user_id: str, symbol: str,
                                       signal_type: str, indicator: str, price: Optional[float],
                                       timeframe: str):
        """Send alert notification to user"""
        try:
            logger.info(f"Sending notification for alert {alert_id} to user {user_id}")
            
            # Get user FCM tokens
            tokens = await Database.get_user_devices(user_id)
            if not tokens:
                logger.warning(f"No FCM tokens found for user {user_id}")
                return
            
            # Get notification settings
            sound_enabled = alert.get('sound_enabled', True)
            vibrate_enabled = alert.get('vibrate_enabled', True)
            
            # Build notification message
            stock_name = cls.get_stock_name(symbol)
            indicator_name = cls.get_indicator_name(indicator)
            timeframe_name = cls.get_timeframe_name(timeframe)
            price_str = f"{price:,.0f}" if price else "N/A"
            
            message_template = cls.SIGNAL_MESSAGES.get(signal_type, cls.SIGNAL_MESSAGES['buy'])
            title = message_template['title'].format(stock=stock_name)
            body = message_template['body'].format(
                timeframe=timeframe_name,
                indicator=indicator_name,
                price=price_str
            )
            
            # Notification data
            data = {
                'alert_id': alert_id,
                'symbol': symbol,
                'signal_type': signal_type,
                'indicator': indicator,
                'price': str(price) if price else '',
                'timestamp': str(int(datetime.now().timestamp()))
            }
            
            # Send notification with custom sound/vibration settings
            success = await FirebaseService.send_notification(
                token=tokens[0],
                title=title,
                body=body,
                data=data,
                sound_enabled=sound_enabled,
                vibrate_enabled=vibrate_enabled
            )
            
            if success:
                # Save to alert history
                await Database.save_alert_history(
                    alert_id=alert_id,
                    user_id=user_id,
                    ticker=symbol,
                    timeframe=timeframe,
                    indicator=indicator,
                    condition=signal_type,
                    trigger_price=price or 0.0,
                    signal_type=signal_type,
                    message=f"{title} - {body}",
                    notification_sent=True
                )
                
                # Update last_triggered_at in alerts table
                await Database.update_alert_last_triggered(alert_id)
                
                logger.info(f"Notification sent successfully for alert {alert_id}")
            else:
                logger.error(f"Failed to send notification for alert {alert_id}")
                # Still save to history but mark as failed
                await Database.save_alert_history(
                    alert_id=alert_id,
                    user_id=user_id,
                    ticker=symbol,
                    timeframe=timeframe,
                    indicator=indicator,
                    condition=signal_type,
                    trigger_price=price or 0.0,
                    signal_type=signal_type,
                    message=f"{title} - {body}",
                    notification_sent=False
                )
                
        except Exception as e:
            logger.error(f"Error sending alert notification: {e}")


from datetime import datetime
