import logging
import firebase_admin
from firebase_admin import credentials, messaging
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class FirebaseService:
    """Firebase Cloud Messaging service"""
    
    _initialized = False
    
    @classmethod
    def initialize(cls):
        """Initialize Firebase Admin SDK"""
        if not cls._initialized:
            try:
                logger.info("Initializing Firebase Admin SDK...")
                cred = credentials.Certificate(settings.firebase_credentials_path)
                firebase_admin.initialize_app(cred)
                cls._initialized = True
                logger.info("Firebase Admin SDK initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
                raise
    
    @classmethod
    async def send_notification(cls, token: str, title: str, body: str, data: dict = None,
                                 sound_enabled: bool = True, vibrate_enabled: bool = True):
        """Send push notification to a single device with custom sound/vibration"""
        if not cls._initialized:
            cls.initialize()
        
        try:
            # Build Android config with sound and vibration settings
            android_config = messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default' if sound_enabled else None,
                    # Vibration pattern: [delay, vibrate, sleep, vibrate, ...]
                    vibrate_timings_millis=[0, 500, 250, 500] if vibrate_enabled else None,
                    channel_id='stock_alerts'
                )
            )
            
            # Build APNS config for iOS
            apns_config = messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound=messaging.CriticalSound(
                            name='default' if sound_enabled else None,
                            critical=False
                        ) if sound_enabled else None,
                        # iOS handles vibration automatically with sound
                    )
                )
            )
            
            # Build Webpush config for browsers (Chrome, Firefox, Edge, etc.)
            webpush_config = messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon='/icon.png',
                    badge='/badge.png',
                    # requireInteraction keeps the notification visible until user interacts
                    tag='stock-alert',
                    renotify=True,
                )
                # Note: fcm_options.link requires HTTPS, skip for local development
            )
            
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                token=token,
                android=android_config,
                apns=apns_config,
                webpush=webpush_config
            )
            
            response = messaging.send(message)
            logger.info(f"Notification sent successfully: {response}")
            return True
        except messaging.UnregisteredError:
            logger.warning(f"Token is invalid or unregistered: {token}")
            # TODO: Remove invalid token from database
            return False
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return False
    
    @classmethod
    async def send_multicast(cls, tokens: list[str], title: str, body: str, data: dict = None):
        """Send push notification to multiple devices"""
        if not cls._initialized:
            cls.initialize()
        
        if not tokens:
            logger.warning("No tokens provided for multicast")
            return
        
        try:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                tokens=tokens,
            )
            
            response = messaging.send_multicast(message)
            logger.info(f"Multicast sent: {response.success_count} succeeded, {response.failure_count} failed")
            
            # Handle failed tokens
            if response.failure_count > 0:
                failed_tokens = []
                for idx, result in enumerate(response.responses):
                    if not result.success:
                        failed_tokens.append(tokens[idx])
                        logger.warning(f"Failed to send to token: {tokens[idx]}, error: {result.exception}")
                # TODO: Remove failed tokens from database
            
            return response
        except Exception as e:
            logger.error(f"Error sending multicast notification: {e}")
            return None
