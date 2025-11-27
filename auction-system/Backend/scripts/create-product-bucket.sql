-- Chạy toàn bộ script này trong Supabase SQL Editor
-- Script tạo bucket lưu ảnh sản phẩm và thiết lập policy đọc công khai

-- 1. Tạo (hoặc cập nhật) bucket "auction-product-media"
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values (
  'auction-product-media',
  'auction-product-media',
  true,
  false,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 2. Cho phép mọi người đọc ảnh trong bucket (cần để frontend tải ảnh công khai)
do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read product images'
  ) then
    drop policy "Public read product images" on storage.objects;
  end if;
end$$;

create policy "Public read product images"
on storage.objects for select
using ( bucket_id = 'auction-product-media' );

-- 3. (Tùy chọn) Cho phép người dùng đã đăng nhập tải ảnh trực tiếp vào bucket
-- Bỏ qua nếu chỉ backend dùng service key để upload.
do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated upload product images'
  ) then
    drop policy "Authenticated upload product images" on storage.objects;
  end if;
end$$;

create policy "Authenticated upload product images"
on storage.objects for insert
with check (
  bucket_id = 'auction-product-media'
  and auth.role() = 'authenticated'
);
