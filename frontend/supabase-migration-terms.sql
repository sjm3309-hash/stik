-- Migration: Add terms agreement fields to profiles table
-- Run this in your Supabase SQL Editor to update existing profiles table

-- Add new columns for terms agreement
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to have terms agreed (optional - remove if you want existing users to re-agree)
-- UPDATE profiles SET 
--   terms_agreed = true,
--   privacy_agreed = true,
--   push_agreed = true,
--   agreed_at = now()
-- WHERE terms_agreed IS NULL OR terms_agreed = false;

-- Add comment to document the columns
COMMENT ON COLUMN profiles.terms_agreed IS '서비스 이용약관 동의 여부';
COMMENT ON COLUMN profiles.privacy_agreed IS '개인정보 수집 및 이용 동의 여부';
COMMENT ON COLUMN profiles.push_agreed IS '푸시 알림 및 야간 알림 수신 동의 여부';
COMMENT ON COLUMN profiles.agreed_at IS '약관 동의 일시';
