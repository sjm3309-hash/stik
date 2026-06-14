-- ========================================
-- Complete Migration (All-in-One)
-- 통합 마이그레이션 - 한 번에 실행
-- ========================================

-- 1. Add last_triggered_at to alerts table (for cooldown)
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN alerts.last_triggered_at IS '마지막 알림 발생 시간 (쿨다운 계산용)';

CREATE INDEX IF NOT EXISTS idx_alerts_last_triggered ON alerts(last_triggered_at);

-- 2. Create alert_history table for tracking all notifications
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  indicator TEXT NOT NULL,
  condition TEXT NOT NULL,
  trigger_price NUMERIC(12, 2),
  signal_type TEXT NOT NULL,
  message TEXT,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notification_sent BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at DESC);

-- Enable RLS on alert_history
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Create policies for alert_history
DROP POLICY IF EXISTS "Users can view their own alert history" ON alert_history;
CREATE POLICY "Users can view their own alert history"
  ON alert_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert alert history" ON alert_history;
CREATE POLICY "Service can insert alert history"
  ON alert_history FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own alert history" ON alert_history;
CREATE POLICY "Users can delete their own alert history"
  ON alert_history FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE alert_history IS '알림 발생 이력 테이블 - 모든 알림 발생 시 기록';
COMMENT ON COLUMN alert_history.notification_sent IS '알림 전송 성공 여부';

-- 3. Add global notification settings to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vibrate_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS global_cooldown_minutes INTEGER DEFAULT 0;

COMMENT ON COLUMN profiles.sound_enabled IS '전역 알림 소리 설정';
COMMENT ON COLUMN profiles.vibrate_enabled IS '전역 알림 진동 설정';
COMMENT ON COLUMN profiles.global_cooldown_minutes IS '전역 중복 알림 제한 시간 (분): 0=없음, 1=1분, 5=5분, 10=10분, 60=1시간, 1440=1일';

-- 4. Clean up old columns if they exist
-- DO $$ 
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.columns 
--                WHERE table_name='alerts' AND column_name='cooldown_period') THEN
--         ALTER TABLE alerts DROP COLUMN cooldown_period;
--     END IF;
-- END $$;
