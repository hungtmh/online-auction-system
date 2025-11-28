-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SPAM REPORTS TABLE - Quản lý báo cáo spam
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Tạo enum cho loại báo cáo spam
DO $$ BEGIN
    CREATE TYPE spam_report_type AS ENUM ('user', 'product', 'bid', 'message');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tạo enum cho trạng thái báo cáo spam
DO $$ BEGIN
    CREATE TYPE spam_report_status AS ENUM ('pending', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tạo bảng spam_reports
CREATE TABLE IF NOT EXISTS spam_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Người báo cáo
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Người bị báo cáo
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Loại báo cáo
  report_type spam_report_type NOT NULL DEFAULT 'user',
  
  -- ID của đối tượng bị báo cáo (product hoặc bid)
  reported_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  reported_bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  
  -- Nội dung báo cáo
  reason TEXT NOT NULL,
  evidence_urls TEXT[], -- Mảng URL hình ảnh/video làm bằng chứng
  
  -- Trạng thái xử lý
  status spam_report_status DEFAULT 'pending',
  
  -- Hành động đã thực hiện
  action_taken VARCHAR(50), -- 'warn', 'ban_user', 'delete_content', 'ban_and_delete', 'dismissed'
  admin_note TEXT,
  
  -- Admin xử lý
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE spam_reports IS 'Bảng lưu trữ các báo cáo spam từ người dùng';
COMMENT ON COLUMN spam_reports.report_type IS 'Loại báo cáo: user (tài khoản spam), product (sản phẩm spam), bid (đấu giá spam), message (tin nhắn spam)';
COMMENT ON COLUMN spam_reports.action_taken IS 'Hành động đã thực hiện: warn, ban_user, delete_content, ban_and_delete, dismissed';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spam_reports_reporter ON spam_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_spam_reports_reported_user ON spam_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_spam_reports_status ON spam_reports(status);
CREATE INDEX IF NOT EXISTS idx_spam_reports_type ON spam_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_spam_reports_created_at ON spam_reports(created_at DESC);

-- RLS (Row Level Security) - Tùy chọn
-- ALTER TABLE spam_reports ENABLE ROW LEVEL SECURITY;

-- Policy cho Admin có thể xem tất cả
-- CREATE POLICY "Admin can view all spam reports" ON spam_reports
--   FOR SELECT USING (
--     EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
--   );

-- Policy cho người dùng chỉ có thể tạo báo cáo
-- CREATE POLICY "Users can create spam reports" ON spam_reports
--   FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SAMPLE DATA (để test)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Uncomment để thêm dữ liệu mẫu
-- INSERT INTO spam_reports (reporter_id, reported_user_id, report_type, reason) VALUES
-- ('user-uuid-1', 'user-uuid-2', 'user', 'Tài khoản này liên tục đăng sản phẩm giả mạo'),
-- ('user-uuid-1', 'user-uuid-3', 'product', 'Sản phẩm có nội dung không phù hợp');

