# 🔑 Hướng dẫn lấy Supabase Service Role Key

## Bước 1: Truy cập Supabase Dashboard

1. Vào https://app.supabase.com
2. Đăng nhập vào tài khoản của bạn
3. Chọn project: **ojbcqlntvkdpdetmttuu**

## Bước 2: Lấy Service Role Key

1. Click vào **Settings** (biểu tượng ⚙️ ở sidebar bên trái)
2. Chọn **API** trong menu Settings
3. Kéo xuống phần **Project API keys**
4. Tìm key có tên **`service_role`** (màu đỏ/cam cảnh báo)
   - ⚠️ **KHÔNG** dùng `anon` `public` key (key này dùng cho Frontend)
   - ✅ **DÙNG** `service_role` `secret` key (key này có full quyền, chỉ dùng Backend)

5. Click vào nút **Copy** hoặc **Reveal** để xem key

## Bước 3: Cập nhật file `.env`

Mở file `Backend/.env` và paste key vào:

```env
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
```

(Key rất dài, khoảng 200-300 ký tự)

## ⚠️ LƯU Ý AN TOÀN

### KHÔNG BAO GIỜ:
- ❌ Commit `service_role` key lên Git
- ❌ Share `service_role` key publicly  
- ❌ Dùng `service_role` key ở Frontend
- ❌ Hard-code key trong code

### LUÔN LUÔN:
- ✅ Lưu trong file `.env` (đã có trong `.gitignore`)
- ✅ Chỉ dùng ở Backend/Server
- ✅ Dùng `anon public` key cho Frontend (nếu cần gọi Supabase trực tiếp)
- ✅ Đổi key ngay nếu bị lộ

## Kiểm tra

Sau khi cập nhật `.env`, chạy:

```bash
cd Backend
npm run dev
```

Nếu thấy message:
```
🚀 AUCTION BACKEND API RUNNING
📍 http://localhost:5000
```

→ **Thành công!** 

Test API:
```bash
curl http://localhost:5000/api/health
```

Nếu trả về `{"status":"OK",...}` → Backend đã kết nối Supabase thành công! 🎉
