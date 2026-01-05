DO $$
DECLARE
    v_parent_id uuid;
BEGIN
    -- ==================================================================================
    -- 1. ĐIỆN THOẠI DI ĐỘNG
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Điện thoại di động', 'dien-thoai-di-dong', 'smartphone', 1, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'dien-thoai-di-dong'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Apple (iPhone)', 'dien-thoai-apple', v_parent_id, true),
        ('Samsung', 'dien-thoai-samsung', v_parent_id, true),
        ('Xiaomi', 'dien-thoai-xiaomi', v_parent_id, true),
        ('Oppo', 'dien-thoai-oppo', v_parent_id, true),
        ('Phụ kiện điện thoại', 'phu-kien-dien-thoai', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 2. MÁY TÍNH XÁCH TAY (LAPTOP)
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Máy tính xách tay', 'may-tinh-xach-tay', 'laptop', 2, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'may-tinh-xach-tay'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Laptop Gaming', 'laptop-gaming', v_parent_id, true),
        ('MacBook', 'macbook', v_parent_id, true),
        ('Laptop Văn phòng', 'laptop-van-phong', v_parent_id, true),
        ('Linh kiện máy tính', 'linh-kien-may-tinh', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 3. THIẾT BỊ ĐIỆN TỬ
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Thiết bị điện tử', 'thiet-bi-dien-tu', 'cpu', 3, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'thiet-bi-dien-tu'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Máy tính bảng', 'may-tinh-bang', v_parent_id, true),
        ('Thiết bị âm thanh', 'thiet-bi-am-thanh', v_parent_id, true),
        ('Camera & Máy ảnh', 'camera-may-anh', v_parent_id, true),
        ('Tivi & Màn hình', 'tivi-man-hinh', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 4. THỜI TRANG
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Thời trang', 'thoi-trang', 'shirt', 4, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'thoi-trang'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Áo quần Nam', 'thoi-trang-nam', v_parent_id, true),
        ('Áo quần Nữ', 'thoi-trang-nu', v_parent_id, true),
        ('Đồ lót & Đồ ngủ', 'do-lot-do-ngu', v_parent_id, true),
        ('Túi xách & Balo', 'tui-xach-balo', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 5. GIÀY DÉP
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Giày dép', 'giay-dep', 'footprints', 5, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'giay-dep'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Giày thể thao', 'giay-the-thao', v_parent_id, true),
        ('Giày tây & Công sở', 'giay-tay', v_parent_id, true),
        ('Giày cao gót', 'giay-cao-got', v_parent_id, true),
        ('Dép & Sandal', 'dep-sandal', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 6. ĐỒNG HỒ
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Đồng hồ', 'dong-ho', 'watch', 6, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'dong-ho'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Smartwatch', 'smartwatch', v_parent_id, true),
        ('Đồng hồ Nam', 'dong-ho-nam', v_parent_id, true),
        ('Đồng hồ Nữ', 'dong-ho-nu', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 7. NỘI THẤT
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Nội thất', 'noi-that', 'sofa', 7, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'noi-that'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Bàn ghế', 'ban-ghe', v_parent_id, true),
        ('Giường & Tủ', 'giuong-tu', v_parent_id, true),
        ('Đèn & Trang trí', 'den-trang-tri', v_parent_id, true),
        ('Chăn ga gối nệm', 'chan-ga-goi-nem', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 8. GIA DỤNG
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Gia dụng', 'gia-dung', 'home', 8, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'gia-dung'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Thiết bị nhà bếp', 'thiet-bi-nha-bep', v_parent_id, true),
        ('Thiết bị giặt ủi', 'thiet-bi-giat-ui', v_parent_id, true),
        ('Dụng cụ vệ sinh', 'dung-cu-ve-sinh', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 9. XE CỘ
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Xe cộ', 'xe-co', 'car', 9, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'xe-co'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Xe máy', 'xe-may', v_parent_id, true),
        ('Ô tô', 'o-to', v_parent_id, true),
        ('Xe đạp & Xe điện', 'xe-dap-xe-dien', v_parent_id, true),
        ('Phụ tùng xe', 'phu-tung-xe', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 10. THỂ THAO
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Thể thao', 'the-thao', 'dumbbell', 10, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'the-thao'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Dụng cụ tập Gym', 'dung-cu-tap-gym', v_parent_id, true),
        ('Bóng đá', 'bong-da', v_parent_id, true),
        ('Dã ngoại & Cắm trại', 'da-ngoai-cam-trai', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 11. SÁCH
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Sách', 'sach', 'book', 11, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'sach'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Sách Văn học', 'sach-van-hoc', v_parent_id, true),
        ('Sách Kinh tế', 'sach-kinh-te', v_parent_id, true),
        ('Sách Giáo dục', 'sach-giao-duc', v_parent_id, true),
        ('Văn phòng phẩm', 'van-phong-pham', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 12. NGHỆ THUẬT & SƯU TẦM
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Nghệ thuật & Sưu tầm', 'nghe-thuat', 'palette', 12, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'nghe-thuat'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Tranh ảnh', 'tranh-anh', v_parent_id, true),
        ('Đồ thủ công (Handmade)', 'do-thu-cong', v_parent_id, true),
        ('Nhạc cụ', 'nhac-cu', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

    -- ==================================================================================
    -- 13. ĐỒ CŨ (THANH LÝ)
    -- ==================================================================================
    INSERT INTO public.categories (name, slug, icon, display_order, is_active)
    VALUES ('Đồ cũ (Thanh lý)', 'do-cu', 'recycle', 13, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order
    RETURNING id INTO v_parent_id;

    IF v_parent_id IS NULL THEN SELECT id INTO v_parent_id FROM public.categories WHERE slug = 'do-cu'; END IF;

    INSERT INTO public.categories (name, slug, parent_id, is_active) VALUES 
        ('Đồ điện tử cũ', 'do-dien-tu-cu', v_parent_id, true),
        ('Xe cộ cũ', 'xe-co-cu', v_parent_id, true),
        ('Đồ gia dụng cũ', 'do-gia-dung-cu', v_parent_id, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = v_parent_id;

END $$;