# Backup & Rollback Notes

Các hướng dẫn quan trọng khi thực thi việc Sao lưu (Backup) và Khôi phục/Thu hồi phiên bản (Rollback).

## 1. Backup trước thay đổi lớn
Bất cứ khi nào cập nhật Schema hoặc deploy một phiên bản tái cấu trúc DB, Kỹ sư phải Backup thủ công (Export) các tệp tin an toàn từ Supabase, tối thiểu bao gồm:
- Export Schema của Database dưới dạng SQL file.
- Export Data CSV/JSON các table vận hành cốt lõi:
  - `product_overrides`
  - `product_identities`
  - `catalog_sections`
  - `seo_pages`
  - `site_settings`
  - `media_assets`

## 2. Rollback Frontend (Giao diện)
Nếu bản phát hành Frontend gây lỗi nghiêm trọng trên Production:
- Truy cập vào Project trên **Vercel Dashboard**.
- Chuyển sang tab **Deployments**.
- Chọn bản Deploy thành công trước đó (Previous release).
- Nhấn vào dấu 3 chấm (`...`) -> Nhấn **Instant Rollback**.
- Hoặc sử dụng Git: `git checkout <tag_cũ>` và đẩy Hotfix branch lên lại.

## 3. Rollback Edge Function
Nếu lỗi nằm ở API (Supabase Edge Function) khiến việc Ghi sản phẩm thất bại:
- Di chuyển Checkout Codebase về Tag Release (Version) cũ gần nhất không bị lỗi thông qua Git.
- Mở terminal và tái Deploy lại chính xác Function đó từ Source Code phiên bản cũ.
  ```bash
  npx supabase functions deploy save-product-override
  ```

## 4. Rollback Database
Cực kỳ cẩn trọng khi động tới CSDL thực.
- Không được tùy tiện rollback dữ liệu thủ công bằng cách Drop Tables hay Insert ghi đè khi chưa Backup cẩn thận bằng bản Dump (Pg_dump).
- Đối với việc thu hồi Migration lỗi (`destructive migration`), bắt buộc phải có script SQL Rollback đi kèm từ đầu (viết script Down) để loại bỏ các Table mới/Cột mới, thay vì tự xóa tay.

## 5. Xử lý Rollback Storage
- Tính năng Ẩn (Soft Delete) hình ảnh trong Media Assets hiện tại không trực tiếp xóa đi Object Storage để hạn chế rủi ro thất thoát tệp. 
- Nếu vì lý do nào đó một ảnh bị Kỹ sư thao tác lệnh xóa cứng nhầm trong Bucket `product-images` hoặc `site-assets`, hệ thống sẽ xuất hiện ảnh bị gãy (Broken link 404). Phương pháp Rollback duy nhất là Admin phải đăng nhập và tự tay Tải (Upload) lại tập tin gốc thông qua Dashboard.
