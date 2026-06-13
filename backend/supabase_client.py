from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from typing import List, Dict, Optional

def get_supabase_client() -> Client:
    """
    Supabase 클라이언트를 생성합니다. 백엔드에서는 서비스 롤 키를 사용합니다.
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def fetch_active_alerts() -> List[Dict]:
    """
    활성화된 알림을 가져옵니다.
    
    Returns:
        활성화된 알림 리스트
    """
    client = get_supabase_client()
    
    try:
        response = client.table('alerts').select('*').eq('is_active', True).execute()
        print(f"Debug: Response data: {response.data}")
        print(f"Debug: Response count: {len(response.data)}")
        return response.data
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        print(f"Error type: {type(e)}")
        return []

def save_triggered_alerts(matched_alerts: List[Dict]) -> bool:
    """
    매칭된 알림을 triggered_alerts 테이블에 저장합니다.
    
    Args:
        matched_alerts: 매칭된 알림 리스트
    
    Returns:
        성공 여부
    """
    if not matched_alerts:
        return True
    
    client = get_supabase_client()
    
    try:
        response = client.table('triggered_alerts').insert(matched_alerts).execute()
        print(f"Saved {len(matched_alerts)} triggered alerts")
        return True
    except Exception as e:
        print(f"Error saving triggered alerts: {e}")
        return False

def fetch_user_devices(user_id: str) -> List[Dict]:
    """
    사용자의 디바이스(FCM 토큰)를 가져옵니다.
    
    Args:
        user_id: 사용자 ID
    
    Returns:
        사용자 디바이스 리스트
    """
    client = get_supabase_client()
    
    try:
        response = client.table('user_devices').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching user devices: {e}")
        return []
