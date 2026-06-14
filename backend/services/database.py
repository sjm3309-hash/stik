import logging
from supabase import create_client, Client
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class Database:
    """Supabase database client"""
    
    _instance: Client = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get Supabase client singleton"""
        if cls._instance is None:
            logger.info("Initializing Supabase client...")
            cls._instance = create_client(
                settings.supabase_url,
                settings.supabase_service_key
            )
            logger.info("Supabase client initialized")
        return cls._instance
    
    @classmethod
    async def get_active_alerts(cls):
        """Get all active alerts from database"""
        try:
            client = cls.get_client()
            response = client.table("alerts").select("*").eq("is_active", True).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching active alerts: {e}")
            return []
    
    @classmethod
    async def get_user_devices(cls, user_id: str):
        """Get FCM tokens for a user"""
        try:
            client = cls.get_client()
            response = client.table("user_devices").select("fcm_token").eq("user_id", user_id).order("created_at", desc=True).execute()
            return [device["fcm_token"] for device in response.data]
        except Exception as e:
            logger.error(f"Error fetching user devices: {e}")
            return []
    
    @classmethod
    async def save_alert_history(cls, alert_id: str, user_id: str, ticker: str, 
                                  timeframe: str, indicator: str, condition: str,
                                  trigger_price: float, signal_type: str, message: str,
                                  notification_sent: bool = True):
        """Save alert notification to history (new schema)"""
        try:
            client = cls.get_client()
            from datetime import datetime
            data = {
                "alert_id": alert_id,
                "user_id": user_id,
                "ticker": ticker,
                "timeframe": timeframe,
                "indicator": indicator,
                "condition": condition,
                "trigger_price": trigger_price,
                "signal_type": signal_type,
                "message": message,
                "notification_sent": notification_sent,
                "triggered_at": datetime.utcnow().isoformat()
            }
            response = client.table("alert_history").insert(data).execute()
            logger.info(f"Alert history saved: {alert_id}")
            return response.data
        except Exception as e:
            logger.error(f"Error saving alert history: {e}")
            return None
    
    @classmethod
    async def update_alert_last_triggered(cls, alert_id: str):
        """Update alert last triggered timestamp (for cooldown)"""
        try:
            client = cls.get_client()
            from datetime import datetime
            response = client.table("alerts").update({
                "last_triggered_at": datetime.utcnow().isoformat()
            }).eq("id", alert_id).execute()
            logger.info(f"Alert {alert_id} last_triggered_at updated")
            return response.data
        except Exception as e:
            logger.error(f"Error updating alert last triggered: {e}")
            return None
    
    @classmethod
    async def get_alert_history(cls, user_id: str, limit: int = 50):
        """Get alert history for a user"""
        try:
            client = cls.get_client()
            response = client.table("alert_history")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("triggered_at", desc=True)\
                .limit(limit)\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching alert history: {e}")
            return []
    
    @classmethod
    async def get_user_profile(cls, user_id: str):
        """Get user profile with settings"""
        try:
            client = cls.get_client()
            response = client.table("profiles")\
                .select("*")\
                .eq("user_id", user_id)\
                .single()\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            return None
