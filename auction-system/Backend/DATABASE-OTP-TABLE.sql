-- ═══════════════════════════════════════════════════════════════════════════
-- OTP VERIFICATION SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════
-- Table để lưu mã OTP cho email verification
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'email_verification', -- 'email_verification', 'password_reset', etc.
  
  -- Trạng thái
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Thời hạn
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45), -- IPv6 support
  user_agent TEXT,
  
  -- Index for faster lookup
  CONSTRAINT valid_otp_length CHECK (length(otp_code) = 6)
);

-- Indexes
CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_otp_code ON otp_codes(otp_code);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- Comments
COMMENT ON TABLE otp_codes IS 'Mã OTP cho email verification và password reset';
COMMENT ON COLUMN otp_codes.purpose IS 'Mục đích: email_verification, password_reset';
COMMENT ON COLUMN otp_codes.expires_at IS 'OTP hết hạn sau 10 phút';

-- Auto cleanup expired OTP (run every hour)
-- Note: Cần enable pg_cron extension trong Supabase
-- SELECT cron.schedule('cleanup-expired-otp', '0 * * * *', $$
--   DELETE FROM otp_codes WHERE expires_at < NOW() AND is_verified = false;
-- $$);
