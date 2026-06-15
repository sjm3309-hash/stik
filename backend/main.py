import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from services.scheduler import AlertScheduler
from services.data_fetcher import DataFetcher
# Explicitly import notification_sender to load stock names at startup
import services.notification_sender

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()
logger.info(f"[DEBUG] Loaded SUPABASE_URL: {settings.supabase_url}")
logger.info(f"[DEBUG] Loaded SUPABASE_SERVICE_KEY: {'****' + settings.supabase_service_key[-10:] if settings.supabase_service_key else 'NOT LOADED'}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Stik Alert Service...")
    
    # Verify stock names are loaded
    from services.notification_sender import _STOCK_NAMES_CACHE
    logger.info(f"✅ Stock names cache loaded: {len(_STOCK_NAMES_CACHE)} entries")
    if len(_STOCK_NAMES_CACHE) == 0:
        logger.error("❌ CRITICAL: Stock names cache is empty!")
    
    # Start scheduler
    scheduler = AlertScheduler()
    scheduler.start()
    logger.info("Alert scheduler started")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Stik Alert Service...")
    scheduler.stop()


app = FastAPI(
    title="Stik Alert Service",
    description="Stock alert notification service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: 프로덕션에서는 specific origins로 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Stik Alert Service",
        "status": "running",
        "environment": settings.environment
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "scheduler": "running"
    }


@app.get("/api/stock/{symbol}")
async def get_stock_info(symbol: str):
    """Get stock price and change information"""
    try:
        # Remove .KS or .KQ suffix
        clean_symbol = symbol.replace('.KS', '').replace('.KQ', '')
        
        # Fetch recent data (last 2 days)
        df = DataFetcher.get_stock_data(clean_symbol, '1d', '5d')
        
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Stock data not found")
        
        # Get latest and previous close prices
        latest = df.iloc[-1]
        current_price = float(latest['Close'])
        
        if len(df) >= 2:
            previous = df.iloc[-2]
            prev_close = float(previous['Close'])
            change = current_price - prev_close
            change_percent = (change / prev_close) * 100
        else:
            change = 0
            change_percent = 0
        
        return {
            "symbol": symbol,
            "name": symbol,
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "date": str(latest.name.date()) if hasattr(latest.name, 'date') else str(latest.name)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stock info for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development"
    )
