-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SPAM REPORTS TABLE - Quản lý báo cáo spam
-- Script để tạo bảng spam_reports trong Supabase
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

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INSERT SAMPLE DATA - Dữ liệu mẫu để test
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Lấy 3 user IDs từ bảng profiles
DO $$
DECLARE
    admin_user_id UUID;
    reporter_user_id UUID;
    reported_user_id UUID;
    product_id UUID;
BEGIN
    -- Lấy admin user (người có role = 'admin')
    SELECT id INTO admin_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;

    -- Lấy reporter (người báo cáo - có thể là bidder)
    SELECT id INTO reporter_user_id 
    FROM profiles 
    WHERE role = 'bidder' 
    LIMIT 1;

    -- Lấy reported user (người bị báo cáo - có thể là seller)
    SELECT id INTO reported_user_id 
    FROM profiles 
    WHERE role = 'seller' 
    LIMIT 1;

    -- Lấy product ID
    SELECT id INTO product_id 
    FROM products 
    LIMIT 1;

    -- Chỉ insert nếu tìm thấy đủ users
    IF admin_user_id IS NOT NULL AND reporter_user_id IS NOT NULL AND reported_user_id IS NOT NULL THEN
        -- Sample report 1: User spam
        INSERT INTO spam_reports (
            reporter_id, 
            reported_user_id, 
            report_type, 
            reason,
            status,
            created_at
        ) VALUES (
            reporter_user_id,
            reported_user_id,
            'user',
            'Tài khoản này liên tục đăng sản phẩm giả mạo và lừa đảo người mua. Đã có nhiều người phàn nàn về chất lượng hàng hóa.',
            'pending',
            NOW() - INTERVAL '2 hours'
        );

        -- Sample report 2: Product spam
        IF product_id IS NOT NULL THEN
            INSERT INTO spam_reports (
                reporter_id, 
                reported_user_id, 
                report_type, 
                reason,
                reported_product_id,
                status,
                created_at
            ) VALUES (
                reporter_user_id,
                reported_user_id,
                'product',
                'Sản phẩm này có nội dung không phù hợp, hình ảnh không đúng với mô tả thực tế.',
                product_id,
                'pending',
                NOW() - INTERVAL '1 day'
            );
        END IF;

        -- Sample report 3: Resolved report
        INSERT INTO spam_reports (
            reporter_id, 
            reported_user_id, 
            report_type, 
            reason,
            status,
            action_taken,
            admin_note,
            reviewed_by,
            reviewed_at,
            created_at
        ) VALUES (
            reporter_user_id,
            reported_user_id,
            'user',
            'Người dùng này spam liên tục trong phần bình luận sản phẩm.',
            'resolved',
            'warn',
            'Đã cảnh cáo người dùng qua email',
            admin_user_id,
            NOW() - INTERVAL '3 hours',
            NOW() - INTERVAL '1 day'
        );

        -- Sample report 4: Dismissed report
        INSERT INTO spam_reports (
            reporter_id, 
            reported_user_id, 
            report_type, 
            reason,
            status,
            action_taken,
            admin_note,
            reviewed_by,
            reviewed_at,
            created_at
        ) VALUES (
            reporter_user_id,
            reported_user_id,
            'message',
            'Tin nhắn quấy rối',
            'dismissed',
            'dismissed',
            'Sau khi kiểm tra, không phát hiện dấu hiệu vi phạm',
            admin_user_id,
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '3 days'
        );

        RAISE NOTICE 'Đã tạo 4 báo cáo spam mẫu thành công!';
    ELSE
        RAISE NOTICE 'Không tìm thấy đủ users để tạo dữ liệu mẫu. Vui lòng tạo users trước.';
    END IF;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Kiểm tra kết quả
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    COUNT(*) as total_reports,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
    SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed
FROM spam_reports;

-- Hiển thị danh sách báo cáo
SELECT 
    id,
    report_type,
    reason,
    status,
    created_at
FROM spam_reports
ORDER BY created_at DESC;

