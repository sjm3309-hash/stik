-- ========================================
-- Global User Settings Migration
-- ========================================

-- Remove per-alert settings from alerts table
ALTER TABLE alerts 
DROP COLUMN IF EXISTS cooldown_period,
DROP COLUMN IF EXISTS sound_enabled,
DROP COLUMN IF EXISTS vibrate_enabled;

-- Add global settings to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vibrate_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS global_cooldown_minutes INTEGER DEFAULT 0;

-- Update existing notification settings columns (rename for clarity)
ALTER TABLE profiles
RENAME COLUMN notification_sound_enabled TO sound_enabled;

ALTER TABLE profiles
RENAME COLUMN notification_vibrate_enabled TO vibrate_enabled;

-- Add comments
COMMENT ON COLUMN profiles.sound_enabled IS '전역 알림 소리 설정';
COMMENT ON COLUMN profiles.vibrate_enabled IS '전역 알림 진동 설정';
COMMENT ON COLUMN profiles.global_cooldown_minutes IS '전역 중복 알림 제한 시간 (분): 0=없음, 1=1분, 5=5분, 10=10분, 60=1시간, 1440=1일';
