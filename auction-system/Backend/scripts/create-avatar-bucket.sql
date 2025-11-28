-- Chạy script này trong Supabase SQL Editor để tạo bucket lưu avatar người dùng

insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  false,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Cho phép mọi người đọc avatar (để hiển thị công khai)
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read seller avatars'
  ) then
    drop policy "Public read seller avatars" on storage.objects;
  end if;
end$$;

create policy "Public read seller avatars"
on storage.objects for select
using ( bucket_id = 'profile-avatars' );

-- Cho phép người dùng đã đăng nhập upload avatar của chính mình (nếu cần frontend trực tiếp)
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated upload seller avatars'
  ) then
    drop policy "Authenticated upload seller avatars" on storage.objects;
  end if;
end$$;

create policy "Authenticated upload seller avatars"
on storage.objects for insert
with check (
  bucket_id = 'profile-avatars'
  and auth.role() = 'authenticated'
);
