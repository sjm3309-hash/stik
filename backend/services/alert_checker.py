import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

from services.database import Database
from services.data_fetcher import DataFetcher
from services.indicator_calculator import IndicatorCalculator
from services.notification_sender import NotificationSender

logger = logging.getLogger(__name__)


class AlertChecker:
    """Check alert conditions and trigger notifications"""
    
    # Cache to prevent duplicate alerts (symbol + alert_id + signal)
    _recent_alerts = {}
    _cooldown_minutes = 60  # Don't send same alert within 60 minutes
    
    @classmethod
    async def _check_target_price_alert(cls, alert: Dict[str, Any], alert_id: str, user_id: str, symbol: str, cache_key: str):
        """Check target price alert"""
        parameters = alert.get('parameters', {}).get('target_price', {})
        buy_price = parameters.get('buy_price')
        sell_price = parameters.get('sell_price')
        condition = alert.get('condition', {})
        timeframe = condition.get('timeframe', '1d')
        
        # Get current price
        current_price = DataFetcher.get_latest_price(symbol)
        if current_price is None:
            logger.warning(f"Could not get current price for {symbol}")
            return
        
        logger.info(f"Current price for {symbol}: {current_price}")
        
        # Check buy target price
        enable_buy = alert.get('enable_buy_signal', True)
        if enable_buy and buy_price and current_price <= buy_price:
            logger.info(f"Buy target price reached: {current_price} <= {buy_price}")
            await NotificationSender.send_alert_notification(
                alert_id=alert_id,
                user_id=user_id,
                symbol=symbol,
                signal_type='buy',
                indicator='target_price',
                price=current_price,
                timeframe=timeframe
            )
            cls._recent_alerts[cache_key] = datetime.now()
            return
        
        # Check sell target price
        enable_sell = alert.get('enable_sell_signal', True)
        if enable_sell and sell_price and current_price >= sell_price:
            logger.info(f"Sell target price reached: {current_price} >= {sell_price}")
            await NotificationSender.send_alert_notification(
                alert_id=alert_id,
                user_id=user_id,
                symbol=symbol,
                signal_type='sell',
                indicator='target_price',
                price=current_price,
                timeframe=timeframe
            )
            cls._recent_alerts[cache_key] = datetime.now()
    
    @classmethod
    async def check_all_alerts(cls):
        """Check all active alerts"""
        try:
            logger.info("Starting alert check cycle...")
            alerts = await Database.get_active_alerts()
            logger.info(f"Found {len(alerts)} active alerts to check")
            
            for alert in alerts:
                try:
                    await cls.check_single_alert(alert)
                except Exception as e:
                    logger.error(f"Error checking alert {alert.get('id')}: {e}")
            
            logger.info("Alert check cycle completed")
        except Exception as e:
            logger.error(f"Error in check_all_alerts: {e}")
    
    @classmethod
    async def check_single_alert(cls, alert: Dict[str, Any]):
        """Check a single alert condition"""
        alert_id = alert['id']
        user_id = alert['user_id']
        condition = alert['condition']
        
        symbol = condition.get('symbol')
        timeframe = condition.get('timeframe')
        indicator = condition.get('indicator')
        
        logger.info(f"Checking alert {alert_id}: {symbol} {timeframe} {indicator}")
        
        # Check cooldown to prevent duplicate alerts
        cache_key = f"{alert_id}_{indicator}"
        if cache_key in cls._recent_alerts:
            last_sent = cls._recent_alerts[cache_key]
            if datetime.now() - last_sent < timedelta(minutes=cls._cooldown_minutes):
                logger.debug(f"Alert {alert_id} is in cooldown period, skipping")
                return
        
        # Special handling for target_price indicator
        if indicator == 'target_price':
            await cls._check_target_price_alert(alert, alert_id, user_id, symbol, cache_key)
            return
        
        # Fetch stock data
        df = DataFetcher.get_stock_data(symbol, timeframe, period="60d")
        if df is None or df.empty:
            logger.warning(f"No data available for {symbol}")
            return
        
        # Get indicator parameters from alert
        parameters = alert.get('parameters', {})
        if indicator == 'macd':
            parameters = parameters.get('macd', {'fast': 12, 'slow': 26, 'signal': 9})
        elif indicator == 'rsi':
            parameters = parameters.get('rsi', {'period': 14, 'overbought': 70, 'oversold': 30})
        elif indicator == 'bollinger':
            parameters = parameters.get('bollinger', {'period': 20, 'std_dev': 2})
        elif indicator == 'ma_cross':
            parameters = parameters.get('ma', {'short_period': 20, 'long_period': 50})
        elif indicator == 'ma_price_cross':
            parameters = parameters.get('ma_price_cross', {'period': 20})
        elif indicator == 'disparity':
            parameters = parameters.get('disparity', {'ma_period': 20, 'overheat': 105, 'chill': 95})
        elif indicator == 'cci':
            parameters = parameters.get('cci', {'period': 14, 'upper': 100, 'lower': -100})
        
        # Check indicator condition
        result = IndicatorCalculator.check_indicator(df, indicator, parameters)
        
        if result:
            signal_type = result['signal']
            logger.info(f"Signal detected for alert {alert_id}: {signal_type}")
            
            # Check if user wants this signal type
            enable_buy = alert.get('enable_buy_signal', True)
            enable_sell = alert.get('enable_sell_signal', True)
            
            is_buy_signal = signal_type in ['golden_cross', 'oversold', 'lower_break']
            is_sell_signal = signal_type in ['dead_cross', 'overbought', 'upper_break']
            
            if (is_buy_signal and not enable_buy) or (is_sell_signal and not enable_sell):
                logger.info(f"Signal {signal_type} is disabled for this alert")
                return
            
            # Get latest price
            price = DataFetcher.get_latest_price(symbol)
            
            # Send notification
            await NotificationSender.send_alert_notification(
                alert_id=alert_id,
                user_id=user_id,
                symbol=symbol,
                signal_type='buy' if is_buy_signal else 'sell',
                indicator=indicator,
                price=price,
                timeframe=timeframe
            )
            
            # Update cooldown
            cls._recent_alerts[cache_key] = datetime.now()
            
            # Update alert trigger in database
            await Database.update_alert_trigger(alert_id)
