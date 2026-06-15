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
    
    # NOTE: Cooldown is now managed per-alert in database (cooldown_period column)
    # This cache is kept for backward compatibility but not used
    
    @classmethod
    async def _check_target_price_alert(cls, alert: Dict[str, Any], alert_id: str, user_id: str, symbol: str):
        """Check target price alert with cooldown"""
        # Get user's global cooldown setting
        user_id_str = alert.get('user_id')
        user_profile = await Database.get_user_profile(user_id_str)
        global_cooldown = user_profile.get('global_cooldown_minutes', 0) if user_profile else 0
        
        # Check cooldown if enabled
        last_triggered_at = alert.get('last_triggered_at')
        if global_cooldown > 0 and last_triggered_at:
            from datetime import timezone
            from dateutil import parser as date_parser
            
            if isinstance(last_triggered_at, str):
                last_triggered_dt = date_parser.parse(last_triggered_at)
            else:
                last_triggered_dt = last_triggered_at
            
            if last_triggered_dt.tzinfo is None:
                last_triggered_dt = last_triggered_dt.replace(tzinfo=timezone.utc)
            
            now = datetime.now(timezone.utc)
            elapsed_minutes = (now - last_triggered_dt).total_seconds() / 60
            
            # Use global cooldown setting
            if elapsed_minutes < global_cooldown:
                logger.info(f"Target price alert {alert_id} is in cooldown ({elapsed_minutes:.1f}/{global_cooldown} min), skipping")
                return
        
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
        
        # Check buy target price (price at or below target = good buy opportunity)
        enable_buy = alert.get('enable_buy_signal', True)
        if enable_buy and buy_price:
            # Alert when price reaches target (±0.5% tolerance for exact match)
            tolerance = buy_price * 0.005
            if abs(current_price - buy_price) <= tolerance or current_price <= buy_price:
                logger.info(f"Buy target price reached: {current_price} ≈ {buy_price}")
                await NotificationSender.send_alert_notification(
                    alert=alert,
                    alert_id=alert_id,
                    user_id=user_id,
                    symbol=symbol,
                    signal_type='buy',
                    indicator='target_price',
                    price=current_price,
                    timeframe=timeframe
                )
                return
        
        # Check sell target price (price at or above target = good sell opportunity)
        enable_sell = alert.get('enable_sell_signal', True)
        if enable_sell and sell_price:
            # Alert when price reaches target (±0.5% tolerance for exact match)
            tolerance = sell_price * 0.005
            if abs(current_price - sell_price) <= tolerance or current_price >= sell_price:
                logger.info(f"Sell target price reached: {current_price} ≈ {sell_price}")
                await NotificationSender.send_alert_notification(
                    alert=alert,
                    alert_id=alert_id,
                    user_id=user_id,
                    symbol=symbol,
                    signal_type='sell',
                    indicator='target_price',
                    price=current_price,
                    timeframe=timeframe
                )
    
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
        
        # Get user's global settings for cooldown
        user_profile = await Database.get_user_profile(user_id)
        global_cooldown = user_profile.get('global_cooldown_minutes', 0) if user_profile else 0
        
        # Auto cooldown based on timeframe (prevents alert spam within same candle)
        # Only for minute/hour timeframes, not for daily/weekly
        timeframe_cooldown_map = {
            '1m': 1,
            '3m': 3,
            '5m': 5,
            '10m': 10,
            '15m': 15,
            '30m': 30,
            '1h': 60,
        }
        auto_cooldown = timeframe_cooldown_map.get(timeframe, 0)
        
        # Use the longer of global or auto cooldown
        cooldown_period = max(global_cooldown, auto_cooldown)
        last_triggered_at = alert.get('last_triggered_at')
        
        if auto_cooldown > 0:
            logger.info(f"Auto cooldown for {timeframe}: {auto_cooldown} min (global: {global_cooldown} min, using: {cooldown_period} min)")
        
        # Check cooldown (prevents duplicate alerts)
        if cooldown_period > 0 and last_triggered_at:
            from datetime import timezone
            # Parse last_triggered_at
            if isinstance(last_triggered_at, str):
                from dateutil import parser
                last_triggered_dt = parser.parse(last_triggered_at)
            else:
                last_triggered_dt = last_triggered_at
            
            # Make timezone-aware if needed
            if last_triggered_dt.tzinfo is None:
                last_triggered_dt = last_triggered_dt.replace(tzinfo=timezone.utc)
            
            now = datetime.now(timezone.utc)
            elapsed_minutes = (now - last_triggered_dt).total_seconds() / 60
            
            if elapsed_minutes < cooldown_period:
                logger.info(f"Alert {alert_id} is in cooldown ({elapsed_minutes:.1f}/{cooldown_period} min), skipping")
                return
            else:
                logger.info(f"Alert {alert_id} cooldown expired ({elapsed_minutes:.1f}/{cooldown_period} min), checking...")
        
        # Special handling for target_price indicator
        if indicator == 'target_price':
            await cls._check_target_price_alert(alert, alert_id, user_id, symbol)
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
            
            # Send notification (will update last_triggered_at automatically)
            await NotificationSender.send_alert_notification(
                alert=alert,
                alert_id=alert_id,
                user_id=user_id,
                symbol=symbol,
                signal_type='buy' if is_buy_signal else 'sell',
                indicator=indicator,
                price=price,
                timeframe=timeframe
            )
