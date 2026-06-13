import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import asyncio

from services.alert_checker import AlertChecker
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AlertScheduler:
    """Schedule alert checking jobs"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._setup_jobs()
    
    def _setup_jobs(self):
        """Setup scheduled jobs"""
        
        # 1분마다 분봉 체크
        self.scheduler.add_job(
            self._check_minute_alerts,
            trigger=IntervalTrigger(minutes=1),
            id='check_minute_alerts',
            name='Check minute timeframe alerts',
            replace_existing=True
        )
        
        # 5분마다 5분봉 체크
        self.scheduler.add_job(
            self._check_5min_alerts,
            trigger=IntervalTrigger(minutes=5),
            id='check_5min_alerts',
            name='Check 5-minute timeframe alerts',
            replace_existing=True
        )
        
        # 15분마다 15분봉 체크
        self.scheduler.add_job(
            self._check_15min_alerts,
            trigger=IntervalTrigger(minutes=15),
            id='check_15min_alerts',
            name='Check 15-minute timeframe alerts',
            replace_existing=True
        )
        
        # 1시간마다 시간봉 체크
        self.scheduler.add_job(
            self._check_hourly_alerts,
            trigger=IntervalTrigger(hours=1),
            id='check_hourly_alerts',
            name='Check hourly timeframe alerts',
            replace_existing=True
        )
        
        # 평일 장 마감 후 일봉 체크 (오후 3:35, 한국 시간 기준)
        self.scheduler.add_job(
            self._check_daily_alerts,
            trigger=CronTrigger(
                day_of_week='mon-fri',
                hour=15,
                minute=35,
                timezone='Asia/Seoul'
            ),
            id='check_daily_alerts',
            name='Check daily timeframe alerts',
            replace_existing=True
        )
        
        # 매주 월요일 주봉 체크
        self.scheduler.add_job(
            self._check_weekly_alerts,
            trigger=CronTrigger(
                day_of_week='mon',
                hour=16,
                minute=0,
                timezone='Asia/Seoul'
            ),
            id='check_weekly_alerts',
            name='Check weekly timeframe alerts',
            replace_existing=True
        )
        
        logger.info("Scheduled jobs configured")
    
    async def _check_minute_alerts(self):
        """Check 1-minute timeframe alerts"""
        logger.info("Checking 1-minute alerts...")
        await AlertChecker.check_all_alerts()
    
    async def _check_5min_alerts(self):
        """Check 5-minute timeframe alerts"""
        logger.info("Checking 5-minute alerts...")
        await AlertChecker.check_all_alerts()
    
    async def _check_15min_alerts(self):
        """Check 15-minute timeframe alerts"""
        logger.info("Checking 15-minute alerts...")
        await AlertChecker.check_all_alerts()
    
    async def _check_hourly_alerts(self):
        """Check hourly timeframe alerts"""
        logger.info("Checking hourly alerts...")
        await AlertChecker.check_all_alerts()
    
    async def _check_daily_alerts(self):
        """Check daily timeframe alerts"""
        logger.info("Checking daily alerts...")
        await AlertChecker.check_all_alerts()
    
    async def _check_weekly_alerts(self):
        """Check weekly timeframe alerts"""
        logger.info("Checking weekly alerts...")
        await AlertChecker.check_all_alerts()
    
    def start(self):
        """Start the scheduler"""
        try:
            self.scheduler.start()
            logger.info("Alert scheduler started successfully")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            raise
    
    def stop(self):
        """Stop the scheduler"""
        try:
            self.scheduler.shutdown(wait=False)
            logger.info("Alert scheduler stopped")
        except Exception as e:
            logger.error(f"Error stopping scheduler: {e}")
