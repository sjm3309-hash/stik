import logging
import json
import os
from typing import Optional

from services.database import Database
from services.firebase_service import FirebaseService

logger = logging.getLogger(__name__)

# Load stock names from JSON file at module import time
def _load_stock_names_at_import():
    """Load stock names from JSON file when module is imported"""
    try:
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'stock_names.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            stock_names = json.load(f)
        logger.info(f"✅ Successfully loaded {len(stock_names)} stock names from {json_path}")
        return stock_names
    except Exception as e:
        logger.error(f"❌ CRITICAL: Failed to load stock_names.json: {e}")
        return {}

# Global stock names cache - loaded once when module is imported
_STOCK_NAMES_CACHE = _load_stock_names_at_import()


class NotificationSender:
    """Handle notification sending logic"""
    
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
        # Remove .KS or .KQ suffix for lookup
        code = symbol.replace('.KS', '').replace('.KQ', '')
        
        # Try to find the stock name from global cache
        stock_name = _STOCK_NAMES_CACHE.get(code, symbol)
        
        # Log INFO level to ensure visibility in production
        logger.info(f"📊 Stock name lookup: {symbol} -> {code} -> {stock_name}")
        return stock_name
    
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
                logger.warning(f"❌ No FCM tokens found for user {user_id} - Alert will NOT be sent!")
                # Still save to history even if no tokens
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
                return
            
            # Get user's global notification settings
            user_profile = await Database.get_user_profile(user_id)
            sound_enabled = user_profile.get('sound_enabled', True) if user_profile else True
            vibrate_enabled = user_profile.get('vibrate_enabled', True) if user_profile else True
            
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
            
            # Save to alert history regardless of FCM success
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
                notification_sent=success
            )
            
            # CRITICAL: Update last_triggered_at REGARDLESS of FCM success
            # This ensures cooldown works even if notifications fail
            await Database.update_alert_last_triggered(alert_id)
            
            if success:
                logger.info(f"✅ Notification sent successfully for alert {alert_id}")
            else:
                logger.error(f"❌ Failed to send notification for alert {alert_id}, but cooldown still applied")
                
        except Exception as e:
            logger.error(f"Error sending alert notification: {e}")


from datetime import datetime
