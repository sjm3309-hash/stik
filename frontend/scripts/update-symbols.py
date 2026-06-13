"""
종목 리스트 업데이트 스크립트
FinanceDataReader를 사용하여 한국 전체 주식, ETF, 지수 목록을 가져옵니다.
"""
import FinanceDataReader as fdr
import json
from pathlib import Path

def fetch_all_symbols():
    """모든 종목 정보를 가져옵니다."""
    symbols = []
    
    print("한국 주식 목록 가져오는 중...")
    # 한국 전체 주식 (KOSPI + KOSDAQ)
    try:
        kr_stocks = fdr.StockListing('KRX')
        for _, row in kr_stocks.iterrows():
            # .KS는 KOSPI, .KQ는 KOSDAQ
            suffix = '.KS' if row['Market'] == 'KOSPI' else '.KQ'
            symbols.append({
                "name": row['Name'],
                "symbol": f"{row['Code']}{suffix}",
                "type": "stock",
                "market": row['Market']
            })
        print(f"[OK] 한국 주식: {len(kr_stocks)}개")
    except Exception as e:
        print(f"[ERROR] 한국 주식 가져오기 실패: {e}")
    
    print("한국 ETF 목록 가져오는 중...")
    # 한국 ETF
    try:
        kr_etf = fdr.StockListing('ETF/KR')
        for _, row in kr_etf.iterrows():
            symbols.append({
                "name": row['Name'],
                "symbol": f"{row['Symbol']}.KS",
                "type": "etf",
                "market": "KRX"
            })
        print(f"[OK] 한국 ETF: {len(kr_etf)}개")
    except Exception as e:
        print(f"[ERROR] 한국 ETF 가져오기 실패: {e}")
    
    # 주요 지수 추가
    print("지수 추가 중...")
    indices = [
        {"name": "KOSPI", "symbol": "KS11", "type": "index", "market": "KRX"},
        {"name": "KOSDAQ", "symbol": "KQ11", "type": "index", "market": "KRX"},
        {"name": "KRX 100", "symbol": "KRX100", "type": "index", "market": "KRX"},
        {"name": "KOSPI 200", "symbol": "KS200", "type": "index", "market": "KRX"},
    ]
    symbols.extend(indices)
    print(f"[OK] 지수: {len(indices)}개")
    
    # 주요 미국 주식 추가
    print("미국 주요 주식 추가 중...")
    us_stocks = [
        {"name": "Apple", "symbol": "AAPL", "type": "stock", "market": "NASDAQ"},
        {"name": "Microsoft", "symbol": "MSFT", "type": "stock", "market": "NASDAQ"},
        {"name": "Amazon", "symbol": "AMZN", "type": "stock", "market": "NASDAQ"},
        {"name": "Google", "symbol": "GOOGL", "type": "stock", "market": "NASDAQ"},
        {"name": "Meta", "symbol": "META", "type": "stock", "market": "NASDAQ"},
        {"name": "Tesla", "symbol": "TSLA", "type": "stock", "market": "NASDAQ"},
        {"name": "NVIDIA", "symbol": "NVDA", "type": "stock", "market": "NASDAQ"},
        {"name": "Netflix", "symbol": "NFLX", "type": "stock", "market": "NASDAQ"},
        {"name": "Intel", "symbol": "INTC", "type": "stock", "market": "NASDAQ"},
        {"name": "AMD", "symbol": "AMD", "type": "stock", "market": "NASDAQ"},
    ]
    symbols.extend(us_stocks)
    print(f"[OK] 미국 주식: {len(us_stocks)}개")
    
    return symbols

def save_symbols(symbols):
    """symbols.json 파일로 저장합니다."""
    # frontend/public/symbols.json 경로
    output_path = Path(__file__).parent.parent / 'public' / 'symbols.json'
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(symbols, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] 총 {len(symbols)}개 종목이 {output_path}에 저장되었습니다.")

if __name__ == "__main__":
    print("=" * 60)
    print("종목 리스트 업데이트 시작")
    print("=" * 60)
    
    symbols = fetch_all_symbols()
    save_symbols(symbols)
    
    print("=" * 60)
    print("완료!")
    print("=" * 60)
